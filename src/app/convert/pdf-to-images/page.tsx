import type { Metadata } from "next";
import PdfToImagesClient from "./PdfToImagesClient";

export const metadata: Metadata = {
  title: "PDF to Images",
  description: "Convert each PDF page to PNG/JPG/WEBP with adjustable density.",
  alternates: { canonical: "/convert/pdf-to-images" },
};

export default function PdfToImagesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300">
      <div className="container mx-auto px-4 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-6">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              PDF to Images Converter
            </h1>
            <p className="text-lg text-gray-700 max-w-2xl mx-auto">
              Convert each PDF page to high-quality images in PNG, JPG, or WEBP format. 
              Choose your preferred output format and adjust density (DPI) for optimal quality.
            </p>
          </div>
          
          <PdfToImagesClient />
        </div>
      </div>
    </div>
  );
}


