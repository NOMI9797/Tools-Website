import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "MP4 to GIF Converter",
  description: "Convert MP4 videos to animated GIF format with optimized quality.",
  alternates: { canonical: "/convert/mp4-gif" },
};

import Mp4ToGifClient from "./Mp4ToGifClient";

export default function Mp4ToGifPage() {
  return <Mp4ToGifClient />;
}


