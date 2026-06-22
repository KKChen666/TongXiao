import os
from pathlib import Path

# 加载 .env 文件（在 import 时自动加载）
from dotenv import load_dotenv
_env_path = Path(__file__).resolve().parent / ".env"
load_dotenv(_env_path)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# ===== 环境变量覆盖硬编码配置 =====
# Docker 部署时通过 docker-compose.yml 的 environment 传入
# 本地开发时直接修改 .env 文件即可

DB_TYPE = os.environ.get("DB_TYPE", "mysql")

MYSQL_CONFIG = {
    "host": os.environ.get("MYSQL_HOST", "119.45.182.166"),
    "port": int(os.environ.get("MYSQL_PORT", "9274")),
    "user": os.environ.get("MYSQL_USER", "TongXiao"),
    "password": os.environ.get("MYSQL_PASSWORD", "P8MtxmyYZMznkx8j"),
    "database": os.environ.get("MYSQL_DATABASE", "TongXiao"),
}

SQLITE_PATH = os.path.join(BASE_DIR, "data", "tongxiao.db")

SERVER_HOST = os.environ.get("SERVER_HOST", "0.0.0.0")
SERVER_PORT = int(os.environ.get("SERVER_PORT", "7896"))

APP_TITLE = "考研背诵"

COLOR_PRIMARY = "#4A90D9"
COLOR_SUCCESS = "#52C41A"
COLOR_DANGER = "#FF4D4F"
COLOR_WARNING = "#FAAD14"
COLOR_BG = "#F2F3F7"
COLOR_CARD = "#FFFFFF"
COLOR_TEXT = "#1A1A2E"
COLOR_TEXT_SUB = "#8E8E93"
COLOR_NAV_ACTIVE = "#4A90D9"
COLOR_NAV_INACTIVE = "#8E8E93"
