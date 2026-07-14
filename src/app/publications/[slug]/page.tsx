import { getPublicationBySlug, getAllPublications } from '@/lib/content';
import { notFound } from 'next/navigation';
import Link from 'next/link';

export async function generateStaticParams() {
  const publications = getAllPublications();
  return publications.map((pub) => ({
    slug: pub.slug,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  try {
    const pub = await getPublicationBySlug(slug);
    return {
      title: `${pub.title} | Publications`,
      description: pub.summary,
    };
  } catch (e) {
    return {
      title: "Publication Not Found",
    };
  }
}

export default async function PublicationPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  let pub;
  try {
    pub = await getPublicationBySlug(slug);
  } catch (e) {
    notFound();
  }

  return (
    <main style={{ position: 'relative', zIndex: 1 }} className="container">
      <nav style={{ padding: '32px 0', borderBottom: '1px solid var(--border)', marginBottom: '40px' }}>
        <Link href="/#publications" className="text-mono link-hover" style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
          ← Back to home
        </Link>
      </nav>

      <article style={{ maxWidth: '800px', margin: '0 auto', paddingBottom: '100px' }}>
        <header style={{ marginBottom: '40px' }}>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
            <span className="text-mono" style={{ fontSize: '12px', color: 'var(--accent)', background: 'var(--accent-soft)', padding: '6px 12px', borderRadius: '100px' }}>
              {pub.date}
            </span>
            <span className="text-mono" style={{ fontSize: '12px', color: 'var(--text-muted)', border: '1px solid var(--border)', padding: '6px 12px', borderRadius: '100px' }}>
              {pub.venue}
            </span>
          </div>
          <h1 className="heading-display h1-title" style={{ fontSize: '48px', margin: '0 0 24px', lineHeight: 1.1 }}>{pub.title}</h1>
          <p style={{ fontSize: '20px', color: 'var(--text-faint)', margin: '0 0 24px', lineHeight: 1.5 }}>{pub.summary}</p>
          
          {pub.url && (
            <a href={pub.url} target="_blank" rel="noopener noreferrer" className="text-mono link-hover" style={{ fontSize: '14px', display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--accent)', textDecoration: 'none' }}>
              Read Original Publication ↗
            </a>
          )}
        </header>

        <div 
          className="markdown-content" 
          dangerouslySetInnerHTML={{ __html: pub.contentHtml }} 
          style={{ lineHeight: 1.8, fontSize: '16px', color: 'var(--text)' }}
        />
      </article>
    </main>
  );
}
