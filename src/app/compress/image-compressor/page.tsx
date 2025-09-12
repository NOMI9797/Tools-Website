import type { Metadata } from "next";
import ImageCompressorClient from "./ImageCompressorClient";

export const metadata: Metadata = {
  title: "Image Compressor (JPG/PNG/WEBP)",
  description: "Compress images in the browser with adjustable quality, resize, and format.",
  alternates: { canonical: "/compress/image-compressor" },
};

export default function ImageCompressorPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Image Compressor</h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Compress JPG, PNG, and WEBP images directly in your browser. Adjust quality, resize dimensions, and change output format.
            </p>
          </div>
          <ImageCompressorClient />
        </div>
      </div>
    </div>
  );
}


