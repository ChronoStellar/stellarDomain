/**
 * Prefix a site-absolute asset path with the deploy basePath.
 *
 * Next rewrites paths it owns (<Link>, its own chunks), but URLs written by hand
 * in markdown and JSON are opaque strings, so on GitHub Pages — served from
 * /stellarDomain/ — they 404 without this. Leaves external URLs and already
 * prefixed paths alone.
 *
 * Lives apart from content.ts on purpose: that module imports `fs`, and this is
 * needed by client components too.
 */
export function withBasePath(url: string): string {
  const base = process.env.NEXT_PUBLIC_BASE_PATH ?? '';
  if (!base) return url;
  if (!url.startsWith('/') || url.startsWith('//')) return url;
  if (url === base || url.startsWith(`${base}/`)) return url;
  return `${base}${url}`;
}
