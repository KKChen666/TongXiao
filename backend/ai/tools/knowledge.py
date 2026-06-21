"""
知识库搜索工具

从 knowledge_items 表中精确/模糊检索词条，为 RAG 和 Agent 提供数据支撑。
"""

import json
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))
from database.db import get_conn
from config import DB_TYPE
from .base import Tool


class KnowledgeSearchTool(Tool):
    name = "knowledge_search"
    description = "从知识库中搜索词条，返回精确的词汇释义、音标、例句等信息。用于回答用户关于单词/知识点的问题。"
    parameters = {
        "query": "搜索关键词（单词或短语）",
        "subject": "科目名称，如 'english' 或 'polit'",
        "limit": "返回结果数量，默认5",
    }

    def execute(self, query: str = "", subject: str = "english", limit: int = 5, **kwargs) -> str:
        p = "%s" if DB_TYPE == "mysql" else "?"
        conn = get_conn()
        cur = conn.cursor()

        cur.execute(f"SELECT id FROM subjects WHERE name={p}", (subject,))
        subj = cur.fetchone()
        if not subj:
            return f"未找到科目: {subject}"
        sid = subj["id"]

        # 精确匹配
        cur.execute(
            f"SELECT * FROM knowledge_items WHERE subject_id={p} AND front={p} LIMIT {p}",
            (sid, query, limit),
        )
        exact = [dict(r) for r in cur.fetchall()]
        if exact:
            return json.dumps(exact, ensure_ascii=False, indent=2)

        # 模糊搜索
        cur.execute(
            f"SELECT * FROM knowledge_items WHERE subject_id={p} AND (front LIKE {p} OR back LIKE {p}) LIMIT {p}",
            (sid, f"%{query}%", f"%{query}%", limit),
        )
        results = [dict(r) for r in cur.fetchall()]

        if not results:
            return f"知识库中未找到与 '{query}' 相关的内容"
        return json.dumps(results, ensure_ascii=False, indent=2)
