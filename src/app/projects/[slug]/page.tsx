import { getProjectBySlug, getAllProjects } from '@/lib/content';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import SiteNav from '@/components/SiteNav';

export async function generateStaticParams() {
  const projects = getAllProjects();
  return projects.map((project) => ({
    slug: project.slug,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  try {
    const project = await getProjectBySlug(slug);
    return {
      title: `${project.title} | Projects`,
      description: project.summary,
      openGraph: {
        title: project.title,
        description: project.summary,
        type: "article",
        images: project.coverImage ? [project.coverImage] : [],
      },
      twitter: {
        card: "summary_large_image",
        title: project.title,
        description: project.summary,
        images: project.coverImage ? [project.coverImage] : [],
      },
    };
  } catch {
    return {
      title: "Project Not Found",
    };
  }
}

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  let project;
  try {
    project = await getProjectBySlug(slug);
  } catch {
    notFound();
  }

  // Next project in the same order the listing uses, so the reader always has
  // somewhere to go after the case study.
  const all = getAllProjects();
  const index = all.findIndex((p) => p.slug === slug);
  const next = index >= 0 && all.length > 1 ? all[(index + 1) % all.length] : null;

  return (
    <>
      <SiteNav backHref="/#work" backLabel="All work" />

      <main id="main" className="container article-shell">
        <article className="article">
          <header className="article-header">
            <div className="article-tags">
              {project.tags.map((tag) => (
                <span key={tag} className="text-mono tag-pill">{tag}</span>
              ))}
            </div>
            <h1 className="heading-display article-title">{project.title}</h1>
            <p className="article-summary">{project.summary}</p>

            {project.coverImage && (
              <div className="article-cover">
                <img src={project.coverImage} alt="" decoding="async" />
              </div>
            )}
          </header>

          <div
            className="markdown-content"
            dangerouslySetInnerHTML={{ __html: project.contentHtml }}
          />
        </article>

        <nav className="article-footer text-mono" aria-label="Project navigation">
          <Link href="/projects">← All projects</Link>
          {next && (
            <Link href={`/projects/${next.slug}`} className="article-next">
              <span>Next project</span>
              {next.title} →
            </Link>
          )}
        </nav>
      </main>
    </>
  );
}
