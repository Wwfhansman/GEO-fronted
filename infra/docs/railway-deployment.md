# Railway 后端部署指南

## 前置准备

1. **注册 Railway 账户**
   - 访问 https://railway.app
   - 用 GitHub 账户登录（推荐）

2. **确保代码已 commit**
   ```bash
   cd /Users/goucaicai/Desktop/GEO-fronted
   git status
   git add .
   git commit -m "feat: add Railway deployment config"
   ```

## 部署步骤

### 方式一：从 Railway 仪表板部署（推荐新手）

1. **创建新项目**
   - 进入 https://railway.app/dashboard
   - 点击 "New Project"
   - 选择 "Deploy from GitHub"
   - 授权 Railway 访问你的 GitHub

2. **选择仓库和分支**
   - 选择你的 `GEO-fronted` 仓库
   - 选择 `main` 分支
   - 点击 "Deploy"

3. **Railway 自动检测**
   - Railway 会自动检测 `Procfile`
   - 自动安装 `requirements.txt` 中的依赖
   - 自动设置 Python 3.9+

4. **配置环境变量**
   - 点击项目 → "Variables"
   - 添加以下环境变量（从 `.env.example` 复制）：
     ```
     APP_ENV=production
     DATABASE_URL=postgresql://user:pass@host:port/dbname
     SUPABASE_JWT_SECRET=xxx
     SUPABASE_PROJECT_URL=https://xxx.supabase.co
     SUPABASE_SERVICE_ROLE_KEY=xxx
     OPENAI_API_KEY=xxx
     OPENAI_BASE_URL=https://api.qnaigc.com/v1
     CHATGPT_MODEL=openai/gpt-5.4-mini
     DEEPSEEK_MODEL=deepseek-v3
     DOUBAO_MODEL=doubao-1.5-pro-32k
     TONGYI_MODEL=qwen/qwen3.6-plus
     REVIEW_MODEL_API_KEY=xxx（可选）
     EMAIL_API_KEY=xxx（可选）
     EMAIL_FROM=noreply@geo.example.com
     LEAD_NOTIFICATION_TO=your-email@example.com
     CORS_ALLOW_ORIGINS=https://your-frontend.vercel.app
     ADMIN_EMAIL_WHITELIST=admin@example.com
     ```

5. **配置数据库**
   - **选项 A：用 Railway Postgres**
     - 项目内点 "New"
     - 选 "Database" → "PostgreSQL"
     - Railway 自动生成 `DATABASE_URL`，复制到环境变量
   
   - **选项 B：用外部数据库（如 Supabase Postgres）**
     - 从 Supabase 项目获取 connection string
     - 格式：`postgresql://user:password@host:port/database?sslmode=require`
     - 粘贴到环境变量 `DATABASE_URL`

6. **获取公网 URL**
   - 部署完成后，点击项目名
   - 右上角找 "Public URL" 或 "Domain"
   - 这就是你的 API 地址，例如：`https://geo-backend-prod.railway.app`
   - 更新前端的 `NEXT_PUBLIC_API_BASE_URL=https://geo-backend-prod.railway.app`

### 方式二：用 Railway CLI 部署（面向开发者）

1. **安装 Railway CLI**
   ```bash
   npm i -g @railway/cli
   # 或
   brew install railway
   ```

2. **登录**
   ```bash
   railway login
   ```

3. **初始化项目**
   ```bash
   cd backend
   railway init
   # 选择"Create a new project"，输入项目名
   ```

4. **添加 Postgres 插件**
   ```bash
   railway add
   # 选择 "PostgreSQL"
   ```

5. **部署**
   ```bash
   railway up
   # 或指定后端目录
   railway up --service backend
   ```

6. **设置环境变量**
   ```bash
   railway variables set DATABASE_URL=postgresql://...
   railway variables set SUPABASE_JWT_SECRET=xxx
   railway variables set SUPABASE_PROJECT_URL=https://...
   # ... 其他变量
   ```

7. **查看日志**
   ```bash
   railway logs
   ```

8. **获取公网 URL**
   ```bash
   railway domains
   # 或从仪表板复制
   ```

## 数据库初始化

Railway 部署时不会自动运行迁移。如果需要创建表：

1. **本地运行初始化（一次性）**
   ```bash
   cd backend
   source .venv/bin/activate
   DATABASE_URL=postgresql://user:pass@host/db python -c "from app.db.session import init_db; init_db()"
   ```

2. **或通过 Railway 远程 shell**
   - 仪表板 → 项目 → "Connect" → 选择数据库
   - 用 psql 或其他工具直接运行 SQL

## 常见问题

### Q: 部署后 502 错误
**A:** 检查 Procfile 命令是否正确，查看日志：
```bash
railway logs --follow
```

### Q: 数据库连接失败
**A:** 确保：
- `DATABASE_URL` 格式正确（带 `?sslmode=require`）
- 数据库有足够的连接池配置
- Postgres 版本 ≥ 12

### Q: CORS 错误
**A:** 检查 `CORS_ALLOW_ORIGINS` 环境变量，确保包含前端 URL

### Q: 冷启动慢
**A:** Railway 免费层会有冷启动延迟。可升级到付费计划或保活。

## 监控和日志

- **实时日志**：仪表板 → "Logs"
- **指标**：仪表板 → "Metrics"（CPU、内存、网络）
- **健康检查**：访问 `/health` 端点检查应用状态

## 自定义域名

1. 购买域名（如 Godaddy、阿里云等）
2. Railway 项目 → "Domains" → "Add Custom Domain"
3. 按提示配置 DNS 记录（CNAME）

## 部署后的前端配置

前端需要更新 `NEXT_PUBLIC_API_BASE_URL`：
```bash
# .env.local（本地开发）
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000

# Vercel 项目设置（生产）
NEXT_PUBLIC_API_BASE_URL=https://你的-railway-app-url
```

---

**下一步：** 部署完成后，访问 `https://your-railway-url/docs` 查看 Swagger 文档验证 API 正常。
