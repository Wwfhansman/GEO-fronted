# GEO MVP Development Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a production-like GEO landing page MVP with a separate frontend site, separate FastAPI backend, Supabase auth/data, test execution flow, conversion tracking, and a lightweight internal dashboard.

**Architecture:** The system is split into a Next.js frontend on Vercel, a Python FastAPI backend service, Supabase Auth + Database as the identity/data layer, and an event tracking layer for funnel analytics. The backend owns all business rules, model calls, quota control, result aggregation, contact leads, and dashboard-facing APIs; the frontend owns page rendering, registration UX, test form UX, local draft persistence, and analytics triggers.

**Tech Stack:** Next.js, TypeScript, Tailwind CSS, FastAPI, Python 3.11+, Supabase Auth, Supabase Postgres, email service provider, pytest, Playwright, Vitest, Vercel, Aliyun

---

## 1. Delivery Scope

This plan covers:

- Marketing landing page
- Test page and result page
- Email/password registration with required phone + company fields
- Free quota flow
- GEO test execution flow
- Contact-sales lead submission
- Event tracking and funnel metrics
- Lightweight internal dashboard
- Local/dev, staging, and production deployment setup

This plan does not cover:

- Multi-prompt sampling
- Multi-model parallel comparison
- Full CMS
- CRM integration beyond lead persistence and email notification
- Advanced RBAC

## 2. Proposed Repository Structure

Create this structure before implementation starts:

```text
GEO-project/
├── DEVELOPMENT_PLAN.md
├── frontend/
│   ├── app/
│   ├── components/
│   ├── lib/
│   ├── hooks/
│   ├── styles/
│   ├── tests/
│   ├── package.json
│   ├── playwright.config.ts
│   ├── vitest.config.ts
│   └── .env.example
├── backend/
│   ├── app/
│   │   ├── api/
│   │   ├── core/
│   │   ├── db/
│   │   ├── models/
│   │   ├── schemas/
│   │   ├── services/
│   │   └── main.py
│   ├── tests/
│   ├── pyproject.toml
│   └── .env.example
├── infra/
│   ├── supabase/
│   │   ├── migrations/
│   │   └── seed.sql
│   ├── env/
│   └── docs/
├── docs/
│   └── superpowers/
│       └── specs/
└── scripts/
```

## 3. Target Data Model

The implementation should align to these logical tables:

- `users`
- `user_test_metrics`
- `test_runs`
- `prompt_templates`
- `contact_leads`
- `event_logs` or external analytics sink mirror table if needed

## 4. Delivery Sequence

Build in this order:

1. Repo scaffolding
2. Supabase schema and auth model
3. Backend API skeleton
4. Frontend shell and routes
5. Registration and session flow
6. Test execution pipeline
7. Result and aggregate metrics UI
8. Contact lead and email notifications
9. Analytics and dashboard
10. End-to-end hardening and deployment

## 5. Implementation Rules For AI Coding Assistants

- Keep frontend and backend in separate directories and separate runtime boundaries.
- Never put model provider API keys in the frontend.
- Backend owns quota checks, result calculation, contact lead persistence, and dashboard data aggregation.
- Frontend may persist test-form drafts locally, but must not compute quota or aggregate metrics.
- Use TDD where practical: write or update tests before implementation changes in each task.
- Commit after each completed task with a focused message.
- Do not widen MVP scope during implementation.
- If a task requires a product decision not covered by specs, stop and update the spec first.

## 6. File Ownership Map

### Frontend

- `frontend/app/page.tsx`: landing page assembly
- `frontend/app/test/page.tsx`: test page route
- `frontend/app/result/[id]/page.tsx`: result page route
- `frontend/app/dashboard/page.tsx`: internal dashboard route
- `frontend/components/landing/*`: marketing sections
- `frontend/components/test/*`: aggregate stats, form, loading state, latest run card
- `frontend/components/result/*`: overall metrics, single-run detail, contact CTA
- `frontend/components/auth/*`: registration/login modal or panel
- `frontend/lib/api.ts`: backend API client
- `frontend/lib/auth.ts`: Supabase browser auth wiring
- `frontend/lib/analytics.ts`: event tracker wrappers
- `frontend/lib/draft.ts`: local draft persistence
- `frontend/tests/e2e/*`: Playwright E2E
- `frontend/tests/unit/*`: Vitest component and utility tests

### Backend

- `backend/app/main.py`: FastAPI app bootstrap
- `backend/app/api/routes/auth.py`: auth-adjacent user bootstrap endpoints
- `backend/app/api/routes/context.py`: user context + top metrics endpoints
- `backend/app/api/routes/tests.py`: test execution endpoints
- `backend/app/api/routes/leads.py`: contact-sales endpoints
- `backend/app/api/routes/dashboard.py`: internal dashboard endpoints
- `backend/app/core/config.py`: settings and env loading
- `backend/app/core/security.py`: JWT validation and request identity helpers
- `backend/app/db/session.py`: database session setup
- `backend/app/models/*.py`: SQLAlchemy models
- `backend/app/schemas/*.py`: Pydantic request/response schemas
- `backend/app/services/prompt_builder.py`: prompt generation
- `backend/app/services/provider_adapter.py`: model provider abstraction
- `backend/app/services/company_preprocessor.py`: company name preprocessing
- `backend/app/services/rule_matcher.py`: rule-based match counting
- `backend/app/services/llm_review.py`: conditional second LLM review
- `backend/app/services/result_merger.py`: layered adjudication
- `backend/app/services/metrics.py`: aggregate metric update logic
- `backend/app/services/emailer.py`: lead notification emails
- `backend/app/services/analytics.py`: server-side event sink
- `backend/tests/*`: pytest coverage

### Infra

- `infra/supabase/migrations/*`: SQL migrations
- `infra/supabase/seed.sql`: initial prompt templates and seed configs
- `infra/env/*`: environment examples and deployment variable docs

## 7. Task Plan

### Task 1: Initialize Repo Structure

**Files:**
- Create: `frontend/package.json`
- Create: `backend/pyproject.toml`
- Create: `frontend/.env.example`
- Create: `backend/.env.example`
- Create: `infra/supabase/migrations/0001_init.sql`
- Create: `backend/app/__init__.py`
- Create: `backend/app/api/__init__.py`
- Create: `backend/app/api/routes/__init__.py`
- Create: `backend/app/core/__init__.py`
- Create: `backend/app/db/__init__.py`
- Create: `backend/app/models/__init__.py`
- Create: `backend/app/schemas/__init__.py`
- Create: `backend/app/services/__init__.py`

- [ ] **Step 1: Create root folders and baseline apps**

Create these directories:

```bash
mkdir -p frontend backend infra/supabase/migrations scripts
mkdir -p frontend/app frontend/components frontend/lib frontend/hooks frontend/styles frontend/tests
mkdir -p backend/app/api/routes backend/app/core backend/app/db backend/app/models backend/app/schemas backend/app/services backend/tests
touch backend/app/__init__.py backend/app/api/__init__.py backend/app/api/routes/__init__.py
touch backend/app/core/__init__.py backend/app/db/__init__.py backend/app/models/__init__.py
touch backend/app/schemas/__init__.py backend/app/services/__init__.py
```

- [ ] **Step 2: Create frontend package definition**

Create `frontend/package.json`:

```json
{
  "name": "geo-frontend",
  "private": true,
  "dependencies": {
    "@supabase/supabase-js": "^2.49.0",
    "next": "^15.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "@playwright/test": "^1.54.0",
    "@testing-library/jest-dom": "^6.6.0",
    "@testing-library/react": "^16.1.0",
    "@types/node": "^22.0.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "tailwindcss": "^3.4.0",
    "typescript": "^5.6.0",
    "vitest": "^2.1.0"
  },
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "vitest run",
    "test:e2e": "playwright test"
  }
}
```

- [ ] **Step 3: Create backend package definition**

Create `backend/pyproject.toml`:

```toml
[project]
name = "geo-backend"
version = "0.1.0"
requires-python = ">=3.11"
dependencies = [
  "fastapi",
  "uvicorn",
  "sqlalchemy",
  "psycopg[binary]",
  "pydantic",
  "pydantic-settings",
  "python-jose",
  "httpx",
  "pytest"
]
```

- [ ] **Step 4: Create environment examples**

Create `frontend/.env.example`:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_API_BASE_URL=
NEXT_PUBLIC_ANALYTICS_WRITE_KEY=
```

Create `backend/.env.example`:

```env
APP_ENV=local
DATABASE_URL=
SUPABASE_JWT_SECRET=
SUPABASE_PROJECT_URL=
SUPABASE_SERVICE_ROLE_KEY=
DEEPSEEK_API_KEY=
DOUBAO_API_KEY=
TONGYI_API_KEY=
OPENAI_API_KEY=
REVIEW_MODEL_API_KEY=
EMAIL_API_KEY=
LEAD_NOTIFICATION_TO=
ANALYTICS_WRITE_KEY=
CORS_ALLOW_ORIGINS=http://localhost:3000
ADMIN_EMAIL_WHITELIST=
```

- [ ] **Step 5: Verify structure exists**

Run:

```bash
find frontend backend infra -maxdepth 3 -type d | sort
```

Expected: directories for frontend app, backend app, and infra migrations exist.

- [ ] **Step 6: Commit**

```bash
git add frontend backend infra DEVELOPMENT_PLAN.md
git commit -m "chore: initialize geo project structure"
```

### Task 2: Implement Supabase Schema

**Files:**
- Modify: `infra/supabase/migrations/0001_init.sql`
- Create: `infra/supabase/seed.sql`
- Test: `backend/tests/test_schema_contract.py`

- [ ] **Step 1: Write a schema contract test**

Create `backend/tests/test_schema_contract.py`:

```python
from pathlib import Path


def test_init_sql_contains_core_tables():
    sql = Path("infra/supabase/migrations/0001_init.sql").read_text()
    for table in [
        "users",
        "user_test_metrics",
        "test_runs",
        "prompt_templates",
        "contact_leads",
    ]:
        assert f"create table {table}" in sql.lower()
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
cd backend && pytest tests/test_schema_contract.py -v
```

Expected: FAIL because schema file does not yet define tables.

- [ ] **Step 3: Write the initial SQL schema**

Add `infra/supabase/migrations/0001_init.sql` with:

```sql
create table users (
  id uuid primary key,
  supabase_auth_id uuid unique not null,
  email text unique not null,
  email_verified boolean not null default false,
  phone text not null,
  company_name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table user_test_metrics (
  user_id uuid primary key references users(id) on delete cascade,
  total_query_count integer not null default 0,
  total_mentioned_count integer not null default 0,
  total_exposure_count integer not null default 0,
  free_test_quota_total integer not null default 3,
  free_test_quota_remaining integer not null default 3,
  overall_evaluation_text text not null default '',
  last_test_at timestamptz,
  updated_at timestamptz not null default now()
);

create table prompt_templates (
  id uuid primary key,
  industry text not null,
  template_version text not null,
  template_content text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table test_runs (
  id uuid primary key,
  user_id uuid not null references users(id) on delete cascade,
  input_company_name text not null,
  input_product_keyword text not null,
  input_industry text not null,
  input_provider text not null,
  template_id uuid references prompt_templates(id),
  template_version text,
  final_prompt text not null,
  provider_model_name text,
  raw_response_text text,
  raw_provider_response jsonb,
  response_latency_ms integer,
  normalized_company_name text,
  rule_matched boolean not null default false,
  llm_review_triggered boolean not null default false,
  final_match_source text,
  is_mentioned boolean,
  mentioned_count_for_query integer,
  exposure_count_for_query integer,
  matched_snippets jsonb,
  evaluation_text text,
  evaluation_source text,
  status text not null,
  error_code text,
  error_message text,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create table contact_leads (
  id uuid primary key,
  user_id uuid not null references users(id) on delete cascade,
  test_run_id uuid references test_runs(id),
  email text not null,
  phone text not null,
  company_name text not null,
  test_summary jsonb not null,
  email_sent boolean not null default false,
  created_at timestamptz not null default now()
);
```

- [ ] **Step 4: Seed prompt templates**

Create `infra/supabase/seed.sql`:

```sql
insert into prompt_templates (id, industry, template_version, template_content)
values
  (
    gen_random_uuid(),
    '医疗健康',
    'v1',
    '行业场景背景：用户正在为企业或个人筛选医疗健康相关服务提供方。用户需求描述：用户想了解{product_keyword}相关服务，希望优先看到适合业务或实际使用场景的推荐对象。推荐型回答要求：请直接给出推荐公司或品牌名单，并简要说明推荐理由。'
  ),
  (
    gen_random_uuid(),
    '电商品牌',
    'v1',
    '行业场景背景：用户正在通过AI寻找适合购买或合作的电商品牌。用户需求描述：用户想了解{product_keyword}相关品牌，关注知名度、适用场景和选择理由。推荐型回答要求：请直接给出推荐品牌或公司，并简要说明为什么值得推荐。'
  ),
  (
    gen_random_uuid(),
    'IT科技',
    'v1',
    '行业场景背景：用户正在为企业评估IT科技类产品或服务。用户需求描述：用户想了解{product_keyword}相关解决方案，希望快速形成备选公司名单。推荐型回答要求：请直接给出推荐公司或品牌，并说明适用场景与推荐原因。'
  ),
  (
    gen_random_uuid(),
    '智能制造',
    'v1',
    '行业场景背景：用户正在评估智能制造方向的供应商或技术服务方。用户需求描述：用户想了解{product_keyword}相关解决方案，重点关注企业能力和落地适配性。推荐型回答要求：请直接给出推荐公司或品牌，并简要说明推荐依据。'
  ),
  (
    gen_random_uuid(),
    '传统零售',
    'v1',
    '行业场景背景：用户正在寻找适用于传统零售业务的品牌、平台或服务商。用户需求描述：用户想了解{product_keyword}相关推荐对象，希望快速形成候选名单。推荐型回答要求：请直接给出推荐公司或品牌，并附上简短理由。'
  );
```

- [ ] **Step 5: Run test to verify it passes**

Run:

```bash
cd /Users/goucaicai/Desktop/GEO-project/backend && pytest tests/test_schema_contract.py -v
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add infra/supabase/migrations/0001_init.sql infra/supabase/seed.sql backend/tests/test_schema_contract.py
git commit -m "feat: add initial supabase schema"
```

### Task 3: Bootstrap FastAPI Service

**Files:**
- Create: `backend/app/main.py`
- Create: `backend/app/core/config.py`
- Create: `backend/app/api/routes/health.py`
- Create: `backend/app/core/cors.py`
- Test: `backend/tests/test_health_api.py`

- [ ] **Step 1: Write the failing API test**

Create `backend/tests/test_health_api.py`:

```python
from fastapi.testclient import TestClient

from app.main import app


def test_health_endpoint():
    client = TestClient(app)
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
cd backend && pytest tests/test_health_api.py -v
```

Expected: FAIL because `app.main` does not exist.

- [ ] **Step 3: Write minimal FastAPI bootstrap**

Create `backend/app/main.py`:

```python
from fastapi import FastAPI

from app.api.routes.health import router as health_router
from app.core.config import settings
from app.core.cors import install_cors

app = FastAPI(title="GEO Backend")
install_cors(app, settings.cors_allow_origins.split(","))
app.include_router(health_router)
```

Create `backend/app/api/routes/health.py`:

```python
from fastapi import APIRouter

router = APIRouter()


@router.get("/health")
def health_check():
    return {"status": "ok"}
```

Create `backend/app/core/config.py`:

```python
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_env: str = "local"
    cors_allow_origins: str = "http://localhost:3000"


settings = Settings()
```

Create `backend/app/core/cors.py`:

```python
from fastapi.middleware.cors import CORSMiddleware


def install_cors(app, allow_origins: list[str]):
    app.add_middleware(
        CORSMiddleware,
        allow_origins=allow_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
```

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
cd backend && pytest tests/test_health_api.py -v
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/app backend/tests/test_health_api.py
git commit -m "feat: bootstrap fastapi backend"
```

### Task 4: Implement Auth-Aware User Bootstrap

**Files:**
- Create: `backend/app/api/routes/auth.py`
- Create: `backend/app/core/security.py`
- Create: `backend/app/schemas/auth.py`
- Test: `backend/tests/test_auth_bootstrap.py`

- [ ] **Step 1: Write the failing test**

Create `backend/tests/test_auth_bootstrap.py`:

```python
from fastapi.testclient import TestClient

from app.main import app


def test_bootstrap_user_route_exists():
    client = TestClient(app)
    response = client.post("/api/auth/bootstrap", json={})
    assert response.status_code in {401, 422}
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
cd backend && pytest tests/test_auth_bootstrap.py -v
```

Expected: FAIL with 404 because route does not exist.

- [ ] **Step 3: Implement the auth bootstrap skeleton**

Create `backend/app/schemas/auth.py`:

```python
from pydantic import BaseModel, EmailStr


class BootstrapUserRequest(BaseModel):
    email: EmailStr
    phone: str
    company_name: str


class BootstrapUserResponse(BaseModel):
    user_id: str
    email: str
    phone: str
    company_name: str
```

Create `backend/app/core/security.py`:

```python
from fastapi import Header, HTTPException


def require_bearer_token(authorization: str | None = Header(default=None)) -> str:
    if not authorization or not authorization.startswith("Bearer "):
      raise HTTPException(status_code=401, detail="Unauthorized")
    return authorization.removeprefix("Bearer ")
```

Create `backend/app/api/routes/auth.py`:

```python
from fastapi import APIRouter, Depends

from app.core.security import require_bearer_token
from app.schemas.auth import BootstrapUserRequest, BootstrapUserResponse

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/bootstrap", response_model=BootstrapUserResponse)
def bootstrap_user(
    payload: BootstrapUserRequest,
    _: str = Depends(require_bearer_token),
):
    return BootstrapUserResponse(
        user_id="placeholder-user-id",
        email=payload.email,
        phone=payload.phone,
        company_name=payload.company_name,
    )
```

Update `backend/app/main.py`:

```python
from fastapi import FastAPI

from app.api.routes.auth import router as auth_router
from app.api.routes.health import router as health_router

app = FastAPI(title="GEO Backend")
app.include_router(health_router)
app.include_router(auth_router)
```

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
cd backend && pytest tests/test_auth_bootstrap.py -v
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/app backend/tests/test_auth_bootstrap.py
git commit -m "feat: add auth bootstrap endpoint"
```

### Task 5: Implement User Context API

**Files:**
- Create: `backend/app/api/routes/context.py`
- Create: `backend/app/schemas/context.py`
- Test: `backend/tests/test_user_context_api.py`

- [ ] **Step 1: Write the failing test**

Create `backend/tests/test_user_context_api.py`:

```python
from fastapi.testclient import TestClient

from app.main import app


def test_user_context_route_exists():
    client = TestClient(app)
    response = client.get("/api/context/me")
    assert response.status_code in {401, 422}
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
cd backend && pytest tests/test_user_context_api.py -v
```

Expected: FAIL with 404.

- [ ] **Step 3: Implement minimal route**

Create `backend/app/schemas/context.py`:

```python
from pydantic import BaseModel


class UserContextResponse(BaseModel):
    is_registered: bool
    total_query_count: int
    total_mentioned_count: int
    total_exposure_count: int
    free_test_quota_remaining: int
    overall_evaluation_text: str
```

Create `backend/app/api/routes/context.py`:

```python
from fastapi import APIRouter, Depends

from app.core.security import require_bearer_token
from app.schemas.context import UserContextResponse

router = APIRouter(prefix="/api/context", tags=["context"])


@router.get("/me", response_model=UserContextResponse)
def get_user_context(_: str = Depends(require_bearer_token)):
    return UserContextResponse(
        is_registered=True,
        total_query_count=0,
        total_mentioned_count=0,
        total_exposure_count=0,
        free_test_quota_remaining=3,
        overall_evaluation_text="您尚未开始测试，先查看您的AI曝光情况。",
    )
```

Update `backend/app/main.py` to include `context_router`.

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
cd backend && pytest tests/test_user_context_api.py -v
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/app backend/tests/test_user_context_api.py
git commit -m "feat: add user context api"
```

### Task 6: Scaffold Next.js Frontend Routes

**Files:**
- Create: `frontend/app/page.tsx`
- Create: `frontend/app/test/page.tsx`
- Create: `frontend/app/result/[id]/page.tsx`
- Create: `frontend/app/dashboard/page.tsx`
- Test: `frontend/tests/unit/routes.spec.ts`

- [ ] **Step 1: Write the failing route smoke test**

Create `frontend/tests/unit/routes.spec.ts`:

```ts
import { describe, expect, it } from "vitest";

describe("route placeholders", () => {
  it("defines route files", async () => {
    const routes = [
      () => import("../../app/page"),
      () => import("../../app/test/page"),
      () => import("../../app/result/[id]/page"),
      () => import("../../app/dashboard/page"),
    ];
    await Promise.all(routes.map((loader) => loader()));
    expect(true).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
cd frontend && npm run test
```

Expected: FAIL because route files do not exist.

- [ ] **Step 3: Create route placeholders**

Create `frontend/app/page.tsx`:

```tsx
export default function LandingPage() {
  return <main>GEO Landing Page</main>;
}
```

Create `frontend/app/test/page.tsx`:

```tsx
export default function TestPage() {
  return <main>GEO Test Page</main>;
}
```

Create `frontend/app/result/[id]/page.tsx`:

```tsx
export default function ResultPage() {
  return <main>GEO Result Page</main>;
}
```

Create `frontend/app/dashboard/page.tsx`:

```tsx
export default function DashboardPage() {
  return <main>GEO Dashboard</main>;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
cd frontend && npm run test
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add frontend/app frontend/tests/unit/routes.spec.ts
git commit -m "feat: scaffold frontend routes"
```

### Task 7: Build Landing Page Sections

**Files:**
- Modify: `frontend/app/page.tsx`
- Create: `frontend/components/landing/Hero.tsx`
- Create: `frontend/components/landing/IndustrySection.tsx`
- Create: `frontend/components/landing/FAQSection.tsx`
- Test: `frontend/tests/unit/landing-page.spec.tsx`

- [ ] **Step 1: Write the failing landing page test**

Create `frontend/tests/unit/landing-page.spec.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import LandingPage from "../../app/page";


test("landing page shows main conversion entry", () => {
  render(<LandingPage />);
  expect(screen.getByText("立即免费测试")).toBeInTheDocument();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
cd frontend && npm run test -- landing-page.spec.tsx
```

Expected: FAIL because the CTA does not exist.

- [ ] **Step 3: Implement marketing sections**

Create `frontend/components/landing/Hero.tsx`:

```tsx
export function Hero() {
  return (
    <section>
      <h1>AI 正在替客户做选择，你的品牌可能根本没有进入候选名单</h1>
      <p>注册后即可查看测试结果，注册成功后赠送 3 次免费测试机会。</p>
      <a href="/test">立即免费测试</a>
    </section>
  );
}
```

Create `frontend/components/landing/IndustrySection.tsx` and `frontend/components/landing/FAQSection.tsx` with static section placeholders.

Update `frontend/app/page.tsx`:

```tsx
import { FAQSection } from "../components/landing/FAQSection";
import { Hero } from "../components/landing/Hero";
import { IndustrySection } from "../components/landing/IndustrySection";

export default function LandingPage() {
  return (
    <main>
      <Hero />
      <IndustrySection />
      <FAQSection />
    </main>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
cd frontend && npm run test -- landing-page.spec.tsx
```

Expected: PASS.

- [ ] **Step 5: Add responsive behavior checks**

Update the landing page sections so they stack cleanly on mobile screens, avoid horizontal overflow, and keep the main CTA visible without requiring desktop-only layout assumptions.

- [ ] **Step 6: Commit**

```bash
git add frontend/app/page.tsx frontend/components/landing frontend/tests/unit/landing-page.spec.tsx
git commit -m "feat: add landing page sections"
```

### Task 8: Implement Registration UX and Draft Persistence

**Files:**
- Create: `frontend/components/auth/RegisterModal.tsx`
- Create: `frontend/lib/auth.ts`
- Create: `frontend/lib/draft.ts`
- Modify: `frontend/app/test/page.tsx`
- Test: `frontend/tests/unit/test-draft.spec.ts`

- [ ] **Step 1: Write the failing draft persistence test**

Create `frontend/tests/unit/test-draft.spec.ts`:

```ts
import { saveDraft, loadDraft } from "../../lib/draft";

test("saves and loads test form draft", () => {
  saveDraft({
    companyName: "Acme",
    productKeyword: "云服务器",
    industry: "IT科技",
    provider: "chatgpt",
  });
  expect(loadDraft()?.companyName).toBe("Acme");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
cd frontend && npm run test -- test-draft.spec.ts
```

Expected: FAIL because draft helpers do not exist.

- [ ] **Step 3: Implement draft helpers and modal shell**

Create `frontend/lib/draft.ts`:

```ts
const KEY = "geo-test-draft";

export type TestDraft = {
  companyName: string;
  productKeyword: string;
  industry: string;
  provider: string;
};

export function saveDraft(draft: TestDraft) {
  localStorage.setItem(KEY, JSON.stringify(draft));
}

export function loadDraft(): TestDraft | null {
  const raw = localStorage.getItem(KEY);
  return raw ? JSON.parse(raw) : null;
}
```

Create `frontend/lib/auth.ts`:

```ts
import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

export async function signUpWithEmail(email: string, password: string) {
  return supabase.auth.signUp({ email, password });
}

export async function signInWithEmail(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password });
}

export async function getAccessToken() {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}
```

Create `frontend/components/auth/RegisterModal.tsx` with fields for email, password, phone, and company name.

Update `frontend/app/test/page.tsx` to render:
- top aggregate metrics placeholder
- test form
- `查看AI曝光情况` button
- registration modal trigger when unauthenticated
- quota-exhausted state that replaces the primary test CTA with a contact-sales CTA
- responsive layout behavior for mobile screens

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
cd frontend && npm run test -- test-draft.spec.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add frontend/app/test/page.tsx frontend/components/auth/RegisterModal.tsx frontend/lib/auth.ts frontend/lib/draft.ts frontend/tests/unit/test-draft.spec.ts
git commit -m "feat: add test form draft persistence and registration shell"
```

### Task 9: Implement Test Execution Backend Pipeline

**Files:**
- Create: `backend/app/api/routes/tests.py`
- Create: `backend/app/schemas/tests.py`
- Create: `backend/app/services/prompt_builder.py`
- Create: `backend/app/services/company_preprocessor.py`
- Create: `backend/app/services/rule_matcher.py`
- Create: `backend/app/services/llm_review.py`
- Create: `backend/app/services/result_merger.py`
- Create: `backend/app/services/provider_adapter.py`
- Create: `backend/app/services/metrics.py`
- Test: `backend/tests/test_test_execution_service.py`

- [ ] **Step 1: Write the failing service test**

Create `backend/tests/test_test_execution_service.py`:

```python
from app.services.result_merger import adjudicate_result


def test_rule_match_wins_without_review():
    result = adjudicate_result(
        rule_matched=True,
        raw_match_count=2,
        llm_review_triggered=False,
        llm_match=None,
        llm_match_count=None,
    )
    assert result["is_mentioned"] is True
    assert result["mentioned_count_for_query"] == 1
    assert result["exposure_count_for_query"] == 2
    assert result["final_match_source"] == "rule"
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
cd backend && pytest tests/test_test_execution_service.py -v
```

Expected: FAIL because adjudication service does not exist.

- [ ] **Step 3: Implement minimal adjudication pipeline**

Create `backend/app/services/result_merger.py`:

```python
def adjudicate_result(
    rule_matched: bool,
    raw_match_count: int,
    llm_review_triggered: bool,
    llm_match: bool | None,
    llm_match_count: int | None,
):
    if rule_matched:
        return {
            "rule_matched": True,
            "llm_review_triggered": False,
            "is_mentioned": True,
            "mentioned_count_for_query": 1,
            "exposure_count_for_query": raw_match_count,
            "final_match_source": "rule",
        }
    if llm_review_triggered and llm_match:
        return {
            "rule_matched": False,
            "llm_review_triggered": True,
            "is_mentioned": True,
            "mentioned_count_for_query": 1,
            "exposure_count_for_query": llm_match_count or 1,
            "final_match_source": "llm_review",
        }
    return {
        "rule_matched": False,
        "llm_review_triggered": llm_review_triggered,
        "is_mentioned": False,
        "mentioned_count_for_query": 0,
        "exposure_count_for_query": 0,
        "final_match_source": "none",
    }
```

Add placeholder implementations for:
- `prompt_builder.py`
- `company_preprocessor.py`
- `rule_matcher.py`
- `llm_review.py`
- `provider_adapter.py`
- `metrics.py`

Create route and schema shells in `tests.py` and `schemas/tests.py`.

Implement `provider_adapter.py` with:
- a base adapter interface
- one concrete adapter skeleton for OpenAI
- clear method signatures for future DeepSeek, 豆包, and 通义 adapters

Implement `metrics.py` with:
- aggregate metric update helpers
- `calculate_overall_evaluation_text(total_query_count, total_mentioned_count)` for the 3-band mapping defined in spec

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
cd backend && pytest tests/test_test_execution_service.py -v
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/app backend/tests/test_test_execution_service.py
git commit -m "feat: scaffold test execution pipeline"
```

### Task 10: Wire Frontend Test Submission and Result Rendering

**Files:**
- Modify: `frontend/app/test/page.tsx`
- Modify: `frontend/app/result/[id]/page.tsx`
- Create: `frontend/lib/api.ts`
- Test: `frontend/tests/e2e/test-flow.spec.ts`

- [ ] **Step 1: Write the failing end-to-end flow test**

Create `frontend/tests/e2e/test-flow.spec.ts`:

```ts
import { test, expect } from "@playwright/test";

test("user can reach test page and see CTA", async ({ page }) => {
  await page.goto("/test");
  await expect(page.getByText("查看AI曝光情况")).toBeVisible();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
cd frontend && npm run test:e2e -- test-flow.spec.ts
```

Expected: FAIL until Playwright and page wiring are ready.

- [ ] **Step 3: Implement API client and page wiring**

Create `frontend/lib/api.ts`:

```ts
import { getAccessToken } from "./auth";

export async function getUserContext() {
  const token = await getAccessToken();
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/context/me`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  return response.json();
}
```

Update test and result pages so:
- test page fetches context
- test page shows aggregate metrics at the top
- test page switches the CTA to contact-sales when free quota is exhausted
- result page reads a `test_run_id`
- result page shows overall metrics and single-run details

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
cd frontend && npm run test:e2e -- test-flow.spec.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add frontend/app frontend/lib/api.ts frontend/tests/e2e/test-flow.spec.ts
git commit -m "feat: wire test flow and result rendering"
```

### Task 11: Implement Contact Sales and Email Notifications

**Files:**
- Create: `backend/app/api/routes/leads.py`
- Create: `backend/app/schemas/leads.py`
- Create: `backend/app/services/emailer.py`
- Test: `backend/tests/test_contact_leads_api.py`

- [ ] **Step 1: Write the failing lead API test**

Create `backend/tests/test_contact_leads_api.py`:

```python
from fastapi.testclient import TestClient

from app.main import app


def test_contact_leads_route_exists():
    client = TestClient(app)
    response = client.post("/api/leads/contact", json={})
    assert response.status_code in {401, 422}
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
cd backend && pytest tests/test_contact_leads_api.py -v
```

Expected: FAIL with 404.

- [ ] **Step 3: Implement minimal route**

Create `backend/app/schemas/leads.py`:

```python
from pydantic import BaseModel
from typing import Any


class ContactLeadRequest(BaseModel):
    test_run_id: str | None = None
    test_summary: dict[str, Any]


class ContactLeadResponse(BaseModel):
    success: bool
```

Create `backend/app/services/emailer.py`:

```python
def send_lead_notification(email: str, company_name: str, test_summary: dict) -> None:
    return None
```

Create `backend/app/api/routes/leads.py`:

```python
from fastapi import APIRouter, Depends

from app.core.security import require_bearer_token
from app.schemas.leads import ContactLeadRequest, ContactLeadResponse

router = APIRouter(prefix="/api/leads", tags=["leads"])


@router.post("/contact", response_model=ContactLeadResponse)
def create_contact_lead(
    payload: ContactLeadRequest,
    _: str = Depends(require_bearer_token),
):
    return ContactLeadResponse(success=True)
```

Update `backend/app/main.py` to include `leads_router`.

Add 24-hour duplicate submission protection so the same user cannot create repeated contact leads within the cooldown window.

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
cd backend && pytest tests/test_contact_leads_api.py -v
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/app backend/tests/test_contact_leads_api.py
git commit -m "feat: add contact leads endpoint"
```

### Task 12: Implement Lightweight Internal Dashboard

**Files:**
- Create: `backend/app/api/routes/dashboard.py`
- Modify: `backend/app/core/security.py`
- Modify: `frontend/app/dashboard/page.tsx`
- Test: `backend/tests/test_dashboard_api.py`
- Test: `frontend/tests/unit/dashboard-page.spec.tsx`

- [ ] **Step 1: Write the failing backend dashboard test**

Create `backend/tests/test_dashboard_api.py`:

```python
from fastapi.testclient import TestClient

from app.main import app


def test_dashboard_summary_route_exists():
    client = TestClient(app)
    response = client.get("/api/dashboard/summary")
    assert response.status_code in {401, 422}
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
cd backend && pytest tests/test_dashboard_api.py -v
```

Expected: FAIL with 404.

- [ ] **Step 3: Implement dashboard summary skeleton**

Create `backend/app/api/routes/dashboard.py`:

```python
from fastapi import APIRouter, Depends

from app.core.security import require_admin_token

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/summary")
def dashboard_summary(_: str = Depends(require_admin_token)):
    return {
        "user_count": 0,
        "test_count": 0,
        "lead_count": 0,
        "funnel": {},
    }
```

Update `backend/app/main.py` to include `dashboard_router`.

Update `backend/app/core/security.py` so `require_admin_token`:
- validates the bearer token
- resolves the authenticated user's email
- checks the email against `ADMIN_EMAIL_WHITELIST`
- returns `403` for non-admin users

Create `frontend/tests/unit/dashboard-page.spec.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import DashboardPage from "../../app/dashboard/page";


test("dashboard page renders title", () => {
  render(<DashboardPage />);
  expect(screen.getByText("GEO Dashboard")).toBeInTheDocument();
});
```

- [ ] **Step 4: Run tests to verify they pass**

Run:

```bash
cd backend && pytest tests/test_dashboard_api.py -v
cd ../frontend && npm run test -- dashboard-page.spec.tsx
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/app frontend/app/dashboard/page.tsx frontend/tests/unit/dashboard-page.spec.tsx backend/tests/test_dashboard_api.py
git commit -m "feat: add internal dashboard skeleton"
```

### Task 13: Implement Analytics Events

**Files:**
- Create: `frontend/lib/analytics.ts`
- Create: `backend/app/services/analytics.py`
- Test: `frontend/tests/unit/analytics.spec.ts`
- Test: `backend/tests/test_analytics_service.py`

- [ ] **Step 1: Write failing analytics tests**

Create `frontend/tests/unit/analytics.spec.ts`:

```ts
import { trackEvent } from "../../lib/analytics";

test("trackEvent is defined", () => {
  expect(typeof trackEvent).toBe("function");
});
```

Create `backend/tests/test_analytics_service.py`:

```python
from app.services.analytics import build_event_payload


def test_build_event_payload():
    payload = build_event_payload("landing_page_view", {"page": "landing"})
    assert payload["event_name"] == "landing_page_view"
```

- [ ] **Step 2: Run tests to verify they fail**

Run:

```bash
cd frontend && npm run test -- analytics.spec.ts
cd ../backend && pytest tests/test_analytics_service.py -v
```

Expected: FAIL because analytics helpers do not exist.

- [ ] **Step 3: Implement minimal analytics wrappers**

Create `frontend/lib/analytics.ts`:

```ts
export function trackEvent(eventName: string, properties: Record<string, unknown> = {}) {
  return { eventName, properties };
}
```

Create `backend/app/services/analytics.py`:

```python
def build_event_payload(event_name: str, properties: dict):
    return {"event_name": event_name, "properties": properties}
```

- [ ] **Step 4: Run tests to verify they pass**

Run:

```bash
cd frontend && npm run test -- analytics.spec.ts
cd ../backend && pytest tests/test_analytics_service.py -v
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add frontend/lib/analytics.ts backend/app/services/analytics.py frontend/tests/unit/analytics.spec.ts backend/tests/test_analytics_service.py
git commit -m "feat: add analytics wrappers"
```

### Task 14: Final Hardening and Deployment Readiness

**Files:**
- Modify: `frontend/.env.example`
- Modify: `backend/.env.example`
- Create: `infra/docs/deployment.md`
- Test: `frontend/tests/e2e/*`
- Test: `backend/tests/*`

- [ ] **Step 1: Write deployment notes**

Create `infra/docs/deployment.md`:

```md
# Deployment Notes

## Frontend
- Deploy `frontend/` to Vercel
- Set `NEXT_PUBLIC_SUPABASE_URL`
- Set `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Set `NEXT_PUBLIC_API_BASE_URL`

## Backend
- Deploy `backend/` to Aliyun
- Set database, Supabase, model, and email environment variables
- Configure CORS to allow the frontend origin

## Mobile
- Verify landing, test, result, and dashboard pages render without horizontal overflow on a 390px-wide viewport
```

- [ ] **Step 2: Run backend tests**

Run:

```bash
cd backend && pytest -v
```

Expected: PASS.

- [ ] **Step 3: Run frontend tests**

Run:

```bash
cd frontend && npm run test
```

Expected: PASS.

- [ ] **Step 4: Run end-to-end tests**

Run:

```bash
cd frontend && npm run test:e2e
```

Expected: PASS for landing, test, result, and registration flow coverage.

- [ ] **Step 5: Run mobile viewport smoke test**

Run:

```bash
cd frontend && npm run test:e2e -- --project=chromium
```

Expected: PASS for a mobile-sized viewport scenario covering landing and test pages.

- [ ] **Step 6: Commit**

```bash
git add frontend/.env.example backend/.env.example infra/docs/deployment.md
git commit -m "chore: finalize deployment readiness"
```

## 8. Spec Coverage Check

This plan covers:

- Landing page structure and conversion CTA flow
- Email registration with required phone + company
- Three free test quota model
- Quota-exhausted state that switches to contact-sales CTA
- Test page aggregate metrics and draft persistence
- Conditional registration before execution
- Separate backend-owned test execution pipeline
- Contact-sales lead submission and email notification
- Lightweight internal dashboard for user/test/funnel data
- Event tracking and deployment structure
- Mobile-responsive behavior expectations

Potential follow-up plan items, if scope increases later:

- Prompt/template admin UI
- CRM integration
- Alias matching improvements
- Citation/source extraction
- Multi-provider comparison

## 9. Assistant Workflow Recommendation

Use this execution workflow with Claude/GPT-class coding assistants:

1. Assign one task at a time.
2. Give the assistant only the relevant spec plus the relevant task section from this plan.
3. Require the assistant to run the task-specific tests before claiming completion.
4. Review diffs before moving to the next task.
5. Do not let assistants merge unrelated cleanup into a task.
6. Keep commits task-scoped.

Recommended prompt pattern:

```md
Read:
- docs/superpowers/specs/2026-04-13-geo-landing-design.md
- docs/superpowers/specs/2026-04-13-geo-test-technical-design.md
- docs/superpowers/specs/2026-04-13-geo-site-technical-architecture.md
- DEVELOPMENT_PLAN.md

Implement only: Task N

Requirements:
- Do not widen scope
- Run the tests listed in Task N
- Show exact files changed
- Stop after Task N is complete
```

## 10. Plan Self-Review

- Spec coverage: the plan maps product structure, test flow, architecture boundaries, analytics, dashboard, and deployment into task groups.
- Placeholder scan: no `TBD` or `TODO` markers are left in tasks.
- Type consistency: the same core entities are used throughout: `users`, `user_test_metrics`, `test_runs`, `prompt_templates`, `contact_leads`.

## 11. Notes

- This repository is currently not a git repository, so commit commands in this plan are part of the intended workflow and will only work after git is initialized.
- The plan assumes greenfield implementation. If the project structure changes before coding starts, update the file ownership map before executing tasks.
