import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "MP4 to GIF Converter",
  description: "Convert MP4 videos to animated GIF format with optimized quality.",
  alternates: { canonical: "/convert/mp4-gif" },
};

import Mp4ToGifClient from "./Mp4ToGifClient";

export default function Mp4ToGifPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300">
      <div className="container mx-auto px-4 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-6">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              MP4 to GIF Converter
            </h1>
            <p className="text-lg text-gray-700 max-w-2xl mx-auto">
              Convert MP4 video files to animated GIF format with optimized quality. 
              Perfect for creating shareable animated content from your MP4 videos.
            </p>
          </div>
          
          <Mp4ToGifClient />
        </div>
      </div>
    </div>
  );
}


