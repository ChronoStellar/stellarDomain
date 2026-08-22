import type { Metadata } from "next";
import { getProfileData } from "@/lib/content";
import "./globals.css";
import Footer from "@/components/Footer";

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
    <html lang="en">
      <body style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        {children}
        <Footer />
      </body>
    </html>
  );
}
