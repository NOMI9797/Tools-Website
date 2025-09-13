import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "GIF to MP4 Converter",
  description: "Convert animated GIFs to MP4 video format with smooth playback.",
  alternates: { canonical: "/convert/gif-mp4" },
};

import GifToMp4Client from "./GifToMp4Client";

export default function GifToMp4Page() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300">
      <div className="container mx-auto px-4 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-6">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              GIF to MP4 Converter
            </h1>
            <p className="text-lg text-gray-700 max-w-2xl mx-auto">
              Convert animated GIFs to MP4 video format with smooth playback. 
              Perfect for creating high-quality videos from your animated GIFs.
            </p>
          </div>
          
          <GifToMp4Client />
        </div>
      </div>
    </div>
  );
}


