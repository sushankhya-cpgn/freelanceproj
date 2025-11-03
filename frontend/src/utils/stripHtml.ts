// Strip all HTML tags and return plain text
export function stripHtml(html: string): string {
  if (!html) return '';
  return html.replace(/<[^>]+>/g, '');
}
