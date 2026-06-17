"""
V1: Create all application tables.

Tables: subjects, books, topics, cards, review_log
Note: flyway_schema_history is created by the migration engine itself.
"""
version = "1"
description = "create tables"


def migrate(conn, cur, db_type, placeholder):
    if db_type == "mysql":
        cur.execute("""
            CREATE TABLE IF NOT EXISTS subjects (
                id          INT AUTO_INCREMENT PRIMARY KEY,
                name        VARCHAR(50) NOT NULL UNIQUE,
                display_name VARCHAR(100) NOT NULL,
                icon        VARCHAR(20) DEFAULT ''
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        """)
        cur.execute("""
            CREATE TABLE IF NOT EXISTS books (
                id          INT AUTO_INCREMENT PRIMARY KEY,
                subject_id  INT NOT NULL,
                name        VARCHAR(200) NOT NULL,
                order_num   INT DEFAULT 0,
                FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        """)
        cur.execute("""
            CREATE TABLE IF NOT EXISTS topics (
                id          INT AUTO_INCREMENT PRIMARY KEY,
                subject_id  INT NOT NULL,
                book_id     INT DEFAULT NULL,
                name        VARCHAR(200) NOT NULL,
                order_num   INT DEFAULT 0,
                FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        """)
        cur.execute("""
            CREATE TABLE IF NOT EXISTS cards (
                id          INT AUTO_INCREMENT PRIMARY KEY,
                topic_id    INT NOT NULL,
                front       TEXT NOT NULL,
                back        TEXT NOT NULL,
                phonetic    VARCHAR(100) DEFAULT '',
                example     TEXT,
                back_detail TEXT,
                order_num   INT DEFAULT 0,
                FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        """)
        cur.execute("""
            CREATE TABLE IF NOT EXISTS review_log (
                id          INT AUTO_INCREMENT PRIMARY KEY,
                card_id     INT NOT NULL DEFAULT 0,
                result      INT NOT NULL DEFAULT 0,
                reviewed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (card_id) REFERENCES cards(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        """)
        conn.commit()
    else:
        cur.executescript("""
            CREATE TABLE IF NOT EXISTS subjects (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                name        TEXT NOT NULL UNIQUE,
                display_name TEXT NOT NULL,
                icon        TEXT DEFAULT ''
            );
            CREATE TABLE IF NOT EXISTS books (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                subject_id  INTEGER NOT NULL,
                name        TEXT NOT NULL,
                order_num   INTEGER DEFAULT 0,
                FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
            );
            CREATE TABLE IF NOT EXISTS topics (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                subject_id  INTEGER NOT NULL,
                book_id     INTEGER DEFAULT NULL,
                name        TEXT NOT NULL,
                order_num   INTEGER DEFAULT 0,
                FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
            );
            CREATE TABLE IF NOT EXISTS cards (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                topic_id    INTEGER NOT NULL,
                front       TEXT NOT NULL,
                back        TEXT NOT NULL,
                phonetic    TEXT DEFAULT '',
                example     TEXT DEFAULT '',
                back_detail TEXT DEFAULT '',
                order_num   INTEGER DEFAULT 0,
                FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE CASCADE
            );
            CREATE TABLE IF NOT EXISTS review_log (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                card_id     INTEGER NOT NULL DEFAULT 0,
                result      INTEGER NOT NULL DEFAULT 0,
                reviewed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (card_id) REFERENCES cards(id) ON DELETE CASCADE
            );
        """)
