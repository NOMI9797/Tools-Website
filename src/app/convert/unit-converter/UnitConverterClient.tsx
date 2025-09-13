"use client";

import { useState, useCallback } from "react";

type UnitCategory = {
  id: string;
  name: string;
  icon: string;
  units: {
    id: string;
    name: string;
    symbol: string;
    factor: number; // Conversion factor to base unit
  }[];
};

const unitCategories: UnitCategory[] = [
  {
    id: "length",
    name: "Length",
    icon: "📏",
    units: [
      { id: "mm", name: "Millimeter", symbol: "mm", factor: 0.001 },
      { id: "cm", name: "Centimeter", symbol: "cm", factor: 0.01 },
      { id: "m", name: "Meter", symbol: "m", factor: 1 },
      { id: "km", name: "Kilometer", symbol: "km", factor: 1000 },
      { id: "in", name: "Inch", symbol: "in", factor: 0.0254 },
      { id: "ft", name: "Foot", symbol: "ft", factor: 0.3048 },
      { id: "yd", name: "Yard", symbol: "yd", factor: 0.9144 },
      { id: "mi", name: "Mile", symbol: "mi", factor: 1609.344 },
    ],
  },
  {
    id: "weight",
    name: "Weight",
    icon: "⚖️",
    units: [
      { id: "mg", name: "Milligram", symbol: "mg", factor: 0.000001 },
      { id: "g", name: "Gram", symbol: "g", factor: 0.001 },
      { id: "kg", name: "Kilogram", symbol: "kg", factor: 1 },
      { id: "oz", name: "Ounce", symbol: "oz", factor: 0.0283495 },
      { id: "lb", name: "Pound", symbol: "lb", factor: 0.453592 },
      { id: "ton", name: "Metric Ton", symbol: "t", factor: 1000 },
    ],
  },
  {
    id: "temperature",
    name: "Temperature",
    icon: "🌡️",
    units: [
      { id: "c", name: "Celsius", symbol: "°C", factor: 1 },
      { id: "f", name: "Fahrenheit", symbol: "°F", factor: 1 },
      { id: "k", name: "Kelvin", symbol: "K", factor: 1 },
    ],
  },
  {
    id: "area",
    name: "Area",
    icon: "📐",
    units: [
      { id: "mm2", name: "Square Millimeter", symbol: "mm²", factor: 0.000001 },
      { id: "cm2", name: "Square Centimeter", symbol: "cm²", factor: 0.0001 },
      { id: "m2", name: "Square Meter", symbol: "m²", factor: 1 },
      { id: "km2", name: "Square Kilometer", symbol: "km²", factor: 1000000 },
      { id: "in2", name: "Square Inch", symbol: "in²", factor: 0.00064516 },
      { id: "ft2", name: "Square Foot", symbol: "ft²", factor: 0.092903 },
      { id: "yd2", name: "Square Yard", symbol: "yd²", factor: 0.836127 },
      { id: "acre", name: "Acre", symbol: "ac", factor: 4046.86 },
    ],
  },
  {
    id: "volume",
    name: "Volume",
    icon: "🧊",
    units: [
      { id: "ml", name: "Milliliter", symbol: "ml", factor: 0.000001 },
      { id: "l", name: "Liter", symbol: "L", factor: 0.001 },
      { id: "m3", name: "Cubic Meter", symbol: "m³", factor: 1 },
      { id: "floz", name: "Fluid Ounce", symbol: "fl oz", factor: 0.0000295735 },
      { id: "cup", name: "Cup", symbol: "cup", factor: 0.000236588 },
      { id: "pt", name: "Pint", symbol: "pt", factor: 0.000473176 },
      { id: "qt", name: "Quart", symbol: "qt", factor: 0.000946353 },
      { id: "gal", name: "Gallon", symbol: "gal", factor: 0.00378541 },
    ],
  },
  {
    id: "time",
    name: "Time",
    icon: "⏰",
    units: [
      { id: "ms", name: "Millisecond", symbol: "ms", factor: 0.001 },
      { id: "s", name: "Second", symbol: "s", factor: 1 },
      { id: "min", name: "Minute", symbol: "min", factor: 60 },
      { id: "h", name: "Hour", symbol: "h", factor: 3600 },
      { id: "day", name: "Day", symbol: "day", factor: 86400 },
      { id: "week", name: "Week", symbol: "week", factor: 604800 },
      { id: "month", name: "Month", symbol: "month", factor: 2629746 },
      { id: "year", name: "Year", symbol: "year", factor: 31556952 },
    ],
  },
  {
    id: "speed",
    name: "Speed",
    icon: "🏃",
    units: [
      { id: "mps", name: "Meter per Second", symbol: "m/s", factor: 1 },
      { id: "kmh", name: "Kilometer per Hour", symbol: "km/h", factor: 0.277778 },
      { id: "mph", name: "Mile per Hour", symbol: "mph", factor: 0.44704 },
      { id: "fps", name: "Foot per Second", symbol: "ft/s", factor: 0.3048 },
      { id: "knot", name: "Knot", symbol: "kn", factor: 0.514444 },
    ],
  },
  {
    id: "pressure",
    name: "Pressure",
    icon: "💨",
    units: [
      { id: "pa", name: "Pascal", symbol: "Pa", factor: 1 },
      { id: "kpa", name: "Kilopascal", symbol: "kPa", factor: 1000 },
      { id: "bar", name: "Bar", symbol: "bar", factor: 100000 },
      { id: "psi", name: "PSI", symbol: "psi", factor: 6894.76 },
      { id: "atm", name: "Atmosphere", symbol: "atm", factor: 101325 },
    ],
  },
];

export default function UnitConverterClient() {
  const [selectedCategory, setSelectedCategory] = useState("length");
  const [fromUnit, setFromUnit] = useState("m");
  const [toUnit, setToUnit] = useState("ft");
  const [inputValue, setInputValue] = useState("");
  const [result, setResult] = useState("");
  const [isConverting, setIsConverting] = useState(false);

  const currentCategory = unitCategories.find(cat => cat.id === selectedCategory);

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
      const response = await fetch('/api/convert/unit-converter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          value,
          fromUnit,
          toUnit,
          category: selectedCategory
        })
      });

      if (response.ok) {
        const data = await response.json();
        setResult(data.convertedValue.toString());
        setIsConverting(false);
        return;
      }
    } catch (error) {
      console.log('API conversion failed, using client-side fallback');
    }

    // Client-side fallback
    let convertedValue: number;

    // Special handling for temperature
    if (selectedCategory === "temperature") {
      convertedValue = convertTemperature(value, fromUnit, toUnit);
    } else {
      // Convert to base unit, then to target unit
      const baseValue = value * fromUnitData.factor;
      convertedValue = baseValue / toUnitData.factor;
    }

    setResult(convertedValue.toFixed(6).replace(/\.?0+$/, ""));
    setIsConverting(false);
  }, [inputValue, fromUnit, toUnit, selectedCategory, currentCategory]);

  const convertTemperature = (value: number, from: string, to: string): number => {
    // Convert to Celsius first
    let celsius: number;
    switch (from) {
      case "c":
        celsius = value;
        break;
      case "f":
        celsius = (value - 32) * 5 / 9;
        break;
      case "k":
        celsius = value - 273.15;
        break;
      default:
        celsius = value;
    }

    // Convert from Celsius to target
    switch (to) {
      case "c":
        return celsius;
      case "f":
        return celsius * 9 / 5 + 32;
      case "k":
        return celsius + 273.15;
      default:
        return celsius;
    }
  };

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId);
    const category = unitCategories.find(cat => cat.id === categoryId);
    if (category) {
      setFromUnit(category.units[0].id);
      setToUnit(category.units[1]?.id || category.units[0].id);
    }
    setInputValue("");
    setResult("");
    setIsConverting(false);
  };

  const swapUnits = () => {
    setFromUnit(toUnit);
    setToUnit(fromUnit);
    setInputValue(result);
    setResult("");
    setIsConverting(false);
  };

  const handleReset = () => {
    setInputValue("");
    setResult("");
    setIsConverting(false);
  };

  return (
    <div className="bg-transparent">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Category Selection */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Unit Categories</h3>
          
          <div className="bg-gray-200/50 border border-gray-300/50 rounded-xl p-6 backdrop-blur-sm">
            <div className="space-y-3">
              {unitCategories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => handleCategoryChange(category.id)}
                  className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                    selectedCategory === category.id
                      ? "bg-gradient-to-r from-gray-600 to-gray-700 text-white shadow-lg"
                      : "bg-gray-300/50 text-gray-900 hover:bg-gray-400/50 border border-gray-300/50"
                  }`}
                >
                  <span className="mr-3 text-lg">{category.icon}</span>
                  {category.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Conversion Interface */}
        <div className="lg:col-span-2">
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
                    type="number"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onInput={convertValue}
                    placeholder="Enter value to convert"
                    className="w-full px-4 py-3 border border-gray-300/50 rounded-xl text-gray-900 bg-gray-300/50 focus:outline-none focus:ring-2 focus:ring-gray-500/50 focus:border-gray-500/50 transition-all duration-200"
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
                        {unit.symbol} - {unit.name}
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
                    Result
                  </label>
                  <input
                    type="text"
                    value={result}
                    readOnly
                    placeholder="Result will appear here"
                    className="w-full px-4 py-3 border border-gray-300/50 rounded-xl text-gray-900 bg-gray-300/50 focus:outline-none"
                  />
                </div>
                
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
                        {unit.symbol} - {unit.name}
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
                {isConverting ? "Converting..." : "Convert"}
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
                <div className="bg-gray-300/50 rounded-lg p-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-gray-900 mb-2">
                      {result}
                    </div>
                    <div className="text-gray-700">
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
          </div>
        </div>
      </div>

      {/* Quick Reference */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Quick Reference</h3>
        <div className="bg-gray-200/50 border border-gray-300/50 rounded-xl p-6 backdrop-blur-sm">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {unitCategories.map((category) => (
              <div key={category.id} className="space-y-3">
                <h4 className="font-semibold text-gray-900 flex items-center">
                  <span className="mr-2 text-lg">{category.icon}</span>
                  {category.name}
                </h4>
                <div className="text-sm text-gray-700 space-y-1">
                  {category.units.slice(0, 3).map((unit) => (
                    <div key={unit.id} className="flex justify-between">
                      <span>{unit.symbol}</span>
                      <span className="text-gray-600">{unit.name}</span>
                    </div>
                  ))}
                  {category.units.length > 3 && (
                    <div className="text-gray-500 text-xs">
                      +{category.units.length - 3} more units
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
