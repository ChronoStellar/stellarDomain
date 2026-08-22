import { getAllProjects } from '@/lib/content';
import WorkSection from '@/components/WorkSection';
import ThreeBackground from '@/components/ThreeBackground';
import SiteNav from '@/components/SiteNav';

export const metadata = {
  title: 'All Projects | Stellar Portfolio',
  description: 'A complete list of my past work and projects.',
};

export default function ProjectsPage() {
  const projects = getAllProjects();

  return (
    <>
      <ThreeBackground />
      <SiteNav backHref="/" backLabel="Back to home" />

      <main id="main" style={{ position: 'relative', zIndex: 1, flexGrow: 1 }}>
        <WorkSection projects={projects} />
      </main>
    </>
  );
}
