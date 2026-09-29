"use client";

import { useState, useMemo } from 'react';
import Link from 'next/link';
import type { LabProjectMetadata } from '@/lib/content';

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

function LabCard({ item }: { item: LabProjectMetadata }) {
  return (
    <article className="card-hover lab-card">
      <div className="lab-card-header">
        <div className="lab-card-badges">
          {item.status && (
            <span className={`text-mono status-pill ${statusClassName(item.status)}`}>
              <span className="status-dot" aria-hidden="true" />
              {item.status}
            </span>
          )}
        </div>
        <time className="text-mono lab-date" dateTime={item.date}>
          {item.date}
        </time>
      </div>

      <div className="lab-card-body">
        <h3 className="heading-display lab-card-title">
          <Link href={`/lab/${item.slug}`} className="lab-title-link">
            {item.title}
          </Link>
        </h3>

        <p className="lab-card-summary">{item.summary}</p>

        {item.highlight && (
          <div className="lab-highlight">
            <span className="text-mono lab-highlight-label">The Spark / Insight</span>
            <p className="lab-highlight-text">{item.highlight}</p>
          </div>
        )}

        <div className="lab-card-tags">
          {item.tags.map((tag) => (
            <span key={tag} className="text-mono tag-pill tag-pill-quiet">
              {tag}
            </span>
          ))}
        </div>
      </div>

      <div className="lab-card-footer">
        <Link href={`/lab/${item.slug}`} className="text-mono link-hover lab-card-cta">
          Read notes →
        </Link>

        <div className="lab-card-links text-mono">
          {item.github && (
            <a
              href={item.github}
              target="_blank"
              rel="noopener noreferrer"
              className="lab-ext-link"
              title="View source repository"
            >
              GitHub ↗
            </a>
          )}
          {item.demo && (
            <a
              href={item.demo}
              target="_blank"
              rel="noopener noreferrer"
              className="lab-ext-link"
              title="View live demo or prototype"
            >
              Demo ↗
            </a>
          )}
        </div>
      </div>
    </article>
  );
}

export default function LabSection({ items }: { items: LabProjectMetadata[] }) {
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const statuses = useMemo(() => {
    const set = new Set<string>();
    items.forEach((item) => {
      if (item.status) set.add(item.status);
    });
    return Array.from(set).sort();
  }, [items]);

  const allTags = useMemo(() => {
    const set = new Set<string>();
    items.forEach((item) => item.tags.forEach((t) => set.add(t)));
    return Array.from(set).sort();
  }, [items]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (selectedStatus && item.status !== selectedStatus) return false;
      if (selectedTag && !item.tags.includes(selectedTag)) return false;
      return true;
    });
  }, [items, selectedStatus, selectedTag]);

  const isFiltering = selectedStatus !== null || selectedTag !== null;

  const resetFilters = () => {
    setSelectedStatus(null);
    setSelectedTag(null);
  };

  return (
    <section className="container lab-section">
      <div className="lab-controls">
        <div className="lab-filter-row">
          <span className="text-mono lab-filter-label">Filter:</span>
          <div className="picker-container" role="group" aria-label="Filter by status">
            <button
              type="button"
              onClick={resetFilters}
              aria-pressed={!isFiltering}
              className="text-mono picker-btn picker-btn-all"
              data-active={!isFiltering}
            >
              All ({items.length})
            </button>
            {statuses.map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => {
                  setSelectedStatus(selectedStatus === status ? null : status);
                }}
                aria-pressed={selectedStatus === status}
                className="text-mono picker-btn"
                data-active={selectedStatus === status}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {allTags.length > 0 && (
          <div className="lab-tags-row">
            <span className="text-mono lab-filter-label">Tags:</span>
            <div className="picker-container" role="group" aria-label="Filter by tech tag">
              {allTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => {
                    setSelectedTag(selectedTag === tag ? null : tag);
                  }}
                  aria-pressed={selectedTag === tag}
                  className="text-mono picker-btn"
                  data-active={selectedTag === tag}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <p className="text-mono filter-status" role="status">
        {isFiltering
          ? `Showing ${filteredItems.length} of ${items.length} ${
              items.length === 1 ? 'experiment' : 'experiments'
            }`
          : `${items.length} ${items.length === 1 ? 'experiment' : 'experiments'} documented`}
      </p>

      {filteredItems.length > 0 ? (
        <div className="lab-grid">
          {filteredItems.map((item) => (
            <LabCard key={item.slug} item={item} />
          ))}
        </div>
      ) : (
        <div className="text-mono work-empty">
          No experiments match the selected filters.{' '}
          <button type="button" className="work-empty-reset" onClick={resetFilters}>
            Reset filters
          </button>
        </div>
      )}
    </section>
  );
}
