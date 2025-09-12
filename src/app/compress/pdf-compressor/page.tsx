import type { Metadata } from "next";
import PdfCompressorClient from "./PdfCompressorClient";

export const metadata: Metadata = {
  title: "PDF Compressor",
  description: "Compress PDFs by downscaling embedded images and re-saving.",
  alternates: { canonical: "/compress/pdf-compressor" },
};

export default function PdfCompressorPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">PDF Compressor</h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Basic PDF compression that optimizes embedded images and re-saves. Advanced features may require external tools.
            </p>
          </div>
          <PdfCompressorClient />
        </div>
      </div>
    </div>
  );
}


