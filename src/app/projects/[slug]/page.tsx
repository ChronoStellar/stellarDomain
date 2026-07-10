import { getProjectBySlug, getAllProjects } from '@/lib/content';
import { notFound } from 'next/navigation';
import Link from 'next/link';

export async function generateStaticParams() {
  const projects = getAllProjects();
  return projects.map((project) => ({
    slug: project.slug,
  }));
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
        <Link href="/" className="text-mono" style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
          ← Back to Home
        </Link>
      </nav>

      <article style={{ maxWidth: '800px', margin: '0 auto', paddingBottom: '100px' }}>
        <header style={{ marginBottom: '40px' }}>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
            {project.tags.map((tag) => (
              <span key={tag} className="text-mono" style={{ fontSize: '11px', color: 'var(--accent-dim)', background: 'var(--accent-soft)', padding: '4px 10px', borderRadius: '100px' }}>
                {tag}
              </span>
            ))}
          </div>
          <h1 className="heading-display" style={{ fontSize: '48px', margin: '0 0 16px' }}>{project.title}</h1>
          <p style={{ fontSize: '18px', color: 'var(--text-muted)', lineHeight: 1.6 }}>{project.summary}</p>
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
