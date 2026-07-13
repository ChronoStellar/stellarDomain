# Portfolio Project Plan

## 1. Project Overview
The goal is to build a modern, dynamic portfolio website that supports "plug and play" content management. The user should be able to simply drop a Markdown (`.md`) or JSON file into a specific directory, and the website will automatically generate a new project page, publication page, or update the home page without requiring code changes. 

The design will be heavily inspired by the `v2-starry` sample, prioritizing a premium, visually stunning aesthetic with dynamic micro-interactions and a Three.js-powered background.

## 2. Technology Stack & Justification

### **Framework: Next.js (App Router)**
*Why Next.js over vanilla React (Vite/CRA)?*
Next.js is the perfect fit for a "plug and play" MD/JSON site. It provides:
1. **Server-Side Reading**: With React Server Components, we can read the file system (`fs`) directly to load your Markdown and JSON files without needing an external API.
2. **Static Site Generation (SSG)**: It builds your Markdown files into hyper-fast, SEO-friendly static pages at build time. 
3. **App Router**: Dynamic routing (e.g., `app/projects/[slug]/page.tsx`) makes it effortless to map files to URLs.

### **3D Graphics: Three.js**
To implement the `v2-starry` aesthetic, we will use Three.js. 
* We can use vanilla `three.js` initialized inside a React `useEffect` and attached to a `<canvas>` via `useRef`.
* Alternatively, we can use `@react-three/fiber` for a more declarative, React-friendly approach to building the 3D scene.

### **Styling: Vanilla CSS (CSS Modules)**
We will use standard CSS to achieve full control over the styling, utilizing custom properties (variables) for theming (like glassmorphism, subtle borders, and smooth gradients) as seen in the provided samples.

### **Content Parsing**
* **`gray-matter`**: To parse YAML frontmatter (metadata like title, date, tags) from Markdown files.
* **`next-mdx-remote` or `remark/rehype`**: To render Markdown content safely into React components.

## 3. Architecture & Data Flow

```text
stellarDomain/
├── content/               # Your Plug-and-Play directory
│   ├── projects/          # Drop project .md files here
│   │   ├── project-rulaa.md
│   │   └── project-buah-hati.md
│   ├── publications/      # Drop publication .md files here
│   └── data/              
│       └── profile.json   # General info, skills, links
├── src/
│   ├── app/               # Next.js App Router
│   │   ├── page.tsx       # Home page (parses profile.json & recent projects)
│   │   └── projects/
│   │       └── [slug]/    # Dynamic route for individual projects
│   │           └── page.tsx
│   ├── components/        
│   │   ├── ThreeBackground.tsx # The starry canvas
│   │   ├── ProjectCard.tsx
│   │   └── Navigation.tsx
│   ├── lib/               # Utility functions
│   │   └── content.ts     # Functions using 'fs' to read MD and JSON files
│   └── styles/            # Vanilla CSS files (globals, design system)
```

## 4. Implementation Phases

### Phase 1: Foundation & Setup
- [x] Initialize the Next.js project with App Router.
- [x] Install necessary dependencies: `three`, `gray-matter`, `remark`, `remark-html`.
- [x] Set up the global CSS based on the `v2-starry` color palette (oklch colors, modern fonts like Sora and Source Sans 3).

### Phase 2: The Three.js Integration
- [x] Create the `ThreeBackground` React component.
- [x] Extract the starry canvas logic from `v2-starry` and port it into a React `useEffect` hook.
- [x] Update ThreeBackground to support local absolute positioning and custom colors for sections.

### Phase 3: The Content Layer ("Plug and Play" System)
- [x] Create utility functions in `lib/content.ts` to read the `content/` directory.
- [x] Implement a parser that takes an `.md` file, extracts the frontmatter for metadata, and converts the body to HTML.
- [x] Create the JSON reader for the main profile data.

### Phase 4: Page Assembly & Routing
- [x] **Home Page**: Integrate the Three.js background, the navigation, and dynamically list the top projects by calling the content utilities.
- [x] **Dynamic Project Pages**: Implement `app/projects/[slug]/page.tsx` to automatically render any Markdown file.

### Phase 5: Polish & Premium Feel
- [x] Build and integrate the global Footer component matching the `v2-starry` aesthetic.
- [x] Implement publications support in the content layer.
- [x] Add micro-animations (hover effects, smooth transitions).
- [x] Ensure perfect responsiveness on mobile devices.
- [x] Apply SEO best practices (dynamic meta tags based on the Markdown frontmatter).

## 5. Next Steps for Us
1. Test adding additional markdown and JSON content.
