import { useState, useRef, useEffect } from 'react';
import { Button, Input } from '@heroui/react';
import { PaperAirplaneIcon, TrashIcon, SparklesIcon, ArrowUpTrayIcon, DocumentIcon, BookOpenIcon } from '@heroicons/react/24/outline';
import api, { uploadFile } from '../api';

const SERVER_ORIGIN = 'https://good-luck-lct.icu';
const isNativeApp = typeof window !== 'undefined'
  && window.location.protocol === 'capacitor:';
const API_BASE = isNativeApp ? SERVER_ORIGIN + '/api' : '/api';

const S = {
  bg: 'bg-white dark:bg-gray-900',
  bgAlt: 'bg-gray-100 dark:bg-gray-800',
  bgCard: 'bg-gray-50 dark:bg-gray-800',
  text: 'text-gray-900 dark:text-gray-100',
  textSub: 'text-gray-500 dark:text-gray-400',
  textMuted: 'text-gray-400 dark:text-gray-500',
  border: 'border-gray-200 dark:border-gray-700',
  userBubble: 'bg-blue-600 text-white',
  botBubble: 'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100',
  chip: 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
  btnGhost: 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200',
  code: 'bg-gray-200 dark:bg-gray-700 px-1 py-0.5 rounded text-sm',
  sourceCard: 'bg-gray-100 dark:bg-gray-700/50',
  suggestion: 'bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50',
};

function AiPage() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [totalTokens, setTotalTokens] = useState(0);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  const sendMessage = async (textOverride) => {
    const text = (textOverride || input).trim();
    if (!text || loading) return;

    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: text }]);
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      };

      const res = await fetch(API_BASE + '/ai/chat/stream', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          message: text,
          session_id: sessionId,
          subject: 'english',
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      setMessages(prev => [...prev, { role: 'assistant', content: '', suggestions: [], ragSources: [] }]);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let fullContent = '';
      let suggestions = [];
      let tokenUsage = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop();

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const data = JSON.parse(line.slice(6));
            if (data.type === 'token') {
              fullContent += data.content;
              setMessages(prev => {
                const updated = [...prev];
                updated[updated.length - 1] = { role: 'assistant', content: fullContent, suggestions: [] };
                return updated;
              });
              if (data.session_id) setSessionId(data.session_id);
            } else if (data.type === 'done') {
              suggestions = data.suggestions || [];
              tokenUsage = data.token_usage || null;
              const ragSources = data.rag_sources || [];
              if (data.content) fullContent = data.content;
              setMessages(prev => {
                const updated = [...prev];
                updated[updated.length - 1] = {
                  role: 'assistant',
                  content: fullContent,
                  suggestions,
                  tokenUsage,
                  ragSources,
                };
                return updated;
              });
              if (tokenUsage) setTotalTokens(prev => prev + (tokenUsage.total_tokens || 0));
            } else if (data.type === 'error') {
              setMessages(prev => {
                const updated = [...prev];
                updated[updated.length - 1] = {
                  role: 'assistant',
                  content: `抱歉，发生了错误：${data.content}`,
                  suggestions: [],
                };
                return updated;
              });
            }
          } catch {}
        }
      }
    } catch (err) {
      setMessages(prev => {
        const updated = [...prev];
        if (updated.length > 0 && updated[updated.length - 1].role === 'assistant' && !updated[updated.length - 1].content) {
          updated[updated.length - 1] = { role: 'assistant', content: `抱歉，连接失败：${err.message}`, suggestions: [] };
        } else {
          updated.push({ role: 'assistant', content: `抱歉，连接失败：${err.message}`, suggestions: [] });
        }
        return updated;
      });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    if (sessionId) {
      api('/ai/sessions/clear', {
        method: 'POST',
        body: JSON.stringify({ session_id: sessionId }),
      }).catch(() => {});
    }
    setMessages([]);
    setSessionId(null);
    setTotalTokens(0);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('subject', 'english');
      const result = await uploadFile('/ai/knowledge/upload', formData);
      setMessages(prev => [...prev, {
        role: 'system',
        content: `已上传知识库文档「${result.filename}」，共 ${result.chunk_count} 个分块，已向量化入库。`,
      }]);
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'system',
        content: `文件上传失败：${err.message}`,
      }]);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const renderContent = (text) => {
    if (!text) return null;
    return text.split('\n').map((line, i) => {
      if (line.startsWith('### ')) return <h3 key={i} className="text-sm font-bold mt-3 mb-1">{line.slice(4)}</h3>;
      if (line.startsWith('## ')) return <h2 key={i} className="text-base font-bold mt-3 mb-1">{line.slice(3)}</h2>;
      if (line.startsWith('# ')) return <h1 key={i} className="text-lg font-bold mt-3 mb-1">{line.slice(2)}</h1>;

      let processed = line;
      processed = processed.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
      processed = processed.replace(/\*(.+?)\*/g, '<em>$1</em>');
      processed = processed.replace(/`(.+?)`/g, `<code class="${S.code}">$1</code>`);

      if (line.startsWith('- ') || line.startsWith('* ')) {
        return <li key={i} className="ml-4 list-disc" dangerouslySetInnerHTML={{ __html: processed.slice(2) }} />;
      }
      if (/^\d+\.\s/.test(line)) {
        return <li key={i} className="ml-4 list-decimal" dangerouslySetInnerHTML={{ __html: processed.replace(/^\d+\.\s/, '') }} />;
      }
      if (line.trim() === '') return <br key={i} />;
      return <p key={i} dangerouslySetInnerHTML={{ __html: processed }} />;
    });
  };

  return (
    <div className={`flex flex-col h-full ${S.bg}`}>
      {/* 顶部栏 */}
      <div className={`flex items-center justify-between px-4 py-3 border-b ${S.border} ${S.bg} flex-shrink-0`}>
        <div className="flex items-center gap-2">
          <SparklesIcon className="w-5 h-5 text-blue-600" />
          <h2 className={`text-lg font-bold ${S.text}`}>AI 学习助手</h2>
          {totalTokens > 0 && (
            <span className={`text-xs ${S.textSub} ${S.chip} px-2 py-0.5 rounded-full`}>
              {totalTokens} tokens
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <input ref={fileInputRef} type="file" accept=".pdf,.docx,.txt,.md" onChange={handleFileUpload} className="hidden" />
          <Button isIconOnly size="sm" variant="ghost" onPress={() => fileInputRef.current?.click()} isDisabled={uploading} title="上传知识库文档">
            <ArrowUpTrayIcon className={`w-4 h-4 ${uploading ? 'text-blue-600 animate-pulse' : 'text-gray-500'}`} />
          </Button>
          {messages.length > 0 && (
            <Button isIconOnly size="sm" variant="ghost" onPress={clearChat} title="清空对话">
              <TrashIcon className="w-4 h-4 text-gray-500" />
            </Button>
          )}
        </div>
      </div>

      {/* 消息区域 */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 min-h-0">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <SparklesIcon className={`w-12 h-12 ${S.textMuted} mb-4`} />
            <h3 className={`text-lg font-semibold ${S.textSub} mb-2`}>AI 学习助手</h3>
            <p className={`text-sm ${S.textSub} max-w-xs`}>
              问我任何单词、知识点的问题，或者让我帮你出题练习。
              <br />
              <span className={`text-xs mt-2 block ${S.textMuted}`}>
                所有回答均基于知识库数据，确保准确可靠
              </span>
            </p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className={`mt-4 flex items-center gap-2 text-xs text-blue-600 bg-blue-50 dark:bg-blue-900/30 px-4 py-2 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors`}
            >
              <DocumentIcon className="w-4 h-4" />
              上传电子书到知识库（PDF/DOCX/TXT）
            </button>
            <div className="grid grid-cols-2 gap-2 mt-6 w-full max-w-sm">
              {['abandon 是什么意思？', '帮我出5道填空题', '我今天学了多少单词？', '考研英语高频词汇'].map((q) => (
                <button
                  key={q}
                  onClick={() => { setInput(q); inputRef.current?.focus(); }}
                  className={`text-left text-xs p-3 rounded-xl ${S.bgAlt} hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors ${S.textSub}`}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : msg.role === 'system' ? 'justify-center' : 'justify-start'}`}>
            {msg.role === 'system' ? (
              <div className={`text-xs ${S.textSub} ${S.bgAlt} px-3 py-1.5 rounded-full flex items-center gap-1.5`}>
                <DocumentIcon className="w-3.5 h-3.5" />
                {msg.content}
              </div>
            ) : (
              <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                msg.role === 'user'
                  ? `${S.userBubble} rounded-br-md`
                  : `${S.botBubble} rounded-bl-md`
              }`}>
                {msg.role === 'user' ? (
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                ) : (
                  <div className="prose-sm max-w-none [&_strong]:font-bold [&_em]:italic">
                    {renderContent(msg.content)}
                    {loading && i === messages.length - 1 && !msg.suggestions?.length && (
                      <span className="inline-block w-1.5 h-4 bg-gray-400 animate-pulse ml-0.5" />
                    )}
                    {msg.suggestions?.length > 0 && (
                      <div className={`mt-3 pt-3 border-t ${S.border}`}>
                        <p className={`text-xs ${S.textSub} mb-2`}>你可能还想问：</p>
                        <div className="flex flex-wrap gap-1.5">
                          {msg.suggestions.map((s, si) => (
                            <button key={si} onClick={() => sendMessage(s)}
                              className={`text-xs px-3 py-1.5 rounded-lg ${S.suggestion} transition-colors`}>
                              {s}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    {msg.ragSources?.length > 0 && (
                      <div className={`mt-3 pt-3 border-t ${S.border}`}>
                        <p className={`text-xs ${S.textSub} mb-2 flex items-center gap-1`}>
                          <BookOpenIcon className="w-3.5 h-3.5" /> 引用来源
                        </p>
                        <div className="space-y-1.5">
                          {msg.ragSources.map((s, si) => (
                            <div key={si} className={`text-xs ${S.sourceCard} rounded-lg px-2.5 py-2`}>
                              <span className="text-blue-600 font-medium">[{s.index}]</span>
                              <span className={`${S.textSub} ml-1`}>{s.type}：</span>
                              <span className={`${S.text} font-medium`}>{s.title}</span>
                              <span className={`${S.textMuted} ml-1`}>({s.origin})</span>
                              {s.detail && <p className={`${S.textMuted} mt-0.5 truncate`}>{s.detail}</p>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {msg.tokenUsage && (
                      <div className={`mt-2 text-[10px] ${S.textMuted}`}>{msg.tokenUsage.total_tokens} tokens</div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* 输入区域 */}
      <div className={`flex-shrink-0 border-t ${S.border} ${S.bg} px-4 py-3 pb-[max(12px,env(safe-area-inset-bottom,0px))]`}>
        <div className="flex gap-2 items-end">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="问我任何学习问题..."
            isDisabled={loading}
            classNames={{ input: "text-sm", inputWrapper: `${S.bgAlt} rounded-2xl min-h-[44px]` }}
          />
          <Button isIconOnly color="primary" isDisabled={!input.trim() || loading}
            onPress={() => sendMessage()} className="rounded-2xl flex-shrink-0" size="lg">
            <PaperAirplaneIcon className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export default AiPage;
