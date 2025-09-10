import type { Metadata } from "next";
import HeicToJpgClient from "./HeicToJpgClient";

export const metadata: Metadata = {
  title: "HEIC to JPG Converter",
  description: "Convert HEIC images to JPG format online. Free and easy to use.",
  alternates: { canonical: "/convert/heic-jpg" },
};

export default function HeicToJpgPage() {
  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">HEIC to JPG</h1>
        <p className="text-sm text-black/60">Convert HEIC images to JPG format with high quality.</p>
      </header>

      <HeicToJpgClient />
    </div>
  );
}
