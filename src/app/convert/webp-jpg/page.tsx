import type { Metadata } from "next";
import WebpToJpgClient from "./WebpToJpgClient";

export const metadata: Metadata = {
  title: "WEBP to JPG Converter",
  description: "Convert WEBP images to JPG format online. Free and easy to use.",
  alternates: { canonical: "/convert/webp-jpg" },
};

export default function WebpToJpgPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300">
      <div className="container mx-auto px-4 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-6">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              WEBP to JPG Converter
            </h1>
            <p className="text-lg text-gray-700 max-w-2xl mx-auto">
              Convert WEBP images to JPG format with high quality and compression. 
              Perfect for sharing and maintaining compatibility across all devices.
            </p>
          </div>
          
          <WebpToJpgClient />
        </div>
      </div>
    </div>
  );
}
