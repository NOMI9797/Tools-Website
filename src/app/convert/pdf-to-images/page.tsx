import type { Metadata } from "next";
import PdfToImagesClient from "./PdfToImagesClient";

export const metadata: Metadata = {
  title: "PDF to Images",
  description: "Convert PDF pages to PNG images with high quality and transparency support.",
  alternates: { canonical: "/convert/pdf-to-images" },
};

export default function PdfToImagesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300">
      <div className="container mx-auto px-4 pt-16 pb-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-6">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              PDF to Images Converter
            </h1>
            <p className="text-lg text-gray-700 max-w-2xl mx-auto">
              Convert PDF pages to PNG images with high quality and transparency support.
            </p>
          </div>
          
          <PdfToImagesClient />
        </div>
      </div>
    </div>
  );
}


