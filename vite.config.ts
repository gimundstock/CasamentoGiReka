import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * What the published page may load, as a Content-Security-Policy: its own
 * files, Google Fonts, the guests' photos from Drive and the Apps Script
 * backend — nothing else, and no inline or injected scripts. Links out
 * (maps, PayPal, Revolut) are navigations, which this doesn't restrict.
 */
const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  // (Inline style attributes: the animations set them.)
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data: blob: https://lh3.googleusercontent.com",
  // The Web App answers from script.google.com through a redirect to googleusercontent.
  "connect-src 'self' https://script.google.com https://script.googleusercontent.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ')

/**
 * In the built page only (the dev server needs inline scripts for its hot
 * reload): the CSP above, a referrer policy that never sends the page's
 * address — with its ?g= guest id — to other sites, and a noindex, so the
 * invitation stays out of search engines (link previews still work).
 */
function securityMeta(): Plugin {
  return {
    name: 'security-meta',
    apply: 'build',
    transformIndexHtml() {
      return [
        {
          tag: 'meta',
          attrs: { 'http-equiv': 'Content-Security-Policy', content: CSP },
          injectTo: 'head-prepend',
        },
        { tag: 'meta', attrs: { name: 'referrer', content: 'strict-origin' }, injectTo: 'head' },
        { tag: 'meta', attrs: { name: 'robots', content: 'noindex, nofollow' }, injectTo: 'head' },
      ]
    },
  }
}

export default defineConfig(() => ({
  plugins: [react(), securityMeta()],
  base: '/',
}))
