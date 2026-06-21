"""
RAG 引擎 — 双通道知识库检索增强生成

通道 1：knowledge_items 表（词汇/词条）— TF-IDF 精确匹配
通道 2：knowledge_chunks 表（电子书文档分块）— FAISS 向量检索

两条通道的结果合并后注入 LLM prompt，确保回答基于真实数据。
"""

import logging
import math
import re
from collections import Counter

from database.db import get_conn
from config import DB_TYPE
from .config import FAISS_DATA_DIR
from .vector_store import VectorStore

logger = logging.getLogger("ai.rag")


class RAGEngine:
    """RAG 引擎：知识库词条检索 + 文档向量检索 + 上下文注入"""

    def __init__(self, top_k: int = 5, min_score: float = 0.05):
        self.top_k = top_k
        self.min_score = min_score
        # 通道 1：knowledge_items TF-IDF
        self._documents: list[dict] = []
        self._idf: dict[str, float] = {}
        self._tfidf_matrix: list[dict[str, float]] = []
        self._loaded = False
        # 通道 2：FAISS 向量存储
        self._vector_stores: dict[str, VectorStore] = {}

    def _get_vector_store(self, subject: str) -> VectorStore:
        if subject not in self._vector_stores:
            self._vector_stores[subject] = VectorStore(FAISS_DATA_DIR, subject)
        return self._vector_stores[subject]

    # ==================== 通道 1：knowledge_items TF-IDF ====================

    def load_knowledge(self, subject: str = ""):
        """从 knowledge_items 加载词条数据并构建 TF-IDF 索引"""
        p = "%s" if DB_TYPE == "mysql" else "?"
        conn = get_conn()
        cur = conn.cursor()

        if subject:
            cur.execute(f"SELECT id FROM subjects WHERE name={p}", (subject,))
            subj = cur.fetchone()
            if not subj:
                logger.warning(f"科目不存在: {subject}")
                return
            sid = subj["id"]
            cur.execute(
                f"SELECT id, front, back, phonetic, example, back_detail, tags "
                f"FROM knowledge_items WHERE subject_id={p}", (sid,),
            )
        else:
            cur.execute(
                "SELECT id, front, back, phonetic, example, back_detail, tags "
                "FROM knowledge_items"
            )

        self._documents = []
        for row in cur.fetchall():
            r = dict(row)
            parts = [r.get("front", ""), r.get("back", "")]
            if r.get("example"):
                parts.append(r["example"])
            if r.get("back_detail"):
                parts.append(r["back_detail"])
            r["_search_text"] = " ".join(parts).lower()
            self._documents.append(r)

        logger.info(f"加载了 {len(self._documents)} 条 knowledge_items")
        self._build_tfidf_index()
        self._loaded = True

    def _tokenize(self, text: str) -> list[str]:
        text = text.lower().strip()
        return re.findall(r'[a-z]+|[\u4e00-\u9fff]', text)

    def _build_tfidf_index(self):
        if not self._documents:
            return
        n = len(self._documents)
        doc_freq: dict[str, int] = {}
        for doc in self._documents:
            for token in set(self._tokenize(doc["_search_text"])):
                doc_freq[token] = doc_freq.get(token, 0) + 1

        self._idf = {t: math.log((n + 1) / (df + 1)) + 1 for t, df in doc_freq.items()}

        self._tfidf_matrix = []
        for doc in self._documents:
            tokens = self._tokenize(doc["_search_text"])
            tf = Counter(tokens)
            total = len(tokens) or 1
            tfidf = {t: (c / total) * self._idf.get(t, 1.0) for t, c in tf.items()}
            norm = math.sqrt(sum(v * v for v in tfidf.values())) or 1.0
            self._tfidf_matrix.append({k: v / norm for k, v in tfidf.items()})

    def _search_items(self, query: str) -> list[dict]:
        """通道 1 检索：精确匹配 + TF-IDF"""
        if not self._loaded:
            self.load_knowledge()
        if not self._documents:
            return []

        query_lower = query.lower().strip()
        query_tokens = self._tokenize(query_lower)

        # 短查询优先精确匹配
        if len(query_tokens) <= 3:
            exact = [d for d in self._documents
                     if d.get("front", "").lower() == query_lower
                     or query_lower in d.get("front", "").lower()]
            if exact:
                return exact[:self.top_k]

        # TF-IDF 相似度
        if not query_tokens:
            return []
        tf = Counter(query_tokens)
        total = len(query_tokens)
        qv = {t: (c / total) * self._idf.get(t, 1.0) for t, c in tf.items()}
        norm = math.sqrt(sum(v * v for v in qv.values())) or 1.0
        qv = {k: v / norm for k, v in qv.items()}

        scored = []
        for i, dv in enumerate(self._tfidf_matrix):
            score = sum(qv.get(t, 0) * dv.get(t, 0) for t in qv)
            if score >= self.min_score:
                scored.append((score, i))
        scored.sort(reverse=True)
        return [self._documents[i] for _, i in scored[:self.top_k]]

    # ==================== 通道 2：FAISS 文档分块检索 ====================

    def _search_chunks(self, query: str, subject: str) -> list[dict]:
        """通道 2 检索：FAISS 向量搜索文档分块"""
        store = self._get_vector_store(subject)
        return store.search(query, self.top_k)

    # ==================== 统一检索入口 ====================

    def retrieve(self, query: str, subject: str = "") -> list[dict]:
        """
        双通道检索：knowledge_items + 文档分块，合并后返回。
        """
        results = []

        # 通道 1：词条
        item_results = self._search_items(query)
        for r in item_results:
            results.append({
                "source": "knowledge_item",
                "front": r.get("front", ""),
                "back": r.get("back", ""),
                "phonetic": r.get("phonetic", ""),
                "example": r.get("example", ""),
                "back_detail": r.get("back_detail", ""),
            })

        # 通道 2：文档分块
        if subject:
            chunk_results = self._search_chunks(query, subject)
            for r in chunk_results:
                results.append({
                    "source": "document_chunk",
                    "text": r.get("text", ""),
                    "filename": r.get("filename", ""),
                    "chunk_index": r.get("chunk_index", 0),
                    "score": r.get("score", 0),
                })

        return results[:self.top_k * 2]

    # ==================== 上下文格式化 ====================

    def format_context(self, results: list[dict]) -> str:
        """将检索结果格式化为 LLM 可读的上下文"""
        if not results:
            return ""

        parts = []
        idx = 1
        for item in results:
            if item.get("source") == "knowledge_item":
                part = f"【词条 {idx}】{item.get('front', '')}"
                if item.get("phonetic"):
                    part += f"  /{item['phonetic']}/"
                part += f"\n释义：{item.get('back', '')}"
                if item.get("example"):
                    part += f"\n例句：{item['example']}"
                if item.get("back_detail"):
                    part += f"\n详解：{item['back_detail']}"
                parts.append(part)
            else:
                part = f"【文档 {idx}】来源：{item.get('filename', '未知')}"
                part += f"\n{item.get('text', '')[:500]}"
                parts.append(part)
            idx += 1

        return "\n\n".join(parts)

    def retrain(self, subject: str = ""):
        """重新训练 TF-IDF 索引"""
        self._loaded = False
        self.load_knowledge(subject)
