import { NextRequest, NextResponse } from "next/server";

type UnitCategory = {
  id: string;
  name: string;
  icon: string;
  units: {
    id: string;
    name: string;
    symbol: string;
    factor: number;
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

function convertTemperature(value: number, from: string, to: string): number {
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
}

export async function GET() {
  return NextResponse.json({
    categories: unitCategories,
    message: "Unit converter API - Use POST for conversions"
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { value, fromUnit, toUnit, category } = body;

    // Validation
    if (typeof value !== 'number' || isNaN(value)) {
      return NextResponse.json({ error: "Invalid value" }, { status: 400 });
    }

    if (!fromUnit || !toUnit || !category) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
    }

    const currentCategory = unitCategories.find(cat => cat.id === category);
    if (!currentCategory) {
      return NextResponse.json({ error: "Invalid category" }, { status: 400 });
    }

    const fromUnitData = currentCategory.units.find(unit => unit.id === fromUnit);
    const toUnitData = currentCategory.units.find(unit => unit.id === toUnit);

    if (!fromUnitData || !toUnitData) {
      return NextResponse.json({ error: "Invalid units" }, { status: 400 });
    }

    let convertedValue: number;

    // Special handling for temperature
    if (category === "temperature") {
      convertedValue = convertTemperature(value, fromUnit, toUnit);
    } else {
      // Convert to base unit, then to target unit
      const baseValue = value * fromUnitData.factor;
      convertedValue = baseValue / toUnitData.factor;
    }

    return NextResponse.json({
      originalValue: value,
      originalUnit: fromUnitData.symbol,
      convertedValue: parseFloat(convertedValue.toFixed(6).replace(/\.?0+$/, "")),
      convertedUnit: toUnitData.symbol,
      category: currentCategory.name
    });

  } catch (error) {
    console.error('Unit conversion error:', error);
    return NextResponse.json({ error: "Conversion failed" }, { status: 500 });
  }
}
