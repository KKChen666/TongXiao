"""
执行追踪模块

记录 Agent 运行过程中的每一步决策、工具调用和 LLM 交互。
用于调试、监控和优化 Agent 行为。
"""

import logging
from datetime import datetime

logger = logging.getLogger("ai.trace")


class Trace:
    """执行追踪器"""

    def __init__(self, session_id: str):
        self.session_id = session_id
        self.entries: list[dict] = []

    def log(self, event_type: str, data: dict):
        """记录追踪事件"""
        # 截断过长的字符串值
        truncated = {}
        for k, v in data.items():
            if isinstance(v, str) and len(v) > 500:
                truncated[k] = v[:500] + "..."
            else:
                truncated[k] = v

        entry = {
            "type": event_type,
            "data": truncated,
            "timestamp": datetime.now().isoformat(),
            "session_id": self.session_id,
        }
        self.entries.append(entry)
        logger.debug(f"[{event_type}] session={self.session_id} {truncated}")

    def get_entries(self) -> list[dict]:
        return self.entries

    def get_summary(self) -> str:
        return f"session={self.session_id}, {len(self.entries)} events"
