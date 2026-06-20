"""
Import vocabulary from KyleBing/english-vocabulary (GitHub) into knowledge_items table.

Usage:
    python import_vocabulary.py          # Import all levels
    python import_vocabulary.py 考研      # Import only 考研
    python import_vocabulary.py 考研 四级  # Import 考研 and 四级
"""
import os
import sys
import hashlib
import json
import urllib.request

# Add backend dir to path
_backend_dir = os.path.dirname(os.path.abspath(__file__))
if _backend_dir not in sys.path:
    sys.path.insert(0, _backend_dir)

from config import DB_TYPE
from database.db import get_conn

# Vocabulary source mapping: key -> (filename, tag)
VOCAB_SOURCES = {
    "初中": ("1 初中-乱序", "初中"),
    "高中": ("2 高中-乱序", "高中"),
    "四级": ("3 四级-乱序", "四级"),
    "六级": ("4 六级-乱序", "六级"),
    "考研": ("5 考研-乱序", "考研"),
    "托福": ("6 托福-乱序", "托福"),
    "SAT":  ("7 SAT-乱序", "SAT"),
}

# CDN mirrors (try in order)
MIRROR_URLS = [
    "https://cdn.jsdelivr.net/gh/KyleBing/english-vocabulary@master/",
    "https://raw.kkgithub.com/KyleBing/english-vocabulary/master/",
    "https://raw.githubusercontent.com/KyleBing/english-vocabulary/master/",
]

SUBJECT_NAME = "english"
P = "%s" if DB_TYPE == "mysql" else "?"


def compute_hash(front: str, subject_id: int) -> str:
    raw = f"{front.strip().lower()}|{subject_id}"
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()[:64]


def download_file(filename: str) -> str:
    local_path = os.path.join(_backend_dir, "vocab_cache", filename + ".txt")
    if os.path.isfile(local_path):
        print(f"  [cache] {local_path}")
        with open(local_path, "r", encoding="utf-8") as f:
            return f.read()

    encoded_name = urllib.request.quote(filename + ".txt")
    last_err = None
    for base_url in MIRROR_URLS:
        url = base_url + encoded_name
        print(f"  [download] {url}")
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "TongXiao/1.0"})
            with urllib.request.urlopen(req, timeout=15) as resp:
                content = resp.read().decode("utf-8")
                os.makedirs(os.path.dirname(local_path), exist_ok=True)
                with open(local_path, "w", encoding="utf-8") as f:
                    f.write(content)
                return content
        except Exception as e:
            last_err = e
            print(f"    Failed: {e}")
    raise RuntimeError(f"All mirrors failed: {last_err}")


def parse_txt(content: str) -> list:
    entries = []
    for line in content.split("\n"):
        line = line.strip()
        if not line:
            continue
        parts = line.split("\t", 1)
        if len(parts) == 2 and parts[0].strip() and parts[1].strip():
            entries.append((parts[0].strip(), parts[1].strip()))
    return entries


def get_subject_id(cur) -> int:
    cur.execute(f"SELECT id FROM subjects WHERE name={P}", (SUBJECT_NAME,))
    row = cur.fetchone()
    if not row:
        raise RuntimeError(f"Subject '{SUBJECT_NAME}' not found")
    return row["id"]


def import_vocabulary(levels: list = None):
    conn = get_conn()
    cur = conn.cursor()
    subject_id = get_subject_id(cur)

    # Count before
    cur.execute(f"SELECT COUNT(*) as cnt FROM knowledge_items WHERE subject_id={P}", (subject_id,))
    before = cur.fetchone()["cnt"]

    if levels:
        targets = {k: v for k, v in VOCAB_SOURCES.items() if k in levels}
        if not targets:
            print(f"Unknown level(s): {levels}. Available: {', '.join(VOCAB_SOURCES.keys())}")
            return
    else:
        targets = VOCAB_SOURCES

    grand_new = 0
    grand_skip = 0

    for level_key, (filename, tag) in targets.items():
        print(f"\n[{level_key}] {filename}")
        try:
            content = download_file(filename)
        except Exception as e:
            print(f"  ERROR: {e}")
            continue

        entries = parse_txt(content)
        print(f"  Parsed {len(entries)} entries")

        new_count = 0
        skip_count = 0
        tags_json = json.dumps([tag], ensure_ascii=False)

        for front, back in entries:
            h = compute_hash(front, subject_id)

            if DB_TYPE == "mysql":
                sql = (
                    f"INSERT IGNORE INTO knowledge_items "
                    f"(subject_id, front, back, tags, hash, source) "
                    f"VALUES ({P}, {P}, {P}, {P}, {P}, 'seed')"
                )
            else:
                sql = (
                    f"INSERT OR IGNORE INTO knowledge_items "
                    f"(subject_id, front, back, tags, hash, source) "
                    f"VALUES ({P}, {P}, {P}, {P}, {P}, 'seed')"
                )

            cur.execute(sql, (subject_id, front, back, tags_json, h))

            if cur.rowcount > 0:
                new_count += 1
            else:
                skip_count += 1

        # Commit per level
        if DB_TYPE == "mysql":
            conn.commit()

        print(f"  => {new_count} new, {skip_count} duplicate")
        grand_new += new_count
        grand_skip += skip_count

    # Count after
    cur.execute(f"SELECT COUNT(*) as cnt FROM knowledge_items WHERE subject_id={P}", (subject_id,))
    after = cur.fetchone()["cnt"]

    print(f"\n{'='*50}")
    print(f"Done! Before: {before} | New: {grand_new} | Dup: {grand_skip} | After: {after}")
    print(f"{'='*50}")


if __name__ == "__main__":
    from database.migrate import run_migrations
    run_migrations()
    levels = sys.argv[1:] if len(sys.argv) > 1 else None
    import_vocabulary(levels)
