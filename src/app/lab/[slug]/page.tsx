import { getLabProjectBySlug, getAllLabProjects } from '@/lib/content';
import { withBasePath } from '@/lib/basePath';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import SiteNav from '@/components/SiteNav';

function statusClassName(status?: string): string {
  if (!status) return 'status-default';
  const lower = status.toLowerCase();
  if (lower.includes('proto')) return 'status-prototype';
  if (lower.includes('explor')) return 'status-exploration';
  if (lower.includes('poc') || lower.includes('proof')) return 'status-poc';
  if (lower.includes('wip') || lower.includes('progress')) return 'status-wip';
  if (lower.includes('archive')) return 'status-archived';
  return 'status-default';
}

export async function generateStaticParams() {
  const items = getAllLabProjects();
  return items.map((item) => ({
    slug: item.slug,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  try {
    const item = await getLabProjectBySlug(slug);
    return {
      title: `${item.title} | The Lab`,
      description: item.summary,
      openGraph: {
        title: item.title,
        description: item.summary,
        type: 'article',
        images: item.coverImage ? [item.coverImage] : [],
      },
      twitter: {
        card: 'summary_large_image',
        title: item.title,
        description: item.summary,
        images: item.coverImage ? [item.coverImage] : [],
      },
    };
  } catch {
    return {
      title: 'Lab Note Not Found',
    };
  }
}

export default async function LabDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  let item;
  try {
    item = await getLabProjectBySlug(slug);
  } catch {
    notFound();
  }

  const all = getAllLabProjects();
  const index = all.findIndex((p) => p.slug === slug);
  const next = index >= 0 && all.length > 1 ? all[(index + 1) % all.length] : null;

  return (
    <>
      <SiteNav backHref="/lab" backLabel="All lab notes" />

      <main id="main" className="container article-shell">
        <article className="article">
          <header className="article-header">
            <div className="lab-article-meta">
              {item.status && (
                <span className={`text-mono status-pill ${statusClassName(item.status)}`}>
                  <span className="status-dot" aria-hidden="true" />
                  {item.status}
                </span>
              )}
              <time className="text-mono lab-date" dateTime={item.date}>
                {item.date}
              </time>
            </div>

            <div className="article-tags" style={{ marginTop: '12px' }}>
              {item.tags.map((tag) => (
                <span key={tag} className="text-mono tag-pill">
                  {tag}
                </span>
              ))}
            </div>

            <h1 className="heading-display article-title">{item.title}</h1>
            <p className="article-summary">{item.summary}</p>

            {item.highlight && (
              <div className="lab-highlight lab-highlight-detail">
                <span className="text-mono lab-highlight-label">The Spark / Key Insight</span>
                <p className="lab-highlight-text">{item.highlight}</p>
              </div>
            )}

            {(item.github || item.demo) && (
              <div className="lab-article-links text-mono">
                {item.github && (
                  <a
                    href={item.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="lab-action-btn"
                  >
                    View GitHub Repo ↗
                  </a>
                )}
                {item.demo && (
                  <a
                    href={item.demo}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="lab-action-btn lab-action-btn-primary"
                  >
                    Open Live Demo ↗
                  </a>
                )}
              </div>
            )}

            {item.coverImage && (
              <div className="article-cover" style={{ marginTop: '28px' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={withBasePath(item.coverImage)} alt="" decoding="async" />
              </div>
            )}
          </header>

          <div
            className="markdown-content"
            dangerouslySetInnerHTML={{ __html: item.contentHtml }}
          />
        </article>

        <nav className="article-footer text-mono" aria-label="Lab navigation">
          <Link href="/lab">← All lab notes</Link>
          {next && (
            <Link href={`/lab/${next.slug}`} className="article-next">
              <span>Next experiment</span>
              {next.title} →
            </Link>
          )}
        </nav>
      </main>
    </>
  );
}
