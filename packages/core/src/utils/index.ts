const MAX_TEXT_LENGTH = 8000;

/**
 * Strip HTML tags and decode common entities, returning plain text
 * truncated to `maxLength` characters.
 */
export function htmlToText(html: string, maxLength = MAX_TEXT_LENGTH): string {
  let text = html
    // Remove script/style blocks
    .replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, "")
    // Replace block-level tags with newlines
    .replace(/<\/(p|div|br|h[1-6]|li|tr|blockquote)>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    // Strip remaining tags
    .replace(/<[^>]+>/g, "")
    // Decode common HTML entities
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    // Collapse whitespace
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  if (text.length > maxLength) {
    text = text.slice(0, maxLength);
  }

  return text;
}
