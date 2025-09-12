import type { Metadata } from "next";
import PngCompressorClient from "./PngCompressorClient";

export const metadata: Metadata = {
  title: "PNG Compressor",
  description: "Compress PNG images with palette and compression optimizations.",
  alternates: { canonical: "/compress/png-compressor" },
};

export default function PngCompressorPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">PNG Compressor</h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Compress .png images in your browser or via server. Tune compression level and palette optimization.
            </p>
          </div>
          <PngCompressorClient />
        </div>
      </div>
    </div>
  );
}


