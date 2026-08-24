/**
 * Prefix a site-absolute asset path with the deploy basePath.
 *
 * Next rewrites paths it owns (<Link>, its own chunks), but URLs written by hand
 * in markdown and JSON are opaque strings, so on GitHub Pages — served from
 * /stellarDomain/ — they 404 without this.
 *
 * The prefix is a literal, not read from the environment. GitHub Pages builds
 * with `actions/configure-pages`, which generates its own next.config.js and
 * takes precedence over next.config.ts — so anything that config assigns to
 * process.env never runs in CI. Next's own assets still get prefixed (the
 * generated config sets basePath), but a helper reading process.env at build
 * time would silently return '' and emit unprefixed image paths that 404.
 * That exact failure shipped once. Keep this a constant.
 *
 * Set to '' when serving from a domain root instead of a subpath.
 *
 * Lives apart from content.ts on purpose: that module imports `fs`, and this is
 * needed by client components too.
 */
export const BASE_PATH = '/stellarDomain';

export function withBasePath(url: string): string {
  if (!BASE_PATH) return url;
  if (!url.startsWith('/') || url.startsWith('//')) return url;
  if (url === BASE_PATH || url.startsWith(`${BASE_PATH}/`)) return url;
  return `${BASE_PATH}${url}`;
}
