# 考研背诵 (TongXiao)

考研英语 & 考研政治闪卡背诵应用，支持 Web 和移动端 PWA。

## 技术栈

| 层 | 技术 |
|---|---|
| 前端 | React 18 + Vite |
| 后端 | FastAPI (Python) |
| 数据库 | MySQL / SQLite 双支持 |
| 迁移 | 自研 Flyway 风格 Python 迁移引擎 |

## 项目结构

```
TongXiao/
├── run.py                            # 启动入口
├── backend/                          # FastAPI 后端
│   ├── main.py                       # API 路由
│   ├── config.py                     # 配置（数据库、颜色等）
│   ├── requirements.txt
│   ├── database/
│   │   ├── db.py                     # 数据库连接 & CRUD
│   │   └── migrate.py               # Flyway 风格迁移引擎
│   └── migrations/                   # 版本化迁移脚本
│       ├── V1__create_tables.py      # 建表
│       └── V2__seed_data.py          # 种子数据
└── frontend/                         # React SPA
    ├── vite.config.js
    └── src/
        ├── App.jsx                   # 根组件（页签路由）
        ├── App.css                   # 全局样式
        ├── api.js                    # API 客户端
        ├── components/               # 通用组件
        │   ├── BottomNav.jsx         # 底部导航栏
        │   ├── FlashCard.jsx         # 翻转卡片 + TTS
        │   └── ProgressBar.jsx       # 进度条
        └── pages/                    # 页面组件
            ├── SubjectsPage.jsx      # 科目列表
            ├── TopicsPage.jsx        # 章节列表
            ├── CardsPage.jsx         # 闪卡学习 & 总结
            ├── ImportPage.jsx        # 文件导入
            └── ProfilePage.jsx       # 学习统计
```

## 快速开始

### 环境要求

- Python 3.10+
- Node.js 18+
- MySQL 5.7+ (或使用 SQLite)

### 1. 配置数据库

编辑 `backend/config.py`：

```python
DB_TYPE = "mysql"      # 或 "sqlite"
MYSQL_CONFIG = {
    "host": "your_host",
    "port": 3306,
    "user": "your_user",
    "password": "your_password",
    "database": "TongXiao",
}
```

### 2. 启动后端

```bash
cd backend
pip install -r requirements.txt
cd ..
python run.py
# → http://localhost:8000
```

首次启动会自动执行数据库迁移（建表 + 种子数据），Flyway 风格输出：

```
[Flyway] Applying V1__create_tables.py — create tables ...
[Flyway] ✓ V1__create_tables.py — 45ms
[Flyway] Applying V2__seed_data.py — seed data ...
[Flyway] ✓ V2__seed_data.py — 320ms
```

### 3. 启动前端开发服务器

```bash
cd frontend
npm install
npm run dev
# → http://localhost:5173 （自动代理 API 到 8000）
```

### 4. 生产构建

```bash
cd frontend && npm run build
# 产物输出到 frontend/dist/，后端自动托管静态文件
```

## API 接口

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/api/subjects` | 获取所有科目（含进度） |
| GET | `/api/subjects/{id}/topics` | 获取科目下的章节（含进度） |
| GET | `/api/topics/{id}/cards` | 获取章节下的卡片 |
| POST | `/api/cards/{id}/review` | 记录复习结果 `{result: 0\|1}` |
| GET | `/api/stats` | 获取学习统计 |
| POST | `/api/import` | 导入卡片 `{subject, topic?, cards}` |

## 数据库迁移

项目使用 Flyway 风格的版本化迁移。迁移脚本位于 `backend/migrations/`，命名规范：`V{version}__{description}.py`。

每个迁移文件结构：

```python
version = "3"
description = "add user table"

def migrate(conn, cur, db_type, placeholder):
    # db_type: "mysql" | "sqlite"
    # placeholder: "%s" | "?"
    cur.execute(f"CREATE TABLE ...")
```

迁移历史自动记录在 `flyway_schema_history` 表中。已执行的迁移不会重复运行；失败的迁移会被记录并阻止后续执行。

### 添加新迁移

```bash
# 新建文件: backend/migrations/V3__add_xxx.py
# 重启后端即可自动执行
```

## 功能

- **闪卡背诵** — 翻转卡片、标记认识/不认识、Web Speech API 朗读
- **进度追踪** — 每个科目/章节显示已复习卡片数和百分比
- **数据导入** — 支持 CSV / JSON / TXT 三种格式导入自定义卡片
- **学习统计** — 总卡片数、已复习、完成率、各科目进度
- **PWA** — 支持添加到主屏幕，离线可用
- **双数据库** — 切换 `config.py` 中的 `DB_TYPE` 即可在 MySQL 和 SQLite 间切换
- **手机APP** — 支持打包为Android和iOS原生应用（Capacitor）
