import type { Metadata } from "next";
import PdfCompressorClient from "./PdfCompressorClient";

export const metadata: Metadata = {
  title: "PDF Compressor",
  description: "Compress PDFs by downscaling embedded images and re-saving.",
  alternates: { canonical: "/compress/pdf-compressor" },
};

export default function PdfCompressorPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300">
      <div className="container mx-auto px-4 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-6">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">PDF Compressor</h1>
            <p className="text-lg text-gray-700 max-w-2xl mx-auto">
              Compress PDF files by optimizing embedded images, reducing DPI, and applying advanced compression techniques.
              Reduce file size while maintaining document quality.
            </p>
          </div>
          <PdfCompressorClient />
        </div>
      </div>
    </div>
  );
}


