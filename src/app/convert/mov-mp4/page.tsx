import { Metadata } from 'next';
import MovToMp4Client from './MovToMp4Client';

export const metadata: Metadata = {
  title: 'MOV to MP4 Converter - Convert MOV Videos to MP4 Online | Free Tool',
  description: 'Convert MOV videos to MP4 format online for free. High-quality conversion with customizable settings. Support for QuickTime MOV files.',
  keywords: 'mov to mp4, convert mov to mp4, mov converter, quicktime to mp4, mov mp4 converter, video converter',
  openGraph: {
    title: 'MOV to MP4 Converter - Convert MOV Videos to MP4 Online',
    description: 'Convert MOV videos to MP4 format online for free. High-quality conversion with customizable settings.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MOV to MP4 Converter - Convert MOV Videos to MP4 Online',
    description: 'Convert MOV videos to MP4 format online for free. High-quality conversion with customizable settings.',
  },
  alternates: {
    canonical: '/convert/mov-mp4',
  },
};

export default function MovToMp4Page() {
  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              MOV to MP4 Converter
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Convert your MOV (QuickTime) videos to MP4 format for better compatibility. 
              High-quality conversion with customizable settings.
            </p>
          </div>
          
          <MovToMp4Client />
        </div>
      </div>
    </div>
  );
}
