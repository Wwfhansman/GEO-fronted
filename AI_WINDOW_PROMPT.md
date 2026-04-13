# AI 开发接管提示词（后端优先版）

你现在接管的是一个 GEO 落地页 MVP 项目。请严格按下面要求继续开发，不要自行扩 scope。

## 1. 你的角色和工作方式

- 你是本项目的实现工程师，不是产品顾问。
- 采用 **TDD**：先写失败测试，再实现最小可行代码，再回归测试，再提交。
- 每次只做一个小任务，提交要小而清晰。
- 所有变更必须可运行、可测试、可解释。

## 2. 强约束（必须遵守）

- **当前阶段先不做前端界面设计与样式开发**。  
前端页面原型由产品方另行推进，你只允许做必要的前端接线（例如 API 调用、鉴权 token 传递、状态分支），不要做视觉层改造。
- 不要删除或回滚已有提交。
- 不要改写规格文档的业务口径。

## 3. 先读这 4 个文件

1. [DEVELOPMENT_PLAN.md](/Users/goucaicai/Desktop/GEO-project/DEVELOPMENT_PLAN.md)
2. [2026-04-13-geo-landing-design.md](/Users/goucaicai/Desktop/GEO-project/docs/superpowers/specs/2026-04-13-geo-landing-design.md)
3. [2026-04-13-geo-test-technical-design.md](/Users/goucaicai/Desktop/GEO-project/docs/superpowers/specs/2026-04-13-geo-test-technical-design.md)
4. [2026-04-13-geo-site-technical-architecture.md](/Users/goucaicai/Desktop/GEO-project/docs/superpowers/specs/2026-04-13-geo-site-technical-architecture.md)

## 4. 当前项目状态（你接手时）

已完成（含提交）：
- 项目骨架、环境样例、schema/seed
- FastAPI 基础启动 + health + CORS
- auth bootstrap 路由骨架
- user context 路由骨架
- tests pipeline 路由与服务层骨架
- leads 路由骨架（含 24h 冷却占位）
- dashboard summary 路由骨架（admin guard 占位）
- backend analytics service 占位

后端测试当前全绿：`backend/tests`。

## 5. 当前最重要的待实现项（按优先级）

### P0：把后端占位实现替换为真实业务实现

1. `auth bootstrap`  
- 不再返回 `placeholder-user-id`。  
- 基于 Supabase JWT claims（至少 `sub`、`email`）落库/更新 `users`。

2. `require_admin_token`  
- 现在是“token 字符串等于邮箱”的占位逻辑。  
- 改为：校验 JWT -> 提取 email -> 对比 `ADMIN_EMAIL_WHITELIST`。

3. `tests execute`  
- 去掉 `simulated_response` 占位。  
- 接入真实 provider adapter 调用（至少先完成一个 provider 的真实调用链）。
- 保留“规则优先、LLM 补充、分层裁决”的判定口径。

4. `leads`  
- 24h 防重复从内存字典迁移到数据库层约束逻辑（避免服务重启丢失）。
- 按 schema 写入 `contact_leads.test_summary`、`email_sent`。
- 接入邮件发送服务（先可用 mock provider，接口要稳定）。

5. `dashboard`  
- 从硬编码返回改为数据库聚合返回（user_count/test_count/lead_count/funnel 基础指标）。

### P1：数据库与服务层一致性

- 完成 SQLAlchemy model / repository / service 分层（或同等清晰结构）。
- 关键写路径加事务，保证 quota 扣减与结果落库一致。
- 把内存态逻辑（例如 leads 冷却）替换为可持久化逻辑。

### P2：可运维性

- 标准化错误码和错误响应结构。
- 日志里保留 test_run_id / user_id 关联信息。
- 补充最小 API 集成测试。

## 6. 开发边界（前端相关）

允许：
- `frontend/lib/api.ts`、`frontend/lib/auth.ts` 这类接线代码
- 与后端接口契约相关的最小调整

不允许：
- 落地页视觉改版
- UI 风格、动效、排版重做
- 超出“能对接后端”之外的前端工作

## 7. 测试和验证要求

后端每次改动后至少执行：

```bash
cd backend
.venv/bin/python -m pytest tests -v
```

新增接口时必须有对应测试文件，至少覆盖：
- 路由存在性
- 鉴权分支
- 成功分支
- 关键失败分支

## 8. 提交规范

- 一次提交只做一件事。
- commit message 采用：
  - `feat: ...`
  - `fix: ...`
  - `refactor: ...`
  - `test: ...`
  - `docs: ...`
- 每次提交后附带：
  - 改动文件列表
  - 运行过的测试命令
  - 测试结果摘要

## 9. 你接下来第一步要做什么

先从 `auth + security` 开始，把这两个占位点做实：

1. JWT claim 解析与校验（Supabase）  
2. `users` upsert（按 `supabase_auth_id` / `email`）  
3. `require_admin_token` 改成 claim + whitelist 模式  
4. 补对应测试并跑通全量后端测试

完成后再进入 `tests execute` 的真实 provider 调用改造。
