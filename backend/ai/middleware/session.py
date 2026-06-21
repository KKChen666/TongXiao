"""
会话存储模块

管理 AI 对话的会话生命周期，包括创建、消息管理和过期清理。
"""

import logging
from datetime import datetime, timedelta

logger = logging.getLogger("ai.session")


class SessionStore:
    """会话存储"""

    def __init__(self, max_messages: int = 50, ttl_hours: int = 24):
        self.max_messages = max_messages
        self.ttl_hours = ttl_hours
        self._sessions: dict[str, dict] = {}

    def create_session(self, user_id: int, session_id: str | None = None) -> str:
        """创建或复用会话"""
        if session_id and session_id in self._sessions:
            self._sessions[session_id]["last_active"] = datetime.now()
            return session_id

        if not session_id:
            session_id = f"session-{user_id}-{datetime.now().strftime('%Y%m%d%H%M%S%f')}"

        self._sessions[session_id] = {
            "messages": [],
            "created_at": datetime.now(),
            "last_active": datetime.now(),
            "user_id": user_id,
        }
        logger.info(f"创建会话: {session_id}")
        return session_id

    def add_message(self, session_id: str, role: str, content: str):
        """向会话添加消息"""
        if session_id not in self._sessions:
            return

        self._sessions[session_id]["messages"].append({
            "role": role,
            "content": content,
            "timestamp": datetime.now().isoformat(),
        })
        self._sessions[session_id]["last_active"] = datetime.now()

        # 超出限制时保留前2条（system）和最近的消息
        messages = self._sessions[session_id]["messages"]
        if len(messages) > self.max_messages:
            self._sessions[session_id]["messages"] = messages[:2] + messages[-(self.max_messages - 2):]

    def get_messages(self, session_id: str) -> list[dict]:
        """获取会话的所有消息"""
        session = self._sessions.get(session_id)
        if not session:
            return []
        return session["messages"]

    def get_session(self, session_id: str) -> dict | None:
        """获取会话信息"""
        return self._sessions.get(session_id)

    def clear_session(self, session_id: str):
        """清除会话"""
        self._sessions.pop(session_id, None)
        logger.info(f"清除会话: {session_id}")

    def cleanup_expired(self):
        """清理过期会话"""
        now = datetime.now()
        expired = [
            sid for sid, s in self._sessions.items()
            if now - s["last_active"] > timedelta(hours=self.ttl_hours)
        ]
        for sid in expired:
            del self._sessions[sid]
        if expired:
            logger.info(f"清理了 {len(expired)} 个过期会话")
