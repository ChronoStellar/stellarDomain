import { getProjectBySlug, getAllProjects } from '@/lib/content';
import { notFound } from 'next/navigation';
import Link from 'next/link';

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
    };
  } catch (e) {
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
  } catch (e) {
    notFound();
  }

  return (
    <main style={{ position: 'relative', zIndex: 1 }} className="container">
      <nav style={{ padding: '32px 0', borderBottom: '1px solid var(--border)', marginBottom: '40px' }}>
        <Link href="/" className="text-mono link-hover" style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
          ← Back to home
        </Link>
      </nav>

      <article style={{ maxWidth: '800px', margin: '0 auto', paddingBottom: '100px' }}>
        <header style={{ marginBottom: '40px' }}>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
            {project.tags.map(tag => (
              <span key={tag} className="text-mono" style={{ fontSize: '12px', color: 'var(--accent)', background: 'var(--accent-soft)', padding: '6px 12px', borderRadius: '100px' }}>
                {tag}
              </span>
            ))}
          </div>
          <h1 className="heading-display h1-title" style={{ fontSize: '48px', margin: '0 0 24px', lineHeight: 1.1 }}>{project.title}</h1>
          <p style={{ fontSize: '20px', color: 'var(--text-faint)', margin: '0 0 40px', lineHeight: 1.5 }}>{project.summary}</p>
          
          {project.coverImage && (
            <div style={{ width: '100%', aspectRatio: '16/9', overflow: 'hidden', borderRadius: '16px', border: '1px solid var(--border)' }}>
              <img src={project.coverImage} alt={project.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          )}
        </header>

        <div 
          className="markdown-content" 
          dangerouslySetInnerHTML={{ __html: project.contentHtml }} 
          style={{ lineHeight: 1.8, fontSize: '16px', color: 'var(--text)' }}
        />
      </article>
    </main>
  );
}
