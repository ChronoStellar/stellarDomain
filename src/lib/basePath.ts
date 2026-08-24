/**
 * Prefix a site-absolute asset path with the deploy basePath.
 *
 * Next rewrites paths it owns (<Link>, its own chunks), but URLs written by hand
 * in markdown and JSON are opaque strings, so on GitHub Pages — served from
 * /stellarDomain/ — they 404 without this.
 *
 * `process.env.NODE_ENV` is the ONLY environment value safe to read here: Next
 * statically inlines it at build time, so it survives into the client bundle as
 * a literal. Do NOT switch this to a custom env var like NEXT_PUBLIC_BASE_PATH.
 * GitHub Pages builds with `actions/configure-pages`, which generates its own
 * next.config.js that takes precedence over next.config.ts — so anything that
 * config sets on process.env never runs in CI, the helper silently returns '',
 * and every image ships an unprefixed path that 404s. That exact bug shipped
 * once; the fix is keeping the production value a hardcoded literal.
 *
 * Dev serves from the root so routes stay at localhost:3000/ rather than
 * localhost:3000/stellarDomain. Production always carries the prefix.
 *
 * Serving from a custom domain root instead? Set this to '' unconditionally.
 *
 * Lives apart from content.ts on purpose: that module imports `fs`, and this is
 * needed by client components too.
 */
export const BASE_PATH = process.env.NODE_ENV === 'production' ? '/stellarDomain' : '';

export function withBasePath(url: string): string {
  if (!BASE_PATH) return url;
  if (!url.startsWith('/') || url.startsWith('//')) return url;
  if (url === BASE_PATH || url.startsWith(`${BASE_PATH}/`)) return url;
  return `${BASE_PATH}${url}`;
}
