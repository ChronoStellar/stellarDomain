import type { Metadata } from "next";
import { getProfileData } from "@/lib/content";
import "./globals.css";
import Footer from "@/components/Footer";

export async function generateMetadata(): Promise<Metadata> {
  const profile = getProfileData();
  return {
    title: `${profile.name} | ${profile.tagline}`,
    description: profile.bio.join(" "),
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
