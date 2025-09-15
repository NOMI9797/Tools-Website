import { Metadata } from 'next';
import MP3CompressorClient from './MP3CompressorClient';

export const metadata: Metadata = {
  title: 'MP3 Compressor - Compress MP3 Files Online | Free Tool',
  description: 'Compress MP3 files online for free. Reduce MP3 file size by lowering bitrate while maintaining audio quality. Support for various bitrates and encoding modes.',
  alternates: {
    canonical: '/compress/mp3-compressor',
  },
};

export default function MP3CompressorPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300">
      <div className="container mx-auto px-4 pt-16 pb-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-6">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              MP3 Compressor
            </h1>
            <p className="text-lg text-gray-700 max-w-2xl mx-auto">
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
