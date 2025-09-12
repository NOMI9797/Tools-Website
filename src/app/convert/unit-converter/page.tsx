import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Unit Converter",
  description: "Convert between different units of length, weight, temperature, area, volume, and more.",
  alternates: { canonical: "/convert/unit-converter" },
};

import UnitConverterClient from "./UnitConverterClient";

export default function UnitConverterPage() {
  return <UnitConverterClient />;
}
