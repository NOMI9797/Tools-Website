import type { Metadata } from "next";
import MP4ToMP3Client from "./MP4ToMP3Client";

export const metadata: Metadata = {
  title: "MP4 to MP3 - Extract Audio from Video Files",
  description: "Extract audio from MP4 and other video files and convert to MP3 format. Choose quality settings, time ranges, and audio processing options.",
  keywords: ["mp4 to mp3", "video to mp3", "extract audio", "video audio extraction", "mp4 audio converter", "video audio converter"],
  alternates: {
    canonical: "/convert/mp4-mp3"
  },
  openGraph: {
    title: "MP4 to MP3 - Extract Audio from Video Files",
    description: "Extract audio from MP4 and other video files and convert to MP3 format. Choose quality settings, time ranges, and audio processing options.",
    url: "/convert/mp4-mp3",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "MP4 to MP3 - Extract Audio from Video Files",
    description: "Extract audio from MP4 and other video files and convert to MP3 format. Choose quality settings, time ranges, and audio processing options.",
  },
};

export default function MP4ToMP3Page() {
  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              MP4 to MP3 Converter
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Extract audio from MP4 and other video files and convert to MP3 format. 
              Choose your preferred quality settings, specify time ranges, and apply 
              audio processing options for the best results.
            </p>
          </div>
          
          <MP4ToMP3Client />
        </div>
      </div>
    </div>
  );
}
