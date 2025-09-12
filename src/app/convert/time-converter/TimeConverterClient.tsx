"use client";

import { useState, useCallback, useEffect } from "react";

type TimeUnit = {
  id: string;
  name: string;
  symbol: string;
  factor: number;
};

type TimeCategory = {
  id: string;
  name: string;
  icon: string;
  units: TimeUnit[];
};

const timeCategories: TimeCategory[] = [
  {
    id: "standard",
    name: "Standard Units",
    icon: "⏰",
    units: [
      { id: "nanosecond", name: "Nanosecond", symbol: "ns", factor: 0.000001 },
      { id: "microsecond", name: "Microsecond", symbol: "μs", factor: 0.001 },
      { id: "millisecond", name: "Millisecond", symbol: "ms", factor: 1 },
      { id: "second", name: "Second", symbol: "s", factor: 1000 },
      { id: "minute", name: "Minute", symbol: "min", factor: 60000 },
      { id: "hour", name: "Hour", symbol: "h", factor: 3600000 },
      { id: "day", name: "Day", symbol: "day", factor: 86400000 },
      { id: "week", name: "Week", symbol: "week", factor: 604800000 },
      { id: "month", name: "Month (30 days)", symbol: "month", factor: 2592000000 },
      { id: "year", name: "Year (365 days)", symbol: "year", factor: 31536000000 },
    ],
  },
  {
    id: "extended",
    name: "Extended Units",
    icon: "📅",
    units: [
      { id: "decade", name: "Decade", symbol: "decade", factor: 315360000000 },
      { id: "century", name: "Century", symbol: "century", factor: 3153600000000 },
      { id: "millennium", name: "Millennium", symbol: "millennium", factor: 31536000000000 },
      { id: "fortnight", name: "Fortnight", symbol: "fortnight", factor: 1209600000 },
      { id: "quarter", name: "Quarter (3 months)", symbol: "quarter", factor: 7776000000 },
      { id: "semester", name: "Semester (6 months)", symbol: "semester", factor: 15552000000 },
    ],
  },
  {
    id: "astronomical",
    name: "Astronomical Units",
    icon: "🌙",
    units: [
      { id: "leap_year", name: "Leap Year", symbol: "leap year", factor: 31622400000 },
      { id: "sidereal_day", name: "Sidereal Day", symbol: "sidereal day", factor: 86164090 },
      { id: "sidereal_year", name: "Sidereal Year", symbol: "sidereal year", factor: 31558149500 },
      { id: "lunar_month", name: "Lunar Month", symbol: "lunar month", factor: 2551443000 },
    ],
  },
];

export default function TimeConverterClient() {
  const [selectedCategory, setSelectedCategory] = useState("standard");
  const [fromUnit, setFromUnit] = useState("second");
  const [toUnit, setToUnit] = useState("minute");
  const [inputValue, setInputValue] = useState("");
  const [result, setResult] = useState("");
  const [additionalInfo, setAdditionalInfo] = useState<any>(null);

  const currentCategory = timeCategories.find(cat => cat.id === selectedCategory);

  const convertValue = useCallback(async () => {
    if (!inputValue || !currentCategory) return;

    const fromUnitData = currentCategory.units.find(unit => unit.id === fromUnit);
    const toUnitData = currentCategory.units.find(unit => unit.id === toUnit);

    if (!fromUnitData || !toUnitData) return;

    const value = parseFloat(inputValue);
    if (isNaN(value)) return;

    // Try API conversion first for validation, fallback to client-side
    try {
      const response = await fetch('/api/convert/time-converter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          value,
          fromUnit,
          toUnit,
          conversionType: selectedCategory
        })
      });

      if (response.ok) {
        const data = await response.json();
        setResult(data.convertedValue.toString());
        setAdditionalInfo(data.additionalInfo);
        return;
      }
    } catch (error) {
      console.log('API conversion failed, using client-side fallback');
    }

    // Client-side fallback
    const milliseconds = value * fromUnitData.factor;
    const convertedValue = milliseconds / toUnitData.factor;
    
    setResult(convertedValue.toFixed(10).replace(/\.?0+$/, ""));
    
    // Calculate additional info for client-side
    const seconds = milliseconds / 1000;
    const minutes = seconds / 60;
    const hours = minutes / 60;
    const days = hours / 24;
    const weeks = days / 7;
    const months = days / 30;
    const years = days / 365;

    setAdditionalInfo({
      totalMilliseconds: milliseconds,
      totalSeconds: seconds,
      totalMinutes: minutes,
      totalHours: hours,
      totalDays: days,
      totalWeeks: weeks,
      totalMonths: months,
      totalYears: years,
      humanReadable: formatHumanReadable(milliseconds)
    });
  }, [inputValue, fromUnit, toUnit, selectedCategory, currentCategory]);

  const formatHumanReadable = (milliseconds: number): string => {
    const absMs = Math.abs(milliseconds);
    
    if (absMs < 1000) {
      return `${milliseconds.toFixed(0)} ms`;
    }
    
    const seconds = absMs / 1000;
    if (seconds < 60) {
      return `${(milliseconds / 1000).toFixed(2)} seconds`;
    }
    
    const minutes = seconds / 60;
    if (minutes < 60) {
      return `${(milliseconds / 60000).toFixed(2)} minutes`;
    }
    
    const hours = minutes / 60;
    if (hours < 24) {
      return `${(milliseconds / 3600000).toFixed(2)} hours`;
    }
    
    const days = hours / 24;
    if (days < 7) {
      return `${(milliseconds / 86400000).toFixed(2)} days`;
    }
    
    const weeks = days / 7;
    if (weeks < 4) {
      return `${(milliseconds / 604800000).toFixed(2)} weeks`;
    }
    
    const months = days / 30;
    if (months < 12) {
      return `${(milliseconds / 2592000000).toFixed(2)} months`;
    }
    
    const years = days / 365;
    return `${(milliseconds / 31536000000).toFixed(2)} years`;
  };

  const swapUnits = () => {
    setFromUnit(toUnit);
    setToUnit(fromUnit);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setInputValue(value);
    }
  };

  useEffect(() => {
    if (inputValue && !isNaN(parseFloat(inputValue))) {
      convertValue();
    } else {
      setResult("");
      setAdditionalInfo(null);
    }
  }, [inputValue, fromUnit, toUnit, convertValue]);

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Category Sidebar */}
        <div className="lg:col-span-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Time Categories</h3>
          <div className="space-y-2">
            {timeCategories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                  selectedCategory === category.id
                    ? "bg-blue-100 text-blue-700 border-2 border-blue-200"
                    : "bg-gray-50 text-gray-700 hover:bg-gray-100 border-2 border-transparent"
                }`}
              >
                <div className="flex items-center space-x-3">
                  <span className="text-xl">{category.icon}</span>
                  <span className="font-medium">{category.name}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Conversion Interface */}
        <div className="lg:col-span-3">
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">
              Convert Time Units
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* From Unit */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  From
                </label>
                <select
                  value={fromUnit}
                  onChange={(e) => setFromUnit(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {currentCategory?.units.map((unit) => (
                    <option key={unit.id} value={unit.id}>
                      {unit.name} ({unit.symbol})
                    </option>
                  ))}
                </select>
              </div>

              {/* To Unit */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  To
                </label>
                <select
                  value={toUnit}
                  onChange={(e) => setToUnit(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {currentCategory?.units.map((unit) => (
                    <option key={unit.id} value={unit.id}>
                      {unit.name} ({unit.symbol})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Input Value */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Value
              </label>
              <input
                type="text"
                value={inputValue}
                onChange={handleInputChange}
                placeholder="Enter time value"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
              />
            </div>

            {/* Swap Button */}
            <div className="flex justify-center mb-6">
              <button
                onClick={swapUnits}
                className="p-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
                title="Swap units"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                </svg>
              </button>
            </div>

            {/* Result */}
            {result && (
              <div className="bg-white rounded-lg p-6 border-2 border-green-200">
                <h4 className="text-lg font-semibold text-gray-900 mb-2">Result</h4>
                <div className="text-3xl font-bold text-green-600 mb-4">
                  {result} {currentCategory?.units.find(u => u.id === toUnit)?.symbol}
                </div>
                
                {additionalInfo && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <h5 className="font-semibold text-gray-900 mb-3">Additional Information</h5>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Human Readable:</span>
                        <div className="font-medium">{additionalInfo.humanReadable}</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Total Seconds:</span>
                        <div className="font-medium">{additionalInfo.totalSeconds?.toFixed(2)}</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Total Minutes:</span>
                        <div className="font-medium">{additionalInfo.totalMinutes?.toFixed(2)}</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Total Hours:</span>
                        <div className="font-medium">{additionalInfo.totalHours?.toFixed(2)}</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Total Days:</span>
                        <div className="font-medium">{additionalInfo.totalDays?.toFixed(2)}</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Total Weeks:</span>
                        <div className="font-medium">{additionalInfo.totalWeeks?.toFixed(2)}</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Total Months:</span>
                        <div className="font-medium">{additionalInfo.totalMonths?.toFixed(2)}</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Total Years:</span>
                        <div className="font-medium">{additionalInfo.totalYears?.toFixed(2)}</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Reference */}
      <div className="mt-8 bg-blue-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-4">Quick Reference</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="bg-white p-3 rounded">
            <div className="font-semibold text-blue-900">1 Second</div>
            <div className="text-gray-600">= 1,000 milliseconds</div>
          </div>
          <div className="bg-white p-3 rounded">
            <div className="font-semibold text-blue-900">1 Minute</div>
            <div className="text-gray-600">= 60 seconds</div>
          </div>
          <div className="bg-white p-3 rounded">
            <div className="font-semibold text-blue-900">1 Hour</div>
            <div className="text-gray-600">= 60 minutes</div>
          </div>
          <div className="bg-white p-3 rounded">
            <div className="font-semibold text-blue-900">1 Day</div>
            <div className="text-gray-600">= 24 hours</div>
          </div>
          <div className="bg-white p-3 rounded">
            <div className="font-semibold text-blue-900">1 Week</div>
            <div className="text-gray-600">= 7 days</div>
          </div>
          <div className="bg-white p-3 rounded">
            <div className="font-semibold text-blue-900">1 Month</div>
            <div className="text-gray-600">= 30 days</div>
          </div>
          <div className="bg-white p-3 rounded">
            <div className="font-semibold text-blue-900">1 Year</div>
            <div className="text-gray-600">= 365 days</div>
          </div>
          <div className="bg-white p-3 rounded">
            <div className="font-semibold text-blue-900">1 Leap Year</div>
            <div className="text-gray-600">= 366 days</div>
          </div>
        </div>
      </div>
    </div>
  );
}
