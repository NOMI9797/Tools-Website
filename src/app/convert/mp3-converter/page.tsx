import type { Metadata } from "next";
import MP3ConverterClient from "./MP3ConverterClient";

export const metadata: Metadata = {
  title: "MP3 Converter",
  description: "Convert audio files to MP3 format with customizable quality settings and bitrate options. Fast, accurate, and easy-to-use MP3 conversion tool.",
  alternates: { canonical: "/convert/mp3-converter" },
};

export default function MP3ConverterPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300">
      <div className="container mx-auto px-4 pt-16 pb-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-6">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              MP3 Converter
            </h1>
            <p className="text-lg text-gray-700 max-w-2xl mx-auto">
              Convert audio files to MP3 format with customizable quality settings and bitrate options.
            </p>
          </div>
          
          <MP3ConverterClient />
        </div>
      </div>
    </div>
  );
}
