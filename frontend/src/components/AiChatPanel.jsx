import { useState, useRef, useEffect } from 'react';
import { Button, Input } from '@heroui/react';
import { PaperAirplaneIcon, XMarkIcon, SparklesIcon, BookOpenIcon } from '@heroicons/react/24/outline';

const SERVER_ORIGIN = 'https://good-luck-lct.icu';
const isNativeApp = typeof window !== 'undefined'
  && window.location.protocol === 'capacitor:';
const API_BASE = isNativeApp ? SERVER_ORIGIN + '/api' : '/api';

const S = {
  bg: 'bg-white dark:bg-gray-900',
  bgAlt: 'bg-gray-100 dark:bg-gray-800',
  text: 'text-gray-900 dark:text-gray-100',
  textSub: 'text-gray-500 dark:text-gray-400',
  textMuted: 'text-gray-400 dark:text-gray-500',
  border: 'border-gray-200 dark:border-gray-700',
  botBubble: 'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100',
  sourceCard: 'bg-gray-100 dark:bg-gray-700/50',
  suggestion: 'bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400',
  code: 'bg-gray-200 dark:bg-gray-700 px-1 py-0.5 rounded text-xs',
};

function AiChatPanel({ open, onClose, context, subject = 'english' }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  useEffect(() => {
    if (open && context && messages.length === 0) {
      const autoMsg = `请帮我讲解一下这个知识点：${context}`;
      sendMessage(autoMsg);
    }
  }, [open, context]);

  const sendMessage = async (textOverride) => {
    const text = (textOverride || input).trim();
    if (!text || loading) return;

    if (!textOverride) setInput('');
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
          subject,
          context: context || '',
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      setMessages(prev => [...prev, { role: 'assistant', content: '', suggestions: [], ragSources: [] }]);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let fullContent = '';
      let suggestions = [];
      let ragSources = [];

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
                updated[updated.length - 1] = { ...updated[updated.length - 1], content: fullContent };
                return updated;
              });
              if (data.session_id) setSessionId(data.session_id);
            } else if (data.type === 'done') {
              suggestions = data.suggestions || [];
              ragSources = data.rag_sources || [];
              if (data.content) fullContent = data.content;
              setMessages(prev => {
                const updated = [...prev];
                updated[updated.length - 1] = {
                  ...updated[updated.length - 1],
                  content: fullContent,
                  suggestions,
                  ragSources,
                  tokenUsage: data.token_usage,
                };
                return updated;
              });
            } else if (data.type === 'error') {
              setMessages(prev => {
                const updated = [...prev];
                updated[updated.length - 1] = {
                  ...updated[updated.length - 1],
                  content: `错误：${data.content}`,
                  suggestions: [],
                  ragSources: [],
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
          updated[updated.length - 1] = { ...updated[updated.length - 1], content: `连接失败：${err.message}` };
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

  const renderContent = (text) => {
    if (!text) return null;
    return text.split('\n').map((line, i) => {
      if (line.startsWith('### ')) return <h3 key={i} className="text-sm font-bold mt-2 mb-1">{line.slice(4)}</h3>;
      if (line.startsWith('## ')) return <h2 key={i} className="text-sm font-bold mt-2 mb-1">{line.slice(3)}</h2>;
      let processed = line;
      processed = processed.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
      processed = processed.replace(/\*(.+?)\*/g, '<em>$1</em>');
      processed = processed.replace(/`(.+?)`/g, `<code class="${S.code}">$1</code>`);
      if (line.startsWith('- ') || line.startsWith('* ')) {
        return <li key={i} className="ml-3 list-disc text-xs" dangerouslySetInnerHTML={{ __html: processed.slice(2) }} />;
      }
      if (/^\d+\.\s/.test(line)) {
        return <li key={i} className="ml-3 list-decimal text-xs" dangerouslySetInnerHTML={{ __html: processed.replace(/^\d+\.\s/, '') }} />;
      }
      if (line.trim() === '') return <br key={i} />;
      return <p key={i} className="text-xs" dangerouslySetInnerHTML={{ __html: processed }} />;
    });
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />

      <div className={`relative w-full max-w-lg h-[80vh] max-h-[600px] ${S.bg} rounded-t-3xl md:rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-slideUp`}>
        {/* 头部 */}
        <div className={`flex items-center justify-between px-4 py-3 border-b ${S.border} flex-shrink-0`}>
          <div className="flex items-center gap-2">
            <SparklesIcon className="w-4 h-4 text-blue-600" />
            <span className={`text-sm font-bold ${S.text}`}>AI 学习助手</span>
            {context && (
              <span className={`text-[10px] ${S.textSub} ${S.bgAlt} px-2 py-0.5 rounded-full max-w-[160px] truncate`}>
                {context}
              </span>
            )}
          </div>
          <Button isIconOnly size="sm" variant="ghost" onPress={onClose}>
            <XMarkIcon className="w-4 h-4 text-gray-500" />
          </Button>
        </div>

        {/* 消息 */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-0">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[90%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white rounded-br-md'
                  : `${S.botBubble} rounded-bl-md`
              }`}>
                {msg.role === 'user' ? (
                  <p className="whitespace-pre-wrap text-xs">{msg.content}</p>
                ) : (
                  <div className="[&_strong]:font-bold [&_em]:italic">
                    {renderContent(msg.content)}
                    {loading && i === messages.length - 1 && !msg.suggestions?.length && (
                      <span className="inline-block w-1.5 h-3 bg-gray-400 animate-pulse ml-0.5" />
                    )}

                    {msg.ragSources?.length > 0 && (
                      <div className={`mt-2 pt-2 border-t ${S.border}`}>
                        <p className={`text-[10px] ${S.textSub} mb-1 flex items-center gap-1`}>
                          <BookOpenIcon className="w-3 h-3" /> 引用来源
                        </p>
                        <div className="space-y-1">
                          {msg.ragSources.map((s, si) => (
                            <div key={si} className={`text-[10px] ${S.sourceCard} rounded-lg px-2 py-1.5`}>
                              <span className="text-blue-600 font-medium">[{s.index}]</span>
                              <span className={`${S.textSub} ml-1`}>{s.type}：</span>
                              <span className={`${S.text}`}>{s.title}</span>
                              <span className={`${S.textMuted} ml-1`}>({s.origin})</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {msg.suggestions?.length > 0 && (
                      <div className={`mt-2 pt-2 border-t ${S.border}`}>
                        <p className={`text-[10px] ${S.textSub} mb-1`}>你可能还想问：</p>
                        <div className="flex flex-wrap gap-1">
                          {msg.suggestions.map((s, si) => (
                            <button
                              key={si}
                              onClick={() => sendMessage(s)}
                              className={`text-[10px] px-2 py-1 rounded-lg ${S.suggestion} transition-colors`}
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {msg.tokenUsage && (
                      <div className={`mt-1 text-[9px] ${S.textMuted}`}>{msg.tokenUsage.total_tokens} tokens</div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* 输入 */}
        <div className={`flex-shrink-0 border-t ${S.border} px-3 py-2 pb-[max(8px,env(safe-area-inset-bottom,0px))]`}>
          <div className="flex gap-2 items-end">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="继续提问..."
              isDisabled={loading}
              size="sm"
              classNames={{ input: "text-xs", inputWrapper: `${S.bgAlt} rounded-xl min-h-[38px]` }}
            />
            <Button
              isIconOnly
              color="primary"
              size="sm"
              isDisabled={!input.trim() || loading}
              onPress={() => sendMessage()}
              className="rounded-xl flex-shrink-0"
            >
              <PaperAirplaneIcon className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-slideUp { animation: slideUp 0.3s ease-out; }
      `}</style>
    </div>
  );
}

export default AiChatPanel;
