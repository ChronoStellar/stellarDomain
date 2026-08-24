# Image optimization

Images are the heaviest thing this site ships, and GitHub Pages caps asset
caching at ten minutes (`cache-control: max-age=600`, not configurable), so
visitors re-download them often. Keeping them small matters more here than on a
host where you control caching.

The site's images went from **4.45 MB to 492 KB (−89%)** with no visible
difference at display size.

## Adding a new image

1. Put the original in `assets-original/<project>/`
2. Run the script:

   ```bash
   node scripts/optimize-images.mjs            # everything
   node scripts/optimize-images.mjs rulaa      # one project
   ```

3. Reference the `.webp` output in markdown with a leading slash:

   ```markdown
   ![Alt text](/projects/rulaa/rulaa_hero.webp)
   ```

The leading `/` matters. Paths are resolved against `public/`, and
`withBasePath()` adds the `/stellarDomain` prefix for GitHub Pages at build
time. A relative path resolves against the current page instead and 404s.

Originals stay in `assets-original/` and are never modified, so you can always
re-export at different settings.

## What the script does

| Step | Value | Why |
| --- | --- | --- |
| Resize | max **1600px** wide | 2× the widest container (~770px), so retina stays sharp. Anything larger ships pixels no screen renders. |
| Convert | **WebP** | Typically 25–35% smaller than PNG at equal quality; universal browser support since Safari 14 (2020). |
| Quality | **82** photos / **92** text | Lossy WebP rings around sharp edges. Screenshots and diagrams need the higher setting; photographs don't. |

Quality is picked per file from the filename. `TEXT_LIKE` in the script lists
the fragments that mark an image as text or line art — `diagram`, `sample`,
`chart`, `screenshot`, and so on. Add to that list rather than raising the
global quality.

## Verifying quality

The script prints **MAE** (mean absolute error per channel, 0–255) comparing
each output against its original. Rough reading:

| MAE | Meaning |
| --- | --- |
| < 2 | Imperceptible |
| 2–4 | Fine for photos, check text |
| > 4 | Flagged — inspect before shipping |

All current images are under 2.2.

One caveat worth knowing, because it produced a misleading number during the
first pass: MAE must be measured against the **resized** original, not the
full-size one. Comparing across resolutions folds resampling difference into the
score — `jktdrive_sample` read 5.20 that way versus a true 0.89, a false alarm
that looks exactly like real compression damage.

A number is not a substitute for looking. For anything with text, crop the same
region from both versions and compare them side by side before shipping.

## Why not `next/image`

`next.config.ts` sets `output: 'export'` with `images.unoptimized: true`.
Static export has no server to transform images on request, so Next's optimizer
is disabled entirely and `next/image` gives nothing here. Optimizing ahead of
time is the whole story.

## Things this does not cover

- **The jktdrive cover** is hosted remotely on `github.com/user-attachments`, so
  it bypasses this pipeline.
- **No `<picture>` fallback.** Browsers older than Safari 14 get no image.
- **The 10-minute cache cap is fixed** on GitHub Pages. Smaller files are the
  only lever available.
