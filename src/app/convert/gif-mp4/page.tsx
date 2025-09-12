import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "GIF to MP4 Converter",
  description: "Convert animated GIFs to MP4 video format with smooth playback.",
  alternates: { canonical: "/convert/gif-mp4" },
};

import GifToMp4Client from "./GifToMp4Client";

export default function GifToMp4Page() {
  return <GifToMp4Client />;
}


