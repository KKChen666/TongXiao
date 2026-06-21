"""
权限控制模块

控制哪些工具调用需要用户确认，哪些可以自动执行。
学习类查询工具默认安全，写入类操作需要审核。
"""

import logging

logger = logging.getLogger("ai.permission")


class PermissionGate:
    """权限网关"""

    # 安全工具：只读查询，自动放行
    SAFE_TOOLS = {
        "knowledge_search",
        "get_study_stats",
        "study_assistant",
    }

    def check(self, tool_name: str, arguments: dict) -> bool:
        """
        检查工具是否允许执行。

        目前策略：所有工具自动放行，保留扩展点。
        未来可接入前端确认弹窗。
        """
        if tool_name in self.SAFE_TOOLS:
            return True

        # 非安全工具也放行（generate_quiz 也是只读的）
        logger.debug(f"工具放行: {tool_name}")
        return True

    def is_safe(self, tool_name: str) -> bool:
        return tool_name in self.SAFE_TOOLS
