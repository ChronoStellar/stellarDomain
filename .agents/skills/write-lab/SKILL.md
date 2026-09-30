---
name: write-lab
description: Create or update an unpolished experiment, prototype note, or technical documentation page under content/lab/ for this portfolio. Use whenever adding a new lab entry, writing up an edge AI / CV / systems experiment, or editing lab frontmatter, benchmarks, and math.
---

# Writing Lab Content

The Lab (`/lab`) documents projects that are not necessarily polished or shipped to production, but explore an interesting constraint, hypothesis, or technical tradeoff.

Every lab entry is a Markdown file located at:
```
content/lab/<slug>.md
```

The filename directly forms the URL slug (e.g. `content/lab/metal-bilateral-filter.md` -> `/lab/metal-bilateral-filter`). Always use lowercase with hyphens.

---

## 1. Authoring Procedure

When authoring a new lab entry, follow these steps:

1. **Clarify the Core Question & Outcome**:
   - What was the hypothesis or motivation?
   - What status best fits? (`Prototype`, `Exploration`, `Proof of Concept`, `WIP`, or `Archived`)
   - What broke or didn't work as expected? (Crucial for lab authenticity)
   - What was the key numeric or architectural takeaway?

2. **Draft the Frontmatter**:
   Ensure all required keys are populated. Frontmatter is parsed with `gray-matter` by `src/lib/content.ts`.

3. **Write the Body**:
   Start body headings at `##` (the `title` is rendered automatically as `h1`). Structure with clear, honest technical prose.

4. **Verify Locally**:
   Run the static export build and link validator:
   ```bash
   NODE_ENV=production npm run build && node scripts/check-links.mjs
   ```

---

## 2. Frontmatter Contract

```yaml
---
title: "Speculative Decoding on Apple Silicon with MLX"
date: "2026-08-14"                          # YYYY-MM-DD, string-sorted, zero-pad month and day
status: "Prototype"                         # Prototype | Exploration | Proof of Concept | WIP | Archived
tags: ["MLX", "Apple Silicon", "LLM"]       # Array of strings for filter pills
summary: "Testing whether draft model speculation with a 0.5B model can accelerate 4B on-device token generation without blowing through the thermal envelope."
highlight: "Draft model speculative decoding achieved a 1.8x speedup on freeform text, but collapsed under heavy verification rollbacks during structured JSON generation."
github: "https://github.com/ChronoStellar"  # Optional repo link
demo: "https://..."                         # Optional demo link
coverImage: "/lab/speculative/hero.webp"    # Optional, must start with leading slash
pinned: false                               # Optional, pinned items sort first
---
```

### Status Badges
The UI assigns distinct color-coded badges based on `status`:
- `Prototype`: Amber / warm gold
- `Exploration`: Cyan / sky blue
- `Proof of Concept`: Purple / violet
- `WIP`: Emerald / green
- `Archived`: Muted slate gray

---

## 3. Formatting & Media Rules

### LaTeX Math
KaTeX is enabled with `singleDollarTextMath: false`.
- **Always use `$$...$$`**, even for inline math (e.g. `$$O(\sqrt{N})$$` or `$$\tau = 0.5$$`).
- Single dollar (`$`) is reserved for currency and prices (e.g. `$0.01/request`).

### Images
- Images live under `public/lab/<slug>/`.
- Always reference with a leading slash: `![Alt](/lab/<slug>/diagram.webp)`.
- Never reference `content/`.
- Optimize images using:
  ```bash
  node scripts/optimize-images.mjs <folder>
  ```

### Video Embeds
Wrap iframes in `<div class="video-embed">` to enforce 16:9 aspect ratio and prevent responsive mobile overflow:
```html
<div class="video-embed">
  <iframe src="https://drive.google.com/file/d/FILE_ID/preview" allow="autoplay" allowfullscreen></iframe>
</div>
```

---

## 4. House Style

- **Empirical & First-Person**: Use direct, grounded language.
- **Numbers over adjectives**: Say "achieved 42.7 tok/s down from 24.1 tok/s" instead of "much faster".
- **Celebrate failure modes**: Explaining why a promising approach failed (e.g., thermal throttling, rollback latency, edge artifacts) is what makes lab documentation valuable.
