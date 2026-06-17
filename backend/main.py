import os
import sys

# Make backend/ the import root so `from config import ...` and `from database.db import ...` work
_backend_dir = os.path.dirname(os.path.abspath(__file__))
if _backend_dir not in sys.path:
    sys.path.insert(0, _backend_dir)

from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from database.db import (
    get_subjects, get_topics, get_cards,
    get_subject_progress, get_topic_progress, log_review, get_conn,
)
from database.migrate import run_migrations
from config import DB_TYPE


@asynccontextmanager
async def lifespan(app: FastAPI):
    run_migrations()
    yield


app = FastAPI(title="考研背诵 API", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])


class ReviewBody(BaseModel):
    result: int


class ImportBody(BaseModel):
    subject: str
    topic: str = ""
    cards: list


def _placeholder():
    return "%s" if DB_TYPE == "mysql" else "?"


# --- API Routes ---

@app.get("/api/subjects")
def api_subjects():
    subs = get_subjects()
    result = []
    for s in subs:
        total, reviewed = get_subject_progress(s["id"])
        d = dict(s)
        d["total_cards"] = total
        d["reviewed_cards"] = reviewed
        d["progress_pct"] = round(reviewed / total * 100, 1) if total else 0
        result.append(d)
    return result


@app.get("/api/subjects/{subject_id}/topics")
def api_topics(subject_id: int):
    tops = get_topics(subject_id)
    result = []
    for t in tops:
        total, reviewed = get_topic_progress(t["id"])
        d = dict(t)
        d["total_cards"] = total
        d["reviewed_cards"] = reviewed
        d["progress_pct"] = round(reviewed / total * 100, 1) if total else 0
        result.append(d)
    return result


@app.get("/api/topics/{topic_id}/cards")
def api_cards(topic_id: int):
    cards = get_cards(topic_id)
    if not cards:
        return []
    return [dict(c) for c in cards]


@app.post("/api/cards/{card_id}/review")
def api_review(card_id: int, body: ReviewBody):
    log_review(card_id, body.result)
    return {"ok": True}


@app.get("/api/stats")
def api_stats():
    subs = get_subjects()
    total_all = 0
    reviewed_all = 0
    for s in subs:
        total, reviewed = get_subject_progress(s["id"])
        total_all += total
        reviewed_all += reviewed
    subjects = []
    for s in subs:
        total, reviewed = get_subject_progress(s["id"])
        d = dict(s)
        d["total_cards"] = total
        d["reviewed_cards"] = reviewed
        d["progress_pct"] = round(reviewed / total * 100, 1) if total else 0
        subjects.append(d)
    return {
        "total_cards": total_all,
        "reviewed_cards": reviewed_all,
        "pending_cards": total_all - reviewed_all,
        "completion_rate": round(reviewed_all / total_all * 100, 1) if total_all else 0,
        "subjects": subjects,
    }


@app.post("/api/import")
def api_import(body: ImportBody):
    if not body.cards:
        raise HTTPException(400, "No cards provided")
    conn = get_conn()
    cur = conn.cursor()
    p = _placeholder()
    cur.execute(f"SELECT id FROM subjects WHERE name={p}", (body.subject,))
    subj = cur.fetchone()
    if not subj:
        raise HTTPException(400, "Subject not found")
    sid = subj["id"]
    topic_name = body.topic or f"导入 - {body.subject}"
    cur.execute(f"SELECT id FROM topics WHERE subject_id={p} AND name={p}", (sid, topic_name))
    topic = cur.fetchone()
    if topic:
        tid = topic["id"]
        cur.execute(f"DELETE FROM cards WHERE topic_id={p}", (tid,))
    else:
        cur.execute(f"SELECT MAX(order_num) FROM topics WHERE subject_id={p}", (sid,))
        max_ord = cur.fetchone()["MAX(order_num)"] or 0
        cur.execute(f"INSERT INTO topics (subject_id, name, order_num) VALUES ({p},{p},{p})",
                    (sid, topic_name, max_ord + 1))
        tid = cur.lastrowid
    for idx, card in enumerate(body.cards):
        front = card.get("front", card.get("word", ""))
        back = card.get("back", card.get("definition", ""))
        cur.execute(f"INSERT INTO cards (topic_id, front, back, order_num) VALUES ({p},{p},{p},{p})",
                    (tid, front, back, idx + 1))
    if DB_TYPE == "mysql":
        conn.commit()
    return {"ok": True, "count": len(body.cards), "topic": topic_name}


# --- Serve Static Frontend (production build) ---

STATIC_DIR = os.path.join(os.path.dirname(__file__), "..", "frontend", "dist")
if os.path.isdir(STATIC_DIR):
    app.mount("/", StaticFiles(directory=STATIC_DIR, html=True), name="static")
