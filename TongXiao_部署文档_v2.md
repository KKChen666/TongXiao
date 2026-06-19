# TongXiao 部署文档 v2 — 双容器 + git-pull 方案

> 更新日期：2026-06-19  
> 服务器：腾讯云 Lighthouse `119.45.182.166`  
> 域名：`https://good-luck-lct.icu`  
> 仓库：`https://github.com/KKChen666/TongXiao.git`

---

## 架构

```
浏览器 → 宝塔 Nginx (80/443)
            │
            ├── /api/*  → tongxiao-backend:7896  (Python FastAPI)
            └── /*      → tongxiao-frontend:8080  (Nginx 静态文件)
```

| 容器 | 镜像 | 挂载 | 端口 |
|---|---|---|---|
| `tongxiao-backend` | 自建 Python + git | `/root/tongxiao:/app` | 7896 |
| `tongxiao-frontend` | `nginx:alpine` | `/root/tongxiao/frontend/dist:/usr/share/nginx/html` | 8080→80 |
| | | `/root/tongxiao/nginx.conf:/etc/nginx/conf.d/default.conf` | |

---

## 服务器目录结构

```
/root/tongxiao/
├── backend/             ← git sparse-checkout 自动拉取
├── frontend/
│   └── dist/            ← scp 上传的前端构建产物
├── Dockerfile
├── docker-compose.yml
├── entrypoint.sh
├── nginx.conf
└── .env
```

---

## 已完成步骤

### ✅ 1. 本地项目 deploy 目录

```
TongXiao/deploy/
├── Dockerfile
├── docker-compose.yml
├── entrypoint.sh
├── nginx.conf
├── build.bat
├── .env.example
├── .env
└── .dockerignore
```

### ✅ 2. 服务器文件已上传

6 个文件已位于 `/root/tongxiao/`：

```
Dockerfile ✅
docker-compose.yml ✅  (已去掉 version 行)
entrypoint.sh ✅
nginx.conf ✅
.env.example ✅
.env ✅  (已填入 GIT_REPO_URL + 数据库密码)
```

### ✅ 3. 服务器目录结构已创建

```
/root/tongxiao/
├── backend/             ← 空，待容器自动 git clone
├── frontend/
│   └── dist/            ← 空，待 scp 上传
├── Dockerfile
├── docker-compose.yml
├── entrypoint.sh
├── nginx.conf
├── .env.example
└── .env
```

---

## 待完成步骤

### ⬜ 第 4 步：启动容器

SSH 进入服务器，执行：

```bash
cd /root/tongxiao
docker compose up -d --build
```

首次需 2-3 分钟（下载镜像 + pip 安装 + git clone）。之后每次 `docker restart tongxiao-backend` 只需 3 秒。

验证：

```bash
docker ps                    # 看两个容器是否 running
docker logs tongxiao-backend # 看是否 git clone 成功、启动成功
ls /root/tongxiao/backend/   # 看后端代码是否拉下来了
```

### ⬜ 第 5 步：配置宝塔 Nginx

宝塔 → **网站** → `good-luck-lct.icu` → **配置** → 设为：

```nginx
server {
    listen 80;
    server_name good-luck-lct.icu;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    http2 on;
    server_name good-luck-lct.icu;

    ssl_certificate     /etc/letsencrypt/live/good-luck-lct.icu/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/good-luck-lct.icu/privkey.pem;

    # API → 后端容器
    location /api/ {
        proxy_pass http://127.0.0.1:7896;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # 页面 → 前端容器
    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

保存 → **重载**。

### ⬜ 第 6 步：构建并上传前端

Windows 本地：

```bash
cd frontend
npm install
npm run build
scp -i TencentSSHKey.pem -r dist\* root@119.45.182.166:/root/tongxiao/frontend/dist/
```

### ⬜ 第 7 步：验证

浏览器访问 `https://good-luck-lct.icu`，能看到页面即成功。

---

## 日常发版流程

### 后端发版

```bash
# 本地修改代码后
git push

# 服务器端（SSH 进去）
docker restart tongxiao-backend
# 容器自动 git pull → 3 秒完成
```

### 前端发版

```bash
# 本地
cd frontend
npm run build
scp -i TencentSSHKey.pem -r dist\* root@119.45.182.166:/root/tongxiao/frontend/dist/
# 无需重启容器
```

---

## 回滚

```bash
# 后端回滚到上一个版本
cd /root/tongxiao
git revert HEAD --no-edit   # 或 git reset --hard <commit>
git push -f                 # 容器重启后会 pull

# 前端回滚：重新构建旧版本 dist 并 scp 上传
```

---

## 常用命令

| 操作 | 命令 |
|---|---|
| 查看容器状态 | `docker ps` |
| 后端日志 | `docker logs tongxiao-backend` |
| 前端日志 | `docker logs tongxiao-frontend` |
| 重启后端 | `docker restart tongxiao-backend` |
| 重启前端 | `docker restart tongxiao-frontend` |
| 进入后端容器 | `docker exec -it tongxiao-backend sh` |
| 测试 API | `curl http://127.0.0.1:7896/api/subjects` |
| 测试前端 | `curl http://127.0.0.1:8080/` |
| 重建容器 | `cd /root/tongxiao && docker compose up -d --build` |
