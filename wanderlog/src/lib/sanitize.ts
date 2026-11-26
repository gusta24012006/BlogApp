// Sanitização do HTML dos posts antes de ser mostrado com dangerouslySetInnerHTML.
//
// Usa o isomorphic-dompurify, que funciona tanto no browser como no servidor (SSR).
// Antes, o código tentava carregar o "dompurify" (que não estava instalado) e caía
// sempre num fallback com expressões regulares, fácil de contornar (risco de XSS).

import DOMPurify from 'isomorphic-dompurify'

const ALLOWED_TAGS = [
  'p', 'br', 'b', 'i', 'u', 'strong', 'em',
  'h1', 'h2', 'h3', 'ul', 'ol', 'li',
  'a', 'span', 'div', 'blockquote',
]

const ALLOWED_ATTR = ['href', 'style', 'class']

export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOW_DATA_ATTR: false,
    // Só permite links http(s), mailto e relativos (bloqueia javascript:, data:, etc.)
    ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto):|\/|#)/i,
  })
}
