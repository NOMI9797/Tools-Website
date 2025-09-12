import { Metadata } from 'next';
import MP3ToOggClient from './MP3ToOggClient';

export const metadata: Metadata = {
  title: 'MP3 to OGG Converter - Convert MP3 to OGG Online | Free Tool',
  description: 'Convert MP3 files to OGG format online for free. High-quality audio conversion with customizable bitrate and quality settings.',
  keywords: 'mp3 to ogg, convert mp3 to ogg, mp3 ogg converter, audio converter, ogg converter, vorbis',
  openGraph: {
    title: 'MP3 to OGG Converter - Convert MP3 to OGG Online',
    description: 'Convert MP3 files to OGG format online for free. High-quality audio conversion with customizable bitrate and quality settings.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MP3 to OGG Converter - Convert MP3 to OGG Online',
    description: 'Convert MP3 files to OGG format online for free. High-quality audio conversion with customizable bitrate and quality settings.',
  },
  alternates: {
    canonical: '/convert/mp3-ogg',
  },
};

export default function MP3ToOggPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              MP3 to OGG Converter
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Convert your MP3 files to OGG format for better compression and open-source compatibility. 
              High-quality audio conversion with customizable settings.
            </p>
          </div>
          
          <MP3ToOggClient />
        </div>
      </div>
    </div>
  );
}
