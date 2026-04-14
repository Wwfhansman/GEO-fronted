# Deployment Notes

## Frontend

- Deploy `frontend/` to Vercel.
- Set environment variables:
  - `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anonymous key
  - `NEXT_PUBLIC_API_BASE_URL` — Backend API base URL (e.g. `https://api.geo.example.com`)
  - `NEXT_PUBLIC_ANALYTICS_WRITE_KEY` — Analytics write key (optional)

## Backend

- Deploy `backend/` to Aliyun.
- Set environment variables:
  - `DATABASE_URL` — PostgreSQL connection string (falls back to SQLite for local dev)
  - `SUPABASE_JWT_SECRET` — Supabase JWT secret for token verification
  - `SUPABASE_PROJECT_URL` — Supabase project URL
  - `SUPABASE_SERVICE_ROLE_KEY` — Supabase service role key
  - `OPENAI_API_KEY` — API key for the LLM provider (Qiniu AI / OpenAI-compatible)
  - `OPENAI_BASE_URL` — Base URL for OpenAI-compatible API (default: `https://api.qnaigc.com/v1`)
  - `CHATGPT_MODEL` — Model name for ChatGPT provider
  - `DEEPSEEK_MODEL` — Model name for DeepSeek provider
  - `DOUBAO_MODEL` — Model name for Doubao provider
  - `TONGYI_MODEL` — Model name for Tongyi provider
  - `REVIEW_MODEL_API_KEY` — API key for LLM review model (optional, falls back to OPENAI_API_KEY)
  - `EMAIL_API_KEY` — Resend API key for email notifications (optional)
  - `EMAIL_FROM` — Sender email address (default: `noreply@geo.example.com`)
  - `LEAD_NOTIFICATION_TO` — Comma-separated recipient emails for lead notifications
  - `CORS_ALLOW_ORIGINS` — Comma-separated allowed origins (must include the frontend URL)
  - `ADMIN_EMAIL_WHITELIST` — Comma-separated admin emails for dashboard access

## Mobile

- Verify landing, test, result, and dashboard pages render without horizontal overflow on a 390px-wide viewport.
- E2E tests include mobile viewport smoke tests for all pages.

## Running Tests

```bash
# Backend
cd backend && source .venv/bin/activate && pytest -v

# Frontend unit tests
cd frontend && npx vitest run

# Frontend E2E tests
cd frontend && npx playwright test --project=chromium

# Mobile viewport E2E
cd frontend && npx playwright test --project=mobile
```
