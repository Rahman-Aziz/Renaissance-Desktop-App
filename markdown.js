/**
 * Lightweight markdown → HTML renderer (no dependencies).
 * Handles: headings, bold, italic, code, pre, lists, blockquote, hr, tables, links.
 */
export function renderMarkdown(md) {
  if (!md) return '';

  let html = md
    // Escape HTML (but preserve existing newlines)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

    // Fenced code blocks
    .replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) =>
      `<pre><code class="lang-${lang}">${code.trimEnd()}</code></pre>`)

    // Inline code
    .replace(/`([^`]+)`/g, '<code>$1</code>')

    // Headings
    .replace(/^#{6}\s+(.+)$/gm, '<h6>$1</h6>')
    .replace(/^#{5}\s+(.+)$/gm, '<h5>$1</h5>')
    .replace(/^#{4}\s+(.+)$/gm, '<h4>$1</h4>')
    .replace(/^###\s+(.+)$/gm, '<h3>$1</h3>')
    .replace(/^##\s+(.+)$/gm, '<h2>$1</h2>')
    .replace(/^#\s+(.+)$/gm, '<h1>$1</h1>')

    // Blockquotes
    .replace(/^&gt;\s+(.+)$/gm, '<blockquote>$1</blockquote>')

    // HR
    .replace(/^---+$/gm, '<hr />')

    // Bold + italic
    .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/__(.+?)__/g, '<strong>$1</strong>')
    .replace(/_(.+?)_/g, '<em>$1</em>')

    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')

    // Tables
    .replace(/^(\|.+\|)\n\|[-| :]+\|\n((?:\|.+\|\n?)*)/gm, (_, header, body) => {
      const heads = header.split('|').filter(Boolean).map(h => `<th>${h.trim()}</th>`).join('');
      const rows  = body.trim().split('\n').map(row => {
        const cells = row.split('|').filter(Boolean).map(c => `<td>${c.trim()}</td>`).join('');
        return `<tr>${cells}</tr>`;
      }).join('');
      return `<table><thead><tr>${heads}</tr></thead><tbody>${rows}</tbody></table>`;
    })

    // Unordered lists
    .replace(/^[-*]\s+(.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>\n?)+/g, match => `<ul>${match}</ul>`)

    // Ordered lists
    .replace(/^\d+\.\s+(.+)$/gm, '<li>$1</li>')

    // Paragraphs (double newline = paragraph break)
    .split(/\n{2,}/)
    .map(block => {
      const trimmed = block.trim();
      if (!trimmed) return '';
      if (/^<(h[1-6]|ul|ol|li|pre|blockquote|hr|table)/.test(trimmed)) return trimmed;
      return `<p>${trimmed.replace(/\n/g, ' ')}</p>`;
    })
    .join('\n');

  return html;
}
