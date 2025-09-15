import type { Metadata } from "next";
import PngCompressorClient from "./PngCompressorClient";

export const metadata: Metadata = {
  title: "PNG Compressor",
  description: "Compress PNG images with palette and compression optimizations.",
  alternates: { canonical: "/compress/png-compressor" },
};

export default function PngCompressorPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300">
      <div className="container mx-auto px-4 pt-16 pb-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-6">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">PNG Compressor</h1>
            <p className="text-lg text-gray-700 max-w-2xl mx-auto">
              Compress .png images in your browser or via server. Tune compression level and palette optimization.
            </p>
          </div>
          <PngCompressorClient />
        </div>
      </div>
    </div>
  );
}


