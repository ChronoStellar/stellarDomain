"use client";

import { useState, useMemo } from 'react';
import Link from 'next/link';
import type { ProjectMetadata } from '@/lib/content';
import { withBasePath } from '@/lib/basePath';

function ProjectCard({ project, featured }: { project: ProjectMetadata; featured?: boolean }) {
  return (
    <Link
      href={`/projects/${project.slug}`}
      className={`card-hover project-card${featured ? ' project-card-featured' : ''}`}
    >
      <div className="project-card-media">
        {project.coverImage ? (
          <img
            src={withBasePath(project.coverImage)}
            alt=""
            loading={featured ? 'eager' : 'lazy'}
            decoding="async"
          />
        ) : (
          <div className="project-card-placeholder" />
        )}
      </div>

      <div className="project-card-body">
        {featured && (
          <span className="text-mono project-card-flag">Featured project</span>
        )}
        <div className="project-card-tags">
          {project.tags.map((tag) => (
            <span key={tag} className="text-mono tag-pill">{tag}</span>
          ))}
        </div>
        <h3 className="heading-display project-card-title">{project.title}</h3>
        <p className="project-card-summary">{project.summary}</p>
        <span className="text-mono link-hover project-card-cta">Read case study →</span>
      </div>
    </Link>
  );
}

export default function WorkSection({ projects, limit }: { projects: ProjectMetadata[]; limit?: number }) {
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    projects.forEach((p) => p.tags.forEach((tag) => tags.add(tag)));
    return Array.from(tags).sort();
  }, [projects]);

  const filteredProjects = useMemo(() => {
    if (!selectedTag) return projects;
    return projects.filter((p) => p.tags.includes(selectedTag));
  }, [projects, selectedTag]);

  const displayProjects = limit ? filteredProjects.slice(0, limit) : filteredProjects;
  const hiddenCount = filteredProjects.length - displayProjects.length;

  // The first card of an unfiltered list is the featured slot. Once a filter is
  // active every result is equally relevant, so the hierarchy is dropped.
  const showFeatured = !selectedTag && displayProjects.length > 0;
  const [lead, ...rest] = displayProjects;

  return (
    <section id="work" className="container section-padding" style={{ position: 'relative', zIndex: 1 }}>
      <div className="section-head">
        <h2 className="section-title">Selected Work</h2>

        <div className="picker-container" role="group" aria-label="Filter projects by skill">
          <button
            type="button"
            onClick={() => setSelectedTag(null)}
            aria-pressed={selectedTag === null}
            className="text-mono picker-btn picker-btn-all"
            data-active={selectedTag === null}
          >
            All
          </button>
          {allTags.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => setSelectedTag(tag)}
              aria-pressed={selectedTag === tag}
              className="text-mono picker-btn"
              data-active={selectedTag === tag}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      <p className="text-mono filter-status" role="status">
        {selectedTag
          ? `${filteredProjects.length} ${filteredProjects.length === 1 ? 'project' : 'projects'} tagged ${selectedTag}`
          : `${projects.length} ${projects.length === 1 ? 'project' : 'projects'}`}
        {hiddenCount > 0 && ` · showing ${displayProjects.length}`}
      </p>

      {showFeatured ? (
        <>
          <ProjectCard project={lead} featured />
          {rest.length > 0 && (
            <div className="work-grid">
              {rest.map((project) => (
                <ProjectCard key={project.slug} project={project} />
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="work-grid">
          {displayProjects.map((project) => (
            <ProjectCard key={project.slug} project={project} />
          ))}
        </div>
      )}

      {displayProjects.length === 0 && (
        <div className="text-mono work-empty">
          No projects tagged {selectedTag}.{' '}
          <button type="button" className="work-empty-reset" onClick={() => setSelectedTag(null)}>
            Show all
          </button>
        </div>
      )}

      {/* Always offer the archive link when results are truncated — the previous
          version only rendered it for the unfiltered list, stranding filtered views. */}
      {hiddenCount > 0 && (
        <div className="work-more">
          <Link href="/projects" className="text-mono work-more-link">
            View all {filteredProjects.length} projects →
          </Link>
        </div>
      )}
    </section>
  );
}
