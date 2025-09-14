import type { Metadata } from "next";
import GifCompressorClient from "./GifCompressorClient";

export const metadata: Metadata = {
  title: "GIF Compressor",
  description: "Compress GIFs by reducing fps, colors, and dimensions.",
  alternates: { canonical: "/compress/gif-compressor" },
};

export default function GifCompressorPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300">
      <div className="container mx-auto px-4 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-6">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">GIF Compressor</h1>
            <p className="text-lg text-gray-700 max-w-2xl mx-auto">
              Compress animated GIF files by reducing frame rate, colors, and dimensions.
              Optimize GIFs for web use while maintaining visual quality.
            </p>
          </div>
          <GifCompressorClient />
        </div>
      </div>
    </div>
  );
}


