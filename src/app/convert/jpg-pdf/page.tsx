import type { Metadata } from "next";
import JpgToPdfClient from "./JpgToPdfClient";

export const metadata: Metadata = {
  title: "JPG to PDF Converter",
  description: "Convert JPG images to PDF format online. Free and easy to use.",
  alternates: { canonical: "/convert/jpg-pdf" },
};

export default function JpgToPdfPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300">
      <div className="container mx-auto px-4 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-6">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              JPG to PDF Converter
            </h1>
            <p className="text-lg text-gray-700 max-w-2xl mx-auto">
              Convert JPG images to PDF format with high quality. 
              Perfect for combining multiple JPG photos into a single PDF document.
            </p>
          </div>
          
          <JpgToPdfClient />
        </div>
      </div>
    </div>
  );
}
