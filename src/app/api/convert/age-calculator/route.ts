import { NextRequest, NextResponse } from "next/server";

type AgeUnit = {
  id: string;
  name: string;
  symbol: string;
  factor: number; // factor to convert to days
};

const ageUnits: AgeUnit[] = [
  { id: "days", name: "Days", symbol: "days", factor: 1 },
  { id: "weeks", name: "Weeks", symbol: "weeks", factor: 7 },
  { id: "months", name: "Months", symbol: "months", factor: 30.44 }, // Average month length
  { id: "years", name: "Years", symbol: "years", factor: 365.25 }, // Average year length including leap years
  { id: "decades", name: "Decades", symbol: "decades", factor: 3652.5 },
  { id: "centuries", name: "Centuries", symbol: "centuries", factor: 36525 },
  { id: "millennia", name: "Millennia", symbol: "millennia", factor: 365250 },
];

export async function GET() {
  return NextResponse.json({
    units: ageUnits,
    message: "Age calculator API - Use POST for age calculations"
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { birthDate, currentDate, unit = "years" } = body;

    // Validation
    if (!birthDate) {
      return NextResponse.json({ error: "Birth date is required" }, { status: 400 });
    }

    const birth = new Date(birthDate);
    const current = currentDate ? new Date(currentDate) : new Date();

    // Validate dates
    if (isNaN(birth.getTime())) {
      return NextResponse.json({ error: "Invalid birth date" }, { status: 400 });
    }

    if (isNaN(current.getTime())) {
      return NextResponse.json({ error: "Invalid current date" }, { status: 400 });
    }

    // Check if birth date is in the future
    if (birth > current) {
      return NextResponse.json({ error: "Birth date cannot be in the future" }, { status: 400 });
    }

    // Calculate age in days
    const ageInDays = Math.floor((current.getTime() - birth.getTime()) / (1000 * 60 * 60 * 24));

    // Get the requested unit
    const requestedUnit = ageUnits.find(u => u.id === unit);
    if (!requestedUnit) {
      return NextResponse.json({ error: "Invalid unit" }, { status: 400 });
    }

    // Calculate age in requested unit
    const ageInRequestedUnit = ageInDays / requestedUnit.factor;

    // Calculate age in all units
    const ageInAllUnits = ageUnits.map(unit => ({
      unit: unit.id,
      name: unit.name,
      symbol: unit.symbol,
      value: parseFloat((ageInDays / unit.factor).toFixed(6).replace(/\.?0+$/, ""))
    }));

    // Calculate additional information
    const additionalInfo = calculateAgeInfo(birth, current, ageInDays);

    return NextResponse.json({
      birthDate: birth.toISOString().split('T')[0],
      currentDate: current.toISOString().split('T')[0],
      ageInDays: ageInDays,
      ageInRequestedUnit: parseFloat(ageInRequestedUnit.toFixed(6).replace(/\.?0+$/, "")),
      requestedUnit: requestedUnit.symbol,
      ageInAllUnits: ageInAllUnits,
      additionalInfo: additionalInfo
    });

  } catch (error) {
    console.error('Age calculation error:', error);
    return NextResponse.json({ error: "Age calculation failed" }, { status: 500 });
  }
}

function calculateAgeInfo(birthDate: Date, currentDate: Date, ageInDays: number) {
  const birthYear = birthDate.getFullYear();
  const currentYear = currentDate.getFullYear();
  
  // Calculate leap years
  const leapYears = calculateLeapYears(birthYear, currentYear);
  
  // Calculate next birthday
  const nextBirthday = new Date(currentDate);
  nextBirthday.setFullYear(currentDate.getFullYear());
  nextBirthday.setMonth(birthDate.getMonth());
  nextBirthday.setDate(birthDate.getDate());
  
  if (nextBirthday <= currentDate) {
    nextBirthday.setFullYear(currentDate.getFullYear() + 1);
  }
  
  const daysUntilNextBirthday = Math.ceil((nextBirthday.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
  
  // Calculate age in different formats
  const ageInYears = ageInDays / 365.25;
  const ageInMonths = ageInDays / 30.44;
  const ageInWeeks = ageInDays / 7;
  
  // Calculate exact age (years, months, days)
  const exactAge = calculateExactAge(birthDate, currentDate);
  
  // Calculate life milestones
  const milestones = calculateLifeMilestones(ageInDays);
  
  // Calculate time spent in different activities (approximate)
  const timeSpent = calculateTimeSpent(ageInDays);
  
  return {
    leapYears: leapYears,
    nextBirthday: nextBirthday.toISOString().split('T')[0],
    daysUntilNextBirthday: daysUntilNextBirthday,
    exactAge: exactAge,
    milestones: milestones,
    timeSpent: timeSpent,
    ageInYears: parseFloat(ageInYears.toFixed(2)),
    ageInMonths: parseFloat(ageInMonths.toFixed(2)),
    ageInWeeks: parseFloat(ageInWeeks.toFixed(2)),
    humanReadable: formatHumanReadableAge(ageInDays)
  };
}

function calculateLeapYears(startYear: number, endYear: number): number {
  let leapYears = 0;
  for (let year = startYear; year <= endYear; year++) {
    if ((year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0)) {
      leapYears++;
    }
  }
  return leapYears;
}

function calculateExactAge(birthDate: Date, currentDate: Date) {
  let years = currentDate.getFullYear() - birthDate.getFullYear();
  let months = currentDate.getMonth() - birthDate.getMonth();
  let days = currentDate.getDate() - birthDate.getDate();
  
  if (days < 0) {
    months--;
    const lastMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0);
    days += lastMonth.getDate();
  }
  
  if (months < 0) {
    years--;
    months += 12;
  }
  
  return {
    years: years,
    months: months,
    days: days,
    formatted: `${years} years, ${months} months, ${days} days`
  };
}

function calculateLifeMilestones(ageInDays: number) {
  const milestones = [];
  
  if (ageInDays >= 365) milestones.push({ name: "First Birthday", days: 365, achieved: true });
  if (ageInDays >= 1095) milestones.push({ name: "3 Years Old", days: 1095, achieved: true });
  if (ageInDays >= 1825) milestones.push({ name: "5 Years Old", days: 1825, achieved: true });
  if (ageInDays >= 3650) milestones.push({ name: "10 Years Old", days: 3650, achieved: true });
  if (ageInDays >= 5475) milestones.push({ name: "15 Years Old", days: 5475, achieved: true });
  if (ageInDays >= 6570) milestones.push({ name: "18 Years Old", days: 6570, achieved: true });
  if (ageInDays >= 7300) milestones.push({ name: "20 Years Old", days: 7300, achieved: true });
  if (ageInDays >= 9125) milestones.push({ name: "25 Years Old", days: 9125, achieved: true });
  if (ageInDays >= 10950) milestones.push({ name: "30 Years Old", days: 10950, achieved: true });
  if (ageInDays >= 14600) milestones.push({ name: "40 Years Old", days: 14600, achieved: true });
  if (ageInDays >= 18250) milestones.push({ name: "50 Years Old", days: 18250, achieved: true });
  if (ageInDays >= 21900) milestones.push({ name: "60 Years Old", days: 21900, achieved: true });
  if (ageInDays >= 25550) milestones.push({ name: "70 Years Old", days: 25550, achieved: true });
  if (ageInDays >= 29200) milestones.push({ name: "80 Years Old", days: 29200, achieved: true });
  if (ageInDays >= 32850) milestones.push({ name: "90 Years Old", days: 32850, achieved: true });
  if (ageInDays >= 36500) milestones.push({ name: "100 Years Old", days: 36500, achieved: true });
  
  // Add next milestone
  const nextMilestone = milestones.find(m => !m.achieved);
  if (nextMilestone) {
    nextMilestone.achieved = false;
    nextMilestone.daysUntil = nextMilestone.days - ageInDays;
  }
  
  return milestones;
}

function calculateTimeSpent(ageInDays: number) {
  const totalHours = ageInDays * 24;
  
  return {
    sleeping: Math.round(totalHours * 0.33), // 8 hours per day
    working: Math.round(totalHours * 0.25), // 6 hours per day (average)
    eating: Math.round(totalHours * 0.08), // 2 hours per day
    commuting: Math.round(totalHours * 0.04), // 1 hour per day
    leisure: Math.round(totalHours * 0.30) // Remaining time
  };
}

function formatHumanReadableAge(ageInDays: number): string {
  const years = Math.floor(ageInDays / 365.25);
  const remainingDays = ageInDays % 365.25;
  const months = Math.floor(remainingDays / 30.44);
  const days = Math.floor(remainingDays % 30.44);
  
  if (years > 0) {
    if (months > 0) {
      return `${years} year${years > 1 ? 's' : ''}, ${months} month${months > 1 ? 's' : ''}`;
    }
    return `${years} year${years > 1 ? 's' : ''}`;
  } else if (months > 0) {
    return `${months} month${months > 1 ? 's' : ''}`;
  } else {
    return `${days} day${days > 1 ? 's' : ''}`;
  }
}
