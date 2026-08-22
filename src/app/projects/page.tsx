import { getAllProjects } from '@/lib/content';
import WorkSection from '@/components/WorkSection';
import Link from 'next/link';
import ThreeBackground from '@/components/ThreeBackground';
import ThemeToggle from '@/components/ThemeToggle';

export const metadata = {
  title: 'All Projects | Stellar Portfolio',
  description: 'A complete list of my past work and projects.',
};

export default function ProjectsPage() {
  const projects = getAllProjects();

  return (
    <main style={{ position: 'relative', zIndex: 1, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <ThreeBackground isFixed={true} color={0xffffff} />
      
      <nav style={{ padding: '32px 28px', borderBottom: '1px solid var(--border)', marginBottom: '40px', background: 'var(--bg)' }}>
        <div className="container" style={{ padding: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link href="/" className="text-mono link-hover" style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
            ← Back to home
          </Link>
          <ThemeToggle />
        </div>
      </nav>

      <div style={{ flexGrow: 1 }}>
        <WorkSection projects={projects} />
      </div>
    </main>
  );
}
