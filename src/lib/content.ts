import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { withBasePath } from './basePath';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import gfm from 'remark-gfm';
import remarkMath from 'remark-math';
import remarkRehype from 'remark-rehype';
import rehypeKatex from 'rehype-katex';
import rehypeStringify from 'rehype-stringify';

const contentDirectory = path.join(process.cwd(), 'content');

export interface ProjectMetadata {
  title: string;
  date: string;
  tags: string[];
  summary: string;
  slug: string;
  coverImage?: string;
  pinned?: boolean;
}

export interface PublicationMetadata {
  title: string;
  date: string;
  venue: string;
  url: string;
  summary: string;
  slug: string;
}

export interface ProfileData {
  name: string;
  tagline: string;
  bio: string[];
  about: string[];
  competencies: { name: string; description: string }[];
  email: string;
  /** Path or URL to the CV. Falls back to the email CTA when unset. */
  cv?: string;
  github: string;
  linkedin: string;
  focus?: {
    label: string;
    body: string;
    linkText?: string;
    linkHref?: string;
  };
}

/**
 * Markdown -> HTML, with LaTeX via KaTeX.
 *
 * `singleDollarTextMath: false` is deliberate: prose here contains bare prices
 * like "$0.01/request", and with single-dollar math enabled the parser treats
 * the next `$` as a closing delimiter and swallows the text between them.
 * Inline math therefore uses `$$...$$`.
 */
async function renderMarkdown(markdown: string): Promise<string> {
  const file = await unified()
    .use(remarkParse)
    .use(gfm)
    .use(remarkMath, { singleDollarTextMath: false })
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeKatex)
    .use(rehypeStringify, { allowDangerousHtml: true })
    .process(markdown);
  return rewriteHtmlAssetPaths(String(file));
}

/** Rewrite src="/..." in rendered markdown HTML so images resolve under basePath. */
function rewriteHtmlAssetPaths(html: string): string {
  const base = process.env.NEXT_PUBLIC_BASE_PATH ?? '';
  if (!base) return html;
  return html.replace(/(<img\b[^>]*?\bsrc=")(\/[^"]*)(")/g, (_m, a, url, c) => `${a}${withBasePath(url)}${c}`);
}

export function getProfileData(): ProfileData {
  const filePath = path.join(contentDirectory, 'data', 'profile.json');
  if (!fs.existsSync(filePath)) {
    return {
      name: 'Your Name',
      tagline: 'Your Tagline',
      bio: [],
      about: [],
      competencies: [],
      email: '',
      github: '',
      linkedin: '',
    };
  }
  const fileContents = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(fileContents);
}

export function getAllProjects(): ProjectMetadata[] {
  const projectsDir = path.join(contentDirectory, 'projects');
  if (!fs.existsSync(projectsDir)) return [];

  const fileNames = fs.readdirSync(projectsDir);
  const allProjectsData = fileNames
    .filter(fileName => fileName.endsWith('.md'))
    .map(fileName => {
      // Remove ".md" from file name to get slug
      const slug = fileName.replace(/\.md$/, '');
      const fullPath = path.join(projectsDir, fileName);
      const fileContents = fs.readFileSync(fullPath, 'utf8');

      // Use gray-matter to parse the project metadata section
      const matterResult = matter(fileContents);

      return {
        slug,
        ...(matterResult.data as Omit<ProjectMetadata, 'slug'>),
      };
    });

  // Sort projects by pinned status, then by date
  return allProjectsData.sort((a, b) => {
    const aPinned = a.pinned || false;
    const bPinned = b.pinned || false;
    
    if (aPinned !== bPinned) {
      return aPinned ? -1 : 1;
    }
    
    // Fall back to date sorting
    if (a.date < b.date) return 1;
    if (a.date > b.date) return -1;
    return 0;
  });
}

export async function getProjectBySlug(slug: string) {
  const fullPath = path.join(contentDirectory, 'projects', `${slug}.md`);
  const fileContents = fs.readFileSync(fullPath, 'utf8');

  // Use gray-matter to parse the project metadata section
  const matterResult = matter(fileContents);

  // Use remark to convert markdown into HTML string
  const processedContent = await renderMarkdown(matterResult.content);
  const contentHtml = processedContent;

  return {
    slug,
    contentHtml,
    ...(matterResult.data as Omit<ProjectMetadata, 'slug'>),
  };
}

export function getAllPublications(): PublicationMetadata[] {
  const publicationsDir = path.join(contentDirectory, 'publications');
  if (!fs.existsSync(publicationsDir)) return [];

  const fileNames = fs.readdirSync(publicationsDir);
  const allPublicationsData = fileNames
    .filter(fileName => fileName.endsWith('.md'))
    .map(fileName => {
      const slug = fileName.replace(/\.md$/, '');
      const fullPath = path.join(publicationsDir, fileName);
      const fileContents = fs.readFileSync(fullPath, 'utf8');

      const matterResult = matter(fileContents);

      return {
        slug,
        ...(matterResult.data as Omit<PublicationMetadata, 'slug'>),
      };
    });

  return allPublicationsData.sort((a, b) => {
    if (a.date < b.date) return 1;
    return -1;
  });
}

export async function getPublicationBySlug(slug: string) {
  const fullPath = path.join(contentDirectory, 'publications', `${slug}.md`);
  const fileContents = fs.readFileSync(fullPath, 'utf8');

  const matterResult = matter(fileContents);

  const processedContent = await renderMarkdown(matterResult.content);
  const contentHtml = processedContent;

  return {
    slug,
    contentHtml,
    ...(matterResult.data as Omit<PublicationMetadata, 'slug'>),
  };
}

