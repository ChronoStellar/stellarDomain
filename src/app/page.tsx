import ThreeBackground from '@/components/ThreeBackground';

export default function Home() {
  return (
    <main>
      <ThreeBackground />
      
      {/* Navigation */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 50, backdropFilter: 'blur(10px)', background: 'color-mix(in oklch, var(--bg) 82%, transparent)', borderBottom: '1px solid var(--border)' }}>
        <div className="container" style={{ padding: '18px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <a href="/" className="heading-display" style={{ fontSize: '18px' }}>Portfolio</a>
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
              Dynamic Next.js Portfolio.
            </h1>
            <p style={{ fontSize: '18px', lineHeight: 1.6, color: 'var(--text-muted)', maxWidth: '560px', margin: '0 0 34px' }}>
              This is the initial setup. Soon, this content will be populated dynamically from your markdown and JSON files!
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
