import Link from 'next/link';
import { Metadata } from 'next';
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
      {/* Hero Section - Image Converter */}
      <section className="relative pt-2 pb-16 sm:pt-3 sm:pb-20 bg-transparent overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 opacity-60" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='1.5'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            backgroundSize: '60px 60px'
          }}></div>
          <div className="absolute top-0 left-1/4 w-72 h-72 bg-gray-400/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-gray-500/20 rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative w-full px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-20">
            <div className="inline-flex items-center px-6 py-3 rounded-full bg-gray-200/50 border border-gray-300/50 text-gray-800 text-sm font-medium mb-6 backdrop-blur-md">
              <div className="w-2 h-2 bg-gray-600 rounded-full mr-3 animate-pulse"></div>
              Enterprise-Grade File Processing
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Professional File
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-800">
                Processing Suite
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-gray-700 max-w-3xl mx-auto leading-relaxed">
              Transform, compress, and optimize any file format with enterprise-grade tools. 
              <span className="text-gray-900 font-semibold"> Secure, fast, and completely free</span> - no registration required.
            </p>
          </div>

          {/* Image Converter Interface */}
          <ImageConverterHero />

          {/* Quick Access Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-12">
              <Link 
              href="/convert/image-converter" 
              className="px-8 py-3 bg-gray-900/90 backdrop-blur-md border border-gray-700/50 text-white rounded-xl font-medium hover:bg-gray-800 hover:border-gray-600/50 transition-all duration-300 shadow-lg hover:shadow-xl"
              >
              Try Full Image Converter →
              </Link>
              <Link 
              href="/convert" 
              className="px-8 py-3 border-2 border-gray-700/50 text-gray-900 rounded-xl font-medium hover:bg-gray-800/50 hover:border-gray-600/50 transition-all duration-300 backdrop-blur-sm"
            >
              View All Converters
              </Link>
          </div>
        </div>
      </section>


    </>
  );
}