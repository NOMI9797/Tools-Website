import { Metadata } from 'next';
import MP3CompressorClient from './MP3CompressorClient';

export const metadata: Metadata = {
  title: 'MP3 Compressor - Compress MP3 Files Online | Free Tool',
  description: 'Compress MP3 files online for free. Reduce MP3 file size by lowering bitrate while maintaining audio quality. Support for various bitrates and encoding modes.',
  keywords: 'mp3 compressor, compress mp3, reduce mp3 size, mp3 optimization, audio compression, bitrate reduction',
  openGraph: {
    title: 'MP3 Compressor - Compress MP3 Files Online',
    description: 'Compress MP3 files online for free. Reduce MP3 file size by lowering bitrate while maintaining audio quality.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MP3 Compressor - Compress MP3 Files Online',
    description: 'Compress MP3 files online for free. Reduce MP3 file size by lowering bitrate while maintaining audio quality.',
  },
  alternates: {
    canonical: '/compress/mp3-compressor',
  },
};

export default function MP3CompressorPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              MP3 Compressor
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Compress your MP3 files to reduce file size by lowering bitrate. 
              Choose from various quality settings to balance file size and audio quality.
            </p>
          </div>
          
          <MP3CompressorClient />
        </div>
      </div>
    </div>
  );
}
