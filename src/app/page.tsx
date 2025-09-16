import Link from 'next/link';
import { Metadata } from 'next';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
import ImageConverterHero from "./ImageConverterHero";

export const metadata: Metadata = {
  title: 'Free Online Tools - Convert & Compress Files',
  description: 'Free online tools for converting and compressing files. Support for images, videos, audio, PDFs, and more. No signup required.',
  keywords: 'online tools, file converter, file compressor, video converter, image converter, audio converter, pdf tools',
  openGraph: {
    title: 'Free Online Tools - Convert & Compress Files',
    description: 'Free online tools for converting and compressing files. Support for images, videos, audio, PDFs, and more.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Free Online Tools - Convert & Compress Files',
    description: 'Free online tools for converting and compressing files. Support for images, videos, audio, PDFs, and more.',
  },
};

export default function HomePage() {
  return (
    <>
      {/* Futuristic Hero */}
      <section className="relative overflow-hidden pt-16 pb-14 sm:pt-20 sm:pb-20">
        <div className="absolute inset-0">
          <div className="absolute -top-32 -left-20 h-80 w-80 rounded-full bg-gradient-to-br from-gray-400/40 to-gray-600/30 blur-3xl" />
          <div className="absolute -bottom-32 -right-24 h-[28rem] w-[28rem] rounded-full bg-gradient-to-tr from-gray-500/30 to-gray-700/30 blur-[90px]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.35),transparent_40%),radial-gradient(circle_at_80%_0%,rgba(255,255,255,0.25),transparent_35%)]" />
        </div>

        <div className="relative w-full px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <div className="inline-flex items-center px-5 py-2.5 rounded-full bg-white/50 border border-gray-300/60 text-gray-900 text-sm font-medium mb-5 backdrop-blur-md shadow-sm">
              <div className="w-2 h-2 bg-gray-800 rounded-full mr-3 animate-pulse" />
              AI-Ready Conversion & Compression
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
              Convert. Compress. Create.
            </h1>
            <p className="mt-5 text-base sm:text-lg text-gray-700 max-w-2xl mx-auto leading-relaxed">
              A unified toolkit for images, video, audio, and documents. Fast, private, and entirely free.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/convert" className="px-7 py-3 rounded-xl text-white bg-gray-900/90 hover:bg-gray-900 transition-all duration-300 shadow-lg hover:shadow-xl">
                Explore Converters
              </Link>
              <Link href="/compress" className="px-7 py-3 rounded-xl border-2 border-gray-800/70 text-gray-900 hover:bg-gray-900/5 transition-all duration-300">
                Explore Compressors
              </Link>
            </div>
          </div>

          {/* Glass Showcase - Centered Image Converter */}
          <div className="max-w-3xl mx-auto">
            <div className="rounded-2xl border border-gray-300/50 bg-white/50 backdrop-blur-lg p-5 sm:p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                  <span className="text-xl">🎨</span>
                  Quick Image Convert
                </h2>
                <Link href="/convert/image-converter" className="text-sm font-medium text-gray-700 hover:text-gray-900">Open</Link>
              </div>
              <div className="rounded-xl border border-gray-300/50 bg-gray-100/60 p-3">
                <ImageConverterHero />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Highlights */}
      <section className="w-full px-4 sm:px-6 lg:px-8 pb-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {[ 
            { title: 'Private by Design', desc: 'Client-side processing where possible. Your files stay with you.', icon: '🔒' },
            { title: 'Fast Performance', desc: 'WASM/FFmpeg acceleration and tuned server fallbacks.', icon: '⚡' },
            { title: 'Crisp Results', desc: 'Thoughtful defaults for quality and size balance.', icon: '🎯' },
            { title: 'Totally Free', desc: 'No sign-up. No watermarks. No limits.', icon: '💎' },
          ].map((f) => (
            <div key={f.title} className="rounded-2xl border border-gray-300/50 bg-white/50 backdrop-blur-lg p-5 sm:p-6 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-xl bg-gray-900/90 text-white flex items-center justify-center text-lg">{f.icon}</div>
                <div>
                  <h3 className="text-base font-semibold text-gray-900">{f.title}</h3>
                  <p className="text-sm text-gray-700 mt-1">{f.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}