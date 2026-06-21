"""
AI 模块配置

所有 AI 相关的配置集中管理，支持环境变量覆盖。
"""

import os

# LLM 配置（必须通过环境变量设置）
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY", "")
OPENAI_BASE_URL = os.environ.get("OPENAI_BASE_URL", "https://token-plan-cn.xiaomimimo.com/v1")
MODEL_NAME = os.environ.get("MODEL_NAME", "mimo-v2.5-pro")

# Agent Harness 配置
AI_MAX_TOOL_ROUNDS = int(os.environ.get("AI_MAX_TOOL_ROUNDS", "5"))

# RAG 配置
RAG_TOP_K = int(os.environ.get("RAG_TOP_K", "5"))
RAG_MIN_SCORE = float(os.environ.get("RAG_MIN_SCORE", "0.05"))

# Session 配置
SESSION_MAX_MESSAGES = int(os.environ.get("SESSION_MAX_MESSAGES", "50"))
SESSION_TTL_HOURS = int(os.environ.get("SESSION_TTL_HOURS", "24"))

# 腾讯云 COS 配置（必须通过环境变量设置）
COS_SECRET_ID = os.environ.get("COS_SECRET_ID", "")
COS_SECRET_KEY = os.environ.get("COS_SECRET_KEY", "")
COS_BUCKET = os.environ.get("COS_BUCKET", "tongxiao-1385409028")
COS_REGION = os.environ.get("COS_REGION", "ap-nanjing")

# 知识库管理 API Key（独立鉴权，不走 JWT）
KNOWLEDGE_ADMIN_KEY = os.environ.get("KNOWLEDGE_ADMIN_KEY", "tx-admin-kb-2026")

# FAISS 向量数据库目录
FAISS_DATA_DIR = os.environ.get(
    "FAISS_DATA_DIR",
    os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'data', 'faiss'),
)
