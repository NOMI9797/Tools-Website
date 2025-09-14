import { Metadata } from 'next';
import VideoCompressorClient from './VideoCompressorClient';

export const metadata: Metadata = {
  title: 'Video Compressor - Compress Video Files Online | Free Tool',
  description: 'Compress video files online for free. Reduce video file size while maintaining quality. Support for MP4, AVI, MOV, and more formats.',
  keywords: 'video compressor, compress video, reduce video size, video optimization, MP4 compressor, AVI compressor, MOV compressor',
  openGraph: {
    title: 'Video Compressor - Compress Video Files Online',
    description: 'Compress video files online for free. Reduce video file size while maintaining quality.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Video Compressor - Compress Video Files Online',
    description: 'Compress video files online for free. Reduce video file size while maintaining quality.',
  },
  alternates: {
    canonical: '/compress/video-compressor',
  },
};

export default function VideoCompressorPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300">
      <div className="container mx-auto px-4 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-6">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Video Compressor
            </h1>
            <p className="text-lg text-gray-700 max-w-2xl mx-auto">
              Compress your video files to reduce file size while maintaining quality. 
              Support for MP4, AVI, MOV, WEBM, and more formats.
            </p>
          </div>
          
          <VideoCompressorClient />
        </div>
      </div>
    </div>
  );
}
