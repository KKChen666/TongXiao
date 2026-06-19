#!/bin/bash
# ============================================================
# TongXiao 容器启动入口
# 启动时自动: git pull → pip install(按需) → 启动服务
# ============================================================

set -e

APP_DIR="/app"
BACKEND_DIR="${APP_DIR}/backend"
GIT_BRANCH="${GIT_BRANCH:-master}"
GIT_REPO_URL="${GIT_REPO_URL:-}"

log()   { echo "[ENTRY] $1"; }
warn()  { echo "[ENTRY] ⚠ $1"; }

# 修复容器内 git dubious ownership 问题
git config --global --add safe.directory /app 2>/dev/null || true

# GitHub 镜像加速（国内服务器访问 GitHub 更稳定）
git config --global url."https://ghfast.top/https://github.com/".insteadOf "https://github.com/" 2>/dev/null || true

# ===========================
# 拉取后端代码（sparse-checkout: 只拉 backend/）
# ===========================
update_code() {
    cd "${APP_DIR}"

    # --- 已有 git 仓库 → git pull ---
    if [ -d ".git" ]; then
        log "拉取最新代码（sparse-checkout: backend/）..."

        # 私有仓库 HTTPS + Token 认证
        if [ -n "${GIT_TOKEN}" ]; then
            REMOTE_URL=$(git remote get-url origin 2>/dev/null || echo "")
            if echo "$REMOTE_URL" | grep -q "^https://"; then
                AUTH_URL=$(echo "$REMOTE_URL" | sed "s|https://|https://${GIT_TOKEN}@|")
                git remote set-url origin "$AUTH_URL" 2>/dev/null || true
            fi
        fi

        git sparse-checkout init --cone 2>/dev/null || true
        git sparse-checkout set backend 2>/dev/null || true

        BEFORE=$(git rev-parse HEAD 2>/dev/null || echo "?")

        timeout 30 git fetch origin "${GIT_BRANCH}" 2>/dev/null || {
            warn "git fetch 超时或失败，用已有代码启动"
            return 0
        }
        timeout 15 git reset --hard "origin/${GIT_BRANCH}" 2>/dev/null || {
            warn "git reset 失败，用已有代码启动"
            return 0
        }

        AFTER=$(git rev-parse HEAD 2>/dev/null || echo "?")
        if [ "$BEFORE" != "$AFTER" ]; then
            log "代码已更新: ${BEFORE:0:7} → ${AFTER:0:7}"
        else
            log "代码已是最新: ${AFTER:0:7}"
        fi
        return 0
    fi

    # --- 首次部署 → git clone ---
    if [ -z "${GIT_REPO_URL}" ]; then
        warn "未设置 GIT_REPO_URL，且 .git 目录不存在"
        warn "请在 .env 中设置 GIT_REPO_URL"
        return 0
    fi

    log "首次部署，克隆仓库（sparse-checkout: backend/）..."
    log "仓库: ${GIT_REPO_URL}"

    local CLONE_URL="${GIT_REPO_URL}"
    if [ -n "${GIT_TOKEN}" ] && echo "${GIT_REPO_URL}" | grep -q "^https://"; then
        CLONE_URL=$(echo "${GIT_REPO_URL}" | sed "s|https://|https://${GIT_TOKEN}@|")
    fi

    git clone --depth 1 --filter=blob:none --no-checkout "${CLONE_URL}" /tmp/tongxiao-clone 2>/dev/null || {
        warn "git clone 失败，请检查 GIT_REPO_URL"
        return 0
    }

    mv /tmp/tongxiao-clone/.git "${APP_DIR}/"
    rm -rf /tmp/tongxiao-clone

    git sparse-checkout init --cone
    git sparse-checkout set backend
    git checkout

    log "后端代码部署完成"
}

# ===========================
# 安装 Python 依赖
# 策略：先检测核心包是否可用，不可用则安装；可用时再检查 requirements.txt 是否变化
# ===========================
update_deps() {
    local REQ="${BACKEND_DIR}/requirements.txt"
    local HASH_FILE="${APP_DIR}/.requirements_hash"

    if [ ! -f "$REQ" ]; then
        return 0
    fi

    # 检测核心包是否已安装（防止容器重建后依赖丢失）
    if ! python3 -c "import uvicorn, fastapi" 2>/dev/null; then
        log "核心依赖缺失，安装中..."
        pip install --no-cache-dir \
            -i https://pypi.tuna.tsinghua.edu.cn/simple \
            -r "$REQ"
        md5sum "$REQ" | awk '{print $1}' > "$HASH_FILE"
        log "依赖安装完成"
        return 0
    fi

    # 核心包已安装，检查 requirements.txt 是否有变化
    local CURRENT_HASH=$(md5sum "$REQ" | awk '{print $1}')

    if [ -f "$HASH_FILE" ] && [ "$(cat $HASH_FILE)" = "$CURRENT_HASH" ]; then
        log "依赖无变化，跳过安装"
        return 0
    fi

    log "requirements.txt 已变更，更新依赖..."
    pip install --no-cache-dir \
        -i https://pypi.tuna.tsinghua.edu.cn/simple \
        -r "$REQ"

    echo "$CURRENT_HASH" > "$HASH_FILE"
    log "依赖更新完成"
}

# ===========================
# 启动
# ===========================
start_server() {
    log "启动 TongXiao..."
    cd "${BACKEND_DIR}"
    exec python -u run.py
}

# ===========================
# Main
# ===========================
echo "=== TongXiao 容器启动 ==="
echo "时间: $(date '+%Y-%m-%d %H:%M:%S')"
echo "分支: ${GIT_BRANCH}"

update_code
update_deps
start_server
