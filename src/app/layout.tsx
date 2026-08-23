import type { Metadata } from "next";
import { Sora, Source_Sans_3, JetBrains_Mono } from "next/font/google";
import { getProfileData } from "@/lib/content";
import "katex/dist/katex.min.css";
import "./globals.css";
import Footer from "@/components/Footer";

const sora = Sora({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-display",
});

const sourceSans = Source_Sans_3({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-mono",
});

// Applies the persisted theme before first paint so dark-mode visitors never
// see a flash of the light palette. Must stay in sync with ThemeToggle.
const themeScript = `
(function() {
  try {
    var t = localStorage.getItem('theme');
    if (!t) {
      t = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    document.documentElement.setAttribute('data-theme', t);
  } catch (e) {
    document.documentElement.setAttribute('data-theme', 'light');
  }
})();
`;

export async function generateMetadata(): Promise<Metadata> {
  const profile = getProfileData();
  const title = `${profile.name} | ${profile.tagline}`;
  const description = profile.bio.join(" ");

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      siteName: profile.name,
      locale: "en_US",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${sora.variable} ${sourceSans.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <a href="#main" className="skip-link">Skip to content</a>
        {children}
        <Footer />
      </body>
    </html>
  );
}
