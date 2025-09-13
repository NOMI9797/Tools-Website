import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Image to GIF Converter",
  description: "Convert multiple images into an animated GIF with customizable settings.",
  alternates: { canonical: "/convert/image-gif" },
};

import ImageToGifClient from "./ImageToGifClient";

export default function ImageToGifPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300">
      <div className="container mx-auto px-4 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-6">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Image to GIF Converter
            </h1>
            <p className="text-lg text-gray-700 max-w-2xl mx-auto">
              Convert multiple images into an animated GIF with customizable settings. 
              Perfect for creating slideshows, animations, and visual sequences.
            </p>
          </div>
          
          <ImageToGifClient />
        </div>
      </div>
    </div>
  );
}
