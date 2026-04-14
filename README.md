# GEO Frontend MVP

这是一个 GEO 落地页 MVP 项目，采用前后端分离架构：

- `frontend/`：Next.js 前端站点
- `backend/`：FastAPI 后端服务
- `infra/`：Supabase 初始化 SQL 和部署说明

当前项目已经具备这些核心能力：

- 官网首页、测试页、结果页、后台页基础路由
- Supabase 邮箱密码注册 / 登录接线
- 后端 JWT 校验、用户 bootstrap、上下文查询
- GEO 测试执行链路
- 七牛云 OpenAI 兼容模型调用
- 测试结果持久化与用户指标累计
- 联系销售提交流程
- 基础 analytics 和 dashboard 聚合

## 环境要求

- Node.js 20+
- Python 3.9+
- npm

## 环境变量

### 后端

复制一份：

```bash
cp backend/.env.example backend/.env
```

至少确认这些字段已经填写：

```env
DATABASE_URL=
SUPABASE_JWT_SECRET=
SUPABASE_PROJECT_URL=
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=
OPENAI_BASE_URL=
ADMIN_EMAIL_WHITELIST=
```

如果你本地开发，不想先连远程 Postgres，可以直接用：

```env
DATABASE_URL=sqlite:///./geo.db
```

### 前端

创建：

```bash
cp frontend/.env.example frontend/.env.local
```

至少确认这些字段已经填写：

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

开发环境约定：

- Supabase Auth 采用邮箱 + 密码注册 / 登录
- 不依赖邮箱验证完成主流程
- 请在 Supabase Dashboard 中关闭 `Confirm email`，否则注册后拿不到可用 session，前端会提示配置不符合当前产品链路

## 安装依赖

### 前端

```bash
cd frontend
npm install
```

### 后端

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -e .
```

如果 `pip install -e .` 有问题，也可以按现有依赖手动装：

```bash
pip install fastapi uvicorn sqlalchemy "psycopg[binary]" pydantic pydantic-settings "python-jose[cryptography]" httpx pytest
```

## 本地启动

建议开两个终端分别启动前后端。

### 启动后端

```bash
cd backend
source .venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

后端默认地址：

```text
http://localhost:8000
```

健康检查：

```text
http://localhost:8000/health
```

### 启动前端

```bash
cd frontend
npm run dev
```

前端默认地址：

```text
http://localhost:3000
```

## 页面路径

- 首页：`/`
- 测试页：`/test`
- 结果页：`/result/[id]`
- 后台页：`/dashboard`

## 测试命令

### 后端测试

```bash
cd backend
source .venv/bin/activate
python -m pytest tests -q
```

### 前端单元测试

```bash
cd frontend
npm test
```

### 前端 E2E

先保证前端可启动，然后执行：

```bash
cd frontend
npm run test:e2e
```

## 当前建议的联调顺序

1. 先启动后端，访问 `/health`
2. 再启动前端，打开 `/test`
3. 验证注册 / 登录是否正常，且注册后无需邮件确认即可继续测试
4. 验证测试执行、结果详情、历史记录
5. 验证联系销售和 dashboard

## 目录说明

```text
backend/   FastAPI 服务、数据库模型、业务路由、测试
frontend/  Next.js 页面、认证接线、前端测试
infra/     Supabase SQL 与部署说明
docs/      规划文档与规格文档
```
