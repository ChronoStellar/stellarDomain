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

## Phase 1 — Why the design reads "standard"

The layout is competent and the token system is mostly well-built. What is missing is
hierarchy and a point of view. Five specific causes:

### 1.1 Everything has identical visual weight

Every block on the page is `1px solid var(--border)` + `16px` radius + `var(--card)`.
Project cards, publication cards, stat tiles, and the competency panel are visually
interchangeable — `WorkSection.tsx:81`, `page.tsx:96`, `AboutSection.tsx:58`. Nothing is
bigger, louder, or first. This is the primary cause of the template feeling.

- [ ] Break the uniform 2×2 grid. Give the featured project a full-width hero treatment
      with its result visual; smaller cards below.
- [ ] Establish at least three tiers of card weight instead of one.

### 1.2 Section headers hide their own content

`SELECTED WORK` renders at `14px`, uppercase, in `--text-faint` (`page.tsx:81`) — smaller
and fainter than the body text beneath it. This is a widely-copied house style, which is
exactly why it reads as generic.

- [ ] Either make section headings confident (28–32px, `--text`) or drop the
      faint-uppercase convention entirely. The current half-measure gets the downside of
      both.

### 1.3 Section rhythm is inverted

`globals.css:96` sets `.section-padding { padding: 25px 0; }` on desktop, and the mobile
override at `globals.css:117` raises it to `80px`. Desktop — where there is the most room —
gets the least breathing space, so sections blur into one continuous scroll.

- [ ] Fix the desktop/mobile padding inversion. Desktop should have the larger value.

### 1.4 Type has almost no range

`globals.css:16-17` defines `--mono` and `--sans` as the same family (`'Source Sans 3'`).
Every `.text-mono` element — tags, labels, nav links, buttons — therefore renders
identically to body copy. A three-font system was designed and a two-font system shipped,
losing the textural contrast the mono was meant to provide.

Body sizes in use: `18 / 16 / 14.5 / 13 / 12.5 / 12 / 11px`. Seven sizes, no scale, and the
gaps between 14.5 / 13 / 12.5 are imperceptible. Meanwhile the single real jump
(60px h1 → 18px body) has nothing in between.

- [ ] Assign a real monospace family to `--mono`, or remove `.text-mono` and stop implying
      a contrast that does not exist.
- [ ] Collapse the seven body sizes to a four-step scale.
- [ ] Add an intermediate step between the h1 and body copy.

### 1.5 The hero wastes the best real estate

The "stats" grid contains no statistics — it is two link tiles labeled "GitHub" and
"LinkedIn" (`profile.json:9-12`) wearing the visual costume of a metrics block. The
tagline, "building shippable intelligence," is phrasing common to most AI portfolios.

- [ ] Replace the stat tiles with real numbers (papers, dataset size, models evaluated,
      apps shipped) — or cut the grid and use the space for a photo.
- [ ] Rewrite the tagline around something specific. "Built a VLM benchmark for Jakarta
      traffic" is more memorable than any adjective.

### 1.6 The starfield is not earning its cost

`ThreeBackground.tsx` renders 2000 points at `size: 2` rotating at `0.0005` rad/frame
behind an `oklch(97.6%)` near-white background (`globals.css:3`). Invisible in light mode;
faint dust that reads as noise in dark mode. Cost: ~200KB of three.js, a WebGL context, and
a permanent `requestAnimationFrame` loop. It instantiates **twice** on the projects page
(fixed background plus footer).

- [ ] Decide: delete it and reclaim the bundle, or commit to it as a real signature
      (scroll-reactive, data-seeded, visible in light mode). The half-measure is worse than
      either choice.
- [ ] If kept, stop double-mounting it on `/projects`.

---

## Phase 2 — Bugs a visitor will actually hit

- [ ] **Theme flash (FOUC).** `ThemeToggle.tsx` applies the theme in `useEffect`, after
      hydration. Every dark-mode visitor gets a white flash on every page load — the first
      thing they see. Needs a blocking inline script in `<head>` that sets `data-theme`
      before first paint.
- [ ] **`Footer.tsx:19`** hardcodes `color: 'White'`, bypassing the token system. Works
      today only because the footer background happens to be `var(--text)`.
- [ ] **`Footer.tsx:15`** uses a raw apostrophe in JSX ("Let's"). Renders fine, but trips
      the lint config.
- [ ] **No mobile navigation.** At 640px, `globals.css:132` shrinks nav links to 12px with
      16px gaps, sitting beside the brand name and theme toggle. Three links + brand +
      toggle will crowd or wrap on a 375px screen. Needs a real menu.
- [ ] **The tag filter silently truncates.** `WorkSection.tsx:26` filters, then slices to 4.
      Filtering to a tag with more than 4 matches shows a partial list, and the "View all"
      escape hatch only renders when `filteredProjects.length > limit` — so some states show
      a truncated list with no way out and no indication anything was hidden.
- [ ] **Project detail pages dead-end.** No footer nav, no next/prev, no back-to-work link
      after the case study.
- [ ] **`<img>` instead of `next/image`** in three places — no responsive sizing. The
      JKTDrive cover is a 4096×2048 GitHub asset served at full weight to every visitor.

---

## Phase 3 — Accessibility

- [ ] Filter buttons in `WorkSection.tsx` need `aria-pressed`.
- [ ] Competency selectors in `AboutSection.tsx` are plain buttons — implement a proper
      tabs pattern (`role="tablist"` / `role="tab"` / `aria-selected`) with arrow-key
      navigation.
- [ ] No visible focus rings anywhere. Add them.
- [ ] No skip-to-content link.
- [ ] Contrast: `--text-faint` (`oklch(62%)`) on `--bg` (`oklch(97.6%)`) is roughly 3.6:1 —
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
