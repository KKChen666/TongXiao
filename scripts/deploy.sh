#!/bin/bash
# ====== 考研背诵 Web App 部署脚本 ======
# 用法: bash scripts/deploy.sh
# 在云服务器上运行此脚本

set -e

APP_DIR="$HOME/tongxiao"
PORT=8000

echo "===== 1. 安装系统依赖 ====="
sudo apt-get update -y
sudo apt-get install -y python3 python3-pip python3-venv nginx

echo "===== 2. 创建项目目录 ====="
mkdir -p "$APP_DIR"
cd "$APP_DIR"

echo "===== 3. 上传代码 ====="
echo "请先在本地打包项目文件："
echo "  cd D:\\code\\TongXiao"
echo "  tar czf tongxiao.tar.gz --exclude='.venv' --exclude='__pycache__' --exclude='.git' --exclude='.idea' *"
echo "  scp tongxiao.tar.gz root@YOUR_SERVER_IP:$APP_DIR/"
echo ""
read -p "按回车继续（确认文件已上传到 $APP_DIR 目录后）..."

echo "===== 4. 解压文件 ====="
tar xzf tongxiao.tar.gz -C "$APP_DIR"

echo "===== 5. 创建虚拟环境并安装依赖 ====="
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

echo "===== 6. 测试启动 ====="
python -m uvicorn server.main:app --host 0.0.0.0 --port $PORT &
sleep 3
curl -s http://127.0.0.1:$PORT/api/subjects
kill %1 2>/dev/null
echo ""
echo "服务启动测试通过！"

echo "===== 7. 配置 systemd 服务 ====="
cat > /tmp/tongxiao.service << 'SVC'
[Unit]
Description=考研背诵 Web App
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/root/tongxiao
ExecStart=/root/tongxiao/venv/bin/uvicorn server.main:app --host 0.0.0.0 --port 8000
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
SVC

sudo mv /tmp/tongxiao.service /etc/systemd/system/tongxiao.service
sudo systemctl daemon-reload
sudo systemctl enable tongxiao
sudo systemctl start tongxiao

sleep 3
if sudo systemctl is-active --quiet tongxiao; then
    echo "✅ 服务运行中"
else
    echo "❌ 服务启动失败，查看日志: sudo journalctl -u tongxiao -n 50"
fi

echo "===== 8. 配置 Nginx 反向代理 ====="
read -p "请输入你的域名（留空则使用 IP 访问）: " DOMAIN

if [ -z "$DOMAIN" ]; then
    cat > /tmp/tongxiao_nginx << 'NGX'
server {
    listen 80;
    server_name _;

    client_max_body_size 10M;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
NGX
else
    cat > /tmp/tongxiao_nginx << NGX
server {
    listen 80;
    server_name $DOMAIN;

    client_max_body_size 10M;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    }
}
NGX
fi

sudo mv /tmp/tongxiao_nginx /etc/nginx/sites-available/tongxiao
sudo ln -sf /etc/nginx/sites-available/tongxiao /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

echo ""
echo "====== 🎉 部署完成! ======"
echo ""
if [ -z "$DOMAIN" ]; then
    IP=$(curl -s ifconfig.me)
    echo "访问地址: http://$IP"
else
    echo "访问地址: http://$DOMAIN"
fi
echo ""
echo "管理命令:"
echo "  sudo systemctl status tongxiao   # 查看状态"
echo "  sudo systemctl restart tongxiao   # 重启"
echo "  sudo journalctl -u tongxiao -f    # 查看实时日志"
echo ""
echo "配置 SSL (HTTPS):"
echo "  sudo apt install -y certbot python3-certbot-nginx"
echo "  sudo certbot --nginx -d 你的域名"
