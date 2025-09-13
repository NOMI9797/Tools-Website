import Link from 'next/link';
import { Metadata } from 'next';

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
    <div>
      {/* Hero Section */}
      <section className="py-20 sm:py-28 bg-gray-50">
        <div className="mx-auto max-w-5xl px-6 text-center">
          <div className="inline-flex items-center px-4 py-2 rounded-full border border-[#00B4D8]/30 bg-[#00B4D8]/10 text-[#1A2B4C] text-sm font-medium mb-8">
            ✨ Professional File Tools
          </div>
          
          <h1 className="text-5xl sm:text-6xl font-bold text-[#1A2B4C] mb-6 leading-tight">
            Free Online Tools
          </h1>
          
          <p className="text-xl text-[#2E2E2E]/80 mb-10 max-w-3xl mx-auto leading-relaxed">
            Convert and compress your files with professional-grade tools. 
            No signup required, completely free, and your files never leave your browser.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link 
              href="/convert" 
              className="px-8 py-4 bg-[#3CCF91] text-white rounded-lg font-semibold hover:bg-[#3CCF91]/90 transition-colors shadow-lg hover:shadow-xl"
            >
              Convert Files
            </Link>
            <Link 
              href="/compress" 
              className="px-8 py-4 border border-[#1A2B4C]/30 text-[#1A2B4C] rounded-lg font-semibold hover:bg-[#1A2B4C]/5 hover:border-[#1A2B4C]/50 transition-all shadow-lg"
            >
              Compress Files
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 border border-gray-300/50 bg-gray-50/80 backdrop-blur-sm rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <div className="text-3xl font-bold text-[#1A2B4C] mb-1">30+</div>
              <div className="text-[#2E2E2E]/70 text-sm">Tools Available</div>
            </div>
            <div className="p-6 border border-gray-300/50 bg-gray-50/80 backdrop-blur-sm rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <div className="text-3xl font-bold text-[#1A2B4C] mb-1">100%</div>
              <div className="text-[#2E2E2E]/70 text-sm">Free to Use</div>
            </div>
            <div className="p-6 border border-gray-300/50 bg-gray-50/80 backdrop-blur-sm rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <div className="text-3xl font-bold text-[#1A2B4C] mb-1">9</div>
              <div className="text-[#2E2E2E]/70 text-sm">Categories</div>
            </div>
            <div className="p-6 border border-gray-300/50 bg-gray-50/80 backdrop-blur-sm rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <div className="text-3xl font-bold text-[#1A2B4C] mb-1">0</div>
              <div className="text-[#2E2E2E]/70 text-sm">Signup Required</div>
            </div>
          </div>
        </div>
      </section>

      {/* Tools Section */}
      <section className="py-20 bg-gray-50">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-[#1A2B4C] mb-4">
              Available Tools
            </h2>
            <p className="text-xl text-[#2E2E2E]/80 max-w-2xl mx-auto">
              Professional tools for all your file conversion and compression needs
            </p>
          </div>

          {/* Convert Tools */}
          <div className="mb-16">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-2xl font-bold text-[#1A2B4C] mb-2">Convert</h3>
                <p className="text-[#2E2E2E]/70">Transform files between different formats</p>
              </div>
              <Link 
                href="/convert" 
                className="inline-flex items-center gap-2 px-6 py-3 border border-[#00B4D8]/30 bg-[#00B4D8]/10 text-[#1A2B4C] rounded-lg hover:bg-[#00B4D8]/20 hover:border-[#00B4D8]/50 transition-all font-medium"
              >
                View all tools →
              </Link>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <Link 
                href="/convert#video-audio" 
                className="group p-6 border border-gray-300/50 bg-gray-50/80 backdrop-blur-sm rounded-xl hover:shadow-lg hover:border-[#00B4D8]/30 transition-all"
              >
                <div className="text-3xl mb-4">🎵</div>
                <h4 className="text-lg font-semibold text-[#1A2B4C] mb-2">Video & Audio</h4>
                <p className="text-[#2E2E2E]/70 text-sm mb-4">Convert between MP3, MP4, WAV, OGG formats</p>
                <div className="text-xs text-[#00B4D8] font-medium">7 tools available</div>
              </Link>

              <Link 
                href="/convert#image" 
                className="group p-6 border border-gray-300/50 bg-gray-50/80 backdrop-blur-sm rounded-xl hover:shadow-lg hover:border-[#00B4D8]/30 transition-all"
              >
                <div className="text-3xl mb-4">🖼️</div>
                <h4 className="text-lg font-semibold text-[#1A2B4C] mb-2">Images</h4>
                <p className="text-[#2E2E2E]/70 text-sm mb-4">Convert between JPG, PNG, WEBP, HEIC formats</p>
                <div className="text-xs text-[#00B4D8] font-medium">7 tools available</div>
              </Link>

              <Link 
                href="/convert#pdf-docs" 
                className="group p-6 border border-gray-300/50 bg-gray-50/80 backdrop-blur-sm rounded-xl hover:shadow-lg hover:border-[#00B4D8]/30 transition-all"
              >
                <div className="text-3xl mb-4">📄</div>
                <h4 className="text-lg font-semibold text-[#1A2B4C] mb-2">PDF & Documents</h4>
                <p className="text-[#2E2E2E]/70 text-sm mb-4">Convert PDFs and document formats</p>
                <div className="text-xs text-[#00B4D8] font-medium">4 tools available</div>
              </Link>

              <Link 
                href="/convert#gif" 
                className="group p-6 border border-gray-300/50 bg-gray-50/80 backdrop-blur-sm rounded-xl hover:shadow-lg hover:border-[#00B4D8]/30 transition-all"
              >
                <div className="text-3xl mb-4">🎞️</div>
                <h4 className="text-lg font-semibold text-[#1A2B4C] mb-2">GIF Tools</h4>
                <p className="text-[#2E2E2E]/70 text-sm mb-4">Create and convert animated GIFs</p>
                <div className="text-xs text-[#00B4D8] font-medium">5 tools available</div>
              </Link>
            </div>
          </div>

          {/* Compress Tools */}
          <div>
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-2xl font-bold text-[#1A2B4C] mb-2">Compress</h3>
                <p className="text-[#2E2E2E]/70">Reduce file size while maintaining quality</p>
              </div>
              <Link 
                href="/compress" 
                className="inline-flex items-center gap-2 px-6 py-3 border border-[#00B4D8]/30 bg-[#00B4D8]/10 text-[#1A2B4C] rounded-lg hover:bg-[#00B4D8]/20 hover:border-[#00B4D8]/50 transition-all font-medium"
              >
                View all tools →
              </Link>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <Link 
                href="/compress#video-audio" 
                className="group p-6 border border-gray-300/50 bg-gray-50/80 backdrop-blur-sm rounded-xl hover:shadow-lg hover:border-[#00B4D8]/30 transition-all"
              >
                <div className="text-3xl mb-4">📹</div>
                <h4 className="text-lg font-semibold text-[#1A2B4C] mb-2">Video & Audio</h4>
                <p className="text-[#2E2E2E]/70 text-sm mb-4">Reduce video and audio file sizes</p>
                <div className="text-xs text-[#00B4D8] font-medium">3 tools available</div>
              </Link>

              <Link 
                href="/compress#image" 
                className="group p-6 border border-gray-300/50 bg-gray-50/80 backdrop-blur-sm rounded-xl hover:shadow-lg hover:border-[#00B4D8]/30 transition-all"
              >
                <div className="text-3xl mb-4">🎨</div>
                <h4 className="text-lg font-semibold text-[#1A2B4C] mb-2">Images</h4>
                <p className="text-[#2E2E2E]/70 text-sm mb-4">Optimize images with quality control</p>
                <div className="text-xs text-[#00B4D8] font-medium">3 tools available</div>
              </Link>

              <Link 
                href="/compress#pdf-docs" 
                className="group p-6 border border-gray-300/50 bg-gray-50/80 backdrop-blur-sm rounded-xl hover:shadow-lg hover:border-[#00B4D8]/30 transition-all"
              >
                <div className="text-3xl mb-4">📑</div>
                <h4 className="text-lg font-semibold text-[#1A2B4C] mb-2">PDF & Documents</h4>
                <p className="text-[#2E2E2E]/70 text-sm mb-4">Reduce PDF size effectively</p>
                <div className="text-xs text-[#00B4D8] font-medium">1 tool available</div>
              </Link>

              <Link 
                href="/compress#gif" 
                className="group p-6 border border-gray-300/50 bg-gray-50/80 backdrop-blur-sm rounded-xl hover:shadow-lg hover:border-[#00B4D8]/30 transition-all"
              >
                <div className="text-3xl mb-4">🎥</div>
                <h4 className="text-lg font-semibold text-[#1A2B4C] mb-2">GIF Compression</h4>
                <p className="text-[#2E2E2E]/70 text-sm mb-4">Optimize GIF animations</p>
                <div className="text-xs text-[#00B4D8] font-medium">1 tool available</div>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-[#1A2B4C] mb-4">
              Why Choose Our Tools?
            </h2>
            <p className="text-xl text-[#2E2E2E]/80 max-w-2xl mx-auto">
              Built with modern technology and a focus on privacy, performance, and quality
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-8 border border-gray-300/50 bg-gray-50/80 backdrop-blur-sm rounded-xl shadow-sm hover:shadow-lg hover:border-[#00B4D8]/30 transition-all">
              <div className="text-4xl mb-6">🔒</div>
              <h3 className="text-xl font-semibold text-[#1A2B4C] mb-4">Private & Secure</h3>
              <p className="text-[#2E2E2E]/70 leading-relaxed">
                All processing happens in your browser. Your files never leave your device, ensuring complete privacy and security.
              </p>
            </div>

            <div className="text-center p-8 border border-gray-300/50 bg-gray-50/80 backdrop-blur-sm rounded-xl shadow-sm hover:shadow-lg hover:border-[#00B4D8]/30 transition-all">
              <div className="text-4xl mb-6">⚡</div>
              <h3 className="text-xl font-semibold text-[#1A2B4C] mb-4">Fast & Efficient</h3>
              <p className="text-[#2E2E2E]/70 leading-relaxed">
                Lightning-fast processing with modern web technologies and optimized algorithms for the best performance.
              </p>
            </div>

            <div className="text-center p-8 border border-gray-300/50 bg-gray-50/80 backdrop-blur-sm rounded-xl shadow-sm hover:shadow-lg hover:border-[#00B4D8]/30 transition-all">
              <div className="text-4xl mb-6">💎</div>
              <h3 className="text-xl font-semibold text-[#1A2B4C] mb-4">Professional Quality</h3>
              <p className="text-[#2E2E2E]/70 leading-relaxed">
                High-quality conversion and compression with customizable settings to meet your specific needs.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}