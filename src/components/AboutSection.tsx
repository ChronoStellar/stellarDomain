"use client";

import { useState } from 'react';
import type { ProfileData } from '@/lib/content';

export default function AboutSection({ profile }: { profile: ProfileData }) {
  const [activeCompetency, setActiveCompetency] = useState<number>(0);

  return (
    <section id="about" className="container" style={{ padding: '0 28px 120px', position: 'relative', zIndex: 1 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '36px', borderBottom: '1px solid var(--border)', paddingBottom: '18px' }}>
        <h2 className="heading-display" style={{ fontSize: '14px', letterSpacing: '0.08em', color: 'var(--text-faint)', textTransform: 'uppercase', margin: 0 }}>About Me</h2>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '80px', alignItems: 'start' }} className="hero-grid">
        {/* Left: Bio Text */}
        <div>
          {profile.about.map((paragraph, idx) => (
            <p key={idx} style={{ fontSize: '18px', lineHeight: 1.6, color: 'var(--text-muted)', marginBottom: '24px' }}>
              {paragraph}
            </p>
          ))}
        </div>
        
        {/* Right: Competencies Picker */}
        {profile.competencies && profile.competencies.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Picker Header / Buttons */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
              {profile.competencies.map((comp, idx) => (
                <button
                  key={comp.name}
                  onClick={() => setActiveCompetency(idx)}
                  className="text-mono"
                  style={{
                    background: activeCompetency === idx ? 'var(--accent)' : 'var(--card)',
                    color: activeCompetency === idx ? '#fff' : 'var(--text-muted)',
                    border: '1px solid',
                    borderColor: activeCompetency === idx ? 'var(--accent)' : 'var(--border)',
                    padding: '8px 16px',
                    borderRadius: '100px',
                    fontSize: '12.5px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {comp.name}
                </button>
              ))}
            </div>
            
            {/* Display active competency description */}
            <div style={{ padding: '24px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '16px' }}>
              <h3 className="heading-display" style={{ fontSize: '20px', margin: '0 0 12px', color: 'var(--text)' }}>
                {profile.competencies[activeCompetency].name}
              </h3>
              <p style={{ fontSize: '15px', lineHeight: 1.6, color: 'var(--text-muted)', margin: 0 }}>
                {profile.competencies[activeCompetency].description}
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
