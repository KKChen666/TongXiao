import { useState, useRef, useCallback, useEffect } from 'react';
import { API_BASE } from '../api';

/**
 * Custom hook for AI chat with SSE streaming support
 * Handles AbortController, throttled updates, and proper cleanup
 */
export function useAiChat({ subject = 'english', context = '' } = {}) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [totalTokens, setTotalTokens] = useState(0);

  const abortControllerRef = useRef(null);
  const rafIdRef = useRef(null);
  const pendingContentRef = useRef(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, []);

  const flushPendingContent = useCallback(() => {
    if (pendingContentRef.current !== null) {
      const content = pendingContentRef.current;
      pendingContentRef.current = null;
      setMessages(prev => {
        const updated = [...prev];
        if (updated.length > 0 && updated[updated.length - 1].role === 'assistant') {
          updated[updated.length - 1] = { ...updated[updated.length - 1], content };
        }
        return updated;
      });
    }
    rafIdRef.current = null;
  }, []);

  const scheduleContentUpdate = useCallback((content) => {
    pendingContentRef.current = content;
    if (!rafIdRef.current) {
      rafIdRef.current = requestAnimationFrame(flushPendingContent);
    }
  }, [flushPendingContent]);

  const sendMessage = useCallback(async (text) => {
    if (!text?.trim() || loading) return;

    // Abort any existing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

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
        signal: controller.signal,
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      setMessages(prev => [...prev, { role: 'assistant', content: '', suggestions: [], ragSources: [] }]);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let fullContent = '';
      let suggestions = [];
      let ragSources = [];
      let tokenUsage = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        // Check if aborted
        if (controller.signal.aborted) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop();

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const data = JSON.parse(line.slice(6));
            if (data.type === 'token') {
              fullContent += data.content;
              scheduleContentUpdate(fullContent);
              if (data.session_id) setSessionId(data.session_id);
            } else if (data.type === 'done') {
              suggestions = data.suggestions || [];
              ragSources = data.rag_sources || [];
              tokenUsage = data.token_usage || null;
              if (data.content) fullContent = data.content;

              // Flush any pending content before final update
              if (rafIdRef.current) {
                cancelAnimationFrame(rafIdRef.current);
                rafIdRef.current = null;
              }
              pendingContentRef.current = null;

              setMessages(prev => {
                const updated = [...prev];
                updated[updated.length - 1] = {
                  ...updated[updated.length - 1],
                  content: fullContent,
                  suggestions,
                  ragSources,
                  tokenUsage,
                };
                return updated;
              });
              if (tokenUsage) setTotalTokens(prev => prev + (tokenUsage.total_tokens || 0));
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
          } catch (parseErr) {
            console.warn('SSE parse error:', parseErr, 'Line:', line);
          }
        }
      }
    } catch (err) {
      // Don't report abort errors
      if (err.name === 'AbortError') return;

      setMessages(prev => {
        const updated = [...prev];
        if (updated.length > 0 && updated[updated.length - 1].role === 'assistant' && !updated[updated.length - 1].content) {
          updated[updated.length - 1] = { ...updated[updated.length - 1], content: `连接失败：${err.message}` };
        }
        return updated;
      });
    } finally {
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
      }
      setLoading(false);
    }
  }, [loading, sessionId, subject, context, scheduleContentUpdate]);

  const clearChat = useCallback(() => {
    // Abort any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    // Cancel any pending animation frame
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
    pendingContentRef.current = null;

    setMessages([]);
    setSessionId(null);
    setTotalTokens(0);
  }, []);

  return {
    messages,
    loading,
    sessionId,
    totalTokens,
    sendMessage,
    clearChat,
    setMessages,
  };
}
