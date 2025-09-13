import type { Metadata } from "next";
import MP3ConverterClient from "./MP3ConverterClient";

export const metadata: Metadata = {
  title: "MP3 Converter - Convert Audio to MP3 Format",
  description: "Convert audio files to MP3 format with advanced quality settings, bitrate options, and audio processing features like normalization and silence removal.",
  keywords: ["mp3 converter", "audio to mp3", "mp3 quality", "mp3 bitrate", "audio normalization", "mp3 encoder"],
  alternates: {
    canonical: "/convert/mp3-converter"
  },
  openGraph: {
    title: "MP3 Converter - Convert Audio to MP3 Format",
    description: "Convert audio files to MP3 format with advanced quality settings, bitrate options, and audio processing features like normalization and silence removal.",
    url: "/convert/mp3-converter",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "MP3 Converter - Convert Audio to MP3 Format",
    description: "Convert audio files to MP3 format with advanced quality settings, bitrate options, and audio processing features like normalization and silence removal.",
  },
};

export default function MP3ConverterPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300">
      <div className="container mx-auto px-4 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-6">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              MP3 Converter
            </h1>
            <p className="text-lg text-gray-700 max-w-2xl mx-auto">
              Convert audio files to MP3 format with advanced quality settings, bitrate options, 
              and audio processing features. Choose from CBR, VBR, or ABR encoding modes with 
              professional audio enhancement options.
            </p>
          </div>
          
          <MP3ConverterClient />
        </div>
      </div>
    </div>
  );
}
