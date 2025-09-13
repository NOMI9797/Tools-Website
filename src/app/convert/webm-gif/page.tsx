import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "WEBM to GIF Converter",
  description: "Convert WEBM videos to animated GIF format with optimized quality.",
  alternates: { canonical: "/convert/webm-gif" },
};

import WebmToGifClient from "./WebmToGifClient";

export default function WebmToGifPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300">
      <div className="container mx-auto px-4 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-6">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              WEBM to GIF Converter
            </h1>
            <p className="text-lg text-gray-700 max-w-2xl mx-auto">
              Convert WEBM video files to animated GIF format with optimized quality. 
              Perfect for creating shareable animated content from your WEBM videos.
            </p>
          </div>
          
          <WebmToGifClient />
        </div>
      </div>
    </div>
  );
}


