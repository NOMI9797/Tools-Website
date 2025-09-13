import { Metadata } from 'next';
import MP4ConverterClient from './MP4ConverterClient';

export const metadata: Metadata = {
  title: 'MP4 Converter - Convert Videos to MP4 Online | Free Tool',
  description: 'Convert videos to MP4 format online for free. Support for AVI, MOV, WEBM, MKV, FLV, WMV, and more formats. High-quality video conversion.',
  keywords: 'mp4 converter, convert to mp4, video converter, avi to mp4, mov to mp4, webm to mp4, mkv to mp4, flv to mp4, wmv to mp4',
  openGraph: {
    title: 'MP4 Converter - Convert Videos to MP4 Online',
    description: 'Convert videos to MP4 format online for free. Support for AVI, MOV, WEBM, MKV, FLV, WMV, and more formats.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MP4 Converter - Convert Videos to MP4 Online',
    description: 'Convert videos to MP4 format online for free. Support for AVI, MOV, WEBM, MKV, FLV, WMV, and more formats.',
  },
  alternates: {
    canonical: '/convert/mp4-converter',
  },
};

export default function MP4ConverterPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300">
      <div className="container mx-auto px-4 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-6">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              MP4 Converter
            </h1>
            <p className="text-lg text-gray-700 max-w-2xl mx-auto">
              Convert your videos to MP4 format for maximum compatibility. 
              Support for AVI, MOV, WEBM, MKV, FLV, WMV, and more formats.
            </p>
          </div>
          
          <MP4ConverterClient />
        </div>
      </div>
    </div>
  );
}
