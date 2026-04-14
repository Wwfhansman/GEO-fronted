import json

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.main import app
from app.models import ContactLead


def _bootstrap(client, auth_token, email="lead@example.com", sub="lead-sub"):
    token = auth_token(email=email, sub=sub)
    client.post(
        "/api/auth/bootstrap",
        headers={"Authorization": f"Bearer {token}"},
        json={"email": email, "phone": "13900000000", "company_name": "LeadCo"},
    )
    return token


def test_contact_leads_route_exists():
    client = TestClient(app)
    response = client.post("/api/leads/contact", json={})
    assert response.status_code in {401, 422}


def test_contact_lead_persists(auth_token):
    client = TestClient(app)
    token = _bootstrap(client, auth_token)

    resp = client.post(
        "/api/leads/contact",
        headers={"Authorization": f"Bearer {token}"},
        json={"test_summary": {"score": 80}},
    )
    assert resp.status_code == 200
    assert resp.json()["success"] is True

    # Verify test_summary was persisted
    db: Session = next(get_db())
    lead = db.query(ContactLead).filter(ContactLead.company_name == "LeadCo").first()
    assert lead is not None
    assert lead.test_summary is not None
    summary = json.loads(lead.test_summary)
    assert summary["score"] == 80
    db.close()


def test_contact_lead_rate_limited(auth_token):
    client = TestClient(app)
    token = _bootstrap(client, auth_token, email="ratelead@example.com", sub="rate-sub")

    payload = {"test_summary": {"score": 50}}
    first = client.post(
        "/api/leads/contact",
        headers={"Authorization": f"Bearer {token}"},
        json=payload,
    )
    assert first.status_code == 200

    second = client.post(
        "/api/leads/contact",
        headers={"Authorization": f"Bearer {token}"},
        json=payload,
    )
    assert second.status_code == 429


def test_contact_lead_rejects_unregistered(auth_token):
    client = TestClient(app)
    token = auth_token(email="nobody@example.com", sub="nobody-sub")
    resp = client.post(
        "/api/leads/contact",
        headers={"Authorization": f"Bearer {token}"},
        json={"test_summary": {}},
    )
    assert resp.status_code == 403
