import json

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.security import require_admin_token
from app.db.session import get_db
from app.models import ContactLead, EventLog, TestRun, User

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])

TRAFFIC_FUNNEL_STEPS = [
    ("landing_view", "首页访问"),
    ("landing_primary_cta_click", "首页主 CTA 点击"),
    ("test_page_view", "进入测试页"),
    ("test_form_started", "开始填写表单"),
    ("test_execute_click", "点击发起检测"),
    ("register_modal_open", "打开注册弹窗"),
    ("user_registered", "完成注册"),
    ("test_executed", "完成检测"),
    ("result_page_view", "查看结果页"),
    ("lead_submitted", "提交销售线索"),
]


def _event_aliases(event: EventLog) -> list[str]:
    aliases: list[str] = []
    if event.visitor_id:
        aliases.append(f"visitor:{event.visitor_id}")
    if event.user_id:
        aliases.append(f"user:{event.user_id}")
    if not aliases:
        aliases.append(f"event:{event.id}")
    return aliases


def _build_actor_aliases(events: list[EventLog]) -> dict[str, str]:
    alias_to_actor: dict[str, str] = {}

    for event in events:
        aliases = _event_aliases(event)
        canonical = min(aliases)
        existing = [alias_to_actor[alias] for alias in aliases if alias in alias_to_actor]
        if existing:
            canonical = min(existing + [canonical])

        for alias in aliases:
            alias_to_actor[alias] = canonical

        for alias, actor in list(alias_to_actor.items()):
            if actor in aliases:
                alias_to_actor[alias] = canonical

    return alias_to_actor


def _actor_key(event: EventLog, alias_to_actor: dict[str, str]) -> str:
    aliases = _event_aliases(event)
    for alias in aliases:
        mapped = alias_to_actor.get(alias)
        if mapped:
            return mapped
    return aliases[0]


def _properties(event: EventLog) -> dict:
    if not event.properties:
        return {}
    try:
        parsed = json.loads(event.properties)
    except json.JSONDecodeError:
        return {}
    return parsed if isinstance(parsed, dict) else {}


def _build_traffic_metrics(events: list[EventLog]) -> dict:
    counts_by_name: dict[str, int] = {}
    unique_by_name: dict[str, set[str]] = {}
    alias_to_actor = _build_actor_aliases(events)

    for event in events:
        counts_by_name[event.event_name] = counts_by_name.get(event.event_name, 0) + 1
        unique_by_name.setdefault(event.event_name, set()).add(_actor_key(event, alias_to_actor))

    funnel = []
    previous_count = None
    start_count = None
    for event_name, label in TRAFFIC_FUNNEL_STEPS:
        unique_count = len(unique_by_name.get(event_name, set()))
        if start_count is None:
            start_count = unique_count
        conversion_from_previous = (
            round((unique_count / previous_count) * 100, 1)
            if previous_count and previous_count > 0
            else None
        )
        conversion_from_start = (
            round((unique_count / start_count) * 100, 1)
            if start_count and start_count > 0
            else None
        )
        funnel.append(
            {
                "event_name": event_name,
                "label": label,
                "count": unique_count,
                "conversion_from_previous": conversion_from_previous,
                "conversion_from_start": conversion_from_start,
            }
        )
        previous_count = unique_count

    landing_views = len(unique_by_name.get("landing_view", set()))
    landing_cta_clicks = len(unique_by_name.get("landing_primary_cta_click", set()))
    test_page_views = len(unique_by_name.get("test_page_view", set()))
    test_executions = len(unique_by_name.get("test_executed", set()))
    lead_submitted = len(unique_by_name.get("lead_submitted", set()))

    result_views = len(unique_by_name.get("result_page_view", set()))
    max_dropoff = None
    if len(funnel) > 1:
        deltas = []
        for prev, current in zip(funnel, funnel[1:]):
            deltas.append(
                {
                    "from": prev["label"],
                    "to": current["label"],
                    "dropoff": max(prev["count"] - current["count"], 0),
                }
            )
        max_dropoff = max(deltas, key=lambda item: item["dropoff"]) if deltas else None

    return {
        "traffic_summary": {
            "landing_views": landing_views,
            "test_page_views": test_page_views,
            "result_page_views": result_views,
            "landing_to_test_rate": round((test_page_views / landing_views) * 100, 1) if landing_views else 0.0,
            "landing_cta_rate": round((landing_cta_clicks / landing_views) * 100, 1) if landing_views else 0.0,
            "test_completion_rate": round((test_executions / test_page_views) * 100, 1) if test_page_views else 0.0,
            "lead_submission_rate": round((lead_submitted / test_executions) * 100, 1) if test_executions else 0.0,
        },
        "traffic_funnel": funnel,
        "traffic_diagnosis": {
            "largest_dropoff": max_dropoff,
        },
    }


@router.get("/summary")
def dashboard_summary(
    _: str = Depends(require_admin_token),
    db: Session = Depends(get_db),
):
    user_count = db.query(func.count(User.id)).scalar() or 0
    test_count = db.query(func.count(TestRun.id)).scalar() or 0
    lead_count = db.query(func.count(ContactLead.id)).scalar() or 0

    mentioned_count = (
        db.query(func.count(TestRun.id)).filter(TestRun.is_mentioned == True).scalar() or 0  # noqa: E712
    )

    events = db.query(EventLog).all()
    traffic_metrics = _build_traffic_metrics(events)

    return {
        "user_count": user_count,
        "test_count": test_count,
        "lead_count": lead_count,
        "mentioned_count": mentioned_count,
        "funnel": {
            "registered": user_count,
            "tested": db.query(func.count(func.distinct(TestRun.user_id))).scalar() or 0,
            "contacted": db.query(func.count(func.distinct(ContactLead.user_id))).scalar() or 0,
        },
        "event_counts": {
            "user_registered": db.query(func.count(EventLog.id)).filter(EventLog.event_name == "user_registered").scalar() or 0,
            "test_executed": db.query(func.count(EventLog.id)).filter(EventLog.event_name == "test_executed").scalar() or 0,
            "lead_submitted": db.query(func.count(EventLog.id)).filter(EventLog.event_name == "lead_submitted").scalar() or 0,
        },
        **traffic_metrics,
    }
