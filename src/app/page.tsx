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
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300">
      {/* Hero Section */}
      <section className="relative py-24 sm:py-32 bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300 overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 opacity-60" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='1.5'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            backgroundSize: '60px 60px'
          }}></div>
          <div className="absolute top-0 left-1/4 w-72 h-72 bg-gray-400/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-gray-500/20 rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative mx-auto max-w-6xl px-6">
          <div className="text-center">
            {/* Badge */}
            <div className="inline-flex items-center px-6 py-3 rounded-full bg-gray-200/50 border border-gray-300/50 text-gray-800 text-sm font-medium mb-8 backdrop-blur-md">
              <div className="w-2 h-2 bg-gray-600 rounded-full mr-3 animate-pulse"></div>
              Enterprise-Grade File Processing
            </div>
            
            {/* Main Heading */}
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-900 mb-8 leading-tight">
              Professional File
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-600 to-gray-800">
                Management Suite
              </span>
            </h1>
            
            {/* Subtitle */}
            <p className="text-xl sm:text-2xl text-gray-700 mb-12 max-w-4xl mx-auto leading-relaxed">
              Advanced file conversion and compression tools for 
              <span className="text-gray-900 font-semibold"> professionals and businesses</span>.
              <br />
              <span className="text-lg text-gray-600">Secure • Fast • Reliable • No registration required</span>
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-6 justify-center mb-20">
              <Link 
                href="/convert" 
                className="group relative px-10 py-5 bg-gradient-to-r from-gray-600 to-gray-700 text-gray-900 rounded-xl font-semibold text-lg hover:from-gray-700 hover:to-gray-800 transition-all duration-300 shadow-2xl hover:shadow-gray-500/25 transform hover:-translate-y-1"
              >
                <span className="relative z-10 flex items-center justify-center gap-3">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                  </svg>
                  Start Converting
                </span>
              </Link>
              
              <Link 
                href="/compress" 
                className="group px-10 py-5 border-2 border-gray-300/50 text-gray-800 rounded-xl font-semibold text-lg hover:bg-gray-200/50 hover:border-gray-400/50 transition-all duration-300 backdrop-blur-sm"
              >
                <span className="flex items-center justify-center gap-3">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  Optimize Files
                </span>
              </Link>
            </div>
            
            {/* Trust Indicators */}
            <div className="flex flex-wrap justify-center items-center gap-8 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Enterprise Security</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
                <span>Zero Data Collection</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                </svg>
                <span>High Performance</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Stats */}
        <div className="relative mx-auto max-w-6xl px-6 -mt-16">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="group p-8 border border-gray-300/50 bg-gray-200/50 backdrop-blur-md rounded-2xl shadow-2xl hover:shadow-gray-500/20 transition-all duration-300 hover:-translate-y-1">
              <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400 mb-2">30+</div>
              <div className="text-gray-700 text-sm font-medium">Professional Tools</div>
            </div>
            <div className="group p-8 border border-gray-300/50 bg-gray-200/50 backdrop-blur-md rounded-2xl shadow-2xl hover:shadow-gray-500/20 transition-all duration-300 hover:-translate-y-1">
              <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-blue-400 mb-2">100%</div>
              <div className="text-gray-700 text-sm font-medium">Free Forever</div>
            </div>
            <div className="group p-8 border border-gray-300/50 bg-gray-200/50 backdrop-blur-md rounded-2xl shadow-2xl hover:shadow-gray-500/20 transition-all duration-300 hover:-translate-y-1">
              <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400 mb-2">9</div>
              <div className="text-gray-700 text-sm font-medium">Categories</div>
            </div>
            <div className="group p-8 border border-gray-300/50 bg-gray-200/50 backdrop-blur-md rounded-2xl shadow-2xl hover:shadow-gray-500/20 transition-all duration-300 hover:-translate-y-1">
              <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-emerald-400 mb-2">0</div>
              <div className="text-gray-700 text-sm font-medium">Registration</div>
            </div>
          </div>
        </div>
      </section>

      {/* Tools Section */}
      <section className="py-20 bg-gradient-to-br from-gray-200 via-gray-300 to-gray-400">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Available Tools
            </h2>
            <p className="text-xl text-gray-700 max-w-2xl mx-auto">
              Professional tools for all your file conversion and compression needs
            </p>
          </div>

          {/* Convert Tools */}
          <div className="mb-16">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Convert</h3>
                <p className="text-gray-700">Transform files between different formats</p>
              </div>
              <Link 
                href="/convert" 
                className="inline-flex items-center gap-2 px-6 py-3 border border-gray-500/50 bg-gray-200/50 text-gray-900 rounded-lg hover:bg-blue-400/20 hover:border-blue-400/50 transition-all font-medium"
              >
                View all tools →
              </Link>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <Link 
                href="/convert#video-audio" 
                className="group p-6 border border-gray-300/50 bg-gray-200/50 backdrop-blur-md rounded-xl hover:shadow-lg hover:border-gray-500/50 transition-all"
              >
                <div className="text-3xl mb-4">🎵</div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">Video & Audio</h4>
                <p className="text-gray-700 text-sm mb-4">Convert between MP3, MP4, WAV, OGG formats</p>
                <div className="text-xs text-gray-600 font-medium">7 tools available</div>
              </Link>

              <Link 
                href="/convert#image" 
                className="group p-6 border border-gray-300/50 bg-gray-200/50 backdrop-blur-md rounded-xl hover:shadow-lg hover:border-gray-500/50 transition-all"
              >
                <div className="text-3xl mb-4">🖼️</div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">Images</h4>
                <p className="text-gray-700 text-sm mb-4">Convert between JPG, PNG, WEBP, HEIC formats</p>
                <div className="text-xs text-gray-600 font-medium">7 tools available</div>
              </Link>

              <Link 
                href="/convert#pdf-docs" 
                className="group p-6 border border-gray-300/50 bg-gray-200/50 backdrop-blur-md rounded-xl hover:shadow-lg hover:border-gray-500/50 transition-all"
              >
                <div className="text-3xl mb-4">📄</div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">PDF & Documents</h4>
                <p className="text-gray-700 text-sm mb-4">Convert PDFs and document formats</p>
                <div className="text-xs text-gray-600 font-medium">4 tools available</div>
              </Link>

              <Link 
                href="/convert#gif" 
                className="group p-6 border border-gray-300/50 bg-gray-200/50 backdrop-blur-md rounded-xl hover:shadow-lg hover:border-gray-500/50 transition-all"
              >
                <div className="text-3xl mb-4">🎞️</div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">GIF Tools</h4>
                <p className="text-gray-700 text-sm mb-4">Create and convert animated GIFs</p>
                <div className="text-xs text-gray-600 font-medium">5 tools available</div>
              </Link>
            </div>
          </div>

          {/* Compress Tools */}
          <div>
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Compress</h3>
                <p className="text-gray-700">Reduce file size while maintaining quality</p>
              </div>
              <Link 
                href="/compress" 
                className="inline-flex items-center gap-2 px-6 py-3 border border-gray-500/50 bg-gray-200/50 text-gray-900 rounded-lg hover:bg-emerald-400/20 hover:border-emerald-400/50 transition-all font-medium"
              >
                View all tools →
              </Link>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <Link 
                href="/compress#video-audio" 
                className="group p-6 border border-gray-300/50 bg-gray-200/50 backdrop-blur-md rounded-xl hover:shadow-lg hover:border-gray-500/50 transition-all"
              >
                <div className="text-3xl mb-4">📹</div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">Video & Audio</h4>
                <p className="text-gray-700 text-sm mb-4">Reduce video and audio file sizes</p>
                <div className="text-xs text-gray-600 font-medium">3 tools available</div>
              </Link>

              <Link 
                href="/compress#image" 
                className="group p-6 border border-gray-300/50 bg-gray-200/50 backdrop-blur-md rounded-xl hover:shadow-lg hover:border-gray-500/50 transition-all"
              >
                <div className="text-3xl mb-4">🎨</div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">Images</h4>
                <p className="text-gray-700 text-sm mb-4">Optimize images with quality control</p>
                <div className="text-xs text-gray-600 font-medium">3 tools available</div>
              </Link>

              <Link 
                href="/compress#pdf-docs" 
                className="group p-6 border border-gray-300/50 bg-gray-200/50 backdrop-blur-md rounded-xl hover:shadow-lg hover:border-gray-500/50 transition-all"
              >
                <div className="text-3xl mb-4">📑</div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">PDF & Documents</h4>
                <p className="text-gray-700 text-sm mb-4">Reduce PDF size effectively</p>
                <div className="text-xs text-gray-600 font-medium">1 tool available</div>
              </Link>

              <Link 
                href="/compress#gif" 
                className="group p-6 border border-gray-300/50 bg-gray-200/50 backdrop-blur-md rounded-xl hover:shadow-lg hover:border-gray-500/50 transition-all"
              >
                <div className="text-3xl mb-4">🎥</div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">GIF Compression</h4>
                <p className="text-gray-700 text-sm mb-4">Optimize GIF animations</p>
                <div className="text-xs text-gray-600 font-medium">1 tool available</div>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gradient-to-br from-gray-200 via-gray-300 to-gray-400">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Why Choose Our Tools?
            </h2>
            <p className="text-xl text-gray-700 max-w-2xl mx-auto">
              Built with modern technology and a focus on privacy, performance, and quality
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-8 border border-gray-300/50 bg-gray-200/50 backdrop-blur-md rounded-xl shadow-2xl hover:shadow-gray-500/20 hover:border-gray-500/50 transition-all">
              <div className="text-4xl mb-6">🔒</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Private & Secure</h3>
              <p className="text-gray-700 leading-relaxed">
                All processing happens in your browser. Your files never leave your device, ensuring complete privacy and security.
              </p>
            </div>

            <div className="text-center p-8 border border-gray-300/50 bg-gray-200/50 backdrop-blur-md rounded-xl shadow-2xl hover:shadow-gray-500/20 hover:border-gray-500/50 transition-all">
              <div className="text-4xl mb-6">⚡</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Fast & Efficient</h3>
              <p className="text-gray-700 leading-relaxed">
                Lightning-fast processing with modern web technologies and optimized algorithms for the best performance.
              </p>
            </div>

            <div className="text-center p-8 border border-gray-300/50 bg-gray-200/50 backdrop-blur-md rounded-xl shadow-2xl hover:shadow-gray-500/20 hover:border-gray-500/50 transition-all">
              <div className="text-4xl mb-6">💎</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Professional Quality</h3>
              <p className="text-gray-700 leading-relaxed">
                High-quality conversion and compression with customizable settings to meet your specific needs.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}