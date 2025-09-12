import type { Metadata } from "next";
import VideoToMP3Client from "./VideoToMP3Client";

export const metadata: Metadata = {
  title: "Video to MP3 - Extract Audio from Any Video Format",
  description: "Extract audio from any video format and convert to MP3. Supports MP4, MOV, AVI, MKV, WEBM, and 20+ video formats with quality settings and audio processing.",
  keywords: ["video to mp3", "extract audio from video", "video audio converter", "mp4 to mp3", "mov to mp3", "avi to mp3", "mkv to mp3", "webm to mp3"],
  alternates: {
    canonical: "/convert/video-mp3"
  },
  openGraph: {
    title: "Video to MP3 - Extract Audio from Any Video Format",
    description: "Extract audio from any video format and convert to MP3. Supports MP4, MOV, AVI, MKV, WEBM, and 20+ video formats with quality settings and audio processing.",
    url: "/convert/video-mp3",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Video to MP3 - Extract Audio from Any Video Format",
    description: "Extract audio from any video format and convert to MP3. Supports MP4, MOV, AVI, MKV, WEBM, and 20+ video formats with quality settings and audio processing.",
  },
};

export default function VideoToMP3Page() {
  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Video to MP3 Converter
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Extract audio from any video format and convert to MP3. Supports MP4, MOV, AVI, MKV, WEBM, 
              and 20+ video formats with customizable quality settings, time range selection, and audio processing options.
            </p>
          </div>
          
          <VideoToMP3Client />
        </div>
      </div>
    </div>
  );
}
