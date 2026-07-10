import ThreeBackground from '@/components/ThreeBackground';
import { getProfileData, getAllProjects } from '@/lib/content';
import Link from 'next/link';

export default function Home() {
  const profile = getProfileData();
  const projects = getAllProjects();

  return (
    <main>
      <ThreeBackground />
      
      {/* Navigation */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 50, backdropFilter: 'blur(10px)', background: 'color-mix(in oklch, var(--bg) 82%, transparent)', borderBottom: '1px solid var(--border)' }}>
        <div className="container" style={{ padding: '18px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <a href="/" className="heading-display" style={{ fontSize: '18px' }}>{profile.name}</a>
          <div style={{ display: 'flex', gap: '32px', fontSize: '13px' }} className="text-mono">
            <a href="#work" style={{ color: 'var(--text-muted)' }}>Work</a>
            <a href="#about" style={{ color: 'var(--text-muted)' }}>About</a>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ position: 'relative', overflow: 'hidden', padding: '96px 0 80px', zIndex: 1 }} className="container">
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '60px', alignItems: 'start' }} className="hero-grid">
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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1px', marginTop: '12px', border: '1px solid var(--border)', borderRadius: '14px', overflow: 'hidden', background: 'var(--border)' }}>
            {profile.stats.map((stat, idx) => (
              <div key={idx} style={{ background: 'var(--card)', padding: '22px 20px' }}>
                <div className="heading-display" style={{ fontSize: '28px' }}>{stat.value}</div>
                <div className="text-mono" style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px' }}>{stat.label} {stat.subtext}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Work Section */}
      <section id="work" className="container" style={{ padding: '40px 28px 90px', position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '36px', borderBottom: '1px solid var(--border)', paddingBottom: '18px' }}>
          <h2 className="heading-display" style={{ fontSize: '14px', letterSpacing: '0.08em', color: 'var(--text-faint)', textTransform: 'uppercase', margin: 0 }}>Selected Work</h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '28px' }} className="work-grid">
          {projects.map((project) => (
            <Link href={`/projects/${project.slug}`} key={project.slug} style={{ display: 'flex', flexDirection: 'column', border: '1px solid var(--border)', borderRadius: '16px', overflow: 'hidden', background: 'var(--card)', color: 'inherit' }}>
              <div style={{ aspectRatio: '16/10', backgroundImage: 'repeating-linear-gradient(135deg, var(--bg-alt) 0px, var(--bg-alt) 14px, var(--card) 14px, var(--card) 28px)', borderBottom: '1px solid var(--border)' }} />
              <div style={{ padding: '26px 26px 28px' }}>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }}>
                  {project.tags.map((tag) => (
                    <span key={tag} className="text-mono" style={{ fontSize: '11px', color: 'var(--accent-dim)', background: 'var(--accent-soft)', padding: '4px 10px', borderRadius: '100px' }}>
                      {tag}
                    </span>
                  ))}
                </div>
                <h3 className="heading-display" style={{ fontSize: '22px', margin: '0 0 8px' }}>{project.title}</h3>
                <p style={{ fontSize: '14.5px', lineHeight: 1.6, color: 'var(--text-muted)', margin: '0 0 16px' }}>{project.summary}</p>
                <span className="text-mono" style={{ fontSize: '12.5px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>Read case study →</span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
