"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import ThemeToggle from './ThemeToggle';

type NavLink = { href: string; label: string };

const DEFAULT_LINKS: NavLink[] = [
  { href: '/#work', label: 'Work' },
  { href: '/#publications', label: 'Publications' },
  { href: '/#about', label: 'About' },
  { href: '/#contact', label: 'Contact' },
];

/**
 * Site header. Collapses to a disclosure menu under 720px, where the previous
 * inline row could not fit brand + four links + toggle.
 */
export default function SiteNav({
  brand,
  links = DEFAULT_LINKS,
  backHref,
  backLabel,
}: {
  brand?: string;
  links?: NavLink[];
  backHref?: string;
  backLabel?: string;
}) {
  const [open, setOpen] = useState(false);

  // Close the menu on Escape and whenever the viewport grows past the
  // breakpoint, so the panel can't be left open on desktop.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    const mq = window.matchMedia('(min-width: 721px)');
    const onChange = () => mq.matches && setOpen(false);
    document.addEventListener('keydown', onKey);
    mq.addEventListener('change', onChange);
    return () => {
      document.removeEventListener('keydown', onKey);
      mq.removeEventListener('change', onChange);
    };
  }, [open]);

  return (
    <header className="site-nav">
      <div className="container nav-padding site-nav-inner">
        {backHref ? (
          <Link href={backHref} className="text-mono link-hover site-nav-back">
            ← {backLabel ?? 'Back'}
          </Link>
        ) : (
          <Link href="/" className="heading-display site-nav-brand">
            {brand}
          </Link>
        )}

        <div className="site-nav-right">
          <nav className="text-mono site-nav-links" aria-label="Primary">
            {links.map((link) => (
              <a key={link.href} href={link.href} className="nav-link">
                {link.label}
              </a>
            ))}
          </nav>

          <ThemeToggle />

          <button
            type="button"
            className="site-nav-toggle"
            aria-expanded={open}
            aria-controls="site-nav-menu"
            aria-label={open ? 'Close menu' : 'Open menu'}
            onClick={() => setOpen((v) => !v)}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              {open ? (
                <>
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </>
              ) : (
                <>
                  <line x1="3" y1="7" x2="21" y2="7" />
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="17" x2="21" y2="17" />
                </>
              )}
            </svg>
          </button>
        </div>
      </div>

      <div id="site-nav-menu" className="site-nav-menu" data-open={open} hidden={!open}>
        <nav className="container text-mono" aria-label="Mobile">
          {links.map((link) => (
            <a key={link.href} href={link.href} onClick={() => setOpen(false)}>
              {link.label}
            </a>
          ))}
        </nav>
      </div>
    </header>
  );
}
