"""
Flyway-style database migration engine.

Scans the `migrations/` directory for versioned Python migration files
named `V{version}__{description}.py`, and applies them in order.

Each migration file must expose:
    version: str       - e.g. "1", "1.1", "2"
    description: str   - human-readable description
    migrate(conn, cur, db_type, placeholder) -> None

Migrations are tracked in the `flyway_schema_history` table.
"""
import os
import re
import importlib.util
from config import DB_TYPE

MIGRATIONS_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "migrations")
HISTORY_TABLE = "flyway_schema_history"
MIGRATION_PATTERN = re.compile(r"^V(.+?)__(.+)\.py$")


def _ensure_history_table(cur, placeholder):
    """Create the schema history table if it doesn't exist."""
    if DB_TYPE == "mysql":
        cur.execute(f"""
            CREATE TABLE IF NOT EXISTS {HISTORY_TABLE} (
                installed_rank  INT AUTO_INCREMENT PRIMARY KEY,
                version         VARCHAR(50) NOT NULL,
                description     VARCHAR(200) NOT NULL,
                type            VARCHAR(20) NOT NULL DEFAULT 'PYTHON',
                script          VARCHAR(200) NOT NULL,
                checksum        INT,
                installed_by    VARCHAR(100) DEFAULT 'system',
                installed_on    DATETIME DEFAULT CURRENT_TIMESTAMP,
                execution_time  INT NOT NULL DEFAULT 0,
                success         BOOLEAN NOT NULL DEFAULT TRUE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        """)
    else:
        cur.execute(f"""
            CREATE TABLE IF NOT EXISTS {HISTORY_TABLE} (
                installed_rank  INTEGER PRIMARY KEY AUTOINCREMENT,
                version         TEXT NOT NULL,
                description     TEXT NOT NULL,
                type            TEXT NOT NULL DEFAULT 'PYTHON',
                script          TEXT NOT NULL,
                checksum        INTEGER,
                installed_by    TEXT DEFAULT 'system',
                installed_on    DATETIME DEFAULT CURRENT_TIMESTAMP,
                execution_time  INTEGER NOT NULL DEFAULT 0,
                success         INTEGER NOT NULL DEFAULT 1
            )
        """)


def _get_applied_versions(cur):
    """Return a set of already-applied migration versions."""
    cur.execute(f"SELECT version FROM {HISTORY_TABLE} WHERE success = 1 ORDER BY version")
    rows = cur.fetchall()
    return {r["version"] for r in rows}


def _discover_migrations():
    """Scan the migrations directory and return a sorted list of (version, description, filepath, module_name)."""
    if not os.path.isdir(MIGRATIONS_DIR):
        return []

    migrations = []
    for filename in sorted(os.listdir(MIGRATIONS_DIR)):
        match = MIGRATION_PATTERN.match(filename)
        if not match:
            continue
        version = match.group(1)
        description = match.group(2)
        filepath = os.path.join(MIGRATIONS_DIR, filename)
        migrations.append((version, description, filepath, filename))
    return migrations


def _load_migration(filepath):
    """Dynamically load a migration module and return its migrate function."""
    module_name = f"migration_{os.path.splitext(os.path.basename(filepath))[0]}"
    spec = importlib.util.spec_from_file_location(module_name, filepath)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    if not hasattr(mod, "migrate"):
        raise AttributeError(f"Migration {filepath} must define a 'migrate' function")
    return mod


def run_migrations():
    """
    Discover and apply all pending migrations in version order.
    Safe to call at every startup — already-applied migrations are skipped.
    """
    from database.db import get_conn

    conn = get_conn()
    cur = conn.cursor()
    placeholder = "%s" if DB_TYPE == "mysql" else "?"

    _ensure_history_table(cur, placeholder)
    applied = _get_applied_versions(cur)
    migrations = _discover_migrations()

    if not migrations:
        return

    for version, description, filepath, filename in migrations:
        if version in applied:
            continue

        mod = _load_migration(filepath)
        print(f"[Flyway] Applying {filename} — {description} ...")

        import time
        start = time.time()
        try:
            mod.migrate(conn, cur, DB_TYPE, placeholder)
            elapsed = int((time.time() - start) * 1000)
            cur.execute(
                f"INSERT INTO {HISTORY_TABLE} (version, description, type, script, execution_time, success) "
                f"VALUES ({placeholder}, {placeholder}, 'PYTHON', {placeholder}, {placeholder}, 1)",
                (version, description, filename, elapsed),
            )
            if DB_TYPE == "mysql":
                conn.commit()
            print(f"[Flyway] ✓ {filename} — {elapsed}ms")
        except Exception as e:
            elapsed = int((time.time() - start) * 1000)
            cur.execute(
                f"INSERT INTO {HISTORY_TABLE} (version, description, type, script, execution_time, success) "
                f"VALUES ({placeholder}, {placeholder}, 'PYTHON', {placeholder}, {placeholder}, 0)",
                (version, description, filename, elapsed),
            )
            if DB_TYPE == "mysql":
                conn.commit()
            print(f"[Flyway] ✗ {filename} — FAILED ({e})")
            raise
