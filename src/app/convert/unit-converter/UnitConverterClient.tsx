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

  const currentCategory = unitCategories.find(cat => cat.id === selectedCategory);

  const convertValue = useCallback(async () => {
    if (!inputValue || !currentCategory) return;

    const fromUnitData = currentCategory.units.find(unit => unit.id === fromUnit);
    const toUnitData = currentCategory.units.find(unit => unit.id === toUnit);

    if (!fromUnitData || !toUnitData) return;

    const value = parseFloat(inputValue);
    if (isNaN(value)) return;

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
  };

  const swapUnits = () => {
    setFromUnit(toUnit);
    setToUnit(fromUnit);
    setInputValue(result);
    setResult("");
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="rounded-xl border border-black/[.06] bg-white p-6">
        <h1 className="text-2xl font-semibold mb-2">Unit Converter</h1>
        <p className="text-sm text-black/60">Convert between different units of measurement</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Category Selection */}
        <div className="lg:col-span-1">
          <div className="rounded-xl border border-black/[.06] bg-white p-6">
            <h2 className="text-lg font-medium mb-4">Categories</h2>
            <div className="space-y-2">
              {unitCategories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => handleCategoryChange(category.id)}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                    selectedCategory === category.id
                      ? "bg-black text-white"
                      : "hover:bg-black/[.05] text-black/80"
                  }`}
                >
                  <span className="mr-2">{category.icon}</span>
                  {category.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Conversion Interface */}
        <div className="lg:col-span-2">
          <div className="rounded-xl border border-black/[.06] bg-white p-6">
            <h2 className="text-lg font-medium mb-4">
              {currentCategory?.icon} {currentCategory?.name} Conversion
            </h2>

            <div className="space-y-4">
              {/* Input */}
              <div>
                <label className="block text-sm font-medium text-black/90 mb-2">
                  From
                </label>
                <div className="flex gap-3">
                  <input
                    type="number"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onInput={convertValue}
                    placeholder="Enter value"
                    className="flex-1 px-3 py-2 border border-black/[.15] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-black/[.1] focus:border-black/[.3]"
                  />
                  <select
                    value={fromUnit}
                    onChange={(e) => setFromUnit(e.target.value)}
                    className="px-3 py-2 border border-black/[.15] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-black/[.1] focus:border-black/[.3]"
                  >
                    {currentCategory?.units.map((unit) => (
                      <option key={unit.id} value={unit.id}>
                        {unit.symbol} - {unit.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Swap Button */}
              <div className="flex justify-center">
                <button
                  onClick={swapUnits}
                  className="p-2 rounded-full hover:bg-black/[.05] transition-colors"
                  title="Swap units"
                >
                  <svg className="w-5 h-5 text-black/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                  </svg>
                </button>
              </div>

              {/* Output */}
              <div>
                <label className="block text-sm font-medium text-black/90 mb-2">
                  To
                </label>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={result}
                    readOnly
                    placeholder="Result will appear here"
                    className="flex-1 px-3 py-2 border border-black/[.15] rounded-md text-sm bg-black/[.02] text-black/80"
                  />
                  <select
                    value={toUnit}
                    onChange={(e) => setToUnit(e.target.value)}
                    className="px-3 py-2 border border-black/[.15] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-black/[.1] focus:border-black/[.3]"
                  >
                    {currentCategory?.units.map((unit) => (
                      <option key={unit.id} value={unit.id}>
                        {unit.symbol} - {unit.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Convert Button */}
              <button
                onClick={convertValue}
                disabled={!inputValue}
                className="w-full py-2 px-4 bg-black text-white rounded-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-black/80 transition-colors"
              >
                Convert
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Reference */}
      <div className="rounded-xl border border-black/[.06] bg-white p-6">
        <h2 className="text-lg font-medium mb-4">Quick Reference</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {unitCategories.map((category) => (
            <div key={category.id} className="space-y-2">
              <h3 className="font-medium text-sm flex items-center">
                <span className="mr-1">{category.icon}</span>
                {category.name}
              </h3>
              <div className="text-xs text-black/60 space-y-1">
                {category.units.slice(0, 3).map((unit) => (
                  <div key={unit.id}>
                    {unit.symbol} - {unit.name}
                  </div>
                ))}
                {category.units.length > 3 && (
                  <div className="text-black/40">+{category.units.length - 3} more</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
