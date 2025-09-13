import type { Metadata } from "next";
import JfifToPngClient from "./JfifToPngClient";

export const metadata: Metadata = {
  title: "JFIF to PNG Converter",
  description: "Convert JFIF images to PNG format online. Free and easy to use.",
  alternates: { canonical: "/convert/jfif-png" },
};

export default function JfifToPngPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300">
      <div className="container mx-auto px-4 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-6">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              JFIF to PNG Converter
            </h1>
            <p className="text-lg text-gray-700 max-w-2xl mx-auto">
              Convert JFIF images to PNG format with high quality and transparency support. 
              Fast, secure, and maintains image quality during conversion.
            </p>
          </div>
          
          <JfifToPngClient />
        </div>
      </div>
    </div>
  );
}
