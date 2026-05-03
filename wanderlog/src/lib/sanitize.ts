// Sanitização client-side com DOMPurify
// Usa fallback simples no servidor (SSR)

let DOMPurify: any = null

export function sanitizeHtml(html: string): string {
  if (typeof window === 'undefined') {
    // SSR — remover tags perigosas básicas
    return html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
      .replace(/javascript:/gi, '')
  }
  if (!DOMPurify) {
    // Lazy load DOMPurify no cliente
    try {
      DOMPurify = require('dompurify')
      if (DOMPurify.default) DOMPurify = DOMPurify.default
    } catch {
      // Fallback se DOMPurify não estiver instalado
      return html
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
        .replace(/javascript:/gi, '')
    }
  }
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['p', 'br', 'b', 'i', 'u', 'strong', 'em', 'h1', 'h2', 'h3', 'ul', 'ol', 'li', 'a', 'span', 'div', 'blockquote'],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'style', 'class'],
    ALLOW_DATA_ATTR: false,
  })
}