"""
V4: Create knowledge_items table (global word/knowledge pool).
One entry per unique (subject, front, back) combination.
"""
version = "4"
description = "create knowledge_items table"


def migrate(conn, cur, db_type, placeholder):
    if db_type == "mysql":
        cur.execute("""
            CREATE TABLE IF NOT EXISTS knowledge_items (
                id          INT AUTO_INCREMENT PRIMARY KEY,
                subject_id  INT NOT NULL,
                front       VARCHAR(500) NOT NULL,
                back        TEXT NOT NULL,
                phonetic    VARCHAR(200) DEFAULT '',
                example     TEXT,
                back_detail TEXT,
                tags        JSON,
                hash        VARCHAR(64) NOT NULL,
                source      VARCHAR(20) DEFAULT 'manual',
                created_by  INT DEFAULT NULL,
                created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
                UNIQUE KEY uk_hash_subject (hash, subject_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        """)
        try:
            cur.execute("""
                CREATE INDEX idx_knowledge_front
                ON knowledge_items (subject_id, front(100))
            """)
        except Exception:
            pass  # index may already exist
        conn.commit()
    else:
        cur.executescript("""
            CREATE TABLE IF NOT EXISTS knowledge_items (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                subject_id  INTEGER NOT NULL,
                front       TEXT NOT NULL,
                back        TEXT NOT NULL,
                phonetic    TEXT DEFAULT '',
                example     TEXT DEFAULT '',
                back_detail TEXT DEFAULT '',
                tags        TEXT DEFAULT '[]',
                hash        TEXT NOT NULL,
                source      TEXT DEFAULT 'manual',
                created_by  INTEGER DEFAULT NULL,
                created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
                UNIQUE (hash, subject_id)
            );
            CREATE INDEX IF NOT EXISTS idx_knowledge_front
            ON knowledge_items (subject_id, front);
        """)
