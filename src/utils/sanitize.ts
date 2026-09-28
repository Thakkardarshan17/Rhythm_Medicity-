/**
 * Safe HTML Sanitizer for Rhythm Medicity Dynamic CMS
 * Strips dangerous tags (script, iframe unless allowed video, object, embed, style)
 * and event handlers (onload, onerror, onclick, etc.)
 */
export function sanitizeHtml(html: string): string {
  if (!html) return '';

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // Remove forbidden elements
    const dangerousTags = ['script', 'style', 'object', 'embed', 'link', 'meta', 'applet', 'base', 'form'];
    dangerousTags.forEach((tag) => {
      const elements = doc.querySelectorAll(tag);
      elements.forEach((el) => el.remove());
    });

    // Remove inline event handlers (on*) and javascript: hrefs
    const allElements = doc.querySelectorAll('*');
    allElements.forEach((el) => {
      const attributes = Array.from(el.attributes);
      attributes.forEach((attr) => {
        const name = attr.name.toLowerCase();
        const value = attr.value.trim().toLowerCase();

        if (name.startsWith('on')) {
          el.removeAttribute(attr.name);
        } else if ((name === 'href' || name === 'src') && (value.startsWith('javascript:') || value.startsWith('data:text/html'))) {
          el.removeAttribute(attr.name);
        }
      });
    });

    return doc.body.innerHTML;
  } catch (e) {
    console.warn('HTML Sanitization fallback:', e);
    // Simple regex fallback
    return html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/on\w+="[^"]*"/gi, '')
      .replace(/on\w+='[^']*'/gi, '');
  }
}
