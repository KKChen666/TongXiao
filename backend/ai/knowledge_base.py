"""
知识库管理模块

处理电子书上传 → 文本提取 → 分块 → 向量化 → COS 存储。
支持 PDF / DOCX / TXT 格式。
"""

import logging
import os
import re
from datetime import datetime

from database.db import get_conn
from config import DB_TYPE
from .config import (
    COS_SECRET_ID, COS_SECRET_KEY, COS_BUCKET, COS_REGION,
    FAISS_DATA_DIR,
)
from .vector_store import VectorStore

logger = logging.getLogger("ai.knowledge")


class KnowledgeBase:
    """知识库管理器"""

    CHUNK_SIZE = 500
    CHUNK_OVERLAP = 50

    def __init__(self):
        self._stores: dict[str, VectorStore] = {}

    def _get_store(self, subject: str) -> VectorStore:
        if subject not in self._stores:
            self._stores[subject] = VectorStore(FAISS_DATA_DIR, subject)
        return self._stores[subject]

    # ---------- COS 上传 ----------

    def upload_to_cos(self, file_content: bytes, filename: str, user_id: int) -> str:
        """上传文件到腾讯云 COS，返回 key。失败返回空字符串。"""
        try:
            from qcloud_cos import CosConfig, CosS3Client
            config = CosConfig(
                SecretId=COS_SECRET_ID,
                SecretKey=COS_SECRET_KEY,
                Region=COS_REGION,
            )
            client = CosS3Client(config)
            key = f"knowledge/{user_id}/{datetime.now().strftime('%Y%m%d%H%M%S')}_{filename}"
            client.put_object(Bucket=COS_BUCKET, Body=file_content, Key=key)
            logger.info(f"COS 上传成功: {key}")
            return key
        except Exception as e:
            logger.warning(f"COS 上传失败（不影响本地处理）: {e}")
            return ""

    # ---------- 文本提取 ----------

    def extract_text(self, file_content: bytes, filename: str) -> str:
        """从文件中提取纯文本"""
        ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""

        if ext == "pdf":
            try:
                import pdfplumber, io
                parts = []
                with pdfplumber.open(io.BytesIO(file_content)) as pdf:
                    for page in pdf.pages:
                        t = page.extract_text()
                        if t:
                            parts.append(t)
                return "\n".join(parts)
            except Exception as e:
                logger.error(f"PDF 解析失败: {e}")
                return ""

        elif ext == "docx":
            try:
                import docx, io
                doc = docx.Document(io.BytesIO(file_content))
                return "\n".join(p.text for p in doc.paragraphs if p.text.strip())
            except Exception as e:
                logger.error(f"DOCX 解析失败: {e}")
                return ""

        else:
            return file_content.decode("utf-8", errors="replace")

    # ---------- 分块 ----------

    def chunk_text(self, text: str) -> list[str]:
        """将长文本切分为带重叠的固定大小分块"""
        text = re.sub(r'\n{3,}', '\n\n', text)
        chunks, start = [], 0
        while start < len(text):
            end = start + self.CHUNK_SIZE
            chunk = text[start:end].strip()
            if chunk:
                chunks.append(chunk)
            start += self.CHUNK_SIZE - self.CHUNK_OVERLAP
        return chunks

    # ---------- 核心流程 ----------

    def process_file(self, file_content: bytes, filename: str,
                     subject: str, user_id: int) -> dict:
        """
        完整处理流程：提取 → 分块 → 存 DB → 向量化 → 上传 COS。

        Returns:
            {"document_id", "chunk_count", "cos_key", "filename"}
        """
        # 1. COS 上传
        cos_key = self.upload_to_cos(file_content, filename, user_id)

        # 2. 提取文本
        text = self.extract_text(file_content, filename)
        if not text.strip():
            return {"error": "未能从文件中提取到文本内容"}

        # 3. 分块
        chunks = self.chunk_text(text)
        if not chunks:
            return {"error": "文本分块失败"}

        # 4. 存数据库
        p = "%s" if DB_TYPE == "mysql" else "?"
        conn = get_conn()
        cur = conn.cursor()

        cur.execute(f"SELECT id FROM subjects WHERE name={p}", (subject,))
        subj = cur.fetchone()
        if not subj:
            return {"error": f"科目不存在: {subject}"}
        sid = subj["id"]

        cur.execute(
            f"INSERT INTO knowledge_documents "
            f"(user_id, filename, cos_key, subject_id, file_type, chunk_count) "
            f"VALUES ({p},{p},{p},{p},{p},{p})",
            (user_id, filename, cos_key, sid,
             filename.rsplit(".", 1)[-1].lower() if "." in filename else "", len(chunks)),
        )
        if DB_TYPE == "mysql":
            conn.commit()
        doc_id = cur.lastrowid

        chunk_ids = []
        for i, chunk in enumerate(chunks):
            cur.execute(
                f"INSERT INTO knowledge_chunks "
                f"(document_id, subject_id, chunk_text, chunk_index) "
                f"VALUES ({p},{p},{p},{p})",
                (doc_id, sid, chunk, i),
            )
            if DB_TYPE == "mysql":
                conn.commit()
            chunk_ids.append(cur.lastrowid)

        # 5. 向量化
        store = self._get_store(subject)
        metas = [
            {
                "source_type": "document",
                "source_id": chunk_ids[i],
                "document_id": doc_id,
                "filename": filename,
                "chunk_index": i,
                "text": chunk,
            }
            for i in range(len(chunks))
        ]
        store.add(chunks, metas)

        return {
            "document_id": doc_id,
            "chunk_count": len(chunks),
            "cos_key": cos_key,
            "filename": filename,
        }

    # ---------- 查询 ----------

    def search_chunks(self, query: str, subject: str, top_k: int = 5) -> list[dict]:
        """在向量索引中搜索相关文档分块"""
        store = self._get_store(subject)
        return store.search(query, top_k)

    def get_documents(self, subject: str = "", user_id: int = 0) -> list[dict]:
        """获取已上传的文档列表"""
        p = "%s" if DB_TYPE == "mysql" else "?"
        conn = get_conn()
        cur = conn.cursor()

        conds, params = [], []
        if subject:
            cur.execute(f"SELECT id FROM subjects WHERE name={p}", (subject,))
            subj = cur.fetchone()
            if subj:
                conds.append(f"subject_id={p}")
                params.append(subj["id"])
        if user_id:
            conds.append(f"user_id={p}")
            params.append(user_id)

        where = " AND ".join(conds) if conds else "1=1"
        cur.execute(f"SELECT * FROM knowledge_documents WHERE {where} ORDER BY created_at DESC",
                    tuple(params))
        return [dict(r) for r in cur.fetchall()]

    def delete_document(self, doc_id: int, subject: str):
        """删除文档及其分块，并重建向量索引"""
        p = "%s" if DB_TYPE == "mysql" else "?"
        conn = get_conn()
        cur = conn.cursor()
        cur.execute(f"DELETE FROM knowledge_chunks WHERE document_id={p}", (doc_id,))
        cur.execute(f"DELETE FROM knowledge_documents WHERE id={p}", (doc_id,))
        if DB_TYPE == "mysql":
            conn.commit()
        self._rebuild_index(subject)

    def _rebuild_index(self, subject: str):
        """重建某个科目的全部向量索引"""
        p = "%s" if DB_TYPE == "mysql" else "?"
        conn = get_conn()
        cur = conn.cursor()

        cur.execute(f"SELECT id FROM subjects WHERE name={p}", (subject,))
        subj = cur.fetchone()
        if not subj:
            return
        sid = subj["id"]

        cur.execute(
            f"SELECT kc.id, kc.chunk_text, kc.document_id, kc.chunk_index, kd.filename "
            f"FROM knowledge_chunks kc "
            f"LEFT JOIN knowledge_documents kd ON kc.document_id = kd.id "
            f"WHERE kc.subject_id={p}",
            (sid,),
        )
        chunks = [dict(r) for r in cur.fetchall()]

        store = self._get_store(subject)
        store.clear()

        if chunks:
            texts = [c["chunk_text"] for c in chunks]
            metas = [
                {
                    "source_type": "document",
                    "source_id": c["id"],
                    "document_id": c["document_id"],
                    "filename": c.get("filename", ""),
                    "chunk_index": c["chunk_index"],
                    "text": c["chunk_text"],
                }
                for c in chunks
            ]
            store.add(texts, metas)

        logger.info(f"重建向量索引 [{subject}]: {len(chunks)} 个分块")
