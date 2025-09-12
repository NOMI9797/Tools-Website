import type { Metadata } from "next";
import AgeCalculatorClient from "./AgeCalculatorClient";

export const metadata: Metadata = {
  title: "Age Calculator - Calculate Your Age in Different Units",
  description: "Calculate your exact age in days, weeks, months, years, decades, centuries, and more. Includes life milestones, next birthday, and time spent analysis.",
  keywords: ["age calculator", "birthday calculator", "age in days", "age in months", "age in years", "life milestones", "next birthday"],
  alternates: {
    canonical: "/convert/age-calculator"
  },
  openGraph: {
    title: "Age Calculator - Calculate Your Age in Different Units",
    description: "Calculate your exact age in days, weeks, months, years, decades, centuries, and more. Includes life milestones, next birthday, and time spent analysis.",
    url: "/convert/age-calculator",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Age Calculator - Calculate Your Age in Different Units",
    description: "Calculate your exact age in days, weeks, months, years, decades, centuries, and more. Includes life milestones, next birthday, and time spent analysis.",
  },
};

export default function AgeCalculatorPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Age Calculator
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Calculate your exact age in various time units including days, weeks, months, years, 
              decades, centuries, and more. Discover life milestones, next birthday countdown, 
              and interesting time statistics about your life.
            </p>
          </div>
          
          <AgeCalculatorClient />
        </div>
      </div>
    </div>
  );
}
