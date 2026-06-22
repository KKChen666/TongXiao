import { useState, useRef, useEffect } from 'react';
import { PaperAirplaneIcon, TrashIcon, SparklesIcon, BookOpenIcon } from '@heroicons/react/24/outline';
import { useAiChat } from '../hooks/useAiChat';
import { markdownToSafeHtml } from '../utils/sanitize';

const S = {
  bg: 'bg-white dark:bg-gray-900',
  bgAlt: 'bg-gray-100 dark:bg-gray-800',
  text: 'text-gray-900 dark:text-gray-100',
  textSub: 'text-gray-500 dark:text-gray-400',
  textMuted: 'text-gray-400 dark:text-gray-500',
  border: 'border-gray-200 dark:border-gray-700',
  userBubble: 'bg-blue-600 text-white',
  botBubble: 'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100',
  chip: 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
  code: 'bg-gray-200 dark:bg-gray-700 px-1 py-0.5 rounded text-sm',
  sourceCard: 'bg-gray-100 dark:bg-gray-700/50',
  suggestion: 'bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50',
};

function AiPage() {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const { messages, loading, totalTokens, sendMessage, clearChat } = useAiChat({ subject: 'english' });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSend = () => {
    if (!input.trim() || loading) return;
    sendMessage(input);
    setInput('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const renderContent = (text) => {
    if (!text) return null;
    return text.split('\n').map((line, i) => {
      if (line.startsWith('### ')) return <h3 key={i} className="text-sm font-bold mt-3 mb-1">{line.slice(4)}</h3>;
      if (line.startsWith('## ')) return <h2 key={i} className="text-base font-bold mt-3 mb-1">{line.slice(3)}</h2>;
      if (line.startsWith('# ')) return <h1 key={i} className="text-lg font-bold mt-3 mb-1">{line.slice(2)}</h1>;

      const processed = markdownToSafeHtml(line);

      if (line.startsWith('- ') || line.startsWith('* ')) {
        return <li key={i} className="ml-4 list-disc" dangerouslySetInnerHTML={{ __html: markdownToSafeHtml(line.slice(2)) }} />;
      }
      if (/^\d+\.\s/.test(line)) {
        return <li key={i} className="ml-4 list-decimal" dangerouslySetInnerHTML={{ __html: markdownToSafeHtml(line.replace(/^\d+\.\s/, '')) }} />;
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
        {messages.length > 0 && (
          <button
            onClick={clearChat}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            title="清空对话"
          >
            <TrashIcon className="w-4 h-4 text-gray-500" />
          </button>
        )}
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
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
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
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* 输入区域 */}
      <div className={`flex-shrink-0 border-t ${S.border} ${S.bg} px-4 py-3 pb-[max(12px,env(safe-area-inset-bottom,0px))]`}>
        <div className="flex gap-2 items-end">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="问我任何学习问题..."
            disabled={loading}
            className={`flex-1 text-sm ${S.bgAlt} rounded-2xl min-h-[44px] px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500/20 transition-shadow`}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="w-11 h-11 bg-blue-600 text-white rounded-2xl flex items-center justify-center hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
          >
            <PaperAirplaneIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default AiPage;
