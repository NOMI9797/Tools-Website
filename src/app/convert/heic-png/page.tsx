import type { Metadata } from "next";
import HeicToPngClient from "./HeicToPngClient";

export const metadata: Metadata = {
  title: "HEIC to PNG Converter",
  description: "Convert HEIC images to PNG format online. Free and easy to use.",
  alternates: { canonical: "/convert/heic-png" },
};

export default function HeicToPngPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300">
      <div className="container mx-auto px-4 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-6">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              HEIC to PNG Converter
            </h1>
            <p className="text-lg text-gray-700 max-w-2xl mx-auto">
              Convert HEIC images to PNG format with high quality and transparency support. 
              Perfect for sharing iPhone photos and maintaining image quality.
            </p>
          </div>
          
          <HeicToPngClient />
        </div>
      </div>
    </div>
  );
}
