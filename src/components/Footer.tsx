import { getProfileData } from '@/lib/content';

export default function Footer() {
  const profile = getProfileData();

  return (
    <footer id="contact" className="site-footer">
      <div className="container footer-padding site-footer-inner">
        <div className="site-footer-top">
          <h2 className="heading-display footer-heading">
            Let&rsquo;s build something worth shipping.
          </h2>
          <a href={`mailto:${profile.email}`} className="text-mono site-footer-cta">
            {profile.email}
          </a>
        </div>

        <div className="site-footer-bottom">
          <span className="text-mono site-footer-copy">
            © {new Date().getFullYear()} {profile.name}
          </span>
          <div className="text-mono site-footer-social">
            {profile.github && (
              <a href={profile.github} target="_blank" rel="noopener noreferrer">GitHub</a>
            )}
            {profile.linkedin && (
              <a href={profile.linkedin} target="_blank" rel="noopener noreferrer">LinkedIn</a>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}
