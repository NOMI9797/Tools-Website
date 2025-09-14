import type { Metadata } from "next";
import VideoToMP3Client from "./VideoToMP3Client";

export const metadata: Metadata = {
  title: "Video to MP3 - Extract Audio from Any Video Format",
  description: "Extract audio from any video format and convert to MP3 with customizable quality settings.",
  keywords: ["video to mp3", "extract audio from video", "video audio converter", "mp4 to mp3", "mov to mp3", "avi to mp3", "mkv to mp3", "webm to mp3"],
  alternates: {
    canonical: "/convert/video-mp3"
  },
  openGraph: {
    title: "Video to MP3 - Extract Audio from Any Video Format",
    description: "Extract audio from any video format and convert to MP3 with customizable quality settings.",
    url: "/convert/video-mp3",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Video to MP3 - Extract Audio from Any Video Format",
    description: "Extract audio from any video format and convert to MP3 with customizable quality settings.",
  },
};

export default function VideoToMP3Page() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300">
      <div className="container mx-auto px-4 pt-16 pb-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-6">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Video to MP3 Converter
            </h1>
            <p className="text-lg text-gray-700 max-w-2xl mx-auto">
              Extract audio from any video format and convert to MP3 with customizable quality settings.
            </p>
          </div>
          
          <VideoToMP3Client />
        </div>
      </div>
    </div>
  );
}
