"use client";

import { useState, useMemo } from 'react';
import Link from 'next/link';

// We import the ProjectMetadata type from the content layer
// Assuming you export it from @/lib/content
import type { ProjectMetadata } from '@/lib/content';

export default function WorkSection({ projects, limit }: { projects: ProjectMetadata[], limit?: number }) {
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // Extract all unique tags from all projects
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    projects.forEach(p => p.tags.forEach(tag => tags.add(tag)));
    return Array.from(tags).sort();
  }, [projects]);

  // Filter projects based on the selected tag
  const filteredProjects = useMemo(() => {
    if (!selectedTag) return projects;
    return projects.filter(p => p.tags.includes(selectedTag));
  }, [projects, selectedTag]);

  const displayProjects = limit ? filteredProjects.slice(0, limit) : filteredProjects;

  return (
    <section id="work" className="container section-padding" style={{ position: 'relative', zIndex: 1 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '24px', borderBottom: '1px solid var(--border)', paddingBottom: '18px', flexWrap: 'wrap', gap: '16px' }}>
        <h2 className="heading-display" style={{ fontSize: '14px', letterSpacing: '0.08em', color: 'var(--text-faint)', textTransform: 'uppercase', margin: 0 }}>Selected Work</h2>
        
        {/* Skills / Language Picker */}
        <div className="picker-container" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setSelectedTag(null)}
            className="text-mono picker-btn"
            style={{
              background: selectedTag === null ? 'var(--text)' : 'transparent',
              color: selectedTag === null ? 'var(--bg)' : 'var(--text-muted)',
              border: '1px solid',
              borderColor: selectedTag === null ? 'var(--text)' : 'var(--border)',
              padding: '6px 14px',
              borderRadius: '100px',
              fontSize: '11px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            All
          </button>
          {allTags.map(tag => (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag)}
              className="text-mono picker-btn"
              style={{
                background: selectedTag === tag ? 'var(--accent)' : 'var(--card)',
                color: selectedTag === tag ? '#fff' : 'var(--text-muted)',
                border: '1px solid',
                borderColor: selectedTag === tag ? 'var(--accent)' : 'var(--border)',
                padding: '6px 14px',
                borderRadius: '100px',
                fontSize: '11px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '28px' }} className="work-grid">
        {displayProjects.map((project) => (
          <Link href={`/projects/${project.slug}`} key={project.slug} className="card-hover" style={{ display: 'flex', flexDirection: 'column', border: '1px solid var(--border)', borderRadius: '16px', overflow: 'hidden', background: 'var(--card)', color: 'inherit' }}>
            {project.coverImage ? (
              <div style={{ aspectRatio: '16/10', width: '100%', overflow: 'hidden', borderBottom: '1px solid var(--border)' }}>
                <img src={project.coverImage} alt={project.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            ) : (
              <div style={{ aspectRatio: '16/10', backgroundImage: 'repeating-linear-gradient(135deg, var(--bg-alt) 0px, var(--bg-alt) 14px, var(--card) 14px, var(--card) 28px)', borderBottom: '1px solid var(--border)' }} />
            )}
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
              <span className="text-mono link-hover" style={{ fontSize: '12.5px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>Read case study →</span>
            </div>
          </Link>
        ))}
        {displayProjects.length === 0 && (
          <div style={{ gridColumn: '1 / -1', padding: '60px 0', textAlign: 'center', color: 'var(--text-muted)' }} className="text-mono">
            No projects found for the selected skill.
          </div>
        )}
      </div>
      
      {limit && filteredProjects.length > limit && (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '48px' }}>
          <Link href="/projects" className="text-mono link-hover" style={{ fontSize: '13px', padding: '14px 28px', border: '1px solid var(--border)', borderRadius: '100px', background: 'var(--card)', color: 'var(--text)' }}>
            View all {filteredProjects.length} projects →
          </Link>
        </div>
      )}
    </section>
  );
}
