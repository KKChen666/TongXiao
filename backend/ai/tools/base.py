"""
工具基类和注册表

所有 AI 工具的抽象基类，以及工具注册表实现。
"""

from abc import ABC, abstractmethod


class Tool(ABC):
    """工具基类"""
    name: str = ""
    description: str = ""
    parameters: dict = {}
    requires_permission: bool = False

    @abstractmethod
    def execute(self, **kwargs) -> str:
        """执行工具，返回结果字符串"""
        pass

    def to_schema(self) -> dict:
        """转为 LLM 可读的工具描述"""
        return {
            "name": self.name,
            "description": self.description,
            "parameters": self.parameters,
        }


class ToolRegistry:
    """工具注册表"""

    def __init__(self):
        self._tools: dict[str, Tool] = {}

    def register(self, tool: Tool):
        self._tools[tool.name] = tool

    def get(self, name: str) -> Tool | None:
        return self._tools.get(name)

    def list_schemas(self) -> list[dict]:
        return [t.to_schema() for t in self._tools.values()]

    def call(self, name: str, parameters: dict) -> str:
        tool = self._tools.get(name)
        if not tool:
            return f"错误：工具 '{name}' 不存在"
        try:
            return tool.execute(**parameters)
        except Exception as e:
            return f"错误：工具 '{name}' 执行失败 - {e}"
