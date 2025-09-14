"use client";

import { useState, useCallback, useEffect } from "react";

type AgeUnit = {
  id: string;
  name: string;
  symbol: string;
  factor: number;
};

type Milestone = {
  name: string;
  days: number;
  achieved: boolean;
  daysUntil?: number;
};

type TimeSpent = {
  sleeping: number;
  working: number;
  eating: number;
  commuting: number;
  leisure: number;
};

type AgeData = {
  birthDate: string;
  currentDate: string;
  ageInDays: number;
  ageInRequestedUnit: number;
  requestedUnit: string;
  ageInAllUnits: Array<{
    unit: string;
    name: string;
    symbol: string;
    value: number;
  }>;
  additionalInfo: {
    leapYears: number;
    nextBirthday: string;
    daysUntilNextBirthday: number;
    exactAge: {
      years: number;
      months: number;
      days: number;
      formatted: string;
    };
    milestones: Milestone[];
    timeSpent: TimeSpent;
    ageInYears: number;
    ageInMonths: number;
    ageInWeeks: number;
    humanReadable: string;
  };
};

const ageUnits: AgeUnit[] = [
  { id: "days", name: "Days", symbol: "days", factor: 1 },
  { id: "weeks", name: "Weeks", symbol: "weeks", factor: 7 },
  { id: "months", name: "Months", symbol: "months", factor: 30.44 },
  { id: "years", name: "Years", symbol: "years", factor: 365.25 },
  { id: "decades", name: "Decades", symbol: "decades", factor: 3652.5 },
  { id: "centuries", name: "Centuries", symbol: "centuries", factor: 36525 },
  { id: "millennia", name: "Millennia", symbol: "millennia", factor: 365250 },
];

export default function AgeCalculatorClient() {
  const [birthDate, setBirthDate] = useState("");
  const [currentDate, setCurrentDate] = useState("");
  const [selectedUnit, setSelectedUnit] = useState("years");
  const [ageData, setAgeData] = useState<AgeData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isCalculating, setIsCalculating] = useState(false);

  // Set current date as default
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setCurrentDate(today);
  }, []);

  const calculateAge = useCallback(async () => {
    if (!birthDate) {
      setError("Please enter your birth date");
      return;
    }

    setLoading(true);
    setIsCalculating(true);
    setError("");

    try {
      const response = await fetch('/api/convert/age-calculator', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          birthDate,
          currentDate: currentDate || undefined,
          unit: selectedUnit
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Age calculation failed');
      }

      const data = await response.json();
      setAgeData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Age calculation failed');
      setAgeData(null);
    } finally {
      setLoading(false);
      setIsCalculating(false);
    }
  }, [birthDate, currentDate, selectedUnit]);

  const handleBirthDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBirthDate(e.target.value);
    setError("");
    setAgeData(null);
  };

  const handleCurrentDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentDate(e.target.value);
    setError("");
    setAgeData(null);
  };


  const formatNumber = (num: number): string => {
    return num.toLocaleString();
  };

  const formatTimeSpent = (hours: number): string => {
    const years = Math.floor(hours / (365.25 * 24));
    const days = Math.floor((hours % (365.25 * 24)) / 24);
    if (years > 0) {
      return `${years} year${years > 1 ? 's' : ''}, ${days} day${days > 1 ? 's' : ''}`;
    }
    return `${days} day${days > 1 ? 's' : ''}`;
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-transparent p-8">
        <div className="space-y-6">
          {/* Input Section */}
          <div className="bg-gray-200/50 border border-gray-300/50 rounded-xl p-6 backdrop-blur-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-6 text-center">Calculate Your Age</h3>
            
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Birth Date *
                  </label>
                  <input
                    type="date"
                    value={birthDate}
                    onChange={handleBirthDateChange}
                    max={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 border border-gray-300/50 rounded-xl text-gray-900 bg-gray-300/50 focus:outline-none focus:ring-2 focus:ring-gray-500/50 focus:border-gray-500/50 transition-all duration-200"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Current Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={currentDate}
                    onChange={handleCurrentDateChange}
                    max={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 border border-gray-300/50 rounded-xl text-gray-900 bg-gray-300/50 focus:outline-none focus:ring-2 focus:ring-gray-500/50 focus:border-gray-500/50 transition-all duration-200"
                  />
                  <p className="text-xs text-gray-600 mt-1">Leave empty to use today's date</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Display Unit
                </label>
                <select
                  value={selectedUnit}
                  onChange={(e) => setSelectedUnit(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300/50 rounded-xl text-gray-900 bg-gray-300/50 focus:outline-none focus:ring-2 focus:ring-gray-500/50 focus:border-gray-500/50 transition-all duration-200"
                >
                  {ageUnits.map((unit) => (
                    <option key={unit.id} value={unit.id}>
                      {unit.name}
                    </option>
                  ))}
                </select>
              </div>

              {error && (
                <div className="bg-red-200/50 border border-red-300/50 rounded-xl p-4 backdrop-blur-sm">
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}

              {/* Calculate Button */}
              <button
                onClick={calculateAge}
                disabled={loading || !birthDate || isCalculating}
                className="w-full py-4 bg-gradient-to-r from-gray-900/90 to-gray-800/90 backdrop-blur-sm text-white font-semibold rounded-xl hover:from-gray-900 hover:to-gray-800 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none relative z-10"
              >
                <span className="flex items-center justify-center gap-3">
                  {loading || isCalculating ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Calculating...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Calculate Age
                    </>
                  )}
                </span>
              </button>
            </div>
          </div>

          {/* Results Section */}
          {ageData ? (
            <div className="bg-gray-200/50 border border-gray-300/50 rounded-xl p-6 backdrop-blur-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-6 text-center">Your Age</h3>
              
              {/* Main Age Display */}
              <div className="text-center mb-6">
                <div className="text-4xl font-bold text-gray-900 mb-2">
                  {formatNumber(ageData.ageInRequestedUnit)} {ageData.requestedUnit}
                </div>
                <div className="text-lg text-gray-700 mb-1">
                  {ageData.additionalInfo.exactAge.formatted}
                </div>
                <div className="text-sm text-gray-600">
                  {formatNumber(ageData.ageInDays)} total days
                </div>
              </div>

              {/* Age in All Units */}
              <div className="mb-6">
                <h4 className="text-md font-semibold text-gray-900 mb-3 text-center">Age in All Units</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {ageData.ageInAllUnits.map((unit) => (
                    <div key={unit.unit} className="bg-gray-300/50 p-3 rounded-lg text-center">
                      <div className="text-lg font-bold text-gray-900">
                        {formatNumber(unit.value)}
                      </div>
                      <div className="text-xs text-gray-700">{unit.name}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Next Birthday */}
              <div className="text-center">
                <div className="text-lg font-semibold text-gray-900">
                  Next Birthday: {new Date(ageData.additionalInfo.nextBirthday).toLocaleDateString()}
                </div>
                <div className="text-sm text-gray-700">
                  {ageData.additionalInfo.daysUntilNextBirthday} days from now
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-gray-200/50 border border-gray-300/50 rounded-xl p-8 backdrop-blur-sm text-center">
              <div className="text-gray-600">
                <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-lg font-medium text-gray-700 mb-2">Enter your birth date to calculate your age</p>
                <p className="text-sm text-gray-600">Get detailed age information in multiple units and formats</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
