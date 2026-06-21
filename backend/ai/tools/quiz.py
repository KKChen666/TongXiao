"""
智能出题工具

基于知识库内容生成练习题，支持选择题、填空题、翻译题。
"""

import json
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))
from database.db import get_conn
from config import DB_TYPE
from .base import Tool


class QuizGenerateTool(Tool):
    name = "generate_quiz"
    description = "根据知识库中的内容生成练习题。支持选择题、填空题、翻译题等题型。用于帮助用户巩固学习。"
    parameters = {
        "subject": "科目名称，如 'english'",
        "topic_name": "章节名称（可选，不填则随机选取）",
        "count": "题目数量，默认5",
        "question_type": "题型：choice(选择题)、fill(填空题)、translate(翻译题)，默认fill",
    }

    def execute(self, subject: str = "english", topic_name: str = "",
                count: int = 5, question_type: str = "fill", **kwargs) -> str:
        p = "%s" if DB_TYPE == "mysql" else "?"
        conn = get_conn()
        cur = conn.cursor()

        cur.execute(f"SELECT id FROM subjects WHERE name={p}", (subject,))
        subj = cur.fetchone()
        if not subj:
            return f"未找到科目: {subject}"
        sid = subj["id"]

        if topic_name:
            like = f"%{topic_name}%"
            if DB_TYPE == "mysql":
                cur.execute(
                    f"SELECT * FROM knowledge_items WHERE subject_id={p} AND (front LIKE {p} OR back LIKE {p}) ORDER BY RAND() LIMIT {p}",
                    (sid, like, like, count * 2),
                )
            else:
                cur.execute(
                    f"SELECT * FROM knowledge_items WHERE subject_id={p} AND (front LIKE {p} OR back LIKE {p}) ORDER BY RANDOM() LIMIT {p}",
                    (sid, like, like, count * 2),
                )
        else:
            if DB_TYPE == "mysql":
                cur.execute(
                    f"SELECT * FROM knowledge_items WHERE subject_id={p} ORDER BY RAND() LIMIT {p}",
                    (sid, count * 2),
                )
            else:
                cur.execute(
                    f"SELECT * FROM knowledge_items WHERE subject_id={p} ORDER BY RANDOM() LIMIT {p}",
                    (sid, count * 2),
                )

        items = [dict(r) for r in cur.fetchall()]
        if not items:
            return "知识库中没有足够的内容来生成题目"

        instructions = {
            "choice": "请根据以下词条生成选择题。每题给出4个选项(A/B/C/D)，其中1个正确答案，3个干扰项。",
            "fill": "请根据以下词条生成填空题。将释义或例句中的关键词挖空，让用户填写。",
            "translate": "请根据以下词条生成翻译题。给出中文意思，让用户写出对应的英文。",
        }

        quiz_data = {
            "question_type": question_type,
            "source_count": len(items),
            "items": items[:count],
            "instructions": instructions.get(question_type, instructions["fill"]),
        }
        return json.dumps(quiz_data, ensure_ascii=False, indent=2)
