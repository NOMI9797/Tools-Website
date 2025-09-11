import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "WEBM to GIF Converter",
  description: "Convert WEBM videos to animated GIF format with optimized quality.",
  alternates: { canonical: "/convert/webm-gif" },
};

import WebmToGifClient from "./WebmToGifClient";

export default function WebmToGifPage() {
  return <WebmToGifClient />;
}


