import os
from config import DB_TYPE, MYSQL_CONFIG, SQLITE_PATH

_connection = None


def get_conn():
    global _connection
    if _connection is not None:
        return _connection
    if DB_TYPE == "mysql":
        import pymysql
        _connection = pymysql.connect(
            host=MYSQL_CONFIG["host"],
            port=MYSQL_CONFIG["port"],
            user=MYSQL_CONFIG["user"],
            password=MYSQL_CONFIG["password"],
            database=MYSQL_CONFIG["database"],
            charset="utf8mb4",
            autocommit=True,
            connect_timeout=10,
            cursorclass=pymysql.cursors.DictCursor,
        )
    else:
        import sqlite3
        os.makedirs(os.path.dirname(SQLITE_PATH), exist_ok=True)
        _connection = sqlite3.connect(SQLITE_PATH, check_same_thread=False)
        _connection.row_factory = sqlite3.Row
        _connection.execute("PRAGMA journal_mode=WAL")
        _connection.execute("PRAGMA foreign_keys=ON")
    return _connection


def _execute(sql, params=None):
    conn = get_conn()
    cur = conn.cursor()
    cur.execute(sql, params or ())
    return cur


def _fetchone(sql, params=None):
    cur = _execute(sql, params)
    return cur.fetchone()


def _fetchall(sql, params=None):
    cur = _execute(sql, params)
    return cur.fetchall()


def init_db():
    conn = get_conn()
    cur = conn.cursor()
    if DB_TYPE == "mysql":
        cur.execute("""
            CREATE TABLE IF NOT EXISTS subjects (
                id          INT AUTO_INCREMENT PRIMARY KEY,
                name        VARCHAR(50) NOT NULL UNIQUE,
                display_name VARCHAR(100) NOT NULL,
                icon        VARCHAR(20) DEFAULT ''
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        """)
        cur.execute("""
            CREATE TABLE IF NOT EXISTS topics (
                id          INT AUTO_INCREMENT PRIMARY KEY,
                subject_id  INT NOT NULL,
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
    else:
        cur.executescript("""
            CREATE TABLE IF NOT EXISTS subjects (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                name        TEXT NOT NULL UNIQUE,
                display_name TEXT NOT NULL,
                icon        TEXT DEFAULT ''
            );
            CREATE TABLE IF NOT EXISTS topics (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                subject_id  INTEGER NOT NULL,
                name        TEXT NOT NULL,
                order_num   INTEGER DEFAULT 0,
                FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
            );
            CREATE TABLE IF NOT EXISTS cards (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                topic_id    INTEGER NOT NULL,
                front       TEXT NOT NULL,
                back        TEXT NOT NULL,
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
    if DB_TYPE == "mysql":
        conn.commit()


def get_subjects():
    return _fetchall("SELECT * FROM subjects ORDER BY id")


def get_topics(subject_id):
    return _fetchall(
        "SELECT * FROM topics WHERE subject_id=%s ORDER BY order_num, id"
        if DB_TYPE == "mysql"
        else "SELECT * FROM topics WHERE subject_id=? ORDER BY order_num, id",
        (subject_id,),
    )


def get_cards(topic_id):
    return _fetchall(
        "SELECT * FROM cards WHERE topic_id=%s ORDER BY order_num, id"
        if DB_TYPE == "mysql"
        else "SELECT * FROM cards WHERE topic_id=? ORDER BY order_num, id",
        (topic_id,),
    )


def get_card_count(topic_id):
    sql = "SELECT COUNT(*) as cnt FROM cards WHERE topic_id=%s" if DB_TYPE == "mysql" else "SELECT COUNT(*) as cnt FROM cards WHERE topic_id=?"
    return _fetchone(sql, (topic_id,))["cnt"]


def log_review(card_id, result):
    _execute(
        "INSERT INTO review_log (card_id, result) VALUES (%s, %s)"
        if DB_TYPE == "mysql"
        else "INSERT INTO review_log (card_id, result) VALUES (?, ?)",
        (card_id, result),
    )


def get_topic_progress(topic_id):
    total = get_card_count(topic_id)
    place = "%s" if DB_TYPE == "mysql" else "?"
    row = _fetchone(
        f"SELECT COUNT(DISTINCT card_id) as cnt FROM review_log WHERE card_id IN (SELECT id FROM cards WHERE topic_id={place})",
        (topic_id,),
    )
    reviewed = row["cnt"] if row else 0
    return total, reviewed


def get_subject_progress(subject_id):
    place = "%s" if DB_TYPE == "mysql" else "?"
    row1 = _fetchone(
        f"SELECT COUNT(*) as cnt FROM cards WHERE topic_id IN (SELECT id FROM topics WHERE subject_id={place})",
        (subject_id,),
    )
    total = row1["cnt"] if row1 else 0
    row2 = _fetchone(
        f"SELECT COUNT(DISTINCT card_id) as cnt FROM review_log WHERE card_id IN (SELECT id FROM cards WHERE topic_id IN (SELECT id FROM topics WHERE subject_id={place}))",
        (subject_id,),
    )
    reviewed = row2["cnt"] if row2 else 0
    return total, reviewed
