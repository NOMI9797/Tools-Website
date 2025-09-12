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
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Video Compressor
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
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
