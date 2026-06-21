"""
Agent Harness — AI 核心调度器

职责：
1. 整合 LLM、RAG、工具、会话、Token 统计
2. 处理用户消息：RAG 检索 → LLM → 工具调用 → 推荐提问
3. 反幻觉：知识库数据约束 LLM 输出
"""

import json
import logging
import re

from openai import OpenAI

from .config import (
    OPENAI_API_KEY, OPENAI_BASE_URL, MODEL_NAME,
    AI_MAX_TOOL_ROUNDS, RAG_TOP_K, RAG_MIN_SCORE,
    SESSION_MAX_MESSAGES, SESSION_TTL_HOURS,
)
from .rag import RAGEngine
from .knowledge_base import KnowledgeBase
from .token_counter import TokenCounter
from .tools.base import ToolRegistry
from .tools.knowledge import KnowledgeSearchTool
from .tools.quiz import QuizGenerateTool
from .tools.study import StudyAssistantTool
from .tools.stats import StudyStatsTool
from .middleware.session import SessionStore
from .middleware.trace import Trace
from .middleware.permission import PermissionGate
from .prompts.templates import SYSTEM_PROMPT, RAG_CONTEXT_TEMPLATE

logger = logging.getLogger("ai.harness")


class AgentHarness:
    """
    Agent Harness：AI 核心调度器。

    流程：用户消息 → RAG → prompt 构建 → LLM → 工具循环 → 解析推荐 → Token 统计
    """

    def __init__(self):
        self.client = OpenAI(api_key=OPENAI_API_KEY, base_url=OPENAI_BASE_URL)
        self.model = MODEL_NAME

        self.rag = RAGEngine(top_k=RAG_TOP_K, min_score=RAG_MIN_SCORE)
        self.knowledge = KnowledgeBase()
        self.token_counter = TokenCounter()
        self.tools = ToolRegistry()
        self.sessions = SessionStore(
            max_messages=SESSION_MAX_MESSAGES,
            ttl_hours=SESSION_TTL_HOURS,
        )
        self.permission = PermissionGate()

        self._register_tools()

    def _register_tools(self):
        self.tools.register(KnowledgeSearchTool())
        self.tools.register(QuizGenerateTool())
        self.tools.register(StudyAssistantTool())
        self.tools.register(StudyStatsTool())
        logger.info(f"已注册 {len(self.tools.list_schemas())} 个工具")

    def _format_tools_for_llm(self) -> str:
        schemas = self.tools.list_schemas()
        if not schemas:
            return "暂无可用工具"
        lines = []
        for t in schemas:
            lines.append(f"- {t['name']}: {t['description']}")
            if t['parameters']:
                params_desc = ", ".join(f"{k}({v})" for k, v in t['parameters'].items())
                lines.append(f"  参数: {params_desc}")
        return "\n".join(lines)

    def _parse_tool_call(self, llm_response: str) -> dict | None:
        try:
            json_match = re.search(
                r'\{[^{}]*"tool"\s*:\s*"[^"]+?"[^{}]*\}', llm_response, re.DOTALL)
            if json_match:
                tc = json.loads(json_match.group())
                if "tool" in tc and "arguments" in tc:
                    return tc
        except (json.JSONDecodeError, Exception):
            pass
        return None

    def _parse_suggestions(self, response: str) -> tuple[str, list[str]]:
        """从 LLM 回答中解析推荐提问"""
        match = re.search(r'---SUGGESTIONS---\s*\n(.*?)(?:\n\n|\Z)', response, re.DOTALL)
        if not match:
            return response, []
        main_answer = response[:match.start()].strip()
        suggestions = re.findall(r'\d+\.\s*(.+)', match.group(1))
        return main_answer, [s.strip() for s in suggestions[:3]]

    def _build_system_prompt(self, rag_context: str) -> str:
        """构建完整的系统提示"""
        system_msg = SYSTEM_PROMPT
        if rag_context:
            system_msg += RAG_CONTEXT_TEMPLATE.format(context=rag_context)

        tools_desc = self._format_tools_for_llm()
        system_msg += f"\n\n## 可用工具\n{tools_desc}\n"
        system_msg += (
            "\n## 工具调用格式\n"
            '如果需要使用工具，请输出以下格式：\n'
            '{"tool":"工具名", "arguments":{"参数名":"参数值"}}\n'
            "只输出一个 JSON 对象，不要输出多余内容。\n"
        )
        return system_msg

    # ==================== 非流式对话 ====================

    def chat(self, user_message: str, user_id: int, session_id: str | None = None,
             subject: str = "english", context: str = "") -> dict:
        session_id = self.sessions.create_session(user_id, session_id)
        trace = Trace(session_id)
        trace.log("user_message", {"message": user_message, "user_id": user_id})

        # RAG 检索（结合卡片上下文扩展查询）
        rag_query = f"{context} {user_message}".strip() if context else user_message
        rag_results = self.rag.retrieve(rag_query, subject)
        rag_context = self.rag.format_context(rag_results) if rag_results else ""
        trace.log("rag_retrieval", {"results_count": len(rag_results)})

        # 构建 prompt
        system_msg = self._build_system_prompt(rag_context)

        self.sessions.add_message(session_id, "user", user_message)
        history = self.sessions.get_messages(session_id)

        messages = [{"role": "system", "content": system_msg}]
        for msg in history[-10:]:
            messages.append({"role": msg["role"], "content": msg["content"]})

        # LLM 调用
        trace.log("llm_call", {"round": 1, "message_count": len(messages)})
        llm_response = self._call_llm(messages)
        trace.log("llm_response", {"round": 1, "response": llm_response[:300]})

        # 工具调用循环
        final_answer = llm_response
        for round_num in range(AI_MAX_TOOL_ROUNDS):
            tool_call = self._parse_tool_call(llm_response)
            if not tool_call:
                break

            tool_name = tool_call["tool"]
            arguments = tool_call.get("arguments", {})
            trace.log("tool_call_parsed", {"tool": tool_name, "arguments": arguments})

            if not self.permission.check(tool_name, arguments):
                final_answer = f"工具 {tool_name} 的调用被拒绝。"
                break

            tool_result = self.tools.call(tool_name, arguments)
            trace.log("tool_result", {"tool": tool_name, "result": tool_result[:300]})

            messages.append({"role": "assistant", "content": llm_response})
            messages.append({
                "role": "user",
                "content": f"工具 {tool_name} 的返回结果：\n{tool_result}\n\n请根据这个结果回答用户的问题。",
            })

            llm_response = self._call_llm(messages)
            trace.log("llm_response", {"round": round_num + 2, "response": llm_response[:300]})
            final_answer = llm_response

        # 解析推荐提问
        answer_text, suggestions = self._parse_suggestions(final_answer)

        # Token 统计
        token_usage = self.token_counter.count_message(
            session_id, user_message, system_msg, rag_context, answer_text,
        )
        trace.log("token_usage", token_usage)

        # 保存回答
        self.sessions.add_message(session_id, "assistant", answer_text)
        trace.log("response", {"answer": answer_text[:300]})

        # 构建 RAG 来源引用
        rag_sources = self._build_rag_sources(rag_results)

        return {
            "answer": answer_text,
            "suggestions": suggestions,
            "token_usage": token_usage,
            "session_id": session_id,
            "rag_used": bool(rag_context),
            "rag_results_count": len(rag_results),
            "rag_sources": rag_sources,
        }

    # ==================== 流式对话 ====================

    def chat_stream(self, user_message: str, user_id: int, session_id: str | None = None,
                    subject: str = "english", context: str = ""):
        session_id = self.sessions.create_session(user_id, session_id)
        trace = Trace(session_id)

        rag_query = f"{context} {user_message}".strip() if context else user_message
        rag_results = self.rag.retrieve(rag_query, subject)
        rag_context = self.rag.format_context(rag_results) if rag_results else ""

        system_msg = self._build_system_prompt(rag_context)

        self.sessions.add_message(session_id, "user", user_message)
        history = self.sessions.get_messages(session_id)

        messages = [{"role": "system", "content": system_msg}]
        for msg in history[-10:]:
            messages.append({"role": msg["role"], "content": msg["content"]})

        try:
            response = self.client.chat.completions.create(
                model=self.model, messages=messages, stream=True,
            )

            full_response = ""
            for chunk in response:
                if chunk.choices and chunk.choices[0].delta.content is not None:
                    token = chunk.choices[0].delta.content
                    full_response += token
                    yield {"type": "token", "content": token, "session_id": session_id}

            # 工具调用
            tool_call = self._parse_tool_call(full_response)
            if tool_call:
                tool_result = self.tools.call(tool_call["tool"], tool_call.get("arguments", {}))
                messages.append({"role": "assistant", "content": full_response})
                messages.append({
                    "role": "user",
                    "content": f"工具 {tool_call['tool']} 的返回结果：\n{tool_result}\n\n请根据这个结果回答用户的问题。",
                })

                response2 = self.client.chat.completions.create(
                    model=self.model, messages=messages, stream=True,
                )
                full_response = ""
                for chunk in response2:
                    if chunk.choices and chunk.choices[0].delta.content is not None:
                        token = chunk.choices[0].delta.content
                        full_response += token
                        yield {"type": "token", "content": token, "session_id": session_id}

            # 解析推荐 + Token 统计
            answer_text, suggestions = self._parse_suggestions(full_response)
            token_usage = self.token_counter.count_message(
                session_id, user_message, system_msg, rag_context, answer_text,
            )
            self.sessions.add_message(session_id, "assistant", answer_text)

            rag_sources = self._build_rag_sources(rag_results)

            yield {
                "type": "done",
                "content": answer_text,
                "suggestions": suggestions,
                "token_usage": token_usage,
                "session_id": session_id,
                "rag_sources": rag_sources,
            }

        except Exception as e:
            logger.error(f"流式 LLM 调用失败: {e}")
            yield {"type": "error", "content": str(e), "session_id": session_id}

    # ==================== RAG 来源引用 ====================

    def _build_rag_sources(self, rag_results: list[dict]) -> list[dict]:
        """将 RAG 检索结果转为前端可展示的来源引用列表"""
        sources = []
        for i, r in enumerate(rag_results, 1):
            if r.get("source") == "knowledge_item":
                sources.append({
                    "index": i,
                    "type": "词条",
                    "title": r.get("front", ""),
                    "detail": r.get("back", ""),
                    "origin": "知识库",
                })
            else:
                sources.append({
                    "index": i,
                    "type": "文档",
                    "title": r.get("filename", "未知文档"),
                    "detail": (r.get("text", "") or "")[:200],
                    "origin": f"文档第 {r.get('chunk_index', 0) + 1} 段",
                })
        return sources

    # ==================== LLM 调用 ====================

    def _call_llm(self, messages: list[dict]) -> str:
        try:
            response = self.client.chat.completions.create(
                model=self.model, messages=messages, stream=False,
            )
            return response.choices[0].message.content or ""
        except Exception as e:
            logger.error(f"LLM 调用失败: {e}")
            return f"抱歉，AI 服务暂时不可用，请稍后再试。错误信息：{e}"

    # ==================== 会话管理 ====================

    def get_session_history(self, session_id: str) -> list[dict]:
        return self.sessions.get_messages(session_id)

    def clear_session(self, session_id: str):
        self.sessions.clear_session(session_id)

    def get_token_usage(self, session_id: str) -> dict:
        return self.token_counter.get_session_usage(session_id)
