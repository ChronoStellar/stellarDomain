# Stellar Domain Portfolio

A highly interactive, modern, and agentic-built portfolio website designed for developers, AI engineers, and researchers.

## Features

- **Dynamic Interactive 3D Background**: A fully customized Three.js canvas featuring interconnected star constellations that slowly rotate, giving a beautiful, deep-space aesthetic.
- **Markdown-Driven Content Engine**: Write your case studies, projects, and publications as `.md` files. They are automatically statically generated as dynamic routes (`/projects/[slug]`, `/publications/[slug]`).
- **Project Pinning**: Feature your best work! Add `pinned: true` to your project's frontmatter, and it will be promoted to the top of your homepage grid regardless of its date.
- **Auto-Pagination / Listing**: The homepage intelligently displays only your top 4 projects. If you have more, it gracefully displays a "View all X projects" button linking to a dedicated archive page.
- **Dynamic Skills & Tags Picker**: A beautiful toggle interface automatically extracts and displays unique tags from your projects, allowing users to filter your work by framework (e.g., Python, Swift, Next.js).
- **Responsive Mobile & iPad Design**: Fine-tuned layouts, robust grid flex-wrapping, and generous touch-targets provide an optimal native-feeling experience across all devices.
- **Deep Content Analytics**: The hero section highlights your key stats. Easily map links to your GitHub and LinkedIn right inside the profile data layer.

## Project Structure

- `content/projects/`: Place your Markdown project case studies here.
- `content/publications/`: Place your research papers, articles, and publications here.
- `content/data/profile.json`: Edit this single file to globally update your name, bio, tagline, about me section, competencies, and stat highlights!
- `src/app/page.tsx`: The primary homepage stitching all components together.
- `src/components/`: Reusable, heavily styled, interactive React components (like the custom `ThreeBackground.tsx`, `WorkSection.tsx`, etc.).
- `src/lib/content.ts`: The data layer responsible for parsing frontmatter and compiling markdown to HTML.

## Getting Started

First, install dependencies:

```bash
npm install
```

Then, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## What's Not Done Yet (Future Roadmap)

While the portfolio is structurally complete and fully responsive, here are a few enhancements you might consider exploring next:

1. **Dark/Light Mode Toggle**: The UI is currently hardcoded for a sleek Dark Mode space aesthetic. A toggle could invert colors for a 'daytime sky' theme.
2. **MDX Support**: Upgrade standard `remark-html` to MDX, allowing you to embed interactive React components directly inside your project and publication markdown files.
3. **SEO Optimization Meta Tags**: While Next.js handles basic titles, dynamic generation of Open Graph (OG) social card images for each project slug could improve shareability on Twitter and LinkedIn.
4. **Content Search Bar**: A fuzzy search overlay to find specific words or technologies across your entire Markdown corpus.
5. **View Counter**: Connecting to a database like Supabase or Vercel KV to track and display live read counts on your articles.

## Deployment

The easiest way to deploy this Next.js app is to use the [Vercel Platform](https://vercel.com/new). Since it is entirely statically generated, it will load instantly across their Edge network!
