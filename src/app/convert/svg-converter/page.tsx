import type { Metadata } from "next";
import SvgConverterClient from "./SvgConverterClient";

export const metadata: Metadata = {
  title: "SVG Converter",
  description: "Convert SVG images to and from other formats (PNG, JPG). Free and easy to use.",
  alternates: { canonical: "/convert/svg-converter" },
};

export default function SvgConverterPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300">
      <div className="container mx-auto px-4 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-6">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              SVG Converter
            </h1>
            <p className="text-lg text-gray-700 max-w-2xl mx-auto">
              Convert SVG images to PNG, JPG, or optimize existing SVGs for web use. 
              Perfect for creating raster images from scalable vector graphics.
            </p>
          </div>
          
          <SvgConverterClient />
        </div>
      </div>
    </div>
  );
}
