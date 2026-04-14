#!/bin/bash
set -e

# ─────────────────────────────────────────────
#  GEO Backend 一键部署脚本
#  适用：Ubuntu 22.04 / root 用户
#  用法：bash deploy-backend.sh
# ─────────────────────────────────────────────

REPO_URL="https://github.com/Wwfhansman/GEO-fronted.git"
APP_DIR="/opt/geo-backend"
SERVICE_NAME="geo-backend"
PORT=8000

# ── 颜色输出 ─────────────────────────────────
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'
log()   { echo -e "${GREEN}[$(date '+%H:%M:%S')] $1${NC}"; }
warn()  { echo -e "${YELLOW}[$(date '+%H:%M:%S')] $1${NC}"; }
error() { echo -e "${RED}[$(date '+%H:%M:%S')] $1${NC}"; exit 1; }

# ── 1. 系统更新 ───────────────────────────────
log "1/7 更新系统..."
apt-get update -qq
apt-get install -y -qq git python3 python3-pip python3-venv curl

# ── 2. 克隆或更新代码 ─────────────────────────
log "2/7 拉取代码..."
if [ -d "$APP_DIR/.git" ]; then
    cd "$APP_DIR"
    git pull origin main
else
    git clone "$REPO_URL" "$APP_DIR"
    cd "$APP_DIR"
fi

# ── 3. 安装 Python 依赖 ───────────────────────
log "3/7 安装 Python 依赖..."
cd "$APP_DIR/backend"
python3 -m venv .venv
source .venv/bin/activate
pip install -q --upgrade pip
pip install -q -r requirements.txt

# ── 4. 配置 .env ──────────────────────────────
log "4/7 配置环境变量..."
ENV_FILE="$APP_DIR/backend/.env"

if [ ! -f "$ENV_FILE" ]; then
    warn ".env 文件不存在，正在创建..."
    cat > "$ENV_FILE" << 'EOF'
# ─── 必填 ────────────────────────────────────
APP_ENV=production

# Supabase Postgres 连接串（在 Supabase 控制台 → Project Settings → Database → Connection string → URI）
DATABASE_URL=postgresql://postgres.xxxx:password@aws-0-xxxx.pooler.supabase.com:5432/postgres

# Supabase JWT（Project Settings → API → JWT Secret）
SUPABASE_JWT_SECRET=your-supabase-jwt-secret

# Supabase 项目 URL（Project Settings → API → Project URL）
SUPABASE_PROJECT_URL=https://xxxx.supabase.co

# Supabase Service Role Key（Project Settings → API → service_role key）
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# ─── AI 模型 ──────────────────────────────────
OPENAI_API_KEY=your-qiniu-or-openai-key
OPENAI_BASE_URL=https://api.qnaigc.com/v1
CHATGPT_MODEL=openai/gpt-5.4-mini
DEEPSEEK_MODEL=deepseek-v3
DOUBAO_MODEL=doubao-1.5-pro-32k
TONGYI_MODEL=qwen/qwen3.6-plus
REVIEW_MODEL_API_KEY=

# ─── 邮件通知（可选）─────────────────────────
EMAIL_API_KEY=
EMAIL_FROM=noreply@geo.example.com
LEAD_NOTIFICATION_TO=

# ─── 跨域（填你的 Vercel 前端地址）───────────
CORS_ALLOW_ORIGINS=http://223.109.140.174:8000,https://your-frontend.vercel.app

# ─── 管理员白名单 ─────────────────────────────
ADMIN_EMAIL_WHITELIST=admin@example.com

# ─── 埋点 ─────────────────────────────────────
ANALYTICS_WRITE_KEY=
EOF
    warn "⚠️  请编辑 $ENV_FILE 填入真实的值，然后重新运行脚本！"
    warn "命令：nano $ENV_FILE"
    exit 0
else
    log ".env 文件已存在，跳过创建"
fi

# ── 5. 配置 systemd 服务 ──────────────────────
log "5/7 配置 systemd 服务..."
cat > /etc/systemd/system/${SERVICE_NAME}.service << EOF
[Unit]
Description=GEO Backend (FastAPI)
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=$APP_DIR/backend
EnvironmentFile=$APP_DIR/backend/.env
ExecStart=$APP_DIR/backend/.venv/bin/uvicorn app.main:app --host 0.0.0.0 --port $PORT
Restart=always
RestartSec=5
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable ${SERVICE_NAME}

# ── 6. 开放防火墙端口 ─────────────────────────
log "6/7 配置防火墙..."
if command -v ufw &> /dev/null; then
    ufw allow ${PORT}/tcp
    log "UFW 已开放端口 ${PORT}"
else
    warn "UFW 未安装，请手动在云服务商控制台开放端口 ${PORT}"
fi

# ── 7. 启动服务 ───────────────────────────────
log "7/7 启动服务..."
systemctl restart ${SERVICE_NAME}
sleep 3

# ── 健康检查 ──────────────────────────────────
if curl -sf "http://localhost:${PORT}/health" > /dev/null 2>&1; then
    log "✅ 部署成功！"
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "  API 地址：http://223.109.140.174:${PORT}"
    echo "  API 文档：http://223.109.140.174:${PORT}/docs"
    echo "  健康检查：http://223.109.140.174:${PORT}/health"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "常用命令："
    echo "  查看日志：journalctl -u ${SERVICE_NAME} -f"
    echo "  重启服务：systemctl restart ${SERVICE_NAME}"
    echo "  停止服务：systemctl stop ${SERVICE_NAME}"
else
    error "❌ 服务启动失败，请查看日志：journalctl -u ${SERVICE_NAME} -n 50"
fi
