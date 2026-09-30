# Authoring Lab Content

The **Lab** (`/lab`) is a space for projects, experiments, and prototypes that are not polished production case studies, but still carry technical interest, unique constraints, interesting failure modes, or educational documentation.

All lab write-ups live in:
```
content/lab/<slug>.md
```

The filename determines the URL slug. For example, `content/lab/mlx-speculative-decoding.md` is served at `/lab/mlx-speculative-decoding`.

---

## 1. Frontmatter Contract

Fields map to `LabProjectMetadata` in `src/lib/content.ts`. All fields must match this contract:

```yaml
---
title: "Speculative Decoding on Apple Silicon with MLX"
date: "2026-08-14"
status: "Prototype"
tags: ["MLX", "Apple Silicon", "LLM", "Optimization"]
summary: "Testing whether draft model speculation with a 0.5B model can accelerate 4B on-device token generation without blowing through the thermal envelope."
highlight: "Draft model speculative decoding achieved a 1.8x speedup on freeform text, but collapsed under heavy verification rollbacks during structured JSON generation."
github: "https://github.com/ChronoStellar"
demo: "https://..."
coverImage: "/lab/speculative/hero.webp"
pinned: false
---
```

### Field Reference

| Field | Type | Required | Description |
|---|---|---|---|
| `title` | `string` | **Yes** | Heading for the card and documentation page. Rendered as `h1`. |
| `date` | `string` | **Yes** | Format: `YYYY-MM-DD` (zero-padded). Sorted as a string in descending order. |
| `status` | `string` | **Yes** | One of the recognized statuses (see below). Controls the badge style. |
| `tags` | `string[]` | **Yes** | Technologies or topics. Used for interactive filtering on `/lab`. |
| `summary` | `string` | **Yes** | 1–2 sentences explaining what the experiment is. Shown on cards & SEO. |
| `highlight` | `string` | Optional | "The Spark" / key takeaway callout. Displayed in an accent box. |
| `github` | `string` | Optional | Link to source repository. Renders action button/link. |
| `demo` | `string` | Optional | Link to interactive demo, testflight, or video. Renders action button. |
| `coverImage` | `string` | Optional | Path to image under `public/` (must start with `/`). |
| `pinned` | `boolean` | Optional | If `true`, pins the item to the top of the lab list. |

---

## 2. Status Taxonomy

Use one of these statuses to ensure the color-coded badge renders cleanly:

- **`Prototype`** (Amber/Gold badge): A functional implementation that works end-to-end, but has unpolished ergonomics, hardcoded constants, or rough edges.
- **`Exploration`** (Cyan/Sky badge): An investigation into a hypothesis, parameter space, or algorithmic boundary without necessarily building a complete product.
- **`Proof of Concept`** (Purple/Violet badge): A minimal test validating whether an architecture, math formulation, or sensor pipeline is technically viable.
- **`WIP`** (Green/Emerald badge): An active experiment currently in development.
- **`Archived`** (Muted gray badge): An experiment that reached a conclusion, was shelved, or was superseded by a different approach.

---

## 3. Editorial Guidelines & House Style

Unlike production case studies on `/projects`, Lab entries do not need to present a polished commercial narrative. Instead, they thrive on **technical honesty, concrete metrics, and transparent failure modes**:

1. **State the hypothesis early**: What specific problem or question were you trying to answer?
2. **Include real numbers**: Report latency (ms), token generation rate (tok/s), memory usage (MB/GB), or accuracy percentages rather than qualitative descriptions like "fast" or "lightweight".
3. **Document what broke**: Unpolished experiments often teach the most through their edge cases, rollbacks, or unexpected bottlenecks.
4. **Heading hierarchy**: Start the markdown body with `##`. The `title` frontmatter is already rendered as the page's `h1`.

### Recommended Section Structure

```markdown
## The hypothesis / The problem
What were you trying to achieve or test, and why?

## The approach & setup
Hardware, framework, model checkpoints, or mathematical pipeline.

## Implementation details
Include concise code snippets, shaders, or formulas.

## Observations & outcomes
Concrete measurements and benchmark tables.

## What broke / Failure modes
Where the assumptions failed or why it's not production-ready.

## Key takeaway
The lasting insight or how this informs future work.
```

---

## 4. Code, Math, and Assets

### LaTeX Math
KaTeX is configured with `singleDollarTextMath: false`.
- **Always use `$$...$$`**, even for inline symbols (e.g. `$$O(N \log N)$$` or `$$\Delta t$$`).
- Single dollar `$10/mo` is reserved for currency to prevent escaping bugs.

### Code Blocks
Always specify the language syntax tag:
````markdown
```swift
final class FilterPipeline { ... }
```
````

### Images
- Place images in `public/lab/<slug>/`.
- Reference with a leading slash:
  ```markdown
  ![Comparison Diagram](/lab/speculative/benchmark.webp)
  ```
- Optimize large PNGs/JPEGs using the project's optimization script:
  ```bash
  node scripts/optimize-images.mjs <folder>
  ```

### Video Embeds
Wrap iframes in `.video-embed` to maintain a 16:9 responsive aspect ratio:
```html
<div class="video-embed">
  <iframe src="https://drive.google.com/file/d/FILE_ID/preview" allow="autoplay" allowfullscreen></iframe>
</div>
```

---

## 5. Build & Validation

Always run the build and link checker before committing new lab entries:

```bash
NODE_ENV=production npm run build && node scripts/check-links.mjs
```

This verifies that:
1. Gray-matter frontmatter parses without syntax errors.
2. Dynamic routes at `/lab/[slug]` are statically generated.
3. All local images, internal links, and assets resolve with the appropriate GitHub Pages `basePath`.
