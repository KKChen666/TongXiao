"""
向量存储模块

基于 FAISS 的向量数据库，用于知识库文档的语义检索。
使用哈希向量化器（HashingVectorizer）实现固定维度文本向量化，
无需维护全局词表，新增文档不需要重建索引。

升级路线：
- 当前：哈希向量化 + FAISS IndexFlatIP
- 未来可替换为 sentence-transformers embedding
"""

import json
import logging
import math
import os
import re
import hashlib
from collections import Counter

logger = logging.getLogger("ai.vector_store")

try:
    import numpy as np
    import faiss
    _HAS_FAISS = True
except ImportError:
    _HAS_FAISS = False
    logger.warning("faiss-cpu / numpy 未安装，向量搜索不可用，将回退到 TF-IDF")


class VectorStore:
    """FAISS 向量存储（按 subject 隔离）"""

    DIMENSION = 2048  # 哈希向量维度

    def __init__(self, data_dir: str, subject: str):
        self.data_dir = data_dir
        self.subject = subject
        self.index = None
        self.metadata: dict[str, dict] = {}  # str(faiss_id) -> meta
        self._next_id = 0
        self._loaded = False
        os.makedirs(data_dir, exist_ok=True)

    @property
    def _index_path(self) -> str:
        return os.path.join(self.data_dir, f"{self.subject}.index")

    @property
    def _meta_path(self) -> str:
        return os.path.join(self.data_dir, f"{self.subject}_meta.json")

    # ---------- 分词 ----------

    @staticmethod
    def _tokenize(text: str) -> list[str]:
        text = text.lower().strip()
        return re.findall(r'[a-z]+|[\u4e00-\u9fff]', text)

    # ---------- 哈希向量化 ----------

    def _vectorize(self, text: str) -> np.ndarray:
        """将文本转为固定维度的归一化向量"""
        tokens = self._tokenize(text)
        vec = np.zeros(self.DIMENSION, dtype=np.float32)
        tf = Counter(tokens)
        total = len(tokens) or 1
        for word, count in tf.items():
            h = int(hashlib.md5(word.encode()).hexdigest(), 16)
            idx = h % self.DIMENSION
            vec[idx] += count / total
        norm = np.linalg.norm(vec)
        if norm > 0:
            vec /= norm
        return vec

    # ---------- 持久化 ----------

    def load(self) -> bool:
        """从磁盘加载索引"""
        if not _HAS_FAISS:
            return False
        try:
            if os.path.exists(self._index_path) and os.path.exists(self._meta_path):
                self.index = faiss.read_index(self._index_path)
                with open(self._meta_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    self.metadata = {str(k): v for k, v in data.get("metadata", {}).items()}
                    self._next_id = data.get("next_id", 0)
                self._loaded = True
                logger.info(f"加载向量索引 [{self.subject}]: {self.index.ntotal} 条")
                return True
        except Exception as e:
            logger.error(f"加载向量索引失败 [{self.subject}]: {e}")
        return False

    def save(self):
        """保存索引到磁盘"""
        if not _HAS_FAISS or self.index is None:
            return
        try:
            faiss.write_index(self.index, self._index_path)
            with open(self._meta_path, 'w', encoding='utf-8') as f:
                json.dump({"metadata": self.metadata, "next_id": self._next_id},
                          f, ensure_ascii=False, indent=2)
            logger.info(f"保存向量索引 [{self.subject}]: {self.index.ntotal} 条")
        except Exception as e:
            logger.error(f"保存向量索引失败 [{self.subject}]: {e}")

    # ---------- 增删查 ----------

    def add(self, texts: list[str], metas: list[dict]):
        """批量添加文本 + 元数据"""
        if not _HAS_FAISS or not texts:
            return
        if not self._loaded:
            self.load()
        if self.index is None:
            self.index = faiss.IndexFlatIP(self.DIMENSION)

        vectors = np.array([self._vectorize(t) for t in texts], dtype=np.float32)
        ids = np.array([self._next_id + i for i in range(len(texts))], dtype=np.int64)
        self.index.add_with_ids(vectors, ids)

        for i, meta in enumerate(metas):
            self.metadata[str(self._next_id + i)] = meta

        self._next_id += len(texts)
        self.save()

    def search(self, query: str, top_k: int = 5) -> list[dict]:
        """语义搜索，返回 top_k 条结果（带 score）"""
        if not _HAS_FAISS:
            return []
        if not self._loaded:
            self.load()
        if self.index is None or self.index.ntotal == 0:
            return []

        vec = self._vectorize(query).reshape(1, -1)
        k = min(top_k, self.index.ntotal)
        scores, ids = self.index.search(vec, k)

        results = []
        for score, idx in zip(scores[0], ids[0]):
            if idx < 0:
                continue
            meta = self.metadata.get(str(idx))
            if meta:
                results.append({**meta, "score": float(score)})
        return results

    def clear(self):
        """清空索引（磁盘 + 内存）"""
        self.index = None
        self.metadata = {}
        self._next_id = 0
        self._loaded = False
        for path in [self._index_path, self._meta_path]:
            if os.path.exists(path):
                os.remove(path)

    @property
    def count(self) -> int:
        if not self._loaded:
            self.load()
        return self.index.ntotal if self.index else 0
