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
    }
  }, [birthDate, currentDate, selectedUnit]);

  const handleBirthDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBirthDate(e.target.value);
    setError("");
  };

  const handleCurrentDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentDate(e.target.value);
    setError("");
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
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Input Section */}
        <div className="lg:col-span-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Calculate Your Age</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Birth Date *
              </label>
              <input
                type="date"
                value={birthDate}
                onChange={handleBirthDateChange}
                max={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">Leave empty to use today's date</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Display Unit
              </label>
              <select
                value={selectedUnit}
                onChange={(e) => setSelectedUnit(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {ageUnits.map((unit) => (
                  <option key={unit.id} value={unit.id}>
                    {unit.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={calculateAge}
              disabled={loading || !birthDate}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Calculating..." : "Calculate Age"}
            </button>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}
          </div>
        </div>

        {/* Results Section */}
        <div className="lg:col-span-2">
          {ageData ? (
            <div className="space-y-6">
              {/* Main Age Display */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border-2 border-blue-200">
                <h3 className="text-lg font-semibold text-blue-900 mb-4">Your Age</h3>
                <div className="text-center">
                  <div className="text-4xl font-bold text-blue-600 mb-2">
                    {formatNumber(ageData.ageInRequestedUnit)} {ageData.requestedUnit}
                  </div>
                  <div className="text-lg text-blue-700">
                    {ageData.additionalInfo.humanReadable}
                  </div>
                  <div className="text-sm text-blue-600 mt-2">
                    {formatNumber(ageData.ageInDays)} total days
                  </div>
                </div>
              </div>

              {/* Age in All Units */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Age in All Units</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {ageData.ageInAllUnits.map((unit) => (
                    <div key={unit.unit} className="bg-white p-3 rounded-lg text-center">
                      <div className="text-lg font-semibold text-gray-900">
                        {formatNumber(unit.value)}
                      </div>
                      <div className="text-sm text-gray-600">{unit.name}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Exact Age */}
              <div className="bg-green-50 rounded-lg p-6 border border-green-200">
                <h4 className="text-lg font-semibold text-green-900 mb-3">Exact Age</h4>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {ageData.additionalInfo.exactAge.formatted}
                  </div>
                </div>
              </div>

              {/* Next Birthday */}
              <div className="bg-purple-50 rounded-lg p-6 border border-purple-200">
                <h4 className="text-lg font-semibold text-purple-900 mb-3">Next Birthday</h4>
                <div className="text-center">
                  <div className="text-xl font-semibold text-purple-600">
                    {new Date(ageData.additionalInfo.nextBirthday).toLocaleDateString()}
                  </div>
                  <div className="text-sm text-purple-600 mt-1">
                    {ageData.additionalInfo.daysUntilNextBirthday} days from now
                  </div>
                </div>
              </div>

              {/* Life Milestones */}
              <div className="bg-yellow-50 rounded-lg p-6 border border-yellow-200">
                <h4 className="text-lg font-semibold text-yellow-900 mb-4">Life Milestones</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {ageData.additionalInfo.milestones.slice(0, 8).map((milestone, index) => (
                    <div
                      key={index}
                      className={`p-3 rounded-lg ${
                        milestone.achieved
                          ? "bg-green-100 text-green-800 border border-green-200"
                          : "bg-gray-100 text-gray-600 border border-gray-200"
                      }`}
                    >
                      <div className="font-medium">{milestone.name}</div>
                      {milestone.achieved ? (
                        <div className="text-sm">✓ Achieved</div>
                      ) : (
                        <div className="text-sm">
                          {milestone.daysUntil} days to go
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Time Spent Analysis */}
              <div className="bg-indigo-50 rounded-lg p-6 border border-indigo-200">
                <h4 className="text-lg font-semibold text-indigo-900 mb-4">Time Spent Analysis</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-indigo-700">Sleeping</span>
                      <span className="font-semibold text-indigo-900">
                        {formatTimeSpent(ageData.additionalInfo.timeSpent.sleeping)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-indigo-700">Working</span>
                      <span className="font-semibold text-indigo-900">
                        {formatTimeSpent(ageData.additionalInfo.timeSpent.working)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-indigo-700">Eating</span>
                      <span className="font-semibold text-indigo-900">
                        {formatTimeSpent(ageData.additionalInfo.timeSpent.eating)}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-indigo-700">Commuting</span>
                      <span className="font-semibold text-indigo-900">
                        {formatTimeSpent(ageData.additionalInfo.timeSpent.commuting)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-indigo-700">Leisure</span>
                      <span className="font-semibold text-indigo-900">
                        {formatTimeSpent(ageData.additionalInfo.timeSpent.leisure)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-indigo-700">Leap Years</span>
                      <span className="font-semibold text-indigo-900">
                        {ageData.additionalInfo.leapYears} years
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-lg p-8 text-center">
              <div className="text-6xl mb-4">🎂</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Ready to Calculate Your Age?</h3>
              <p className="text-gray-600">
                Enter your birth date and discover your age in various time units, 
                life milestones, and interesting time statistics.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Fun Facts */}
      <div className="mt-8 bg-gradient-to-r from-pink-50 to-rose-50 rounded-lg p-6 border border-pink-200">
        <h3 className="text-lg font-semibold text-pink-900 mb-4">Fun Age Facts</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="bg-white p-3 rounded">
            <div className="font-semibold text-pink-900">Average Lifespan</div>
            <div className="text-gray-600">~29,200 days (80 years)</div>
          </div>
          <div className="bg-white p-3 rounded">
            <div className="font-semibold text-pink-900">Oldest Person</div>
            <div className="text-gray-600">~44,000 days (122 years)</div>
          </div>
          <div className="bg-white p-3 rounded">
            <div className="font-semibold text-pink-900">Leap Year Bonus</div>
            <div className="text-gray-600">Extra day every 4 years</div>
          </div>
        </div>
      </div>
    </div>
  );
}
