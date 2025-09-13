import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Unit Converter",
  description: "Convert between different units of length, weight, temperature, area, volume, and more.",
  alternates: { canonical: "/convert/unit-converter" },
};

import UnitConverterClient from "./UnitConverterClient";

export default function UnitConverterPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300">
      <div className="container mx-auto px-4 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-6">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Unit Converter
            </h1>
            <p className="text-lg text-gray-700 max-w-2xl mx-auto">
              Convert between different units of length, weight, temperature, area, volume, and more. 
              Fast, accurate, and easy-to-use unit conversion tool.
            </p>
          </div>
          
          <UnitConverterClient />
        </div>
      </div>
    </div>
  );
}
