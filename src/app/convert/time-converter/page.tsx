import type { Metadata } from "next";
import TimeConverterClient from "./TimeConverterClient";

export const metadata: Metadata = {
  title: "Time Converter - Convert Between Time Units",
  description: "Convert between nanoseconds, milliseconds, seconds, minutes, hours, days, weeks, months, years, decades, centuries, and more time units.",
  keywords: ["time converter", "time units", "seconds", "minutes", "hours", "days", "weeks", "months", "years", "milliseconds", "nanoseconds"],
  alternates: {
    canonical: "/convert/time-converter"
  },
  openGraph: {
    title: "Time Converter - Convert Between Time Units",
    description: "Convert between nanoseconds, milliseconds, seconds, minutes, hours, days, weeks, months, years, decades, centuries, and more time units.",
    url: "/convert/time-converter",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Time Converter - Convert Between Time Units",
    description: "Convert between nanoseconds, milliseconds, seconds, minutes, hours, days, weeks, months, years, decades, centuries, and more time units.",
  },
};

export default function TimeConverterPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Time Converter
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Convert between different time units including nanoseconds, milliseconds, seconds, 
              minutes, hours, days, weeks, months, years, decades, centuries, and more. 
              Includes special time units like leap years, sidereal time, and lunar months.
            </p>
          </div>
          
          <TimeConverterClient />
        </div>
      </div>
    </div>
  );
}
