import type { Metadata } from "next";
import SvgConverterClient from "./SvgConverterClient";

export const metadata: Metadata = {
  title: "SVG Converter",
  description: "Convert SVG images to and from other formats (PNG, JPG). Free and easy to use.",
  alternates: { canonical: "/convert/svg-converter" },
};

export default function SvgConverterPage() {
  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">SVG Converter</h1>
        <p className="text-sm text-black/60">Convert SVG images to PNG/JPG or optimize existing SVGs.</p>
      </header>

      <SvgConverterClient />
    </div>
  );
}
