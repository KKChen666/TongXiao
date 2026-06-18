# ==========================
# 阶段1: 构建前端
# ==========================
FROM node:22-alpine AS frontend-builder

WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm config set registry https://registry.npmmirror.com && npm install
COPY frontend/ ./
RUN npm run build

# ==========================
# 阶段2: 后端运行环境
# ==========================
FROM python:3.10-slim

WORKDIR /app

# 安装依赖（使用清华镜像加速）
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -i https://pypi.tuna.tsinghua.edu.cn/simple -r requirements.txt

# 复制后端代码
COPY backend/ ./

# 复制前端构建产物
COPY --from=frontend-builder /app/frontend/dist /app/frontend/dist

# 暴露端口
EXPOSE 7896

# 启动命令
CMD ["python", "-u", "run.py"]
