import type { Metadata } from "next";
import VideoToGifClient from "./VideoToGifClient"

export const metadata: Metadata = {
  title: "Video to GIF Converter",
  description: "Convert video files to animated GIF format. Supports MP4, MOV, and more.",
  alternates: { canonical: "/convert/video-gif" },
};

export default function VideoToGifPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300">
      <div className="container mx-auto px-4 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-6">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Video to GIF Converter
            </h1>
            <p className="text-lg text-gray-700 max-w-2xl mx-auto">
              Convert video files to animated GIF format with high quality. 
              Perfect for creating shareable animated content from your videos.
            </p>
          </div>
          
          <VideoToGifClient />
        </div>
      </div>
    </div>
  );
}
