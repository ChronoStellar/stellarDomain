import ThreeBackground from '@/components/ThreeBackground';
import { getProfileData, getAllProjects, getAllPublications } from '@/lib/content';
import Link from 'next/link';
import WorkSection from '@/components/WorkSection';
import AboutSection from '@/components/AboutSection';

export default function Home() {
  const profile = getProfileData();
  const projects = getAllProjects();
  const publications = getAllPublications();

  return (
    <main>
      <ThreeBackground />
      
      {/* Navigation */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 50, backdropFilter: 'blur(10px)', background: 'color-mix(in oklch, var(--bg) 82%, transparent)', borderBottom: '1px solid var(--border)' }}>
        <div className="container nav-padding" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <a href="/" className="heading-display" style={{ fontSize: '18px' }}>{profile.name}</a>
          <div style={{ display: 'flex', fontSize: '13px' }} className="text-mono nav-links">
            <a href="#work" className="nav-link" style={{ color: 'var(--text-muted)' }}>Work</a>
            <a href="#publications" className="nav-link" style={{ color: 'var(--text-muted)' }}>Publications</a>
            <a href="#about" className="nav-link" style={{ color: 'var(--text-muted)' }}>About</a>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ position: 'relative', overflow: 'hidden', zIndex: 1 }} className="container hero-padding">
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', alignItems: 'start' }} className="hero-grid">
          <div>
            <div className="text-mono" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--accent)', letterSpacing: '0.06em', marginBottom: '20px' }}>
              ✦ AVAILABLE FOR OPPORTUNITIES
            </div>
            <h1 className="heading-display h1-title" style={{ fontSize: '60px', lineHeight: 1.05, margin: '0 0 22px' }}>
              {profile.tagline}
            </h1>
            {profile.bio.map((paragraph, idx) => (
              <p key={idx} style={{ fontSize: '18px', lineHeight: 1.6, color: 'var(--text-muted)', maxWidth: '560px', margin: '0 0 34px' }}>
                {paragraph}
              </p>
            ))}
          </div>
          
          {/* Stats */}
          <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1px', marginTop: '12px', border: '1px solid var(--border)', borderRadius: '14px', overflow: 'hidden', background: 'var(--border)' }}>
            {profile.stats.map((stat, idx) => {
              const Inner = (
                <div style={{ background: 'var(--card)', padding: '22px 20px', height: '100%', transition: 'background 0.2s ease' }} className={stat.url ? "card-hover" : ""}>
                  <div className="heading-display" style={{ fontSize: '24px', color: stat.url ? 'var(--accent)' : 'inherit' }}>{stat.value}</div>
                  <div className="text-mono" style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px' }}>{stat.label} {stat.subtext}</div>
                </div>
              );

              return stat.url ? (
                <a key={idx} href={stat.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
                  {Inner}
                </a>
              ) : (
                <div key={idx}>{Inner}</div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Work Section (Interactive) */}
      <WorkSection projects={projects} limit={4} />

      {/* Publications Section */}
      {publications.length > 0 && (
        <section id="publications" className="container section-padding" style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '36px', borderBottom: '1px solid var(--border)', paddingBottom: '18px' }}>
            <h2 className="heading-display" style={{ fontSize: '14px', letterSpacing: '0.08em', color: 'var(--text-faint)', textTransform: 'uppercase', margin: 0 }}>Publications</h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {publications.map((pub) => (
              <Link href={`/publications/${pub.slug}`} key={pub.slug} className="card-hover" style={{ display: 'flex', flexDirection: 'column', border: '1px solid var(--border)', borderRadius: '16px', overflow: 'hidden', background: 'var(--card)', padding: '26px', color: 'inherit' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span className="text-mono" style={{ fontSize: '12px', color: 'var(--accent-dim)' }}>{pub.date} • {pub.venue}</span>
                </div>
                <h3 className="heading-display" style={{ fontSize: '20px', margin: '0 0 10px' }}>{pub.title}</h3>
                <p style={{ fontSize: '14.5px', lineHeight: 1.6, color: 'var(--text-muted)', margin: '0 0 16px' }}>{pub.summary}</p>
                <span className="text-mono link-hover" style={{ fontSize: '12.5px', display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--text-main)' }}>
                  Read publication →
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* About Section */}
      <AboutSection profile={profile} />
    </main>
  );
}
