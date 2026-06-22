"""
学习统计工具

获取用户各科目的学习进度、复习次数、掌握率等统计数据。
"""

import json
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))
from database.db import get_conn
from config import DB_TYPE
from .base import Tool


class StudyStatsTool(Tool):
    name = "get_study_stats"
    description = "获取用户的学习统计数据。当用户询问学习进度、背了多少词、复习情况、掌握率时使用此工具。"
    parameters = {
        "user_id": "用户ID",
    }

    def execute(self, user_id: int = 0, **kwargs) -> str:
        p = "%s" if DB_TYPE == "mysql" else "?"
        conn = get_conn()
        cur = conn.cursor()

        cur.execute("SELECT * FROM subjects ORDER BY id")
        subjects = [dict(r) for r in cur.fetchall()]

        stats = []
        for subj in subjects:
            sid = subj["id"]
            cur.execute(
                f"SELECT COUNT(*) as total FROM cards WHERE topic_id IN "
                f"(SELECT id FROM topics WHERE subject_id={p})",
                (sid,),
            )
            total = cur.fetchone()["total"]

            cur.execute(
                f"SELECT COUNT(DISTINCT card_id) as reviewed FROM review_log WHERE card_id IN "
                f"(SELECT id FROM cards WHERE topic_id IN "
                f"(SELECT id FROM topics WHERE subject_id={p})) AND user_id={p}",
                (sid, user_id),
            )
            reviewed = cur.fetchone()["reviewed"]

            stats.append({
                "subject": subj["display_name"],
                "total_cards": total,
                "reviewed": reviewed,
                "progress": f"{round(reviewed / total * 100, 1)}%" if total else "0%",
            })

        return json.dumps(stats, ensure_ascii=False, indent=2)
