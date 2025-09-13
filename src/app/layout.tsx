import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Footer from "@/components/Footer";

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
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300 min-h-screen flex flex-col`}
      >
        <header className="sticky top-0 z-50 border-b border-gray-300/20 bg-white/95 backdrop-blur shadow-sm">
          <nav className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center gap-10">
              <Link href="/" className="font-bold tracking-tight text-xl text-gray-900">
                Toolbox
              </Link>
              <div className="hidden md:flex items-center gap-8 text-sm">
                <Link href="/" className="text-gray-700 hover:text-gray-900 transition-colors font-medium px-2 py-1 rounded-md hover:bg-gray-200/50">Home</Link>
                <div className="relative group">
                  <Link href="/convert" className="text-gray-700 hover:text-gray-900 transition-colors font-medium px-2 py-1 rounded-md hover:bg-gray-200/50">Convert</Link>
                  <div className="invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-all duration-200 absolute left-0 top-full mt-2 w-[750px] rounded-lg border border-gray-300/20 bg-white/95 backdrop-blur shadow-lg p-3">
                    <div className="grid grid-cols-3 gap-2">
                      {/* Video & Audio */}
                      <div className="space-y-1">
                        <h4 className="text-xs font-semibold text-gray-900 uppercase tracking-wide mb-2">🎵 Video & Audio</h4>
                        <Link href="/convert/audio-converter" className="block rounded-md px-2 py-1 text-sm text-gray-700 hover:bg-gray-200/50 hover:text-gray-900 transition-colors">Audio Converter</Link>
                        <Link href="/convert/mp3-converter" className="block rounded-md px-2 py-1 text-sm text-gray-700 hover:bg-gray-200/50 hover:text-gray-900 transition-colors">MP3 Converter</Link>
                        <Link href="/convert/mp4-mp3" className="block rounded-md px-2 py-1 text-sm text-gray-700 hover:bg-gray-200/50 hover:text-gray-900 transition-colors">MP4 to MP3</Link>
                        <Link href="/convert/video-mp3" className="block rounded-md px-2 py-1 text-sm text-gray-700 hover:bg-gray-200/50 hover:text-gray-900 transition-colors">Video to MP3</Link>
                        <Link href="/convert/mp4-converter" className="block rounded-md px-2 py-1 text-sm text-gray-700 hover:bg-gray-200/50 hover:text-gray-900 transition-colors">MP4 Converter</Link>
                        <Link href="/convert/mov-mp4" className="block rounded-md px-2 py-1 text-sm text-gray-700 hover:bg-gray-200/50 hover:text-gray-900 transition-colors">MOV to MP4</Link>
                        <Link href="/convert/mp3-ogg" className="block rounded-md px-2 py-1 text-sm text-gray-700 hover:bg-gray-200/50 hover:text-gray-900 transition-colors">MP3 to OGG</Link>
                      </div>
                      
                      {/* Image */}
                      <div className="space-y-1">
                        <h4 className="text-xs font-semibold text-gray-900 uppercase tracking-wide mb-2">🖼️ Image</h4>
                        <Link href="/convert/image-converter" className="block rounded-md px-2 py-1 text-sm text-gray-700 hover:bg-gray-200/50 hover:text-gray-900 transition-colors">Image Converter</Link>
                        <Link href="/convert/webp-png" className="block rounded-md px-2 py-1 text-sm text-gray-700 hover:bg-gray-200/50 hover:text-gray-900 transition-colors">WEBP to PNG</Link>
                        <Link href="/convert/jfif-png" className="block rounded-md px-2 py-1 text-sm text-gray-700 hover:bg-gray-200/50 hover:text-gray-900 transition-colors">JFIF to PNG</Link>
                        <Link href="/convert/heic-jpg" className="block rounded-md px-2 py-1 text-sm text-gray-700 hover:bg-gray-200/50 hover:text-gray-900 transition-colors">HEIC to JPG</Link>
                        <Link href="/convert/heic-png" className="block rounded-md px-2 py-1 text-sm text-gray-700 hover:bg-gray-200/50 hover:text-gray-900 transition-colors">HEIC to PNG</Link>
                        <Link href="/convert/webp-jpg" className="block rounded-md px-2 py-1 text-sm text-gray-700 hover:bg-gray-200/50 hover:text-gray-900 transition-colors">WEBP to JPG</Link>
                        <Link href="/convert/svg-converter" className="block rounded-md px-2 py-1 text-sm text-gray-700 hover:bg-gray-200/50 hover:text-gray-900 transition-colors">SVG Converter</Link>
                      </div>
                      
                      {/* PDF, GIF & Units */}
                      <div className="space-y-1">
                        <h4 className="text-xs font-semibold text-gray-900 uppercase tracking-wide mb-2">📄 PDF & More</h4>
                        <Link href="/convert/pdf-to-images" className="block rounded-md px-2 py-1 text-sm text-gray-700 hover:bg-gray-200/50 hover:text-gray-900 transition-colors">PDF to Images</Link>
                        <Link href="/convert/image-to-pdf" className="block rounded-md px-2 py-1 text-sm text-gray-700 hover:bg-gray-200/50 hover:text-gray-900 transition-colors">Image to PDF</Link>
                        <Link href="/convert/heic-pdf" className="block rounded-md px-2 py-1 text-sm text-gray-700 hover:bg-gray-200/50 hover:text-gray-900 transition-colors">HEIC to PDF</Link>
                        <Link href="/convert/jpg-pdf" className="block rounded-md px-2 py-1 text-sm text-gray-700 hover:bg-gray-200/50 hover:text-gray-900 transition-colors">JPG to PDF</Link>
                        <Link href="/convert/video-gif" className="block rounded-md px-2 py-1 text-sm text-gray-700 hover:bg-gray-200/50 hover:text-gray-900 transition-colors">Video to GIF</Link>
                        <Link href="/convert/mp4-gif" className="block rounded-md px-2 py-1 text-sm text-gray-700 hover:bg-gray-200/50 hover:text-gray-900 transition-colors">MP4 to GIF</Link>
                        <Link href="/convert/webm-gif" className="block rounded-md px-2 py-1 text-sm text-gray-700 hover:bg-gray-200/50 hover:text-gray-900 transition-colors">WEBM to GIF</Link>
                        <Link href="/convert/gif-mp4" className="block rounded-md px-2 py-1 text-sm text-gray-700 hover:bg-gray-200/50 hover:text-gray-900 transition-colors">GIF to MP4</Link>
                        <Link href="/convert/image-gif" className="block rounded-md px-2 py-1 text-sm text-gray-700 hover:bg-gray-200/50 hover:text-gray-900 transition-colors">Image to GIF</Link>
                        <Link href="/convert/unit-converter" className="block rounded-md px-2 py-1 text-sm text-gray-700 hover:bg-gray-200/50 hover:text-gray-900 transition-colors">Unit Converter</Link>
                        <Link href="/convert/time-converter" className="block rounded-md px-2 py-1 text-sm text-gray-700 hover:bg-gray-200/50 hover:text-gray-900 transition-colors">Time Converter</Link>
                        <Link href="/convert/age-calculator" className="block rounded-md px-2 py-1 text-sm text-gray-700 hover:bg-gray-200/50 hover:text-gray-900 transition-colors">Age Calculator</Link>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="relative group">
                  <Link href="/compress" className="text-gray-700 hover:text-gray-900 transition-colors font-medium px-2 py-1 rounded-md hover:bg-gray-200/50">Compress</Link>
                  <div className="invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-all duration-200 absolute left-0 top-full mt-2 w-[600px] rounded-lg border border-gray-300/20 bg-white/95 backdrop-blur shadow-lg p-3">
                    <div className="grid grid-cols-2 gap-2">
                      {/* Video & Audio */}
                      <div className="space-y-1">
                        <h4 className="text-xs font-semibold text-gray-900 uppercase tracking-wide mb-2">🎵 Video & Audio</h4>
                        <Link href="/compress/video-compressor" className="block rounded-md px-2 py-1 text-sm text-gray-700 hover:bg-gray-200/50 hover:text-gray-900 transition-colors">Video Compressor</Link>
                        <Link href="/compress/mp3-compressor" className="block rounded-md px-2 py-1 text-sm text-gray-700 hover:bg-gray-200/50 hover:text-gray-900 transition-colors">MP3 Compressor</Link>
                        <Link href="/compress/wav-compressor" className="block rounded-md px-2 py-1 text-sm text-gray-700 hover:bg-gray-200/50 hover:text-gray-900 transition-colors">WAV Compressor</Link>
                      </div>
                      
                      {/* Image */}
                      <div className="space-y-1">
                        <h4 className="text-xs font-semibold text-gray-900 uppercase tracking-wide mb-2">🖼️ Image</h4>
                        <Link href="/compress/image-compressor" className="block rounded-md px-2 py-1 text-sm text-gray-700 hover:bg-gray-200/50 hover:text-gray-900 transition-colors">Image Compressor</Link>
                        <Link href="/compress/jpeg-compressor" className="block rounded-md px-2 py-1 text-sm text-gray-700 hover:bg-gray-200/50 hover:text-gray-900 transition-colors">JPEG Compressor</Link>
                        <Link href="/compress/png-compressor" className="block rounded-md px-2 py-1 text-sm text-gray-700 hover:bg-gray-200/50 hover:text-gray-900 transition-colors">PNG Compressor</Link>
                      </div>
                      
                      {/* PDF & Documents */}
                      <div className="space-y-1">
                        <h4 className="text-xs font-semibold text-gray-900 uppercase tracking-wide mb-2">📄 PDF & Documents</h4>
                        <Link href="/compress/pdf-compressor" className="block rounded-md px-2 py-1 text-sm text-gray-700 hover:bg-gray-200/50 hover:text-gray-900 transition-colors">PDF Compressor</Link>
                      </div>
                      
                      {/* GIF */}
                      <div className="space-y-1">
                        <h4 className="text-xs font-semibold text-gray-900 uppercase tracking-wide mb-2">🎞️ GIF</h4>
                        <Link href="/compress/gif-compressor" className="block rounded-md px-2 py-1 text-sm text-gray-700 hover:bg-gray-200/50 hover:text-gray-900 transition-colors">GIF Compressor</Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="#login"
                className="h-10 px-5 rounded-lg border border-gray-300/50 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 hover:border-gray-400/50 transition-all duration-200 font-medium shadow-sm hover:shadow-md"
              >
                Login
              </Link>
              <Link
                href="#signup"
                className="h-10 px-5 rounded-lg bg-gradient-to-r from-gray-600 to-gray-700 text-white text-sm hover:from-gray-700 hover:to-gray-800 transition-all duration-200 font-medium shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
              >
                Sign up
              </Link>
            </div>
          </nav>
        </header>
        <main className="flex-1 mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
