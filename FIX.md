# Portfolio Fix List

A UI/UX + recruiter-perspective review of the site, and the record of what was done about
it. Branch `ui-add`, 2026-08-22. Updated 2026-08-24 (deployment, content, and asset work).

**Status:** Phases 1–3 (design, bugs, accessibility) complete. **Phase 0 (content
credibility) is now essentially done** — all placeholder content is gone, replaced with
three real projects and one real publication. Phase 5 (deployment) documents a class of
bug that only appeared once the site was actually served from GitHub Pages.

**Live:** https://chronostellar.github.io/stellarDomain/

**The one open blocker** is the Google Drive demo video on the Rulaa page: it currently
shows a sign-in wall to anonymous visitors. See Phase 5.

---

## Phase 0 — Credibility (DONE)

**The original problem:** roughly half the content was placeholder — three of four projects
and both publications fabricated, complete with invented metrics and `example.com` links.

All of it is now resolved.

- [x] Delete `content/projects/aura.md` and `nexus.md` (invented metrics, fake cover paths).
- [x] `rulaa.md` **rewritten as real work** — Rulaa is a genuine project (body measurement
      and size recommendation, SMPL → MHR pipeline, fuzzy-logic recommender). The invented
      "75% size reduction" version is gone.
- [x] Delete `content/publications/edge-ml.md` and `reusable-ui.md` (`example.com` URLs).
- [x] Real email in `profile.json` (`hendrikcarlo0@gmail.com`).
- [x] `public/cv.pdf` now exists; the hero CTA resolves.
- [x] **New real content:** `content/projects/trading-rl.md` (PPO trading agent) and
      `content/publications/apple-leaf-glcm.md` (published CNN/GLCM comparison paper).

### JKTDrive case study — DONE

All six «BRACKETED» story prompts are filled, and the results table carries all five
accuracy figures.

- [x] Restructure to **problem → approach → result**.
- [x] Results as a GFM table (needed `remark-gfm`; the pipeline used plain `remark-html`).
- [x] Limitations written out (small N, single city, MCQA measures recognition not driving,
      no inter-annotator agreement, possible contamination).
- [x] **Fixed a self-contradiction in Results.** The table said InternVL2.5 81.32% / GPT-5
      80.22%, while the prose below claimed "GPT-5 leads at 86.90%, InternVL2.5 trails by
      0.45". Three conflicts in one section. Resolved in favour of the table, which also
      matches the bolded claim: the open-source model wins, and the gap is 1.10 points.
- [x] Grammar pass across the whole file (~26 fixes: tense drift, agreement, `commericial`,
      `writting`, `execption`, `analized`, proper-noun casing).
- [ ] Consider a chart for the per-category breakdown.
- [ ] Confirm the arXiv ID before re-adding the paper link (`2407.11691` is unverified;
      currently an HTML comment, so it does not render).

### Still needs your words

- [ ] `focus.body` in `profile.json` is a draft. It is the most prominent sentence on the
      page after the tagline.
- [ ] Reconcile the Rulaa numbers: the Results line says "5s inference time" while the
      3D-measurement section says the new pipeline "took 30s slower". Both are yours to
      confirm; a reader will notice.
- [ ] "top 100th in the fashion & commerce" (Rulaa) is vague next to hard figures — top 100
      in which store, which country, at what date?

## Phase 1 — Why the design read "standard" (DONE)

The layout was competent and the token system mostly well-built. What was missing was
hierarchy and a point of view.

### 1.1 Everything had identical visual weight

Every block was `1px solid var(--border)` + `16px` radius + `var(--card)` — project cards,
publication cards, stat tiles and the competency panel were visually interchangeable.
Nothing was bigger, louder, or first. This was the primary cause of the template feeling.

- [x] Broke the uniform 2×2 grid: the first project renders as a full-width featured card
      (media beside copy, 32px title, accent-tinted border), smaller cards below.
- [x] Three tiers of card weight instead of one.

### 1.2 Section headers hid their own content

`SELECTED WORK` rendered at 14px uppercase in `--text-faint` — smaller and fainter than the
body text beneath it. A widely-copied house style, which is exactly why it read as generic.

- [x] Section headings are now 28px in full-strength `--text` with an accent rule.

### 1.3 Section rhythm was inverted, then silently zeroed

`.section-padding` was `25px` on desktop and `80px` on mobile — the widest screens got the
least breathing room, so sections blurred into one scroll.

- [x] Corrected: `--section-gap` is 120px desktop / 88px tablet / 72px mobile.
- [x] **Follow-up bug, found by measuring.** The first fix looked right but computed to
      `padding-top: 0` on every section below 860px. Cause: section wrappers carry both
      `.container` and `.section-padding`, and `.container`'s `padding` **shorthand** also
      resets top/bottom. On desktop `.section-padding` won on source order; inside the
      media query `.container` came later and clobbered it. The tablet band lost hero
      padding the same way.

      Fixed by splitting the axes so the two classes can never overwrite each other:
      `.container` uses `padding-inline`, and every vertical rule (`.section-padding`,
      `.hero-padding`, `.footer-padding`, `.nav-padding`, `.article`) uses `padding-block`.
      Nav and footer no longer bake in their own horizontal padding, since `.container`
      supplies it.
- [x] Added a genuine tablet step. Horizontal padding is now 28px desktop / 44px tablet /
      24px mobile, and card, focus, publication and competency panels get tighter interior
      padding under 640px.

### 1.4 Type had almost no range

`--mono` and `--sans` were both `'Source Sans 3'`, so every `.text-mono` element — tags,
labels, nav links, buttons — rendered identically to body copy. A three-font system was
designed and a two-font system shipped. Body sizes ran `18 / 16 / 14.5 / 13 / 12.5 / 12 /
11px`: seven sizes, no scale, with imperceptible gaps between 14.5 / 13 / 12.5, while the
one real jump (60px h1 → 18px body) had nothing in between.

- [x] JetBrains Mono for `--mono`, via `next/font` alongside Sora and Source Sans 3. This
      also removed the render-blocking Google Fonts `@import`.
- [x] Four-step body scale (`--fs-xs` … `--fs-lg`), plus `--fs-h1-sub` (32px) filling the
      gap between h1 and body.

### 1.5 The hero wasted the best real estate

The "stats" grid contained no statistics — two link tiles labelled GitHub and LinkedIn
wearing the costume of a metrics block.

- [x] **First attempt was wrong and was reverted.** Real figures (273 scenes / 5 models /
      14 categories / 86.9%) proved just as hollow as the tiles they replaced: dataset size
      and category count measure *effort spent*, not outcome, and the 86.9% headline is
      GPT-5's score — another party's model presented as an achievement. Stat grids only
      work when the numbers are self-evidently impressive without context, which
      early-career research work rarely has.
- [x] Replaced with a `focus` card stating the claim instead: existing driving benchmarks
      assume Western roads; JKTDrive does not. Numbers belong in the case study, where they
      have a frame of reference. Lives in `profile.json` as an optional `focus` object, so
      the hero collapses cleanly to one column if removed.

### 1.6 The starfield was not earning its cost

2000 points rotating behind a near-white background: invisible in light mode, faint noise
in dark. ~200KB of three.js, a WebGL context and a permanent rAF loop, mounted **twice** on
`/projects`.

- [x] Committed to it as a real signature rather than deleting it — see **Constellations**
      below.
- [x] Removed the duplicate mount in `Footer.tsx`.

---

## Phase 2 — Bugs a visitor would hit (DONE)

- [x] **Theme flash (FOUC).** The theme was applied in `useEffect`, after hydration, so
      every dark-mode visitor got a white flash on load. Now set by a blocking script in
      `<head>` before first paint; `ThemeToggle` reads that state via `useSyncExternalStore`
      instead of racing it.
- [x] **Hardcoded `color: 'White'`** in the footer, bypassing the token system.
- [x] **Raw apostrophe in JSX** ("Let's") tripping the lint config.
- [x] **No mobile navigation.** Four links + brand + toggle could not fit a 375px screen.
      New shared `SiteNav` with a disclosure menu, replacing three copies of duplicated nav
      markup.
- [x] **The tag filter silently truncated.** It filtered then sliced to 4, and the "View
      all" escape hatch only rendered for the unfiltered list — so filtered views could show
      a partial list with no way out. Now reports a count and always offers the archive link
      when results are truncated.
- [x] **Project detail pages dead-ended.** Added next/prev footers.
- [x] **`<img>` instead of `next/image`.** Confirmed not actionable: `output: 'export'`
      disables Next's image optimizer entirely (hence `images.unoptimized`). Kept plain
      `<img>` with `loading="lazy"` / `decoding="async"` and empty `alt` on decorative
      covers. **Resolved instead by optimizing ahead of time** — see Phase 6.

---

## Phase 3 — Accessibility (DONE)

- [x] `aria-pressed` on the project filter buttons.
- [x] Competency selectors are a real tablist with roving arrow-key focus, Home/End, and
      `aria-selected` — previously plain buttons.
- [x] Visible focus rings on every interactive element.
- [x] Skip-to-content link.
- [x] Contrast. `--text-faint` on `--bg` measured **3.40:1 — failing AA** (the review's
      original 3.6:1 estimate was optimistic). Raised to **5.14:1**. All token pairs now
      clear AA; ratios computed numerically rather than eyeballed.

---

## Constellations

The background renders eight real constellations over a scattered star field: Orion, Ursa
Major, Cassiopeia, Cygnus, Lyra, Scorpius, Aquila, Crux. Lyra, Cygnus and Aquila carry
Vega, Deneb and Altair respectively — the three stars of the Summer Triangle, and the
brightest points in the whole field. This also makes good on the README's
existing "interconnected star constellations" claim, which the previous random point cloud
did not.

`src/lib/constellations.ts` holds the catalog — each star's true J2000 right ascension,
declination and visual magnitude, plus the conventional figure joins. Magnitude drives both
point size and opacity through a custom shader attribute, so bright stars read as bright.

### Four things had to be right

1. **Scale.** Constellations differ hugely in true angular size, so a shared multiplier
   rendered Lyra and Crux as specks. Each figure normalises to a target on-screen span,
   preserving internal proportions.
2. **Facing.** Stars sit on a sphere, each constellation facing outward along its own line
   of sight. Uncorrected, the Big Dipper arrived edge-on — its 235-unit span lying along Z
   behind a 72×66 smudge. Fixed by projecting onto the tangent plane at each figure's
   centroid via an orthonormal east/north/line-of-sight basis.
3. **Orientation.** The first tangent-plane basis used `los × east` for north, which points
   *south* — every figure rendered upside down, Orion's head below his feet. Corrected to
   `east × los`.
4. **Canvas size.** *This is why nothing was visible at first.* The renderer was sized from
   `container.parentElement`, which for the fixed background is `<body>` — whose
   `clientHeight` is the full scrollable page height (4473px), not the viewport. The canvas
   was drawn roughly five times taller than the 900px area it occupies, so every figure
   fell outside the visible region. Fixed by measuring the container's own
   `getBoundingClientRect()`, with a `ResizeObserver` to re-measure once layout settles.

### Motion

Each figure follows its own slow Lissajous drift — independent x/y speeds, so a
constellation never visibly repeats a loop — with a shallow roll and pitch layered on.
Amplitude scales with parallax depth, so nearer figures travel further. Scroll parallax
applies on top.

Amplitude is tuned in *screen* terms, not world units: the figures sit at z ≈ -400..-600,
so perspective shrinks world-space movement substantially. See **Verification** for the
measured travel — the first pass was mathematically moving but visually static.

Motion is driven by **accumulated animating time**, not `THREE.Clock`: Clock keeps counting
while the loop is paused offscreen or in a hidden tab, so figures would teleport on resume.
The per-frame delta is clamped to 50ms so a stalled frame cannot jump the drift either. The
tilt stays deliberately shallow — a larger rotation would tip figures out of the tangent
plane that makes them recognisable.

### Data corrections found while verifying

- Scorpius had too few stars; the tail straightened into a diagonal and lost its hook. Now
  carries the full 15-star figure. A wrong declination on Tau Sco was fixed in passing.
- Orion gained Meissa so the head fixes its orientation.
- Aquila was added later (Vega and Deneb were already present via Lyra and Cygnus; Altair
  was the missing third of the Summer Triangle). Verified against published values: the
  Tarazed-Altair-Alshain line is collinear to 0.011°, and the Summer Triangle separations
  come out 23.85° / 34.20° / 38.01° against published 23.9 / 34.2 / 38.0.
- Adding a constellation requires adding a matching entry to `placements` in
  `ThreeBackground.tsx`; the list is indexed modulo its length, so a short list silently
  stacks two figures in the same spot.

### Placement

Figures sit in the margins and well back in Z. When first rendered they drifted behind the
headline and bio copy, which read as an accident rather than a backdrop. Figure lines were
also softened from `0.22` to `0.14` opacity — at full strength they read as a diagram.

---

## Phase 4 — Notes, not blockers

- `dangerouslySetInnerHTML` on markdown containing raw HTML (`jktdrive.md` has `<img>`,
  `<a>`, `<b>`). Fine for self-authored content; worth knowing if sourcing ever changes.
- `README.md` still oversells in places — "Deep Content Analytics" for two profile links.
  Worth aligning with what the code does. (The constellation claim is now accurate.)

---

## Phase 5 — Deployment on GitHub Pages (DONE, one item open)

None of this was visible locally. GitHub Pages serves the site from a **subpath**
(`/stellarDomain/`), and every bug below is a variation on the same theme: a URL that
works at a domain root and 404s under a subpath.

- [x] **Images pointed into `content/`.** `coverImage` was
      `content/ressource/img/rulaa_hero.png`. Only `public/` is served — a path into
      `content/` has no URL at all. It was also relative, so from `/projects/rulaa` it
      resolved to `/projects/content/...`. Moved to `public/projects/<slug>/`.
- [x] **Missing basePath on hand-written URLs.** Next rewrites paths it owns (`<Link>`, its
      own chunks) but not opaque strings in markdown and JSON, so every image 404'd in
      production while the CSS loaded fine. Added `withBasePath()` (`src/lib/basePath.ts`),
      applied to cover images, inline markdown images, and the CV link.
- [x] **The first basePath fix silently failed in CI.** It read
      `process.env.NEXT_PUBLIC_BASE_PATH`, assigned in `next.config.ts`. But
      `actions/configure-pages` **generates its own `next.config.js`**, which takes
      precedence — so that assignment never ran on Pages, the helper returned `''`, and the
      images shipped unprefixed anyway. Fixed by making the prefix a literal constant.
      `NODE_ENV` is the only env value safe to read there, because Next inlines it at build
      time. Verified by rebuilding with `next.config.ts` replaced by a CI-style config.
- [x] **Dev server broke.** Hardcoding the constant moved *every route* to
      `localhost:3000/stellarDomain` — `/`, `/projects`, all of it 404ing locally. Restored
      with a `NODE_ENV` check so dev serves from the root and production keeps the prefix.
- [x] **Nav anchor links escaped the site.** `SiteNav` renders its links as plain
      `<a href>`, not `<Link>`, so basePath was never applied — `/#publications` sent
      visitors to `chronostellar.github.io/#publications`, off the project entirely. Now
      wrapped in `withBasePath()`. Note `<Link>` *does* prefix hash paths correctly; only
      the raw anchors were affected.
- [ ] **The Rulaa demo video shows a sign-in wall.** The embedded Google Drive file
      (`/preview` iframe) returns 200 but redirects anonymous visitors to
      `accounts.google.com/ServiceLogin` — verified against the live site. Either set the
      file to "Anyone with the link" or re-host on unlisted YouTube/Vimeo, which is steadier
      for a public page anyway. **Nothing in CI catches this**; the link checker only
      validates local paths.

### `scripts/check-links.mjs` — new

Every bug above shipped as a **green build**: a wrong asset path compiles fine, the page
returns 200, and only the image 404s. This script walks `out/` after the build and fails if
any local `src`/`href` does not resolve on disk, or if an internal link is missing the
basePath prefix. Wired into `deploy.yml`, so it blocks the deploy.

Verified by reintroducing each bug into built HTML and confirming a non-zero exit.

---

## Phase 6 — Assets and content tooling (DONE)

- [x] **Images were 4.45 MB total.** `jktdrive_classes.png` alone was 2.41 MB at
      4096×2048, displayed at roughly 700px. Resized to max 1600px (2× the widest
      container) and converted to WebP: **4.45 MB → 492 KB, −89%**. This also closes the
      "pre-resize the JKTDrive cover" item from the original next-steps list.
- [x] Quality verified numerically per image (mean absolute error vs the original), not
      eyeballed. Photos at q82, anything with text or line art at q92 — lossy WebP rings
      around sharp edges. All outputs land under 2.2/255.
- [x] `scripts/optimize-images.mjs` — **new.** Repeatable pipeline: originals live in
      `assets-original/` (gitignored), optimised WebP is written to `public/projects/`.
- [x] `docs/IMAGES.md` — **new.** The workflow, the quality rationale, and why `next/image`
      cannot help under static export.
- [x] `.claude/skills/content-page/SKILL.md` — **new.** The frontmatter contract for
      projects and publications, image and basePath rules, math syntax, and verification
      steps. Encodes the conventions above so they are not rediscovered each time.
- [x] **KaTeX math support.** `remark-math` + `rehype-katex` added to the pipeline.
      Deliberately configured with `singleDollarTextMath: false`, so inline math uses
      `$$…$$` — prose here contains bare prices like `$0.01/request`, and single-dollar
      math makes the parser swallow everything to the next `$`.
- [x] **Video embeds.** `.video-embed` wrapper in `globals.css` holds a 16:9 ratio around
      an iframe, which has no intrinsic size and otherwise collapses or overflows on mobile.
      Verified at 390 / 768 / 1200px.
- [x] **Mobile card covers.** `.work-grid` stacks to one column below 860px, but the media
      kept `aspect-ratio: 16/10`, so full-width cards produced 340–480px of image with the
      title pushed off screen. Now `2/1` under 860px. The override must stay *after* the
      860px block — the featured selector there has equal specificity, so it only wins on
      source order.

---

## Verification

Everything below was checked, not assumed.

**Build:** `npm run build` passes, 11 static pages. `tsc --noEmit` clean. `eslint` 0 errors,
2 expected `<img>` warnings (see Phase 2).

**Contrast:** computed numerically from the oklch tokens. `--text-faint` on `--bg`
3.40:1 → 5.14:1; all pairs clear WCAG AA in both themes.

**Constellation geometry:** the shipped catalog was rendered through the same projection
into an SVG and inspected, then asserted numerically — Orion's head topmost with Betelgeuse
above Rigel and the sword below the belt; Cygnus with Deneb at the tail, Albireo at the beak
and wings on opposite sides of Sadr; Cassiopeia's W zigzag confirmed. Orion's belt is
collinear to 0.006°; Dipper and Crux separations match published values.

**Responsive padding:** measured computed styles at 1440 / 1024 / 900 / 860 / 768 / 700 /
640 / 480 / 390 / 360px. Horizontal 28/44/24px and vertical 120/88/72px resolve correctly
at every step, with no zero values and no horizontal overflow.

**Browser (Chromium via Playwright, software WebGL):** 1440×900, 768×1024 and 390×844,
both themes.
Canvas sizes correctly to the viewport, WebGL initialises, no console errors.
Constellations legible in the margins in dark *and* light mode, headline unobscured. Mobile
hamburger and stacked hero correct. Featured-card hierarchy working.

**Motion:** the first amplitude pass was too subtle to read as movement. "0.647% of pixels
changed" proved *change*, not *perceptible* change — tracking the centroid of lit pixels in
a text-free region showed only **7px horizontal / 9px vertical of travel over 7.5s**, about
1px per second. Two causes: amplitude of ~26-48 world units at z ≈ -400..-600, where
perspective shrinks it to a few screen pixels, and a ~114s cycle so any glance caught a
sliver of the arc.

Amplitudes were raised to 95-165 (x) and 70-125 (y) world units with a ~25-45s cycle, and
the scattered field's spin roughly tripled so it does not look detached from the figures.
Re-measured: **21px horizontal / 51px vertical over 7.5s** — about 6x the visible travel,
0.796% of pixels changing over 4s.

Pause behaviour re-confirmed after the change: 0.000% over 3s with the tab hidden, 0.000%
over 3.5s under `prefers-reduced-motion` with the canvas still drawn. Headline stays clear
of the figures across 20s of drift.

Playwright and pngjs were installed with `--no-save`; `package.json` is unchanged.

### Deployment and assets (2026-08-24)

**Live site, Chromium via Playwright:** `/`, `/projects/rulaa`, `/projects/jktdrive` —
all images load (2/2, 3/3, 4/4), no failed requests except the Drive video sign-in
redirect noted in Phase 5.

**basePath under CI conditions:** rebuilt with `next.config.ts` replaced by a CI-style
`next.config.js` and the environment unset — the exact condition that broke the first fix.
All six images emit the `/stellarDomain` prefix; zero unprefixed internal links across the
whole export.

**Dev/production split:** `localhost:3000/`, `/projects`, `/projects/rulaa` all 200 with
unprefixed image paths serving correctly; `/stellarDomain` correctly 404s in dev.

**Link checker:** verified by reintroducing each bug class into built HTML — a typo'd image
path and an unprefixed `/#publications` both produce a non-zero exit naming the offender.

**Image quality:** mean absolute error per channel against each original, measured against
the *resized* source (comparing across resolutions folds in resampling difference and
overstates loss — that produced one false alarm at 5.20 versus a true 0.89). All six
images land under 2.2/255.

**Responsive:** project cards measured at 360 / 390 / 640 / 700 / 860 / 861 / 1024 / 1440px
in both `/` and `/projects`; 2/1 ratio below 860px, desktop layout unchanged, no overflow.
Video embed holds 16:9 at 390 / 768 / 1200px.

**Nav anchors:** clicking Publications on the built site stays on the project, lands at
`/stellarDomain/#publications`, and scrolls to the section.

---

## Files changed

- `src/app/layout.tsx` — `next/font` (Sora / Source Sans 3 / JetBrains Mono) replacing the
  render-blocking Google Fonts `@import`; blocking pre-paint theme script; skip link.
- `src/app/globals.css` — rewritten: four-step type scale, real `--mono`, fixed section
  rhythm, focus rings, per-theme starfield tokens, and extracted component classes
  replacing the inline styles.
- `src/components/SiteNav.tsx` — **new.** Shared header with a working mobile disclosure
  menu; replaces three copies of duplicated nav markup.
- `src/lib/constellations.ts` — **new.** Star catalog with J2000 coordinates, magnitudes and
  figure joins, plus projection helpers.
- `src/components/ThreeBackground.tsx` — constellation rendering, tangent-plane projection,
  magnitude-driven shader, Lissajous drift, theme-aware colors, `IntersectionObserver` and
  visibility pausing, reduced-motion static frame, DPR cap, container-based sizing.
- `src/components/WorkSection.tsx` — featured/standard card tiers, `aria-pressed`, result
  count, archive link that no longer strands filtered views.
- `src/components/AboutSection.tsx` — real tablist with roving arrow-key focus.
- `src/components/ThemeToggle.tsx` — `useSyncExternalStore` over the `data-theme` attribute.
- `src/components/Footer.tsx` — tokenised colors, escaped apostrophe, dropped the duplicate
  starfield mount.
- `src/app/page.tsx`, `src/app/projects/page.tsx`, `src/app/projects/[slug]/page.tsx`,
  `src/app/publications/[slug]/page.tsx` — shared nav, semantic markup, next/prev footers.
- `content/data/profile.json` — `stats` removed, `focus` object added.
- `src/lib/content.ts` — `ProfileData.stats` replaced with optional `focus`.

Added 2026-08-24:

- `src/lib/basePath.ts` — **new.** `BASE_PATH` constant + `withBasePath()`. Deliberately
  separate from `content.ts`, which imports `fs` and so cannot be pulled into client
  components. Read the comment before changing how the value is derived.
- `src/lib/content.ts` — unified pipeline (`remark-parse` → `gfm` → `remark-math` →
  `remark-rehype` → `rehype-katex` → `rehype-stringify`) replacing `remark-html`, shared by
  the project and publication renderers; rewrites `<img src="/…">` for basePath.
- `next.config.ts` — `basePath` imported from the same constant, so Next's assets and
  hand-written content paths cannot disagree.
- `src/components/SiteNav.tsx` — nav anchors wrapped in `withBasePath()`.
- `src/app/layout.tsx` — KaTeX stylesheet import.
- `src/app/globals.css` — `.video-embed` / `<video>` styling; mobile card aspect ratio.
- `scripts/check-links.mjs`, `scripts/optimize-images.mjs` — **new.**
- `docs/IMAGES.md`, `.claude/skills/content-page/SKILL.md` — **new.**
- `.github/workflows/deploy.yml` — link check wired in after the build.
- `content/projects/trading-rl.md`, `content/publications/apple-leaf-glcm.md` — **new.**
- `public/projects/**` — all images now WebP; `assets-original/` holds sources. Gitignored
  and untracked, so the full-resolution originals live only on the authoring machine —
  keep a backup elsewhere. The WebP files are downsampled and cannot be reversed.

---

## Suggested next steps

1. **Fix the Rulaa demo video** — it shows a sign-in wall to anonymous visitors right now,
   on the project most likely to be watched. Set the Drive file to "Anyone with the link",
   or re-host unlisted on YouTube/Vimeo.
2. **Set `metadataBase`** and add an OG image before sharing the link anywhere — social
   previews still resolve against `http://localhost:3000`, and the build warns about it
   every time.
3. Reconcile the Rulaa figures (5s inference vs 30s slower; the "top 100th" claim).
4. Put the `focus` card text in your own words.
5. Confirm the arXiv ID before re-adding the JKTDrive paper link.
6. Consider a per-category chart for the JKTDrive capability breakdown.
7. Fill `venue` and `url` on `apple-leaf-glcm.md` once the paper is indexed — both are
   placeholders, and the empty `url` currently hides the "Read original" link.
