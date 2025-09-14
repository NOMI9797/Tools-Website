import type { Metadata } from "next";
import AudioConverterClient from "./AudioConverterClient";

export const metadata: Metadata = {
  title: "Audio Converter",
  description: "Convert audio files between MP3, WAV, OGG, FLAC, AAC, M4A, and WMA formats. Fast, accurate, and easy-to-use audio conversion tool.",
  alternates: { canonical: "/convert/audio-converter" },
};

export default function AudioConverterPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300">
      <div className="container mx-auto px-4 pt-16 pb-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-6">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Audio Converter
            </h1>
            <p className="text-lg text-gray-700 max-w-2xl mx-auto">
              Convert audio files between popular formats including MP3, WAV, OGG, FLAC, AAC, M4A, and WMA. 
              Choose your preferred quality settings and download the converted audio file instantly.
            </p>
          </div>
          
          <AudioConverterClient />
        </div>
      </div>
    </div>
  );
}
