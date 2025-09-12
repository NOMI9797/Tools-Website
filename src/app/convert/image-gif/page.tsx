import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Image to GIF Converter",
  description: "Convert multiple images into an animated GIF with customizable settings.",
  alternates: { canonical: "/convert/image-gif" },
};

import ImageToGifClient from "./ImageToGifClient";

export default function ImageToGifPage() {
  return <ImageToGifClient />;
}
