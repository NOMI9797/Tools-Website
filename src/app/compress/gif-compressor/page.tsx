import type { Metadata } from "next";
import GifCompressorClient from "./GifCompressorClient";

export const metadata: Metadata = {
  title: "GIF Compressor",
  description: "Compress GIFs by reducing fps, colors, and dimensions.",
  alternates: { canonical: "/compress/gif-compressor" },
};

export default function GifCompressorPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">GIF Compressor</h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Reduce GIF file size by adjusting frame rate, colors, and scale. Runs in-browser with a server fallback.
            </p>
          </div>
          <GifCompressorClient />
        </div>
      </div>
    </div>
  );
}


