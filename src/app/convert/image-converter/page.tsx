import type { Metadata } from "next";
import ImageConverterClient from "./ImageConverterClient";

export const metadata: Metadata = {
  title: "Image Converter (JPG/PNG/WEBP/SVG)",
  description: "Convert images between JPG, PNG, WEBP, and SVG with adjustable quality.",
  alternates: { canonical: "/convert/image-converter" },
};

export default function ImageConverterPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300">
      <div className="container mx-auto px-4 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-6">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Image Converter
            </h1>
            <p className="text-lg text-gray-700 max-w-2xl mx-auto">
              Convert images between JPG, PNG, WEBP, and SVG formats with adjustable quality settings. 
              High-quality image conversion with customizable options.
            </p>
          </div>
          
          <ImageConverterClient />
        </div>
      </div>
    </div>
  );
}


