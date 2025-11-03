// Simple HTML sanitizer (for demo only, use DOMPurify for production)
export function sanitizeHtml(html: string): string {
  if (!html) return '';
  return html
    .replace(/<\/?(script|style)[^>]*>/gi, '')
    .replace(/on\w+=(["']).*?\1/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, '')
    .replace(/<object[\s\S]*?<\/object>/gi, '')
    .replace(/<embed[\s\S]*?<\/embed>/gi, '')
    .replace(/<link[\s\S]*?>/gi, '')
    .replace(/<meta[\s\S]*?>/gi, '');
}
