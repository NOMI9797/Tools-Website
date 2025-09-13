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
  const [isConverting, setIsConverting] = useState(false);

  const currentCategory = timeCategories.find(cat => cat.id === selectedCategory);

  const convertValue = useCallback(async () => {
    if (!inputValue || !currentCategory) return;

    const fromUnitData = currentCategory.units.find(unit => unit.id === fromUnit);
    const toUnitData = currentCategory.units.find(unit => unit.id === toUnit);

    if (!fromUnitData || !toUnitData) return;

    const value = parseFloat(inputValue);
    if (isNaN(value)) return;

    setIsConverting(true);

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
        setIsConverting(false);
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
    setIsConverting(false);
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
    setIsConverting(false);
  };

  const handleReset = () => {
    setInputValue("");
    setResult("");
    setAdditionalInfo(null);
    setIsConverting(false);
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
    <div className="bg-transparent">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Category Selection */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Time Categories</h3>
          
          <div className="bg-gray-200/50 border border-gray-300/50 rounded-xl p-6 backdrop-blur-sm">
            <div className="space-y-3">
              {timeCategories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                    selectedCategory === category.id
                      ? "bg-gradient-to-r from-gray-600 to-gray-700 text-white shadow-lg"
                      : "bg-gray-300/50 text-gray-900 hover:bg-gray-400/50 border border-gray-300/50"
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-lg">{category.icon}</span>
                    <span className="font-medium">{category.name}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Conversion Interface */}
        <div className="lg:col-span-3">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">
            {currentCategory?.icon} {currentCategory?.name} Conversion
          </h3>
          
          <div className="space-y-6">
            {/* Input Section */}
            <div className="bg-gray-200/50 border border-gray-300/50 rounded-xl p-6 backdrop-blur-sm">
              <h4 className="font-semibold text-gray-900 mb-4">Convert From</h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Value
                  </label>
                  <input
                    type="text"
                    value={inputValue}
                    onChange={handleInputChange}
                    placeholder="Enter time value"
                    className="w-full px-4 py-3 border border-gray-300/50 rounded-xl text-gray-900 bg-gray-300/50 focus:outline-none focus:ring-2 focus:ring-gray-500/50 focus:border-gray-500/50 transition-all duration-200 text-lg"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    From Unit
                  </label>
                  <select
                    value={fromUnit}
                    onChange={(e) => setFromUnit(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300/50 rounded-xl text-gray-900 bg-gray-300/50 focus:outline-none focus:ring-2 focus:ring-gray-500/50 focus:border-gray-500/50 transition-all duration-200"
                  >
                    {currentCategory?.units.map((unit) => (
                      <option key={unit.id} value={unit.id}>
                        {unit.name} ({unit.symbol})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Swap Button */}
            <div className="flex justify-center">
              <button
                onClick={swapUnits}
                className="p-4 rounded-full bg-gray-200/50 border border-gray-300/50 hover:bg-gray-300/50 transition-all duration-200 shadow-lg hover:shadow-gray-500/25 transform hover:-translate-y-0.5"
                title="Swap units"
              >
                <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                </svg>
              </button>
            </div>

            {/* Output Section */}
            <div className="bg-gray-200/50 border border-gray-300/50 rounded-xl p-6 backdrop-blur-sm">
              <h4 className="font-semibold text-gray-900 mb-4">Convert To</h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    To Unit
                  </label>
                  <select
                    value={toUnit}
                    onChange={(e) => setToUnit(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300/50 rounded-xl text-gray-900 bg-gray-300/50 focus:outline-none focus:ring-2 focus:ring-gray-500/50 focus:border-gray-500/50 transition-all duration-200"
                  >
                    {currentCategory?.units.map((unit) => (
                      <option key={unit.id} value={unit.id}>
                        {unit.name} ({unit.symbol})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-4">
              <button
                onClick={convertValue}
                disabled={!inputValue || isConverting}
                className="flex-1 bg-gradient-to-r from-gray-600 to-gray-700 text-white py-4 px-6 rounded-xl hover:from-gray-700 hover:to-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-gray-500/25 transform hover:-translate-y-0.5 font-semibold text-lg"
              >
                {isConverting ? "Converting..." : "Convert Time"}
              </button>
              
              <button
                onClick={handleReset}
                className="px-6 py-4 bg-gray-300/50 text-gray-900 rounded-xl hover:bg-gray-400/50 transition-all duration-200 border border-gray-300/50 font-semibold"
              >
                Reset
              </button>
            </div>

            {/* Conversion Result */}
            {result && (
              <div className="bg-gray-200/50 border border-gray-300/50 rounded-xl p-6 backdrop-blur-sm">
                <h4 className="font-semibold text-gray-900 mb-3">Conversion Result</h4>
                <div className="bg-gray-300/50 rounded-lg p-6">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-gray-900 mb-2">
                      {result}
                    </div>
                    <div className="text-gray-700 text-lg">
                      {currentCategory?.units.find(u => u.id === toUnit)?.symbol}
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-700">From:</span>
                    <div className="font-medium text-gray-900">
                      {inputValue} {currentCategory?.units.find(u => u.id === fromUnit)?.symbol}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-700">To:</span>
                    <div className="font-medium text-gray-900">
                      {result} {currentCategory?.units.find(u => u.id === toUnit)?.symbol}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Additional Information */}
            {additionalInfo && (
              <div className="bg-gray-200/50 border border-gray-300/50 rounded-xl p-6 backdrop-blur-sm">
                <h4 className="font-semibold text-gray-900 mb-4">Additional Information</h4>
                <div className="space-y-4">
                  <div className="bg-gray-300/50 rounded-lg p-4">
                    <div className="text-center">
                      <div className="text-lg font-semibold text-gray-900 mb-1">Human Readable</div>
                      <div className="text-gray-700">{additionalInfo.humanReadable}</div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div className="bg-gray-300/50 rounded-lg p-3 text-center">
                      <div className="text-gray-700">Seconds</div>
                      <div className="font-medium text-gray-900">{additionalInfo.totalSeconds?.toFixed(2)}</div>
                    </div>
                    <div className="bg-gray-300/50 rounded-lg p-3 text-center">
                      <div className="text-gray-700">Minutes</div>
                      <div className="font-medium text-gray-900">{additionalInfo.totalMinutes?.toFixed(2)}</div>
                    </div>
                    <div className="bg-gray-300/50 rounded-lg p-3 text-center">
                      <div className="text-gray-700">Hours</div>
                      <div className="font-medium text-gray-900">{additionalInfo.totalHours?.toFixed(2)}</div>
                    </div>
                    <div className="bg-gray-300/50 rounded-lg p-3 text-center">
                      <div className="text-gray-700">Days</div>
                      <div className="font-medium text-gray-900">{additionalInfo.totalDays?.toFixed(2)}</div>
                    </div>
                    <div className="bg-gray-300/50 rounded-lg p-3 text-center">
                      <div className="text-gray-700">Weeks</div>
                      <div className="font-medium text-gray-900">{additionalInfo.totalWeeks?.toFixed(2)}</div>
                    </div>
                    <div className="bg-gray-300/50 rounded-lg p-3 text-center">
                      <div className="text-gray-700">Months</div>
                      <div className="font-medium text-gray-900">{additionalInfo.totalMonths?.toFixed(2)}</div>
                    </div>
                    <div className="bg-gray-300/50 rounded-lg p-3 text-center">
                      <div className="text-gray-700">Years</div>
                      <div className="font-medium text-gray-900">{additionalInfo.totalYears?.toFixed(2)}</div>
                    </div>
                    <div className="bg-gray-300/50 rounded-lg p-3 text-center">
                      <div className="text-gray-700">Milliseconds</div>
                      <div className="font-medium text-gray-900">{additionalInfo.totalMilliseconds?.toFixed(0)}</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Reference */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Quick Reference</h3>
        <div className="bg-gray-200/50 border border-gray-300/50 rounded-xl p-6 backdrop-blur-sm">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="bg-gray-300/50 p-3 rounded-lg text-center">
              <div className="font-semibold text-gray-900">1 Second</div>
              <div className="text-gray-700">= 1,000 milliseconds</div>
            </div>
            <div className="bg-gray-300/50 p-3 rounded-lg text-center">
              <div className="font-semibold text-gray-900">1 Minute</div>
              <div className="text-gray-700">= 60 seconds</div>
            </div>
            <div className="bg-gray-300/50 p-3 rounded-lg text-center">
              <div className="font-semibold text-gray-900">1 Hour</div>
              <div className="text-gray-700">= 60 minutes</div>
            </div>
            <div className="bg-gray-300/50 p-3 rounded-lg text-center">
              <div className="font-semibold text-gray-900">1 Day</div>
              <div className="text-gray-700">= 24 hours</div>
            </div>
            <div className="bg-gray-300/50 p-3 rounded-lg text-center">
              <div className="font-semibold text-gray-900">1 Week</div>
              <div className="text-gray-700">= 7 days</div>
            </div>
            <div className="bg-gray-300/50 p-3 rounded-lg text-center">
              <div className="font-semibold text-gray-900">1 Month</div>
              <div className="text-gray-700">= 30 days</div>
            </div>
            <div className="bg-gray-300/50 p-3 rounded-lg text-center">
              <div className="font-semibold text-gray-900">1 Year</div>
              <div className="text-gray-700">= 365 days</div>
            </div>
            <div className="bg-gray-300/50 p-3 rounded-lg text-center">
              <div className="font-semibold text-gray-900">1 Leap Year</div>
              <div className="text-gray-700">= 366 days</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
