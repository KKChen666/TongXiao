"""
Token 计数模块

统计每次 AI 对话消耗的 token 数量，用于自定义收费标准。
使用 tiktoken 做精确计数，不可用时回退到字符估算。
"""

import logging
from datetime import datetime

logger = logging.getLogger("ai.token_counter")

try:
    import tiktoken
    _encoder = tiktoken.get_encoding("cl100k_base")
    _HAS_TIKTOKEN = True
except ImportError:
    _HAS_TIKTOKEN = False
    logger.warning("tiktoken 未安装，使用字符估算模式")


def count_tokens(text: str) -> int:
    """统计文本的 token 数量"""
    if not text:
        return 0
    if _HAS_TIKTOKEN:
        return len(_encoder.encode(text))
    # 回退估算：中文约2字符/token，英文约4字符/token
    cn_chars = sum(1 for c in text if '\u4e00' <= c <= '\u9fff')
    en_chars = len(text) - cn_chars
    return cn_chars * 2 + en_chars // 4


class TokenCounter:
    """对话 Token 计数器（按会话追踪）"""

    def __init__(self):
        self._usage: dict[str, list[dict]] = {}

    def count_message(self, session_id: str, user_message: str,
                      system_prompt: str, rag_context: str,
                      llm_response: str) -> dict:
        """
        统计一次对话的 token 使用量并记录。

        Returns:
            {"user_tokens", "system_tokens", "rag_tokens",
             "response_tokens", "total_tokens"}
        """
        user_tokens = count_tokens(user_message)
        system_tokens = count_tokens(system_prompt)
        rag_tokens = count_tokens(rag_context)
        response_tokens = count_tokens(llm_response)
        total = user_tokens + system_tokens + rag_tokens + response_tokens

        record = {
            "user_tokens": user_tokens,
            "system_tokens": system_tokens,
            "rag_tokens": rag_tokens,
            "response_tokens": response_tokens,
            "total_tokens": total,
            "timestamp": datetime.now().isoformat(),
        }

        if session_id not in self._usage:
            self._usage[session_id] = []
        self._usage[session_id].append(record)

        return record

    def get_session_usage(self, session_id: str) -> dict:
        """获取会话的 token 使用汇总"""
        records = self._usage.get(session_id, [])
        if not records:
            return {"session_id": session_id, "total_tokens": 0, "message_count": 0}
        total = sum(r["total_tokens"] for r in records)
        return {
            "session_id": session_id,
            "total_tokens": total,
            "user_tokens": sum(r["user_tokens"] for r in records),
            "response_tokens": sum(r["response_tokens"] for r in records),
            "message_count": len(records),
            "records": records,
        }
