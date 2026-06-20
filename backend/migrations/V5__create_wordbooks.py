"""
V5: Create wordbooks and wordbook_items tables.

- wordbooks: user-created vocabulary books
- wordbook_items: many-to-many relationship between wordbooks and knowledge_items
"""
version = "5"
description = "create wordbooks tables"


def migrate(conn, cur, db_type, placeholder):
    if db_type == "mysql":
        cur.execute("""
            CREATE TABLE IF NOT EXISTS wordbooks (
                id          INT AUTO_INCREMENT PRIMARY KEY,
                user_id     INT NOT NULL,
                name        VARCHAR(200) NOT NULL,
                description TEXT,
                subject_id  INT NOT NULL,
                item_count  INT DEFAULT 0,
                is_public   TINYINT DEFAULT 0,
                created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        """)
        cur.execute("""
            CREATE TABLE IF NOT EXISTS wordbook_items (
                id              INT AUTO_INCREMENT PRIMARY KEY,
                wordbook_id     INT NOT NULL,
                knowledge_id    INT NOT NULL,
                order_num       INT DEFAULT 0,
                added_at        DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (wordbook_id) REFERENCES wordbooks(id) ON DELETE CASCADE,
                FOREIGN KEY (knowledge_id) REFERENCES knowledge_items(id) ON DELETE CASCADE,
                UNIQUE KEY uk_wordbook_knowledge (wordbook_id, knowledge_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        """)
        cur.execute("""
            CREATE INDEX idx_wordbook_items_wordbook
            ON wordbook_items (wordbook_id)
        """)
        conn.commit()
    else:
        cur.executescript("""
            CREATE TABLE IF NOT EXISTS wordbooks (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id     INTEGER NOT NULL,
                name        TEXT NOT NULL,
                description TEXT DEFAULT '',
                subject_id  INTEGER NOT NULL,
                item_count  INTEGER DEFAULT 0,
                is_public   INTEGER DEFAULT 0,
                created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
            );
            CREATE TABLE IF NOT EXISTS wordbook_items (
                id              INTEGER PRIMARY KEY AUTOINCREMENT,
                wordbook_id     INTEGER NOT NULL,
                knowledge_id    INTEGER NOT NULL,
                order_num       INTEGER DEFAULT 0,
                added_at        DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (wordbook_id) REFERENCES wordbooks(id) ON DELETE CASCADE,
                FOREIGN KEY (knowledge_id) REFERENCES knowledge_items(id) ON DELETE CASCADE,
                UNIQUE (wordbook_id, knowledge_id)
            );
            CREATE INDEX IF NOT EXISTS idx_wordbook_items_wordbook
            ON wordbook_items (wordbook_id);
        """)
