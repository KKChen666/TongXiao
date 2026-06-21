"""
Stage 3: Agent Harness Demo
    目标：实现一个可调试的 agent harness，包含：
    - Tool Registry（工具注册）
    - Permission Gate（权限控制）
    - Session Store（会话存储）
    - Context Compaction（上下文压缩）
    - Trace（执行追踪）
    验收：包含 README、运行步骤、示例输入输出和失败记录。

Auth: lct
Date: 2026-6-21
"""
from dataclasses import dataclass
from typing import Callable
import json
import datetime
import re
from openai import OpenAI

# ===== LLM 配置（从环境变量读取）=====
import os
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY", "")
OPENAI_BASE_URL = os.environ.get("OPENAI_BASE_URL", "https://token-plan-cn.xiaomimimo.com/v1")
MODEL_NAME = os.environ.get("MODEL_NAME", "mimo-v2.5-pro")

# 创建 OpenAI 客户端
client = OpenAI(api_key=OPENAI_API_KEY, base_url=OPENAI_BASE_URL)
model = MODEL_NAME


#======1. Tool 数据类=====
@dataclass
class Tool:
    """工具定义"""
    name: str                           #工具名称
    description: str                    #工具描述
    parameters: dict                    #参数说明
    function: Callable                  #实际执行函数
    requires_permission: bool = False   #是否需要用户确认


#======2. Tool Registry（工具注册表）=====
class ToolRegistry:
    """工具注册表： 管理所有可用的工具"""
    def __init__(self):
        self.tools: dict[str, Tool] = {}

    def registry(self, tool: Tool):
        """注册工具"""
        self.tools[tool.name] = tool
        print(f"成功注册工具: {tool.name}")

    def get(self, name: str) -> Tool | None:
        """获取工具"""
        return self.tools.get(name)

    def list_tools(self) -> list[dict]:
        """列出所有工具（给LLM看的格式）"""
        return [
            {
                "name": t.name,
                "description": t.description,
                "parameters": t.parameters,
            }
            for t in self.tools.values()
        ]

    def call(self, name: str, parameters: dict) -> str:
        """调用工具"""
        tool = self.tools.get(name)
        if not tool:
            return f"错误：工具 '{name}' 不存在"

        try:
            result = tool.function(**parameters)
            return str(result)
        except Exception as e:
            return f"错误：工具执行失败 - {e}"


#=======3. Permission Gate (权限控制)  =====
class PermissionGate:
    """权限控制： 哪些操作需要用户确认"""
    def __init__(self):
        self._approved: set[str] = set()   #已批准的操作

    def check(self, tool_name: str, arguments: dict) -> bool:
        """
        检查是否允许执行该工具调用。

        Returns:
            True = 允许执行， False = 拒绝
        """
        #生成操作的唯一标识
        key = f"{tool_name}:{json.dumps(arguments, sort_keys=True)}"

        # 如果已经批准过，直接允许
        if key in self._approved:
            return True

        # 对于危险操作，提示用户确认
        print(f"\n 权限检查：{tool_name}({arguments})")
        response = input("允许执行？(y/n): ").strip().lower()
        if response == 'y':
            self._approved.add(key)
            return True
        return False

    def approve(self, tool_name: str, aguments: dict):
        """预批准某个工具调用"""
        key = f"{tool_name}:{json.dumps(aguments, sort_keys=True)}"
        self._approved.add(key)


#=======4.Session Store(会话存储) =====
class SessionStore:
    """会话存储： 管理对话历史和状态"""
    def __init__(self):
        self.sessions: dict[str, list[dict]] = {}

    def create_session(self) -> str:
        """创建会话，返回session_id"""
        session_id = f"session-{datetime.datetime.now().strftime('%Y%m%d-%H%M%S')}"
        self.sessions[session_id] = []
        print(f"创建会话session_id: {session_id}")
        return session_id

    def add_message(self, session_id: str, role: str, content: str):
        """向会话添加消息"""
        if session_id not in self.sessions:
            self.sessions[session_id] = []
        self.sessions[session_id].append({
            "role": role,
            "content": content,
            "timestamp": datetime.datetime.now().isoformat(),
        })

    def get_message(self, session_id: str) -> list[dict]:
        """获取会话的所有消息"""
        return self.sessions.get(session_id,[])

#========5. Context Compactor(上下文压缩) =====
class ContextCompaction:
    """上下文压缩：当前对话过长时压缩历史"""
    def __init__(self, max_messages: int = 20):
        self.max_messages = max_messages

    def compact(self, messages: list[dict]) -> list[dict]:
        """
        压缩消息列表。
        策略：
        - 保留最近的消息
        - 早期消息用摘要替代
        """
        if len(messages) <= self.max_messages:
            return messages

        # TODO: 用LLM生成早期消息的摘要
        # 暂时简单阶段
        recent = messages[-self.max_messages:]
        print(f"🗜️上下文压缩: {len(messages)} -> {len(recent)} 条消息")
        return recent

#======6.Trace（执行追踪）=====
class Trace:
    """执行追踪，记录每一步决策和工具调用"""
    def __init__(self):
        self.entries: list[dict] = []

    def log(self, event_type: str, data: dict):
        """记录一个追踪时间"""
        self.entries.append({
            "type": event_type,
            "data": data,
            "timestamp": datetime.datetime.now().isoformat(),
        })

    def get_summary(self) -> str:
        """获取追踪摘要"""
        return f"共 {len(self.entries)} 个事件"

    def print_trace(self):
        """打印完整追踪"""
        print("\n=== Trace ===")
        for entry in self.entries:
            print(f"[{entry['timestamp']}] {entry['type']}: {entry['data']}")

# ====== ！！！！ Agent Harness（主类）======
class AgentHarness:
    """
      Agent Harness：整合所有组件。

      这是 agent 的「运行环境」，不是框架。
    """
    def __init__(self):
        self.tools = ToolRegistry() #工具注册表
        self.permission = PermissionGate() #权限控制
        self.session = SessionStore() #会话存储
        self.compactor = ContextCompaction() #上下文压缩
        self.trace = Trace() #执行跟踪

    def register_tool(self, name, description, parameters, function, requires_permission: bool = False):
        """注册工具"""
        self.tools.registry(Tool(
            name=name,
            description=description,
            parameters=parameters,
            function=function,
            requires_permission=requires_permission
        ))

    def run(self, user_message: str, session_id: str | None = None) -> str:
        """
          运行 agent。

          Args:
              user_message: 用户输入
              session_id: 会话 ID（可选）
          Returns:
              agent 的回答
        """
        # 1.创建或获取对话
        if not session_id:
            session_id = self.session.create_session()

        self.session.add_message(session_id,"user", user_message)
        self.trace.log("user_message", {"session_id": session_id, "message": user_message})

        #2. 获取对话历史
        messages = self.session.get_message(session_id)
        messages = self.compactor.compact(messages)

        #3. 构建prompt
        tools_description = self._format_tools_for_llm()

        prompt = f"""你是一个helpful assistant。 你可以使用以下工具：
{tools_description}

用户问题：{user_message}

请回答。如果需要使用工具，请使用以下格式：
{{"tool":"工具名", "arguments": {{"参数名": "参数值"}}}}

回答：
"""

        #4. 调用 LLM（流式输出）
        self.trace.log("llm_call", {"prompt":prompt[:200] + "..."})

        response = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": "你是一个 helpful assistant，可以使用工具来完成任务。"},
                {"role":"user", "content": prompt},
            ],
            stream=True
        )

        # 流式读取并打印
        llm_response = ""
        for chunk in response:
            if chunk.choices and chunk.choices[0].delta.content is not None:
                content = chunk.choices[0].delta.content
                print(content, end="", flush=True)
                llm_response += content
        print()  # 换行

        self.trace.log("llm_response", {"response":llm_response[:200] + "..."})

        #5. 解析tool call
        tool_call = self._parse_tool_call(llm_response)

        if tool_call:
            tool_name = tool_call["tool"]
            arguments = tool_call["arguments"]

            #6.权限检查
            if self.permission.check(tool_name, arguments):
                #7. 调用工具
                result = self.tools.call(tool_name, arguments)
                self.trace.log("tool_call",{"tool": tool_name, "arguments": arguments, "result": result})

                # 8.用工具结果再次调用LLM（流式输出）
                final_prompt = f"""用户问题：{user_message}
我使用了工具 {tool_name}, 结果是： {result}

请根据这个结果回答用户的问题。
"""

                final_response = client.chat.completions.create(
                    model=model,
                    messages=[
                        {"role": "user", "content": final_prompt},
                    ],
                    stream=True
                )

                # 流式读取并打印
                answer = ""
                for chunk in final_response:
                    if chunk.choices and chunk.choices[0].delta.content is not None:
                        content = chunk.choices[0].delta.content
                        print(content, end="", flush=True)
                        answer += content
                print()  # 换行
            else:
                answer = f"抱歉， 工具 {tool_name}的调用被拒绝。"
        else:
            answer = llm_response

        #9.保存回答
        self.session.add_message(session_id, "assistant", answer)
        self.trace.log("response", {"session_id": session_id, "response": answer[:200] + "..."})

        return answer
    def _format_tools_for_llm(self) -> str:
        """格式化工具列表（给LLM看）"""
        tools = self.tools.list_tools()
        if not tools:
            return "暂无可用工具"

        result = []
        for tool in tools:
            result.append(f"- {tool['name']}: {tool['description']}")
            result.append(f"- 参数：{tool['parameters']}")

        return "\n".join(result)

    def _parse_tool_call(self, llm_response: str) -> dict | None:
        """解析 LLM返回的tool call"""
        try:
            # 尝试解析 JSON 格式的tool call
            # 简单实现： 查找 {...} 格式的内容
            json_match = re.search(r'\{.*\}', llm_response, re.DOTALL)

            if json_match:
                tool_call = json.loads(json_match.group())
                if "tool" in tool_call and "arguments" in tool_call:
                    return tool_call

            return None
        except:
            return None

#=====测试工具函数 ===
def calculate(expression: str) -> str:
    """计算数学表达式"""
    try:
        result = eval(expression)
        return str(result)
    except Exception as e:
        return f"计算错误：{e}"

def search(query: str) -> str:
    """搜索信息（模拟）"""
    return f"关于 '{query}' 的搜索结果：这是模拟的搜索结果。"

def get_time() -> str:
    """获取当前时间"""
    return datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")

#===  主函数，开始测试 ===
if __name__ == "__main__":
    print("=== Agent Harness Demo ===\n")

    #创建 harness
    harness = AgentHarness()

    #注册工具
    harness.register_tool(
        name="calculate",
        description="计算数学表达式",
        parameters={"expression": "数学表达式， 如 '2 +6 * 4 / 5'"},
        function=calculate,
    )

    harness.register_tool(
        name="search",
        description="搜索信息",
        parameters={"query": "搜索关键词"},
        function=search
    )

    harness.register_tool(
        name="get_time",
        description="获取当前时间",
        parameters={},
        function=get_time
    )

    #运行agent
    print("\n--- 测试 1: 计算 ---")
    harness.run("帮我计算 2 + 3 * 4")

    print("\n--- 测试 2: 搜索 ---")
    harness.run("搜索一下 Python 教程")

    print("\n--- 测试 3: 时间 ---")
    harness.run("现在几点了？")

    #打印追踪
    harness.trace.print_trace()

    #打印工具列表
    print("\n=== 已注册工具 ===")
    for tool in harness.tools.list_tools():
        print(f"  {tool['name']}: {tool['description']}")

    #打印会话信息
    print("\n=== 会话信息 ===")
    for session_id, messages in harness.session.sessions.items():
      print(f"  {session_id}: {len(messages)} 条消息")

