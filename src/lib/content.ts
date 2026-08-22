import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { remark } from 'remark';
import html from 'remark-html';

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
  github: string;
  linkedin: string;
  focus?: {
    label: string;
    body: string;
    linkText?: string;
    linkHref?: string;
  };
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
  const processedContent = await remark()
    .use(html)
    .process(matterResult.content);
  const contentHtml = processedContent.toString();

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

  const processedContent = await remark()
    .use(html)
    .process(matterResult.content);
  const contentHtml = processedContent.toString();

  return {
    slug,
    contentHtml,
    ...(matterResult.data as Omit<PublicationMetadata, 'slug'>),
  };
}

