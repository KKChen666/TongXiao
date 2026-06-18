"""
V3: Add users table and user_id to review_log for per-user tracking.
"""
version = "3"
description = "add users table"


def migrate(conn, cur, db_type, placeholder):
    if db_type == "mysql":
        cur.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id            INT AUTO_INCREMENT PRIMARY KEY,
                username      VARCHAR(50) NOT NULL UNIQUE,
                password_hash VARCHAR(255) NOT NULL,
                display_name  VARCHAR(100) NOT NULL,
                created_at    DATETIME DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        """)
        cur.execute("""
            ALTER TABLE review_log
            ADD COLUMN user_id INT DEFAULT NULL AFTER card_id
        """)
        conn.commit()
    else:
        cur.executescript("""
            CREATE TABLE IF NOT EXISTS users (
                id            INTEGER PRIMARY KEY AUTOINCREMENT,
                username      TEXT NOT NULL UNIQUE,
                password_hash TEXT NOT NULL,
                display_name  TEXT NOT NULL,
                created_at    DATETIME DEFAULT CURRENT_TIMESTAMP
            );
        """)
        cur.execute("ALTER TABLE review_log ADD COLUMN user_id INTEGER DEFAULT NULL")
