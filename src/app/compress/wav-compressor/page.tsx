import { Metadata } from 'next';
import WAVCompressorClient from './WAVCompressorClient';

export const metadata: Metadata = {
  title: 'WAV Compressor - Compress WAV Files Online | Free Tool',
  description: 'Compress WAV files online for free. Reduce WAV file size by downsampling or converting to MP3. Support for various bit depths and sample rates.',
  keywords: 'wav compressor, compress wav, reduce wav size, wav optimization, audio compression, wav to mp3, downsample wav',
  openGraph: {
    title: 'WAV Compressor - Compress WAV Files Online',
    description: 'Compress WAV files online for free. Reduce WAV file size by downsampling or converting to MP3.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'WAV Compressor - Compress WAV Files Online',
    description: 'Compress WAV files online for free. Reduce WAV file size by downsampling or converting to MP3.',
  },
  alternates: {
    canonical: '/compress/wav-compressor',
  },
};

export default function WAVCompressorPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              WAV Compressor
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Compress your WAV files to reduce file size. Choose between downsampling 
              the WAV file or converting to MP3 for maximum compression.
            </p>
          </div>
          
          <WAVCompressorClient />
        </div>
      </div>
    </div>
  );
}
