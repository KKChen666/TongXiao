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

APP_TITLE = "考研背诵助手"
APP_SIZE = "1000x700"
MIN_APP_SIZE = (800, 600)

COLOR_PRIMARY = "#4A90D9"
COLOR_SUCCESS = "#52C41A"
COLOR_DANGER = "#FF4D4F"
COLOR_WARNING = "#FAAD14"
COLOR_BG = "#F5F7FA"
COLOR_CARD = "#FFFFFF"
COLOR_TEXT = "#2C3E50"
COLOR_TEXT_SECONDARY = "#7F8C8D"
