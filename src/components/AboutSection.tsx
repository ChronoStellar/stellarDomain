"use client";

import { useRef, useState } from 'react';
import type { ProfileData } from '@/lib/content';

export default function AboutSection({ profile }: { profile: ProfileData }) {
  const [active, setActive] = useState(0);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const competencies = profile.competencies ?? [];

  // Roving focus: arrow keys move between tabs, Home/End jump to the ends.
  const onKeyDown = (e: React.KeyboardEvent) => {
    const last = competencies.length - 1;
    let next: number | null = null;

    if (e.key === 'ArrowRight') next = active === last ? 0 : active + 1;
    else if (e.key === 'ArrowLeft') next = active === 0 ? last : active - 1;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = last;

    if (next !== null) {
      e.preventDefault();
      setActive(next);
      tabRefs.current[next]?.focus();
    }
  };

  return (
    <section id="about" className="container section-padding" style={{ position: 'relative', zIndex: 1 }}>
      <div className="section-head">
        <h2 className="section-title">About</h2>
      </div>

      <div className="hero-grid about-grid">
        <div>
          {profile.about.map((paragraph, idx) => (
            <p key={idx} className="about-para">{paragraph}</p>
          ))}
        </div>

        {competencies.length > 0 && (
          <div className="competency">
            <div
              className="picker-container"
              role="tablist"
              aria-label="Core competencies"
              onKeyDown={onKeyDown}
            >
              {competencies.map((comp, idx) => (
                <button
                  key={comp.name}
                  type="button"
                  role="tab"
                  id={`competency-tab-${idx}`}
                  aria-selected={active === idx}
                  aria-controls={`competency-panel-${idx}`}
                  tabIndex={active === idx ? 0 : -1}
                  ref={(el) => { tabRefs.current[idx] = el; }}
                  onClick={() => setActive(idx)}
                  className="text-mono picker-btn"
                  data-active={active === idx}
                >
                  {comp.name}
                </button>
              ))}
            </div>

            <div
              role="tabpanel"
              id={`competency-panel-${active}`}
              aria-labelledby={`competency-tab-${active}`}
              tabIndex={0}
              className="competency-panel"
            >
              <h3 className="heading-display competency-title">{competencies[active].name}</h3>
              <p className="competency-desc">{competencies[active].description}</p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
