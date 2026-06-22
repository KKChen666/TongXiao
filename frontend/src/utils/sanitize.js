import DOMPurify from 'dompurify';

/**
 * Sanitize HTML content for safe rendering with dangerouslySetInnerHTML
 * @param {string} html - Raw HTML string
 * @returns {string} Sanitized HTML string
 */
export function sanitizeHtml(html) {
  if (!html) return '';
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['strong', 'em', 'code', 'br', 'span'],
    ALLOWED_ATTR: ['class'],
  });
}

/**
 * Simple markdown to HTML conversion with sanitization
 * @param {string} text - Markdown text
 * @returns {string} Sanitized HTML string
 */
export function markdownToSafeHtml(text) {
  if (!text) return '';
  let processed = text;
  processed = processed.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  processed = processed.replace(/\*(.+?)\*/g, '<em>$1</em>');
  processed = processed.replace(/`(.+?)`/g, '<code>$1</code>');
  return sanitizeHtml(processed);
}
