"""
学习助手工具

根据用户的学习进度和薄弱环节，提供个性化学习建议所需的数据。
"""

import json
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))
from database.db import get_conn
from config import DB_TYPE
from .base import Tool


class StudyAssistantTool(Tool):
    name = "study_assistant"
    description = "学习助手工具。根据用户的学习进度和薄弱环节，提供个性化学习建议。返回用户的学习数据摘要。"
    parameters = {
        "user_id": "用户ID",
        "subject": "科目名称（可选）",
    }

    def execute(self, user_id: int = 0, subject: str = "", **kwargs) -> str:
        p = "%s" if DB_TYPE == "mysql" else "?"
        conn = get_conn()
        cur = conn.cursor()

        result = {"user_id": user_id}

        # 总体统计
        cur.execute(
            f"SELECT COUNT(*) as total FROM review_log WHERE user_id={p}", (user_id,)
        )
        total_reviews = cur.fetchone()["total"]

        cur.execute(
            f"SELECT COUNT(DISTINCT card_id) as unique_cards FROM review_log WHERE user_id={p} AND result=1",
            (user_id,),
        )
        mastered = cur.fetchone()["unique_cards"]

        cur.execute("SELECT COUNT(*) as total FROM cards")
        total_cards = cur.fetchone()["total"]

        result["stats"] = {
            "total_reviews": total_reviews,
            "mastered_cards": mastered,
            "total_cards": total_cards,
            "mastery_rate": f"{round(mastered / total_cards * 100, 1)}%" if total_cards else "0%",
        }

        # 薄弱环节
        cur.execute(
            f"SELECT c.front, c.back, COUNT(*) as fail_count "
            f"FROM review_log r JOIN cards c ON r.card_id = c.id "
            f"WHERE r.user_id={p} AND r.result=0 "
            f"GROUP BY r.card_id ORDER BY fail_count DESC LIMIT 10",
            (user_id,),
        )
        result["weak_items"] = [dict(r) for r in cur.fetchall()]

        return json.dumps(result, ensure_ascii=False, indent=2)
