import { getPublicationBySlug, getAllPublications } from '@/lib/content';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import SiteNav from '@/components/SiteNav';

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
      openGraph: {
        title: pub.title,
        description: pub.summary,
        type: "article",
      },
      twitter: {
        card: "summary_large_image",
        title: pub.title,
        description: pub.summary,
      },
    };
  } catch {
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
  } catch {
    notFound();
  }

  const all = getAllPublications();
  const index = all.findIndex((p) => p.slug === slug);
  const next = index >= 0 && all.length > 1 ? all[(index + 1) % all.length] : null;

  return (
    <>
      <SiteNav backHref="/#publications" backLabel="All publications" />

      <main id="main" className="container article-shell">
        <article className="article">
          <header className="article-header">
            <div className="article-tags">
              <span className="text-mono tag-pill">{pub.date}</span>
              <span className="text-mono tag-pill tag-pill-quiet">{pub.venue}</span>
            </div>
            <h1 className="heading-display article-title">{pub.title}</h1>
            <p className="article-summary">{pub.summary}</p>

            {pub.url && (
              <a
                href={pub.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-mono link-hover article-source"
              >
                Read original publication ↗
              </a>
            )}
          </header>

          <div
            className="markdown-content"
            dangerouslySetInnerHTML={{ __html: pub.contentHtml }}
          />
        </article>

        <nav className="article-footer text-mono" aria-label="Publication navigation">
          <Link href="/#publications">← All publications</Link>
          {next && (
            <Link href={`/publications/${next.slug}`} className="article-next">
              <span>Next publication</span>
              {next.title} →
            </Link>
          )}
        </nav>
      </main>
    </>
  );
}
