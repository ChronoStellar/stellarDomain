# Portfolio Fix List

A UI/UX + recruiter-perspective review of the site, and the record of what was done about
it. Branch `ui-add`, 2026-08-22.

**Status:** Phases 1–3 (design, bugs, accessibility) are complete and verified in a
browser. **Phase 0 (content credibility) is untouched and is the highest-impact work
remaining** — it is deliberately left to the author, since which projects are real is not
a call this review can make.

---

## Phase 0 — Credibility (blocking, NOT DONE)

**The problem:** roughly half the content is placeholder. Three of four projects and both
publications are fabricated, complete with invented metrics. A reader who clicks
"Read publication →" lands on `example.com` and then stops trusting the one project that
is real.

`content/projects/jktdrive.md` is the genuinely differentiating work — a Jakarta-specific
VLM driving benchmark with a real dataset (273 human-annotated scenes) and a real
evaluation across five models. It currently sits in a grid beside three fabrications. The
fake work actively devalues the real work.

- [ ] Delete `content/projects/aura.md` (invented "40% faster", fake cover image path).
- [ ] Delete `content/projects/nexus.md` (invented infrastructure, fake cover image path).
- [ ] Delete `content/projects/rulaa.md` (invented "75% size reduction", fake cover image).
- [ ] Delete `content/publications/edge-ml.md` (`url: https://example.com/...`).
- [ ] Delete `content/publications/reusable-ui.md` (`url: https://example.com/...`).
- [ ] Replace `"email": "contact@example.com"` in `content/data/profile.json` with a real
      address. A hero badge reading "Available for opportunities" above a dead contact
      address is the single worst pairing on the page.
- [ ] Re-audit the `competencies` claims in `profile.json` — anything of the form "shipped
      N production apps" needs to be true and, ideally, linkable.

Shipping with one real project is strictly better than shipping with four where three are
hollow.

### Rewrite JKTDrive as a case study

`content/projects/jktdrive.md` is currently a GitHub README pasted into a portfolio. Wrong
register for the audience.

- [ ] Restructure to **problem → approach → result**. Lead with the finding, not the repo.
- [ ] Surface the evaluation result as a visual, not a paragraph. GPT-5 86.90% vs
      InternVL2.5 86.45% across three categories is the most credible asset on the site and
      it is currently buried in prose.
- [ ] Cut the `Dataset/` and `Result/` directory trees and the Utils file listing — link to
      the repo for those.
- [ ] Remove the Stargazers roster badge and the broken in-page anchors
      (`#-the-goal-of-vlmevalkit` does not exist on the rendered page).
- [ ] Resolve or remove the `TBD` BibTeX block. A citation block that says TBD reads as
      unfinished.
- [ ] Reduce emoji-prefixed headings — they read as README, not publication.

### Also needs your words

- [ ] `focus.body` in `profile.json` is a first draft paraphrased from the JKTDrive README.
      It is now the most prominent sentence on the page after the tagline, so it should be
      in your voice, not mine.
- [ ] The tagline — currently "I build and benchmark vision-language systems for messy,
      real-world roads." — likewise.

---

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

### 1.3 Section rhythm was inverted

`.section-padding` was `25px` on desktop and `80px` on mobile — the widest screens got the
least breathing room, so sections blurred into one scroll.

- [x] Corrected: `--section-gap` is 120px on desktop, stepping down to 64px on mobile.

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
- [~] **`<img>` instead of `next/image`.** Not actionable as written: `next.config.ts` sets
      `output: 'export'`, and the Next 16 static-export guide states the default image
      loader is unsupported there — hence the existing `images.unoptimized`. Added
      `loading="lazy"` / `decoding="async"` and empty `alt` on decorative covers instead.
      A real fix needs either a custom loader or pre-resizing the 4096×2048 JKTDrive cover
      before commit. **The two remaining eslint warnings are this, and are expected.**

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

The background renders seven real constellations over a scattered star field: Orion, Ursa
Major, Cassiopeia, Cygnus, Lyra, Scorpius, Crux. This also makes good on the README's
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

Motion is driven by **accumulated animating time**, not `THREE.Clock`: Clock keeps counting
while the loop is paused offscreen or in a hidden tab, so figures would teleport on resume.
The per-frame delta is clamped to 50ms so a stalled frame cannot jump the drift either. The
tilt stays deliberately shallow — a larger rotation would tip figures out of the tangent
plane that makes them recognisable.

### Data corrections found while verifying

- Scorpius had too few stars; the tail straightened into a diagonal and lost its hook. Now
  carries the full 15-star figure. A wrong declination on Tau Sco was fixed in passing.
- Orion gained Meissa so the head fixes its orientation.

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

**Browser (Chromium via Playwright, software WebGL):** 1440×900 and 390×844, both themes.
Canvas sizes correctly to the viewport, WebGL initialises, no console errors.
Constellations legible in the margins in dark *and* light mode, headline unobscured. Mobile
hamburger and stacked hero correct. Featured-card hierarchy working.

**Motion:** 0.647% of pixels change over 4s of floating (visible, still ambient); 0.000%
over 3s with the tab hidden, confirming the pause is real and the clock does not run on;
0.000% over 3.5s under `prefers-reduced-motion` with the canvas still drawn. Two frames 9s
apart show Scorpius and Crux in clearly different positions.

Playwright and pngjs were installed with `--no-save`; `package.json` is unchanged.

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

---

## Suggested next steps

1. **Phase 0 in full** — it changes whether a reader believes anything else on the page.
2. The JKTDrive case-study rewrite.
3. Put the `focus` card text and tagline in your own words.
4. Pre-resize the JKTDrive cover image (currently 4096×2048, served at full weight).
