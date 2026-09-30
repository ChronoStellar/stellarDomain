import { getAllLabProjects } from '@/lib/content';
import ThreeBackground from '@/components/ThreeBackground';
import SiteNav from '@/components/SiteNav';
import LabSection from '@/components/LabSection';
import SpaceSwimmer from '@/components/SpaceSwimmer';
import Link from 'next/link';

export const metadata = {
  title: 'The Lab | Experiments & Prototypes',
  description:
    'A workbench of unpolished experiments, technical proof-of-concepts, and exploratory projects that deserve documentation.',
};

export default function LabPage() {
  const labProjects = getAllLabProjects();

  return (
    <>
      <ThreeBackground />
      <SpaceSwimmer />
      <SiteNav backHref="/" backLabel="Back to home" />

      <main id="main" style={{ position: 'relative', zIndex: 1, flexGrow: 1 }}>
        <header className="container lab-hero">
          <div className="text-mono lab-hero-badge">
            <span className="lab-badge-pulse" aria-hidden="true" />
            {'// The Lab'}
          </div>

          <h1 className="heading-display lab-hero-title">
            Prototypes, explorations, and lab notes.
          </h1>

          <p className="lab-hero-intro">
            A workbench for projects that are not necessarily polished or shipped live, but
            tackled an interesting constraint, hypothesis, or failure mode. Here is where the
            scrappy code, algorithmic tests, and technical documentation live.
          </p>

          <div className="lab-hero-subnav text-mono">
            <span>Looking for production case studies?</span>{' '}
            <Link href="/projects" className="link-hover lab-switch-link">
              View Selected Work →
            </Link>
          </div>
        </header>

        <LabSection items={labProjects} />
      </main>
    </>
  );
}
