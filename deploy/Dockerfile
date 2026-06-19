# ============================================================
# TongXiao 后端容器
#
# 镜像 = Python 3.10 + git（纯净运行时，不含业务代码）
# 代码 = 容器启动时通过 git sparse-checkout 拉取 backend/
#
# 构建（在 deploy/ 目录下执行）：
#   docker compose build
# ============================================================

FROM python:3.10-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    git \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 7896

ENTRYPOINT ["/entrypoint.sh"]
