import type { Metadata } from "next";
import JpegCompressorClient from "./JpegCompressorClient";

export const metadata: Metadata = {
  title: "JPEG Compressor",
  description: "Compress JPEG images with adjustable quality and advanced options.",
  alternates: { canonical: "/compress/jpeg-compressor" },
};

export default function JpegCompressorPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">JPEG Compressor</h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Compress .jpg and .jpeg images in your browser. Control quality, enable progressive encoding and optimize using MozJPEG.
            </p>
          </div>
          <JpegCompressorClient />
        </div>
      </div>
    </div>
  );
}


