"""
知识库管理后台 — 独立页面

通过 API Key 鉴权，不走用户 JWT。
路径：/admin/knowledge?key=tx-admin-kb-2026
"""

import json
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Request
from fastapi.responses import HTMLResponse
from .config import KNOWLEDGE_ADMIN_KEY
from .harness import AgentHarness

router = APIRouter(prefix="/admin", tags=["Admin"])

_harness: AgentHarness | None = None


def get_harness() -> AgentHarness:
    global _harness
    if _harness is None:
        _harness = AgentHarness()
    return _harness


def _verify_api_key(request: Request):
    """API Key 鉴权：从 query 或 header 中获取"""
    key = request.query_params.get("key", "") or request.headers.get("X-API-Key", "")
    if key != KNOWLEDGE_ADMIN_KEY:
        raise HTTPException(403, "无效的 API Key")
    return True


@router.get("/knowledge", response_class=HTMLResponse)
async def admin_knowledge_page(request: Request, key: str = ""):
    """知识库管理页面（需要 API Key）"""
    if key != KNOWLEDGE_ADMIN_KEY:
        raise HTTPException(403, "无效的 API Key")
    return ADMIN_HTML


@router.post("/api/knowledge/upload")
async def admin_upload(
    request: Request,
    file: UploadFile = File(...),
    subject: str = Form("english"),
    _: bool = Depends(_verify_api_key),
):
    filename = file.filename
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    allowed = {"pdf", "docx", "txt", "md"}
    if ext not in allowed:
        raise HTTPException(400, f"不支持的文件格式: .{ext}，支持: {', '.join(allowed)}")
    content = await file.read()
    if len(content) > 50 * 1024 * 1024:
        raise HTTPException(400, "文件大小不能超过 50MB")
    result = get_harness().knowledge.process_file(content, filename, subject, user_id=0)
    if "error" in result:
        raise HTTPException(400, result["error"])
    return result


@router.get("/api/knowledge/documents")
async def admin_documents(
    request: Request,
    subject: str = "",
    _: bool = Depends(_verify_api_key),
):
    return get_harness().knowledge.get_documents(subject=subject)


@router.delete("/api/knowledge/documents/{doc_id}")
async def admin_delete_document(
    doc_id: int,
    request: Request,
    subject: str = "english",
    _: bool = Depends(_verify_api_key),
):
    get_harness().knowledge.delete_document(doc_id, subject)
    return {"ok": True}


@router.get("/api/knowledge/search")
async def admin_search(
    request: Request,
    query: str = "",
    subject: str = "english",
    _: bool = Depends(_verify_api_key),
):
    if not query.strip():
        raise HTTPException(400, "搜索词不能为空")
    return get_harness().knowledge.search_chunks(query, subject)


# ==================== 独立 HTML 页面 ====================

ADMIN_HTML = """<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>TongXiao - 知识库管理</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f5f5f5;color:#1a1a2e;min-height:100vh}
.header{background:linear-gradient(135deg,#4A90D9,#006FEE);color:#fff;padding:20px 32px;display:flex;align-items:center;justify-content:space-between}
.header h1{font-size:20px;font-weight:700}
.header .subtitle{font-size:12px;opacity:.8;margin-top:2px}
.container{max-width:900px;margin:24px auto;padding:0 16px}
.card{background:#fff;border-radius:12px;padding:24px;margin-bottom:16px;box-shadow:0 1px 3px rgba(0,0,0,.08)}
.card h2{font-size:16px;font-weight:600;margin-bottom:16px;display:flex;align-items:center;gap:8px}
.card h2 .icon{font-size:20px}
.upload-zone{border:2px dashed #d0d5dd;border-radius:12px;padding:40px;text-align:center;cursor:pointer;transition:all .2s}
.upload-zone:hover,.upload-zone.dragover{border-color:#4A90D9;background:#f0f7ff}
.upload-zone p{color:#667085;font-size:14px;margin-top:8px}
.upload-zone .formats{font-size:12px;color:#98a2b3;margin-top:4px}
input[type=file]{display:none}
select,input[type=text]{width:100%;padding:10px 12px;border:1px solid #d0d5dd;border-radius:8px;font-size:14px;outline:none;transition:border-color .2s}
select:focus,input[type=text]:focus{border-color:#4A90D9}
.form-row{display:flex;gap:12px;margin-bottom:12px;align-items:end}
.form-row label{font-size:12px;color:#667085;margin-bottom:4px;display:block}
.form-group{flex:1}
.btn{padding:10px 20px;border:none;border-radius:8px;font-size:14px;font-weight:500;cursor:pointer;transition:all .2s}
.btn-primary{background:#4A90D9;color:#fff}
.btn-primary:hover{background:#3a7bc8}
.btn-primary:disabled{background:#b0c4de;cursor:not-allowed}
.btn-danger{background:#ff4d4f;color:#fff}
.btn-danger:hover{background:#e03e3f}
.btn-sm{padding:6px 12px;font-size:12px}
.doc-list{list-style:none}
.doc-item{display:flex;align-items:center;justify-content:space-between;padding:12px 0;border-bottom:1px solid #f0f0f0}
.doc-item:last-child{border-bottom:none}
.doc-info{flex:1;min-width:0}
.doc-name{font-size:14px;font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.doc-meta{font-size:12px;color:#98a2b3;margin-top:2px}
.empty{text-align:center;padding:32px;color:#98a2b3;font-size:14px}
.progress{margin-top:12px}
.progress-bar{height:4px;background:#e5e7eb;border-radius:2px;overflow:hidden}
.progress-fill{height:100%;background:#4A90D9;border-radius:2px;transition:width .3s}
.toast{position:fixed;top:20px;right:20px;padding:12px 20px;border-radius:8px;font-size:14px;color:#fff;z-index:999;animation:slideIn .3s ease}
.toast-success{background:#52c41a}
.toast-error{background:#ff4d4f}
@keyframes slideIn{from{transform:translateX(100%);opacity:0}to{transform:translateX(0);opacity:1}}
.search-results{margin-top:16px}
.search-hit{padding:12px;background:#f9fafb;border-radius:8px;margin-bottom:8px;font-size:13px;line-height:1.6}
.search-hit .source{font-size:11px;color:#4A90D9;margin-bottom:4px}
</style>
</head>
<body>
<div class="header">
  <div>
    <h1>TongXiao 知识库管理</h1>
    <div class="subtitle">上传电子书 → 自动提取 → 分块 → 向量化 → 入库</div>
  </div>
</div>

<div class="container">
  <!-- 上传区 -->
  <div class="card">
    <h2><span class="icon">📚</span> 上传知识库文档</h2>
    <div class="form-row">
      <div class="form-group">
        <label>科目</label>
        <select id="subject">
          <option value="english">考研英语</option>
          <option value="polit">考研政治</option>
        </select>
      </div>
    </div>
    <div class="upload-zone" id="dropZone" onclick="document.getElementById('fileInput').click()">
      <div style="font-size:36px">📄</div>
      <p>点击或拖拽文件到此处上传</p>
      <div class="formats">支持 PDF / DOCX / TXT / MD，最大 50MB</div>
    </div>
    <input type="file" id="fileInput" accept=".pdf,.docx,.txt,.md" onchange="handleFile(this.files[0])">
    <div class="progress" id="progress" style="display:none">
      <div class="progress-bar"><div class="progress-fill" id="progressFill" style="width:0%"></div></div>
      <div style="font-size:12px;color:#667085;margin-top:4px" id="progressText">上传中...</div>
    </div>
  </div>

  <!-- 文档列表 -->
  <div class="card">
    <h2><span class="icon">📋</span> 已入库文档</h2>
    <ul class="doc-list" id="docList"><li class="empty">加载中...</li></ul>
  </div>

  <!-- 语义搜索测试 -->
  <div class="card">
    <h2><span class="icon">🔍</span> 语义搜索测试</h2>
    <div class="form-row">
      <div class="form-group">
        <input type="text" id="searchQuery" placeholder="输入关键词测试向量检索..." onkeydown="if(event.key==='Enter')doSearch()">
      </div>
      <button class="btn btn-primary" onclick="doSearch()">搜索</button>
    </div>
    <div class="search-results" id="searchResults"></div>
  </div>
</div>

<script>
const API_KEY = new URLSearchParams(window.location.search).get('key');
const BASE = '/admin';

function headers(json) {
  const h = { 'X-API-Key': API_KEY };
  if (json) h['Content-Type'] = 'application/json';
  return h;
}

function toast(msg, type='success') {
  const el = document.createElement('div');
  el.className = 'toast toast-' + type;
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3000);
}

// 拖拽
const dz = document.getElementById('dropZone');
dz.addEventListener('dragover', e => { e.preventDefault(); dz.classList.add('dragover'); });
dz.addEventListener('dragleave', () => dz.classList.remove('dragover'));
dz.addEventListener('drop', e => { e.preventDefault(); dz.classList.remove('dragover'); handleFile(e.dataTransfer.files[0]); });

async function handleFile(file) {
  if (!file) return;
  const subject = document.getElementById('subject').value;
  const fd = new FormData();
  fd.append('file', file);
  fd.append('subject', subject);

  const prog = document.getElementById('progress');
  const fill = document.getElementById('progressFill');
  const text = document.getElementById('progressText');
  prog.style.display = 'block';
  fill.style.width = '30%';
  text.textContent = '上传并处理中...';

  try {
    const res = await fetch(BASE + '/api/knowledge/upload?key=' + API_KEY, {
      method: 'POST', body: fd,
    });
    fill.style.width = '90%';
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || '上传失败');
    fill.style.width = '100%';
    text.textContent = '完成！';
    toast('上传成功: ' + data.filename + '，' + data.chunk_count + ' 个分块已入库');
    setTimeout(() => { prog.style.display = 'none'; fill.style.width = '0%'; }, 2000);
    loadDocs();
  } catch (e) {
    toast(e.message, 'error');
    prog.style.display = 'none';
  }
}

async function loadDocs() {
  const subject = document.getElementById('subject').value;
  try {
    const res = await fetch(BASE + '/api/knowledge/documents?subject=' + subject + '&key=' + API_KEY, { headers: headers() });
    const docs = await res.json();
    const list = document.getElementById('docList');
    if (!docs.length) { list.innerHTML = '<li class="empty">暂无文档</li>'; return; }
    list.innerHTML = docs.map(d => `
      <li class="doc-item">
        <div class="doc-info">
          <div class="doc-name">📄 ${d.filename}</div>
          <div class="doc-meta">${d.file_type.toUpperCase()} · ${d.chunk_count} 个分块 · ${d.created_at || ''}</div>
        </div>
        <button class="btn btn-danger btn-sm" onclick="deleteDoc(${d.id})">删除</button>
      </li>
    `).join('');
  } catch (e) { console.error(e); }
}

async function deleteDoc(id) {
  if (!confirm('确定删除此文档？')) return;
  const subject = document.getElementById('subject').value;
  try {
    const res = await fetch(BASE + '/api/knowledge/documents/' + id + '?subject=' + subject + '&key=' + API_KEY, { method: 'DELETE', headers: headers() });
    if (!res.ok) throw new Error('删除失败');
    toast('已删除');
    loadDocs();
  } catch (e) { toast(e.message, 'error'); }
}

async function doSearch() {
  const q = document.getElementById('searchQuery').value.trim();
  if (!q) return;
  const subject = document.getElementById('subject').value;
  try {
    const res = await fetch(BASE + '/api/knowledge/search?query=' + encodeURIComponent(q) + '&subject=' + subject + '&key=' + API_KEY, { headers: headers() });
    const results = await res.json();
    const el = document.getElementById('searchResults');
    if (!results.length) { el.innerHTML = '<div class="empty">未找到相关内容</div>'; return; }
    el.innerHTML = results.map(r => `
      <div class="search-hit">
        <div class="source">📎 ${r.filename || '知识库'} (chunk #${r.chunk_index}) · score: ${(r.score || 0).toFixed(3)}</div>
        <div>${(r.text || '').substring(0, 300)}${(r.text||'').length > 300 ? '...' : ''}</div>
      </div>
    `).join('');
  } catch (e) { toast(e.message, 'error'); }
}

document.getElementById('subject').addEventListener('change', loadDocs);
loadDocs();
</script>
</body>
</html>"""
