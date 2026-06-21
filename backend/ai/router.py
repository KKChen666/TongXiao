"""
AI API 路由

提供 AI 对话、知识库管理、Token 统计等 REST 接口。
"""

import json
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from auth import get_current_user_id
from .harness import AgentHarness

router = APIRouter(prefix="/api/ai", tags=["AI"])

_harness: AgentHarness | None = None


def get_harness() -> AgentHarness:
    global _harness
    if _harness is None:
        _harness = AgentHarness()
    return _harness


class ChatBody(BaseModel):
    message: str
    session_id: str | None = None
    subject: str = "english"
    context: str = ""  # 当前卡片上下文（front/back等），辅助 RAG


class SessionClearBody(BaseModel):
    session_id: str


# ==================== AI 对话 ====================

@router.post("/chat")
def ai_chat(body: ChatBody, user_id: int = Depends(get_current_user_id)):
    """AI 对话（非流式）"""
    if not body.message.strip():
        raise HTTPException(400, "消息不能为空")
    return get_harness().chat(
        user_message=body.message, user_id=user_id,
        session_id=body.session_id, subject=body.subject,
        context=body.context,
    )


@router.post("/chat/stream")
async def ai_chat_stream(body: ChatBody, user_id: int = Depends(get_current_user_id)):
    """AI 流式对话（SSE）"""
    if not body.message.strip():
        raise HTTPException(400, "消息不能为空")
    harness = get_harness()

    def event_generator():
        for chunk in harness.chat_stream(
            user_message=body.message, user_id=user_id,
            session_id=body.session_id, subject=body.subject,
            context=body.context,
        ):
            yield f"data: {json.dumps(chunk, ensure_ascii=False)}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "Connection": "keep-alive", "X-Accel-Buffering": "no"},
    )


# ==================== 会话管理 ====================

@router.get("/sessions/{session_id}/history")
def ai_session_history(session_id: str, user_id: int = Depends(get_current_user_id)):
    """获取会话历史"""
    return {"session_id": session_id, "messages": get_harness().get_session_history(session_id)}


@router.post("/sessions/clear")
def ai_clear_session(body: SessionClearBody, user_id: int = Depends(get_current_user_id)):
    """清除会话"""
    get_harness().clear_session(body.session_id)
    return {"ok": True}


@router.get("/sessions/{session_id}/tokens")
def ai_session_tokens(session_id: str, user_id: int = Depends(get_current_user_id)):
    """获取会话 Token 使用统计"""
    return get_harness().get_token_usage(session_id)


# ==================== 知识库管理 ====================

@router.post("/knowledge/upload")
async def ai_knowledge_upload(
    file: UploadFile = File(...),
    subject: str = Form("english"),
    user_id: int = Depends(get_current_user_id),
):
    """上传电子书到知识库（PDF/DOCX/TXT），自动提取、分块、向量化、上传 COS"""
    filename = file.filename
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    allowed = {"pdf", "docx", "txt", "md"}
    if ext not in allowed:
        raise HTTPException(400, f"不支持的文件格式: .{ext}，支持: {', '.join(allowed)}")

    content = await file.read()
    if len(content) > 50 * 1024 * 1024:
        raise HTTPException(400, "文件大小不能超过 50MB")

    result = get_harness().knowledge.process_file(content, filename, subject, user_id)
    if "error" in result:
        raise HTTPException(400, result["error"])
    return result


@router.get("/knowledge/documents")
def ai_knowledge_documents(
    subject: str = "",
    user_id: int = Depends(get_current_user_id),
):
    """获取已上传的知识库文档列表"""
    return get_harness().knowledge.get_documents(subject=subject, user_id=user_id)


@router.delete("/knowledge/documents/{doc_id}")
def ai_knowledge_delete(doc_id: int, subject: str = "english",
                        user_id: int = Depends(get_current_user_id)):
    """删除知识库文档及其分块"""
    get_harness().knowledge.delete_document(doc_id, subject)
    return {"ok": True}


@router.get("/knowledge/search")
def ai_knowledge_search(
    query: str = "",
    subject: str = "english",
    user_id: int = Depends(get_current_user_id),
):
    """在知识库文档分块中语义搜索"""
    if not query.strip():
        raise HTTPException(400, "搜索词不能为空")
    return get_harness().knowledge.search_chunks(query, subject)
