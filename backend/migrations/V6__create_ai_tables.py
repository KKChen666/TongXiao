"""V6: 创建 AI 知识库文档、分块和 Token 统计表"""

version = "6"
description = "create ai knowledge and token tables"


def migrate(conn, cur, db_type, placeholder):
    is_mysql = db_type == "mysql"
    p = placeholder

    # ---------- 知识库文档表 ----------
    if is_mysql:
        cur.execute(f"""
            CREATE TABLE IF NOT EXISTS knowledge_documents (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                filename VARCHAR(500) NOT NULL,
                cos_key VARCHAR(500) DEFAULT '',
                subject_id INT NOT NULL,
                file_type VARCHAR(20) DEFAULT '',
                chunk_count INT DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (subject_id) REFERENCES subjects(id),
                FOREIGN KEY (user_id) REFERENCES users(id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        """)
    else:
        cur.execute("""
            CREATE TABLE IF NOT EXISTS knowledge_documents (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                filename TEXT NOT NULL,
                cos_key TEXT DEFAULT '',
                subject_id INTEGER NOT NULL,
                file_type TEXT DEFAULT '',
                chunk_count INTEGER DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (subject_id) REFERENCES subjects(id),
                FOREIGN KEY (user_id) REFERENCES users(id)
            )
        """)

    # ---------- 知识库分块表 ----------
    if is_mysql:
        cur.execute(f"""
            CREATE TABLE IF NOT EXISTS knowledge_chunks (
                id INT AUTO_INCREMENT PRIMARY KEY,
                document_id INT NOT NULL,
                subject_id INT NOT NULL,
                chunk_text TEXT NOT NULL,
                chunk_index INT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (document_id) REFERENCES knowledge_documents(id),
                FOREIGN KEY (subject_id) REFERENCES subjects(id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        """)
    else:
        cur.execute("""
            CREATE TABLE IF NOT EXISTS knowledge_chunks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                document_id INTEGER NOT NULL,
                subject_id INTEGER NOT NULL,
                chunk_text TEXT NOT NULL,
                chunk_index INTEGER NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (document_id) REFERENCES knowledge_documents(id),
                FOREIGN KEY (subject_id) REFERENCES subjects(id)
            )
        """)

    # ---------- AI Token 使用统计表 ----------
    if is_mysql:
        cur.execute(f"""
            CREATE TABLE IF NOT EXISTS ai_token_usage (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                session_id VARCHAR(200) NOT NULL,
                user_tokens INT DEFAULT 0,
                system_tokens INT DEFAULT 0,
                rag_tokens INT DEFAULT 0,
                response_tokens INT DEFAULT 0,
                total_tokens INT DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_user (user_id),
                FOREIGN KEY (user_id) REFERENCES users(id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        """)
    else:
        cur.execute("""
            CREATE TABLE IF NOT EXISTS ai_token_usage (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                session_id TEXT NOT NULL,
                user_tokens INTEGER DEFAULT 0,
                system_tokens INTEGER DEFAULT 0,
                rag_tokens INTEGER DEFAULT 0,
                response_tokens INTEGER DEFAULT 0,
                total_tokens INTEGER DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id)
            )
        """)
