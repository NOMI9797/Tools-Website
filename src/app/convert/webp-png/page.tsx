import type { Metadata } from "next";
import WebpToPngClient from "./WebpToPngClient";

export const metadata: Metadata = {
  title: "WEBP to PNG Converter",
  description: "Convert WEBP images to PNG format online. Free, fast, and secure.",
  alternates: { canonical: "/convert/webp-png" },
};

export default function WebpToPngPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300">
      <div className="container mx-auto px-4 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-6">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              WEBP to PNG Converter
            </h1>
            <p className="text-lg text-gray-700 max-w-2xl mx-auto">
              Convert WEBP images to PNG format with high quality and transparency support. 
              Fast, secure, and maintains image quality during conversion.
            </p>
          </div>
          
          <WebpToPngClient />
        </div>
      </div>
    </div>
  );
}
