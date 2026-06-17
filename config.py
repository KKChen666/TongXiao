import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

DB_TYPE = "mysql"
MYSQL_CONFIG = {
    "host": "119.45.182.166",
    "port": 9274,
    "user": "TongXiao",
    "password": "P8MtxmyYZMznkx8j",
    "database": "TongXiao",
}
SQLITE_PATH = os.path.join(BASE_DIR, "data", "tongxiao.db")

SERVER_HOST = "0.0.0.0"
SERVER_PORT = 8000

APP_TITLE = "考研背诵"
APP_W = 420
APP_H = 750

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
