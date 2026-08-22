import ThreeBackground from '@/components/ThreeBackground';
import { getProfileData, getAllProjects, getAllPublications } from '@/lib/content';
import Link from 'next/link';
import WorkSection from '@/components/WorkSection';
import AboutSection from '@/components/AboutSection';
import SiteNav from '@/components/SiteNav';

export default function Home() {
  const profile = getProfileData();
  const projects = getAllProjects();
  const publications = getAllPublications();

  return (
    <>
      <ThreeBackground />
      <SiteNav brand={profile.name} />

      <main id="main">
        {/* Hero */}
        <section className="container hero-padding hero">
          <div className="hero-grid">
            <div>
              <div className="text-mono hero-badge">
                <span className="hero-badge-dot" aria-hidden="true" />
                Available for opportunities
              </div>
              <h1 className="heading-display h1-title hero-title">{profile.tagline}</h1>
              {profile.bio.map((paragraph, idx) => (
                <p key={idx} className="hero-bio">{paragraph}</p>
              ))}
              <div className="hero-links text-mono">
                <a href={`mailto:${profile.email}`} className="hero-cta">Get in touch</a>
                {profile.github && (
                  <a href={profile.github} target="_blank" rel="noopener noreferrer" className="hero-link">
                    GitHub ↗
                  </a>
                )}
                {profile.linkedin && (
                  <a href={profile.linkedin} target="_blank" rel="noopener noreferrer" className="hero-link">
                    LinkedIn ↗
                  </a>
                )}
              </div>
            </div>

            {/* A claim rather than a metrics grid: the counts available here
                (dataset size, category count) measure effort, not outcome, and
                the headline accuracy figure belongs to the models, not the author. */}
            {profile.focus && (
              <aside className="focus-card">
                <span className="text-mono focus-label">{profile.focus.label}</span>
                <p className="focus-body">{profile.focus.body}</p>
                {profile.focus.linkHref && profile.focus.linkText && (
                  <Link href={profile.focus.linkHref} className="text-mono link-hover focus-link">
                    {profile.focus.linkText} →
                  </Link>
                )}
              </aside>
            )}
          </div>
        </section>

        <WorkSection projects={projects} limit={4} />

        {publications.length > 0 && (
          <section id="publications" className="container section-padding" style={{ position: 'relative', zIndex: 1 }}>
            <div className="section-head">
              <h2 className="section-title">Publications</h2>
            </div>

            <ul className="pub-list">
              {publications.map((pub) => (
                <li key={pub.slug}>
                  <Link href={`/publications/${pub.slug}`} className="card-hover pub-card">
                    <span className="text-mono pub-meta">{pub.date} · {pub.venue}</span>
                    <h3 className="heading-display pub-title">{pub.title}</h3>
                    <p className="pub-summary">{pub.summary}</p>
                    <span className="text-mono link-hover pub-cta">Read publication →</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <AboutSection profile={profile} />
      </main>
    </>
  );
}
