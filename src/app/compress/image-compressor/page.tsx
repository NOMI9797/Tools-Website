import type { Metadata } from "next";
import ImageCompressorClient from "./ImageCompressorClient";

export const metadata: Metadata = {
  title: "Image Compressor (JPG/PNG/WEBP)",
  description: "Compress images in the browser with adjustable quality, resize, and format.",
  alternates: { canonical: "/compress/image-compressor" },
};

export default function ImageCompressorPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300">
      <div className="container mx-auto px-4 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-6">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Image Compressor</h1>
            <p className="text-lg text-gray-700 max-w-2xl mx-auto">
              Compress JPG, PNG, and WEBP images directly in your browser. Adjust quality, resize dimensions, and change output format.
            </p>
          </div>
          <ImageCompressorClient />
        </div>
      </div>
    </div>
  );
}


