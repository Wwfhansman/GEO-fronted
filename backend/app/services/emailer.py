from __future__ import annotations

import logging
from typing import Any, Dict, Optional

import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)


def send_lead_notification(
    user_email: str,
    user_phone: str,
    company_name: str,
    test_summary: Optional[Dict[str, Any]] = None,
) -> bool:
    to_address = settings.lead_notification_to
    api_key = settings.email_api_key

    if not to_address or not api_key:
        logger.info("Email not configured, skipping lead notification for %s", company_name)
        return False

    subject = f"[GEO] 新销售线索 - {company_name}"
    body = (
        f"公司名：{company_name}\n"
        f"联系邮箱：{user_email}\n"
        f"联系电话：{user_phone}\n"
    )
    if test_summary:
        body += f"\n测试摘要：{test_summary}\n"

    try:
        resp = httpx.post(
            "https://api.resend.com/emails",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            json={
                "from": settings.email_from,
                "to": [addr.strip() for addr in to_address.split(",") if addr.strip()],
                "subject": subject,
                "text": body,
            },
            timeout=10.0,
        )
        resp.raise_for_status()
        logger.info("Lead notification sent for %s", company_name)
        return True
    except httpx.HTTPError as exc:
        logger.warning("Failed to send lead notification: %s", exc)
        return False
