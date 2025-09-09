import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Toolbox — Convert & Compress",
    template: "%s — Toolbox",
  },
  description: "Free tools to convert between formats and compress files: images, documents, video, and audio.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Toolbox — Convert & Compress",
    description: "Free tools to convert between formats and compress files: images, documents, video, and audio.",
    url: siteUrl,
    siteName: "Toolbox",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Toolbox — Convert & Compress",
    description: "Free tools to convert between formats and compress files.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <header className="sticky top-0 z-50 border-b border-black/[.06] bg-white/90 backdrop-blur">
          <nav className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center gap-8">
              <Link href="/" className="font-semibold tracking-tight text-lg">
                Toolbox
              </Link>
              <div className="hidden md:flex items-center gap-6 text-sm">
                <Link href="/" className="hover:opacity-80">Home</Link>
                <div className="relative group">
                  <Link href="/convert" className="hover:opacity-80">Convert</Link>
                  <div className="invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-opacity duration-150 absolute left-0 top-full mt-2 w-56 rounded-lg border border-black/[.08] bg-white shadow-md p-2">
                    <Link href="/convert/image-to-pdf" className="block rounded-md px-3 py-2 text-sm hover:bg-black/[.04]">Image to PDF</Link>
                    <Link href="/convert/image-converter" className="block rounded-md px-3 py-2 text-sm hover:bg-black/[.04]">JPG ⇄ PNG ⇄ WEBP ⇄ SVG</Link>
                    <Link href="/convert/pdf-to-images" className="block rounded-md px-3 py-2 text-sm hover:bg-black/[.04]">PDF to Images</Link>
                  </div>
                </div>
                <div className="relative group">
                  <Link href="/compress" className="hover:opacity-80">Compress</Link>
                  <div className="invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-opacity duration-150 absolute left-0 top-full mt-2 w-56 rounded-lg border border-black/[.08] bg-white shadow-md p-2">
                    <Link href="/compress#image-compressor" className="block rounded-md px-3 py-2 text-sm hover:bg-black/[.04]">Compress Images</Link>
                    <Link href="/compress#pdf-compressor" className="block rounded-md px-3 py-2 text-sm hover:bg-black/[.04]">Compress PDF</Link>
                    <Link href="/compress#video-compressor" className="block rounded-md px-3 py-2 text-sm hover:bg-black/[.04]">Compress Video</Link>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="#login"
                className="h-9 px-4 rounded-md border border-black/[.08] dark:border-white/[.16] text-sm hover:bg-black/[.03] dark:hover:bg-white/[.06]"
              >
                Login
              </Link>
              <Link
                href="#signup"
                className="h-9 px-4 rounded-md bg-foreground text-background text-sm hover:opacity-90"
              >
                Sign up
              </Link>
            </div>
          </nav>
        </header>
        <main className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
          {children}
        </main>
        <footer className="border-t border-black/[.06] dark:border-white/[.08] py-8">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 text-xs text-black/60 dark:text-white/60">
            © {new Date().getFullYear()} Toolbox. All rights reserved.
          </div>
        </footer>
      </body>
    </html>
  );
}
