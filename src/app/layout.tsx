import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

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
        {/* Mobile Navbar */}
        <Navbar />
        {/* Desktop Navbar */}
        <header className="sticky top-0 z-50 bg-transparent hidden md:block">
          <nav className="w-full px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
            <div className="flex items-center gap-12">
              <Link href="/" className="group flex items-center gap-3 font-bold tracking-tight text-2xl text-gray-900 hover:text-gray-700 transition-colors">
                <div className="w-10 h-10 bg-gradient-to-br from-gray-600 to-gray-800 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <span className="bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">Toolbox</span>
              </Link>
              <div className="hidden md:flex items-center gap-3 text-base">
                <Link href="/" className="relative text-gray-800 hover:text-gray-900 transition-all duration-200 font-semibold px-5 py-3 rounded-lg hover:bg-white/60 group">
                  <span className="relative z-10">Home</span>
                  <div className="absolute inset-0 bg-white/80 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                </Link>
                <div className="relative group">
                  <Link href="/convert" className="relative text-gray-800 hover:text-gray-900 transition-all duration-200 font-semibold px-5 py-3 rounded-lg hover:bg-white/60 group">
                    <span className="relative z-10 flex items-center gap-2">
                      Convert
                      <svg className="w-5 h-5 transition-transform group-hover:rotate-180 duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </span>
                    <div className="absolute inset-0 bg-white/80 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                  </Link>
                  <div className="invisible opacity-0 translate-y-1 group-hover:visible group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200 absolute left-0 top-full mt-2 rounded-xl border border-gray-700/30 bg-gray-900/95 backdrop-blur-md shadow-2xl p-4 z-[99999] min-w-[720px]">
                    <div className="absolute -top-2 left-10 w-4 h-4 bg-gray-900/95 border-t border-l border-gray-700/30 rotate-45"></div>
                    <div className="grid grid-cols-3 gap-2">
                      {/* Video & Audio */}
                      <div className="space-y-1">
                        <h4 className="text-xs font-semibold text-white uppercase tracking-wide mb-2">🎵 Video & Audio</h4>
                        <Link href="/convert/audio-converter" className="group flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-300 hover:bg-gray-700/50 hover:text-white transition-all duration-200">
                          <span className="text-lg">🎧</span>
                          <span>Audio Converter</span>
                        </Link>
                        <Link href="/convert/mp3-converter" className="group flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-300 hover:bg-gray-700/50 hover:text-white transition-all duration-200">
                          <span className="text-lg">🎼</span>
                          <span>MP3 Converter</span>
                        </Link>
                        <Link href="/convert/mp4-mp3" className="group flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-300 hover:bg-gray-700/50 hover:text-white transition-all duration-200">
                          <span className="text-lg">🎞️</span>
                          <span>MP4 to MP3</span>
                        </Link>
                        <Link href="/convert/video-mp3" className="group flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-300 hover:bg-gray-700/50 hover:text-white transition-all duration-200">
                          <span className="text-lg">🎥</span>
                          <span>Video to MP3</span>
                        </Link>
                        <Link href="/convert/mp4-converter" className="group flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-300 hover:bg-gray-700/50 hover:text-white transition-all duration-200">
                          <span className="text-lg">📹</span>
                          <span>MP4 Converter</span>
                        </Link>
                        <Link href="/convert/mov-mp4" className="group flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-300 hover:bg-gray-700/50 hover:text-white transition-all duration-200">
                          <span className="text-lg">🎬</span>
                          <span>MOV to MP4</span>
                        </Link>
                        <Link href="/convert/mp3-ogg" className="group flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-300 hover:bg-gray-700/50 hover:text-white transition-all duration-200">
                          <span className="text-lg">🔊</span>
                          <span>MP3 to OGG</span>
                        </Link>
                      </div>
                      
                      {/* Image */}
                      <div className="space-y-1">
                        <h4 className="text-xs font-semibold text-white uppercase tracking-wide mb-2">🖼️ Image</h4>
                        <Link href="/convert/image-converter" className="group flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-300 hover:bg-gray-700/50 hover:text-white transition-all duration-200">
                          <span className="text-lg">🎨</span>
                          <span>Image Converter</span>
                        </Link>
                        <Link href="/convert/webp-png" className="group flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-300 hover:bg-gray-700/50 hover:text-white transition-all duration-200">
                          <span className="text-lg">📸</span>
                          <span>WEBP to PNG</span>
                        </Link>
                        <Link href="/convert/jfif-png" className="group flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-300 hover:bg-gray-700/50 hover:text-white transition-all duration-200">
                          <span className="text-lg">🖼️</span>
                          <span>JFIF to PNG</span>
                        </Link>
                        <Link href="/convert/heic-jpg" className="group flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-300 hover:bg-gray-700/50 hover:text-white transition-all duration-200">
                          <span className="text-lg">📱</span>
                          <span>HEIC to JPG</span>
                        </Link>
                        <Link href="/convert/heic-png" className="group flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-300 hover:bg-gray-700/50 hover:text-white transition-all duration-200">
                          <span className="text-lg">📲</span>
                          <span>HEIC to PNG</span>
                        </Link>
                        <Link href="/convert/webp-jpg" className="group flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-300 hover:bg-gray-700/50 hover:text-white transition-all duration-200">
                          <span className="text-lg">🌄</span>
                          <span>WEBP to JPG</span>
                        </Link>
                        <Link href="/convert/svg-converter" className="group flex items_CENTER gap-3 rounded-lg px-3 py-2 text-sm text-gray-300 hover:bg-gray-700/50 hover:text-white transition-all duration-200">
                          <span className="text-lg">✨</span>
                          <span>SVG Converter</span>
                        </Link>
                      </div>
                      
                      {/* PDF, GIF & Units */}
                      <div className="space-y-1">
                        <h4 className="text-xs font-semibold text-white uppercase tracking-wide mb-2">📄 PDF & More</h4>
                        <Link href="/convert/pdf-to-images" className="group flex items_CENTER gap-3 rounded-lg px-3 py-2 text-sm text-gray-300 hover:bg-gray-700/50 hover:text-white transition-all duration-200">
                          <span className="text-lg">📄</span>
                          <span>PDF to Images</span>
                        </Link>
                        <Link href="/convert/image-to-pdf" className="group flex items_CENTER gap-3 rounded-lg px-3 py-2 text-sm text-gray-300 hover:bg-gray-700/50 hover:text-white transition-all duration-200">
                          <span className="text-lg">🖼️</span>
                          <span>Image to PDF</span>
                        </Link>
                        <Link href="/convert/video-gif" className="group flex items_CENTER gap-3 rounded-lg px-3 py-2 text-sm text-gray-300 hover:bg-gray-700/50 hover:text-white transition-all duration-200">
                          <span className="text-lg">🎬</span>
                          <span>Video to GIF</span>
                        </Link>
                        <Link href="/convert/mp4-gif" className="group flex items_CENTER gap-3 rounded-lg px-3 py-2 text-sm text-gray-300 hover:bg-gray-700/50 hover:text-white transition-all duration-200">
                          <span className="text-lg">🎞️</span>
                          <span>MP4 to GIF</span>
                        </Link>
                        <Link href="/convert/webm-gif" className="group flex items_CENTER gap-3 rounded-lg px-3 py-2 text-sm text-gray-300 hover:bg-gray-700/50 hover:text-white transition-all duration-200">
                          <span className="text-lg">🎥</span>
                          <span>WEBM to GIF</span>
                        </Link>
                        <Link href="/convert/gif-mp4" className="group flex items_CENTER gap-3 rounded-lg px-3 py-2 text-sm text-gray-300 hover:bg-gray-700/50 hover:text-white transition-all duration-200">
                          <span className="text-lg">🎞️</span>
                          <span>GIF to MP4</span>
                        </Link>
                        <Link href="/convert/image-gif" className="group flex items_CENTER gap-3 rounded-lg px-3 py-2 text-sm text-gray-300 hover:bg-gray-700/50 hover:text-white transition-all duration-200">
                          <span className="text-lg">🖼️</span>
                          <span>Image to GIF</span>
                        </Link>
                        <Link href="/convert/unit-converter" className="group flex items_CENTER gap-3 rounded-lg px-3 py-2 text-sm text-gray-300 hover:bg-gray-700/50 hover:text-white transition-all duration-200">
                          <span className="text-lg">📏</span>
                          <span>Unit Converter</span>
                        </Link>
                        <Link href="/convert/time-converter" className="group flex items_CENTER gap-3 rounded-lg px-3 py-2 text-sm text-gray-300 hover:bg-gray-700/50 hover:text-white transition-all duration-200">
                          <span className="text-lg">⏰</span>
                          <span>Time Converter</span>
                        </Link>
                        <Link href="/convert/age-calculator" className="group flex items_CENTER gap-3 rounded-lg px-3 py-2 text sm text-gray-300 hover:bg-gray-700/50 hover:text-white transition-all duration-200">
                          <span className="text-lg">🎂</span>
                          <span>Age Calculator</span>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="relative group">
                  <Link href="/compress" className="relative text-gray-800 hover:text-gray-900 transition-all duration-200 font-semibold px-5 py-3 rounded-lg hover:bg-white/60 group">
                    <span className="relative z-10 flex items-center gap-2">
                      Compress
                      <svg className="w-5 h-5 transition-transform group-hover:rotate-180 duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </span>
                    <div className="absolute inset-0 bg_WHITE/80 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                  </Link>
                  <div className="invisible opacity-0 translate-y-1 group-hover:visible group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200 absolute left-0 top_full mt-2 rounded-xl border border-gray-700/30 bg-gray-900/95 backdrop-blur-md shadow-2xl p-4 z-[99999] min-w-[560px]">
                    <div className="absolute -top-2 left-10 w-4 h-4 bg-gray-900/95 border-t border-l border-gray-700/30 rotate-45"></div>
                    <div className="grid grid-cols-2 gap-2">
                      {/* Video & Audio */}
                      <div className="space-y-1">
                        <h4 className="text-xs font-semibold text_WHITE uppercase tracking-wide mb-2">🎵 Video & Audio</h4>
                        <Link href="/compress/video-compressor" className="group flex items_CENTER gap-3 rounded-lg px-3 py-2 text-sm text-gray-300 hover:bg-gray-700/50 hover:text_WHITE transition-all duration-200">
                          <span className="text-lg">🎬</span>
                          <span>Video Compressor</span>
                        </Link>
                        <Link href="/compress/mp3-compressor" className="group flex items_CENTER gap-3 rounded-lg px-3 py-2 text-sm text-gray-300 hover:bg-gray-700/50 hover:text_WHITE transition-all duration-200">
                          <span className="text-lg">🎵</span>
                          <span>MP3 Compressor</span>
                        </Link>
                        <Link href="/compress/wav-compressor" className="group flex items_CENTER gap-3 rounded-lg px-3 py-2 text-sm text-gray-300 hover:bg-gray-700/50 hover:text_WHITE transition-all duration-200">
                          <span className="text-lg">🎧</span>
                          <span>WAV Compressor</span>
                        </Link>
                      </div>
                      
                      {/* Image */}
                      <div className="space-y-1">
                        <h4 className="text-xs font-semibold text_WHITE uppercase tracking-wide mb-2">🖼️ Image</h4>
                        <Link href="/compress/image-compressor" className="group flex items_CENTER gap-3 rounded-lg px-3 py-2 text-sm text-gray-300 hover:bg-gray-700/50 hover:text_WHITE transition-all duration-200">
                          <span className="text-lg">🖼️</span>
                          <span>Image Compressor</span>
                        </Link>
                        <Link href="/compress/jpeg-compressor" className="group flex items_CENTER gap-3 rounded-lg px-3 py-2 text-sm text-gray-300 hover:bg-gray-700/50 hover:text_WHITE transition-all duration-200">
                          <span className="text-lg">📸</span>
                          <span>JPEG Compressor</span>
                        </Link>
                        <Link href="/compress/png-compressor" className="group flex items_CENTER gap-3 rounded-lg px-3 py-2 text-sm text-gray-300 hover:bg-gray-700/50 hover:text_WHITE transition-all duration-200">
                          <span className="text-lg">🖼️</span>
                          <span>PNG Compressor</span>
                        </Link>
                      </div>
                      
                      {/* PDF & Documents */}
                      <div className="space-y-1">
                        <h4 className="text-xs font-semibold text_WHITE uppercase tracking-wide mb-2">📄 PDF & Documents</h4>
                        <Link href="/compress/pdf-compressor" className="group flex items_CENTER gap-3 rounded-lg px-3 py-2 text-sm text-gray-300 hover:bg-gray-700/50 hover:text_WHITE transition-all duration-200">
                          <span className="text-lg">📄</span>
                          <span>PDF Compressor</span>
                        </Link>
                      </div>
                      
                      {/* GIF */}
                      <div className="space-y-1">
                        <h4 className="text-xs font-semibold text_WHITE uppercase tracking-wide mb-2">🎞️ GIF</h4>
                        <Link href="/compress/gif-compressor" className="group flex items_CENTER gap-3 rounded-lg px-3 py-2 text-sm text-gray-300 hover:bg-gray-700/50 hover:text_WHITE transition-all duration-200">
                          <span className="text-lg">🎞️</span>
                          <span>GIF Compressor</span>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="#login"
                className="relative h-12 px-7 rounded-xl text-base text-gray-800 hover:text-gray-900 transition-all duration-200 font-semibold group"
              >
                <span className="relative z-10">Login</span>
                <div className="absolute inset-0 bg-white/20 backdrop-blur-sm rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
              </Link>
              <Link
                href="#signup"
                className="relative h-12 px-7 rounded-xl text-base text-gray-800 hover:text-gray-900 transition-all duration-200 font-semibold group"
              >
                <span className="relative z-10 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Sign up
                </span>
                <div className="absolute inset-0 bg-white/30 backdrop-blur-sm rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
              </Link>
            </div>
          </nav>
        </header>
        <main className="flex-1 w-full px-4 sm:px-6 lg:px-8">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
