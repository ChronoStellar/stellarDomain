import { getProfileData } from '@/lib/content';
import ThreeBackground from './ThreeBackground';

export default function Footer() {
  const profile = getProfileData();

  return (
    <footer id="contact" style={{ background: 'var(--text)', color: 'var(--bg)', position: 'relative', overflow: 'hidden', marginTop: 'auto' }}>
      <ThreeBackground isFixed={false} color={0xffffff} />
      
      <div className="container" style={{ padding: '90px 28px 60px', position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '40px', marginBottom: '60px', flexWrap: 'wrap' }}>
          <h2 className="heading-display" style={{ fontSize: '44px', margin: 0, maxWidth: '520px', lineHeight: 1.1 }}>
            Let's build something worth shipping.
          </h2>
          <a 
            href={`mailto:${profile.email}`} 
            className="text-mono" 
            style={{ fontSize: '14px', padding: '14px 24px', background: 'var(--bg)', color: 'var(--text)', borderRadius: '100px', whiteSpace: 'nowrap' }}
          >
            {profile.email}
          </a>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '20px', flexWrap: 'wrap', borderTop: '1px solid color-mix(in oklch, var(--bg) 20%, transparent)', paddingTop: '24px' }}>
          <span className="text-mono" style={{ fontSize: '12px', color: 'color-mix(in oklch, var(--bg) 60%, transparent)' }}>
            © {new Date().getFullYear()} {profile.name}
          </span>
          <div style={{ display: 'flex', gap: '22px', fontSize: '12.5px' }} className="text-mono">
            {profile.github && (
              <a href={profile.github} style={{ color: 'var(--bg)' }} target="_blank" rel="noopener noreferrer">GitHub</a>
            )}
            {profile.linkedin && (
              <a href={profile.linkedin} style={{ color: 'var(--bg)' }} target="_blank" rel="noopener noreferrer">LinkedIn</a>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}
