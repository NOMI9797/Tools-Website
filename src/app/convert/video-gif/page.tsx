import type { Metadata } from "next";
import VideoToGifClient from "./VideoToGifClient"

export const metadata: Metadata = {
  title: "Video to GIF Converter",
  description: "Convert video files to animated GIF format. Supports MP4, MOV, and more.",
  alternates: { canonical: "/convert/video-gif" },
};

export default function VideoToGifPage() {
  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">Video to GIF</h1>
        <p className="text-sm text-black/60">Convert videos to animated GIF format with adjustable quality.</p>
      </header>

      <VideoToGifClient />
    </div>
  );
}
