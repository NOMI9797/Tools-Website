import { NextRequest, NextResponse } from "next/server";

type TimeUnit = {
  id: string;
  name: string;
  symbol: string;
  factor: number; // factor to convert to milliseconds
};

const timeUnits: TimeUnit[] = [
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
  { id: "decade", name: "Decade", symbol: "decade", factor: 315360000000 },
  { id: "century", name: "Century", symbol: "century", factor: 3153600000000 },
  { id: "millennium", name: "Millennium", symbol: "millennium", factor: 31536000000000 },
];

// Special time units with different conversion factors
const specialTimeUnits: TimeUnit[] = [
  { id: "leap_year", name: "Leap Year", symbol: "leap year", factor: 31622400000 },
  { id: "sidereal_day", name: "Sidereal Day", symbol: "sidereal day", factor: 86164090 },
  { id: "sidereal_year", name: "Sidereal Year", symbol: "sidereal year", factor: 31558149500 },
  { id: "lunar_month", name: "Lunar Month", symbol: "lunar month", factor: 2551443000 },
  { id: "fortnight", name: "Fortnight", symbol: "fortnight", factor: 1209600000 },
  { id: "quarter", name: "Quarter (3 months)", symbol: "quarter", factor: 7776000000 },
  { id: "semester", name: "Semester (6 months)", symbol: "semester", factor: 15552000000 },
  { id: "fiscal_year", name: "Fiscal Year", symbol: "fiscal year", factor: 31536000000 },
];

// Time zones (offset from UTC in milliseconds)
const timeZones = [
  { id: "utc", name: "UTC (Coordinated Universal Time)", offset: 0 },
  { id: "est", name: "EST (Eastern Standard Time)", offset: -18000000 },
  { id: "cst", name: "CST (Central Standard Time)", offset: -21600000 },
  { id: "mst", name: "MST (Mountain Standard Time)", offset: -25200000 },
  { id: "pst", name: "PST (Pacific Standard Time)", offset: -28800000 },
  { id: "gmt", name: "GMT (Greenwich Mean Time)", offset: 0 },
  { id: "cet", name: "CET (Central European Time)", offset: 3600000 },
  { id: "eet", name: "EET (Eastern European Time)", offset: 7200000 },
  { id: "jst", name: "JST (Japan Standard Time)", offset: 32400000 },
  { id: "ist", name: "IST (India Standard Time)", offset: 19800000 },
  { id: "aest", name: "AEST (Australian Eastern Standard Time)", offset: 36000000 },
  { id: "nzst", name: "NZST (New Zealand Standard Time)", offset: 43200000 },
];

export async function GET() {
  return NextResponse.json({
    units: timeUnits,
    specialUnits: specialTimeUnits,
    timeZones: timeZones,
    message: "Time converter API - Use POST for conversions"
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { value, fromUnit, toUnit, conversionType = "standard" } = body;

    // Validation
    if (typeof value !== 'number' || isNaN(value)) {
      return NextResponse.json({ error: "Invalid value" }, { status: 400 });
    }

    if (!fromUnit || !toUnit) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
    }

    // Get all available units
    const allUnits = [...timeUnits, ...specialTimeUnits];
    
    const fromUnitData = allUnits.find(unit => unit.id === fromUnit);
    const toUnitData = allUnits.find(unit => unit.id === toUnit);

    if (!fromUnitData || !toUnitData) {
      return NextResponse.json({ error: "Invalid units" }, { status: 400 });
    }

    // Convert to milliseconds first, then to target unit
    const milliseconds = value * fromUnitData.factor;
    const convertedValue = milliseconds / toUnitData.factor;

    // Calculate additional time information
    const additionalInfo = calculateTimeInfo(milliseconds);

    return NextResponse.json({
      originalValue: value,
      originalUnit: fromUnitData.symbol,
      convertedValue: parseFloat(convertedValue.toFixed(10).replace(/\.?0+$/, "")),
      convertedUnit: toUnitData.symbol,
      conversionType: conversionType,
      additionalInfo: additionalInfo
    });

  } catch (error) {
    console.error('Time conversion error:', error);
    return NextResponse.json({ error: "Conversion failed" }, { status: 500 });
  }
}

function calculateTimeInfo(milliseconds: number) {
  const seconds = milliseconds / 1000;
  const minutes = seconds / 60;
  const hours = minutes / 60;
  const days = hours / 24;
  const weeks = days / 7;
  const months = days / 30;
  const years = days / 365;

  return {
    totalMilliseconds: milliseconds,
    totalSeconds: seconds,
    totalMinutes: minutes,
    totalHours: hours,
    totalDays: days,
    totalWeeks: weeks,
    totalMonths: months,
    totalYears: years,
    humanReadable: formatHumanReadable(milliseconds)
  };
}

function formatHumanReadable(milliseconds: number): string {
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
}
