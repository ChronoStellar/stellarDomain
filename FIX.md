# Portfolio Fix List

A prioritized punch list from a UI/UX + recruiter-perspective review of the site as of
2026-08-22 (branch `ui-add`). Ordered by impact on a hiring reader, not by effort.

Phases are meant to be shipped in order. Phase 0 matters more than everything below it
combined.

---

## Phase 0 — Credibility (blocking)

**The problem:** roughly half the content is placeholder. Three of four projects and both
publications are fabricated, complete with invented metrics. A reader who clicks
"Read publication →" lands on `example.com` and then stops trusting the one project that
is real.

`content/projects/jktdrive.md` is the genuinely differentiating work — a Jakarta-specific
VLM driving benchmark with a real dataset (273 human-annotated scenes) and a real
evaluation across five models. It currently sits in a uniform grid beside three
fabrications, styled identically. The fake work is actively devaluing the real work.

- [ ] Delete `content/projects/aura.md` (invented "40% faster", fake cover image path).
- [ ] Delete `content/projects/nexus.md` (invented infrastructure, fake cover image path).
- [ ] Delete `content/projects/rulaa.md` (invented "75% size reduction", fake cover image).
- [ ] Delete `content/publications/edge-ml.md` (`url: https://example.com/...`).
- [ ] Delete `content/publications/reusable-ui.md` (`url: https://example.com/...`).
- [ ] Replace `"email": "contact@example.com"` in `content/data/profile.json:6` with a real
      address. A hero badge reading "AVAILABLE FOR OPPORTUNITIES" above a dead contact
      address is the single worst pairing on the page.
- [ ] Re-audit `content/data/profile.json` competency claims — "shipped 5 production iOS
      applications" needs to be true and, ideally, linkable.

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

---

## Phase 1 — Why the design reads "standard" — DONE

The layout is competent and the token system is mostly well-built. What is missing is
hierarchy and a point of view. Five specific causes:

### 1.1 Everything has identical visual weight

Every block on the page is `1px solid var(--border)` + `16px` radius + `var(--card)`.
Project cards, publication cards, stat tiles, and the competency panel are visually
interchangeable — `WorkSection.tsx:81`, `page.tsx:96`, `AboutSection.tsx:58`. Nothing is
bigger, louder, or first. This is the primary cause of the template feeling.

- [x] Break the uniform 2×2 grid. Give the featured project a full-width hero treatment
      with its result visual; smaller cards below.
- [x] Establish at least three tiers of card weight instead of one.

### 1.2 Section headers hide their own content

`SELECTED WORK` renders at `14px`, uppercase, in `--text-faint` (`page.tsx:81`) — smaller
and fainter than the body text beneath it. This is a widely-copied house style, which is
exactly why it reads as generic.

- [x] Either make section headings confident (28–32px, `--text`) or drop the
      faint-uppercase convention entirely. The current half-measure gets the downside of
      both.

### 1.3 Section rhythm is inverted

`globals.css:96` sets `.section-padding { padding: 25px 0; }` on desktop, and the mobile
override at `globals.css:117` raises it to `80px`. Desktop — where there is the most room —
gets the least breathing space, so sections blur into one continuous scroll.

- [x] Fix the desktop/mobile padding inversion. Desktop should have the larger value.

### 1.4 Type has almost no range

`globals.css:16-17` defines `--mono` and `--sans` as the same family (`'Source Sans 3'`).
Every `.text-mono` element — tags, labels, nav links, buttons — therefore renders
identically to body copy. A three-font system was designed and a two-font system shipped,
losing the textural contrast the mono was meant to provide.

Body sizes in use: `18 / 16 / 14.5 / 13 / 12.5 / 12 / 11px`. Seven sizes, no scale, and the
gaps between 14.5 / 13 / 12.5 are imperceptible. Meanwhile the single real jump
(60px h1 → 18px body) has nothing in between.

- [x] Assign a real monospace family to `--mono`, or remove `.text-mono` and stop implying
      a contrast that does not exist.
- [x] Collapse the seven body sizes to a four-step scale.
- [x] Add an intermediate step between the h1 and body copy.

### 1.5 The hero wastes the best real estate

The "stats" grid contains no statistics — it is two link tiles labeled "GitHub" and
"LinkedIn" (`profile.json:9-12`) wearing the visual costume of a metrics block. The
tagline, "building shippable intelligence," is phrasing common to most AI portfolios.

- [x] Replace the stat tiles. **First attempt was wrong and has been reverted.** Real
      figures (273 scenes / 5 models / 14 categories / 86.9%) turned out just as hollow as
      the GitHub-and-LinkedIn tiles they replaced: dataset size and category count measure
      *effort spent*, not outcome, and the 86.9% headline is GPT-5's score — someone else's
      model presented as an achievement. Stat grids only work when the numbers are
      self-evidently impressive without context, which early-career research work rarely
      has. Replaced with a `focus` card stating the claim instead: existing driving
      benchmarks assume Western roads; JKTDrive does not. Numbers belong in the case study,
      where they have a frame of reference.
- [x] Rewrite the tagline around something specific. Now: "I build and benchmark
      vision-language systems for messy, real-world roads." Revise to taste.

### 1.6 The starfield is not earning its cost

`ThreeBackground.tsx` renders 2000 points at `size: 2` rotating at `0.0005` rad/frame
behind an `oklch(97.6%)` near-white background (`globals.css:3`). Invisible in light mode;
faint dust that reads as noise in dark mode. Cost: ~200KB of three.js, a WebGL context, and
a permanent `requestAnimationFrame` loop. It instantiates **twice** on the projects page
(fixed background plus footer).

- [x] Decide: delete it and reclaim the bundle, or commit to it as a real signature
      (scroll-reactive, data-seeded, visible in light mode). The half-measure is worse than
      either choice.
- [x] If kept, stop double-mounting it on `/projects`.

---

## Phase 2 — Bugs a visitor will actually hit — DONE

- [x] **Theme flash (FOUC).** `ThemeToggle.tsx` applies the theme in `useEffect`, after
      hydration. Every dark-mode visitor gets a white flash on every page load — the first
      thing they see. Needs a blocking inline script in `<head>` that sets `data-theme`
      before first paint.
- [x] **`Footer.tsx:19`** hardcodes `color: 'White'`, bypassing the token system. Works
      today only because the footer background happens to be `var(--text)`.
- [x] **`Footer.tsx:15`** uses a raw apostrophe in JSX ("Let's"). Renders fine, but trips
      the lint config.
- [x] **No mobile navigation.** At 640px, `globals.css:132` shrinks nav links to 12px with
      16px gaps, sitting beside the brand name and theme toggle. Three links + brand +
      toggle will crowd or wrap on a 375px screen. Needs a real menu.
- [x] **The tag filter silently truncates.** `WorkSection.tsx:26` filters, then slices to 4.
      Filtering to a tag with more than 4 matches shows a partial list, and the "View all"
      escape hatch only renders when `filteredProjects.length > limit` — so some states show
      a truncated list with no way out and no indication anything was hidden.
- [x] **Project detail pages dead-end.** No footer nav, no next/prev, no back-to-work link
      after the case study.
- [~] **`<img>` instead of `next/image`.** Not actionable as written: `next.config.ts`
      sets `output: 'export'`, and the Next 16 static-export guide states the default
      image loader is unsupported there — hence the existing `images.unoptimized`. Added
      `loading="lazy"` / `decoding="async"` and empty `alt` on decorative covers instead.
      Real fix is either a custom loader (Cloudinary et al.) or pre-resizing the 4096×2048
      JKTDrive cover before commit. The two remaining lint warnings are this, and expected.

---

## Phase 3 — Accessibility — DONE

- [x] Filter buttons in `WorkSection.tsx` need `aria-pressed`.
- [x] Competency selectors in `AboutSection.tsx` are plain buttons — implement a proper
      tabs pattern (`role="tablist"` / `role="tab"` / `aria-selected`) with arrow-key
      navigation.
- [x] No visible focus rings anywhere. Add them.
- [x] No skip-to-content link.
- [x] Contrast: `--text-faint` (`oklch(62%)`) on `--bg` (`oklch(97.6%)`) is roughly 3.6:1 —
      below WCAG AA for the 14px section headings that use it.

---

## Phase 4 — Notes, not blockers

- `dangerouslySetInnerHTML` on markdown that contains raw HTML (`jktdrive.md` has `<img>`,
  `<a>`, `<b>`). Acceptable for self-authored content; worth knowing if content sourcing
  ever changes.
- `README.md` describes features in aspirational terms ("Deep Content Analytics" for two
  profile links, "interconnected star constellations" for unconnected points). Worth
  aligning with what the code does.

---

## Suggested order

1. Phase 0 in full — it changes whether a reader believes anything else.
2. JKTDrive case-study rewrite.
3. 1.1 (break the grid) + 1.5 (fix the hero) — the two highest-leverage design moves.
4. Phase 2 FOUC fix.
5. Everything else.


---

## Execution log — 2026-08-22

Phases 1–3 implemented. Phase 0 (content deletion) deliberately left untouched — which
projects are real is the author's call.

**Verified:** `npm run build` passes (11 static pages), `tsc --noEmit` clean, `eslint`
0 errors / 2 expected `<img>` warnings. Contrast ratios computed numerically:
`--text-faint` on `--bg` went 3.40:1 (fail) → 5.14:1 (pass); all token pairs now clear
WCAG AA. Rendered markup checked over HTTP for the theme script's position in `<head>`,
the skip link, the featured card, real stat values, `aria-pressed`, and article nav.

**Not visually verified:** no headless browser is installed on this machine, so the
layout has not been seen rendered. Worth a look at localhost:3000 across a desktop and a
~375px viewport, in both themes.

### Files changed

- `src/app/layout.tsx` — `next/font` (Sora / Source Sans 3 / JetBrains Mono) replacing the
  render-blocking Google Fonts `@import`; blocking pre-paint theme script; skip link.
- `src/app/globals.css` — rewritten: four-step type scale, real `--mono`, fixed section
  rhythm, focus rings, per-theme starfield tokens, and extracted component classes
  replacing the inline styles.
- `src/components/SiteNav.tsx` — **new.** Shared header with a working mobile disclosure
  menu; replaces three copies of duplicated nav markup.
- `src/components/WorkSection.tsx` — featured/standard card tiers, `aria-pressed`, a
  result count, and an archive link that no longer strands filtered views.
- `src/components/AboutSection.tsx` — real tablist with roving arrow-key focus.
- `src/components/ThreeBackground.tsx` — theme-aware colors, two-layer scroll parallax,
  `IntersectionObserver` + visibility pausing, reduced-motion static frame, DPR cap.
- `src/components/ThemeToggle.tsx` — `useSyncExternalStore` over the `data-theme`
  attribute, so it reflects the pre-paint script instead of racing it.
- `src/components/Footer.tsx` — tokenised colors, escaped apostrophe, dropped the
  duplicate starfield mount.
- `src/app/page.tsx`, `src/app/projects/page.tsx`, `src/app/projects/[slug]/page.tsx`,
  `src/app/publications/[slug]/page.tsx` — shared nav, semantic markup, next/prev footers.
- `content/data/profile.json` — stats are now real figures from the JKTDrive work.
- `src/lib/content.ts` — `stats.subtext` relaxed to optional.

### Follow-ups this created

- `email` is still `contact@example.com` (Phase 0).
- Publication cards still point at `example.com` (Phase 0).


---

## Amendment — hero stats reverted

The stat grid added earlier the same day was removed. Reasoning recorded in 1.5 above; the
short version is that it measured inputs rather than outcomes and attributed a model's
benchmark score to the author. `profile.json` now carries a `focus` object
(`label` / `body` / `linkText` / `linkHref`) rendered as a bordered aside beside the hero
copy, and `ProfileData.stats` is gone from `src/lib/content.ts`.

The `focus.body` text is a first draft written from the JKTDrive README — worth rewriting
in your own voice, since it is now the most prominent sentence on the page after the
tagline.

Verified after the change: build passes (11 pages), `tsc --noEmit` clean, eslint 0 errors,
and the card confirmed in the served HTML with no orphaned `stat-tile` / `stats-grid` rules
left in the CSS. Still not visually verified — no browser on this machine.
