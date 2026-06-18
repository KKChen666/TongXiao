# TongXiao 部署与发布手册

**版本**: v1.0  
**日期**: 2026年6月18日  
**部署平台**: 腾讯云轻量应用服务器（Lighthouse）  
**域名**: https://good-luck-lct.icu

---

## 目录

1. [项目概述](#1-项目概述)
2. [技术架构](#2-技术架构)
3. [环境要求](#3-环境要求)
4. [本地开发](#4-本地开发)
5. [Docker 部署](#5-docker-部署)
6. [服务器部署](#6-服务器部署)
7. [域名与 HTTPS 配置](#7-域名与-https-配置)
8. [命令速查表](#8-命令速查表)
9. [故障排除](#9-故障排除)
10. [附录](#10-附录)

---

## 1. 项目概述

### 1.1 项目简介
TongXiao（通晓）是一款考研备考辅助应用，提供卡片式背诵功能，支持英语和政治两个学科的知识点复习。项目采用前后端分离架构，前端使用 React + HeroUI v2 构建，后端使用 Python FastAPI 提供 API 服务。

### 1.2 技术栈

| 层面 | 技术选型 |
|------|----------|
| 前端框架 | React 19 + Vite |
| UI 组件库 | HeroUI v2（Tailwind CSS + Framer Motion） |
| 后端框架 | Python FastAPI |
| 数据库 | MySQL 8.0（生产）/ SQLite（开发） |
| 容器化 | Docker + Docker Compose |
| 反向代理 | Nginx（宝塔面板） |
| SSL 证书 | Let's Encrypt（certbot 自动续期） |

### 1.3 功能模块
- **学科管理**：英语、政治两个学科的卡片管理
- **卡片背诵**：正面/背面翻转式记忆卡片
- **进度追踪**：各学科复习进度百分比统计
- **搜索功能**：按关键词搜索卡片内容

---

## 2. 技术架构

### 2.1 整体架构图
```
用户浏览器 → Nginx（HTTPS 反向代理）→ Docker 容器（FastAPI :7896 + 静态文件）→ MySQL 数据库
```

### 2.2 前端架构
前端位于 `frontend/` 目录，使用 Vite 构建工具。开发时运行 `npm run dev` 启动热重载开发服务器（端口 5173）。生产构建输出到 `frontend/dist/` 目录，由 FastAPI 后端统一托管静态文件。

- 入口文件：`frontend/src/main.jsx`
- 路由：React Router（首页、学科详情页、搜索页）
- 状态管理：React Hooks（useState、useEffect）
- 样式方案：Tailwind CSS + HeroUI v2 组件

### 2.3 后端架构
后端位于 `backend/` 目录，使用 FastAPI 框架。

- 入口文件：`backend/run.py`（uvicorn 启动）
- 配置：`backend/config.py`（数据库、端口、主题色）
- 路由：`backend/main.py`（API 路由定义）
- 数据库：`backend/database.py`（MySQL/SQLite 双模式）

### 2.4 Docker 容器化
项目使用多阶段 Docker 构建：

- **阶段1（frontend-builder）**：Node 22 Alpine 镜像，安装依赖并执行 `npm run build`
- **阶段2（最终镜像）**：Python 3.10-slim 镜像，复制后端代码和前端构建产物

容器通过 `docker-compose.yml` 编排，映射端口 `7896:7896`，设置重启策略为 `unless-stopped`。

---

## 3. 环境要求

### 3.1 本地开发环境

| 软件 | 版本要求 | 用途 |
|------|----------|------|
| Node.js | >= 18（推荐 22） | 前端构建 |
| Python | >= 3.10 | 后端运行 |
| MySQL | 8.0+ | 数据库（可选，开发可用 SQLite） |
| Git | 任意版本 | 版本控制 |

### 3.2 生产环境

| 软件 | 版本要求 |
|------|----------|
| 操作系统 | Linux（OpenCloudOS 9 / CentOS 7+ / Ubuntu 20.04+） |
| Docker | Docker Engine 24+ + Docker Compose v2 |
| Nginx | 1.20+（宝塔面板自带或独立安装） |
| SSL 工具 | certbot（Let's Encrypt 证书申请） |

---

## 4. 本地开发

### 4.1 克隆项目
```bash
git clone <仓库地址>
cd TongXiao
```

### 4.2 后端启动
```bash
cd backend
pip install -r requirements.txt
# 修改 config.py 中 DB_TYPE = "sqlite"（本地开发推荐）
python run.py
```

后端默认运行在 `http://localhost:7896`，API 文档可访问 `http://localhost:7896/docs`。

### 4.3 前端启动
```bash
cd frontend
npm install
npm run dev
```

前端开发服务器默认运行在 `http://localhost:5173`，自动代理 API 请求到后端 7896 端口。

### 4.4 一键启动（Windows）
Windows 用户可运行项目根目录的 `setup.ps1` 脚本自动完成依赖安装和启动。

> **提示**：本地开发时建议将 `config.py` 中 `DB_TYPE` 设为 `"sqlite"`，无需额外安装 MySQL。

---

## 5. Docker 部署

### 5.1 Dockerfile 说明
```dockerfile
# 阶段1：构建前端（Node 22 Alpine）
FROM node:22-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm config set registry https://registry.npmmirror.com && npm install
COPY frontend/ ./
RUN npm run build

# 阶段2：后端运行环境（Python 3.10-slim）
FROM python:3.10-slim
WORKDIR /app
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir \
    -i https://pypi.tuna.tsinghua.edu.cn/simple \
    -r requirements.txt
COPY backend/ ./
COPY --from=frontend-builder /app/frontend/dist /app/frontend/dist
EXPOSE 7896
CMD ["python", "-u", "run.py"]
```

### 5.2 docker-compose.yml 说明
```yaml
version: "3.8"
services:
  tongxiao:
    build: .
    container_name: tongxiao
    restart: unless-stopped
    ports:
      - "7896:7896"
    environment:
      - TZ=Asia/Shanghai
```

### 5.3 构建与启动
```bash
# 首次部署：构建镜像并后台启动
docker compose up -d --build

# 查看构建和启动日志
docker compose logs -f

# 查看运行状态
docker ps --filter name=tongxiao
```

### 5.4 更新部署
当代码有更新时，需要重新构建镜像并重启容器：
```bash
# 停止并删除旧容器，重新构建启动
docker compose down
docker compose up -d --build

# 或者一行命令
docker compose down && docker compose up -d --build
```

> **注意**：`docker compose down` 会删除容器但不会删除镜像。旧镜像会保留为 `<none>` 标签，可用 `docker image prune` 清理。

---

## 6. 服务器部署

### 6.1 部署平台信息

| 信息项 | 详情 |
|--------|------|
| 平台 | 腾讯云轻量应用服务器（Lighthouse） |
| 地域 | ap-nanjing（南京） |
| 实例 ID | lhins-o8kav6od |
| 操作系统 | OpenCloudOS 9 |
| 公网 IP | 119.45.182.166 |
| 服务端口 | 7896（Docker 容器） |

### 6.2 部署步骤
1. 将项目代码上传到服务器（`git clone` 或 `scp`）
2. 确保服务器已安装 Docker 和 Docker Compose
3. 修改 `backend/config.py` 中的数据库连接信息（生产环境使用 MySQL）
4. 执行 `docker compose up -d --build` 构建并启动容器
5. 验证：`curl http://127.0.0.1:7896/api/subjects` 返回正常数据

### 6.3 数据库配置
生产环境使用 MySQL 数据库，配置在 `backend/config.py` 中：
```python
DB_TYPE = "mysql"
MYSQL_CONFIG = {
    "host": "数据库主机地址",
    "port": 3306,
    "user": "用户名",
    "password": "密码",
    "database": "TongXiao",
}
```

> **安全提示**：`config.py` 中包含数据库密码等敏感信息。请勿将配置文件提交到公开的 Git 仓库。建议通过环境变量或 Docker secrets 管理敏感配置。

### 6.4 防火墙配置
需要在腾讯云防火墙中开放以下端口：

| 端口 | 协议 | 用途 |
|------|------|------|
| 80 | TCP | HTTP（用于 Let's Encrypt 验证） |
| 443 | TCP | HTTPS（SSL 加密访问） |
| 7896 | TCP | 后端服务端口（可选，建议仅内网开放） |

---

## 7. 域名与 HTTPS 配置

### 7.1 域名信息
- 项目域名：`good-luck-lct.icu`（腾讯云注册）
- 域名已解析到服务器公网 IP：`119.45.182.166`

### 7.2 Nginx 反向代理配置
Nginx 配置文件路径：`/www/server/panel/vhost/nginx/tongxiao.conf`（宝塔面板）

完整配置如下：
```nginx
# HTTP -> HTTPS 自动跳转
server {
    listen 80;
    server_name good-luck-lct.icu;

    # Let's Encrypt 证书验证目录（续期需要）
    location /.well-known/acme-challenge/ {
        root /www/wwwroot/tongxiao;
    }

    location / {
        return 301 https://$host$request_uri;
    }
}

# HTTPS 主配置
server {
    listen 443 ssl;
    http2 on;
    server_name good-luck-lct.icu;

    # SSL 证书路径
    ssl_certificate     /etc/letsencrypt/live/good-luck-lct.icu/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/good-luck-lct.icu/privkey.pem;
    ssl_session_timeout 1d;
    ssl_session_cache   shared:SSL:10m;
    ssl_session_tickets off;
    ssl_protocols TLSv1.2 TLSv1.3;

    # HSTS 安全头
    add_header Strict-Transport-Security "max-age=63072000" always;

    # 反向代理到 Docker 容器
    location / {
        proxy_pass http://127.0.0.1:7896;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 86400;
    }
}
```

### 7.3 SSL 证书管理
证书使用 Let's Encrypt 免费 SSL 证书，通过 certbot 工具管理。

#### 7.3.1 首次申请证书
```bash
# 安装 certbot
yum install -y certbot python3-certbot-nginx

# 申请证书（HTTP 验证方式）
certbot certonly --webroot \
    -w /www/wwwroot/tongxiao \
    -d good-luck-lct.icu \
    --non-interactive --agree-tos \
    --email admin@good-luck-lct.icu
```

#### 7.3.2 证书自动续期
certbot 安装后会自动创建 systemd timer 实现自动续期：
```bash
# 查看自动续期状态
systemctl status certbot-renew.timer

# 手动测试续期（不会真正续期）
certbot renew --dry-run

# 手动强制续期
certbot renew --force-renewal
```

| 证书信息 | 详情 |
|----------|------|
| 证书类型 | Let's Encrypt DV（域名验证） |
| 有效期 | 90 天（自动续期） |
| 证书路径 | `/etc/letsencrypt/live/good-luck-lct.icu/fullchain.pem` |
| 私钥路径 | `/etc/letsencrypt/live/good-luck-lct.icu/privkey.pem` |

### 7.4 访问地址

| 访问方式 | 地址 |
|----------|------|
| HTTPS（推荐） | https://good-luck-lct.icu |
| HTTP（自动跳转） | http://good-luck-lct.icu |

---

## 8. 命令速查表

### 8.1 Docker 相关

| 操作 | 命令 |
|------|------|
| 首次部署 | `docker compose up -d --build` |
| 更新部署 | `docker compose down && docker compose up -d --build` |
| 查看日志 | `docker logs -f tongxiao` |
| 查看最近100行日志 | `docker logs --tail 100 tongxiao` |
| 重启容器 | `docker restart tongxiao` |
| 进入容器 | `docker exec -it tongxiao bash` |
| 查看容器状态 | `docker ps --filter name=tongxiao` |

### 8.2 Nginx 相关

| 操作 | 命令 |
|------|------|
| 测试配置 | `nginx -t` |
| 重载配置 | `nginx -s reload` |
| 重启服务 | `systemctl restart nginx` |
| 查看错误日志 | `tail -f /www/wwwlogs/tongxiao-error.log` |
| 查看访问日志 | `tail -f /www/wwwlogs/tongxiao-access.log` |

### 8.3 SSL 证书相关

| 操作 | 命令 |
|------|------|
| 查看证书信息 | `certbot certificates` |
| 模拟续期测试 | `certbot renew --dry-run` |
| 强制续期 | `certbot renew --force-renewal` |
| 续期后重载 Nginx | `certbot renew --deploy-hook "nginx -s reload"` |

---

## 9. 故障排除

### 9.1 容器无法启动
**问题**：`docker compose up` 后容器立即退出

```bash
# 查看容器退出日志
docker logs tongxiao

# 常见原因：
# 1. 数据库连接失败 → 检查 config.py 中 MySQL 配置
# 2. 端口被占用 → lsof -i :7896 查看端口占用
# 3. Python 依赖缺失 → 检查 requirements.txt 是否完整
```

### 9.2 域名无法访问
**问题**：浏览器访问域名显示无法连接

- 检查 DNS 解析：`nslookup good-luck-lct.icu` 是否返回正确 IP
- 检查 Nginx 状态：`systemctl status nginx`
- 检查防火墙：确认 80 和 443 端口已开放
- 检查容器状态：`docker ps --filter name=tongxiao`

### 9.3 HTTPS 证书错误
**问题**：浏览器提示证书不安全或已过期

- 检查证书有效期：`certbot certificates`
- 手动续期：`certbot renew --force-renewal`
- 续期后重载 Nginx：`nginx -s reload`
- 检查 certbot 自动续期定时器：`systemctl status certbot-renew.timer`

### 9.4 API 返回 502 Bad Gateway
**问题**：Nginx 代理返回 502

- 检查后端容器是否运行：`docker ps --filter name=tongxiao`
- 检查容器端口：`docker port tongxiao`
- 检查 Nginx `proxy_pass` 地址是否正确：应为 `http://127.0.0.1:7896`

### 9.5 前端页面空白
**问题**：访问页面显示白屏

- 检查前端构建产物是否存在：`docker exec tongxiao ls /app/frontend/dist/`
- 检查浏览器控制台是否有 JS 错误
- 确认 API 请求路径是否正确（检查 Network 面板）

---

## 10. 附录

### 10.1 项目目录结构
```
TongXiao/
├── backend/                # 后端代码
│   ├── main.py             # FastAPI 主路由
│   ├── config.py           # 配置文件（数据库、端口等）
│   ├── database.py         # 数据库连接管理
│   ├── run.py              # 启动入口
│   └── requirements.txt    # Python 依赖
├── frontend/               # 前端代码
│   ├── src/                # React 源码
│   ├── public/             # 静态资源
│   ├── package.json        # Node 依赖
│   └── vite.config.js      # Vite 配置
├── Dockerfile              # Docker 构建文件
├── docker-compose.yml      # Docker Compose 编排
├── .dockerignore           # Docker 忽略文件
├── setup.ps1               # Windows 一键启动脚本
└── README.md               # 项目说明
```

### 10.2 关键配置文件

#### config.py 核心配置项

| 配置项 | 说明 | 示例值 |
|--------|------|--------|
| `DB_TYPE` | 数据库类型 | `mysql` / `sqlite` |
| `MYSQL_CONFIG` | MySQL 连接信息 | `{"host":"...","port":3306,...}` |
| `SERVER_PORT` | 服务端口 | `7896` |
| `APP_TITLE` | 应用标题 | `考研背诵` |

### 10.3 服务器资源清单

| 资源 | 详情 |
|------|------|
| 云服务器 | 腾讯云 Lighthouse（ap-nanjing, lhins-o8kav6od） |
| 操作系统 | OpenCloudOS 9 |
| 公网 IP | 119.45.182.166 |
| 域名 | good-luck-lct.icu（腾讯云注册） |
| SSL 证书 | Let's Encrypt（certbot 自动续期） |
| Web 服务器 | Nginx（宝塔面板） |
| 容器运行时 | Docker Engine + Docker Compose |

### 10.4 联系方式与支持
如有部署问题，请参考以下资源：
- 项目仓库：查看最新代码和文档
- Docker 官方文档：https://docs.docker.com
- Let's Encrypt 文档：https://letsencrypt.org/docs
- 腾讯云 Lighthouse 文档：https://cloud.tencent.com/document/product/1207

---

*— 文档结束 —*