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

  const handleReset = () => {
    setBirthDate("");
    setCurrentDate(new Date().toISOString().split('T')[0]);
    setSelectedUnit("years");
    setAgeData(null);
    setError("");
    setIsCalculating(false);
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
    <div className="bg-transparent">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Input Section */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Calculate Your Age</h3>
          
          <div className="bg-gray-200/50 border border-gray-300/50 rounded-xl p-6 backdrop-blur-sm">
            <div className="space-y-6">
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

              <div className="flex space-x-3">
                <button
                  onClick={calculateAge}
                  disabled={loading || !birthDate || isCalculating}
                  className="flex-1 bg-gradient-to-r from-gray-600 to-gray-700 text-white py-4 px-6 rounded-xl hover:from-gray-700 hover:to-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-gray-500/25 transform hover:-translate-y-0.5 font-semibold text-lg"
                >
                  {loading || isCalculating ? "Calculating..." : "Calculate Age"}
                </button>
                
                <button
                  onClick={handleReset}
                  className="px-6 py-4 bg-gray-300/50 text-gray-900 rounded-xl hover:bg-gray-400/50 transition-all duration-200 border border-gray-300/50 font-semibold"
                >
                  Reset
                </button>
              </div>

              {error && (
                <div className="bg-red-200/50 border border-red-300/50 rounded-xl p-4 backdrop-blur-sm">
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Results Section */}
        <div className="lg:col-span-2">
          {ageData ? (
            <div className="space-y-6">
              {/* Main Age Display */}
              <div className="bg-gray-200/50 border border-gray-300/50 rounded-xl p-8 backdrop-blur-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-6 text-center">Your Age</h3>
                <div className="text-center">
                  <div className="text-5xl font-bold text-gray-900 mb-4">
                    {formatNumber(ageData.ageInRequestedUnit)} {ageData.requestedUnit}
                  </div>
                  <div className="text-xl text-gray-700 mb-2">
                    {ageData.additionalInfo.humanReadable}
                  </div>
                  <div className="text-lg text-gray-600">
                    {formatNumber(ageData.ageInDays)} total days
                  </div>
                </div>
              </div>

              {/* Age in All Units */}
              <div className="bg-gray-200/50 border border-gray-300/50 rounded-xl p-6 backdrop-blur-sm">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Age in All Units</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {ageData.ageInAllUnits.map((unit) => (
                    <div key={unit.unit} className="bg-gray-300/50 p-4 rounded-lg text-center">
                      <div className="text-xl font-bold text-gray-900">
                        {formatNumber(unit.value)}
                      </div>
                      <div className="text-sm text-gray-700">{unit.name}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Exact Age */}
              <div className="bg-gray-200/50 border border-gray-300/50 rounded-xl p-6 backdrop-blur-sm">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Exact Age</h4>
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900">
                    {ageData.additionalInfo.exactAge.formatted}
                  </div>
                </div>
              </div>

              {/* Next Birthday */}
              <div className="bg-gray-200/50 border border-gray-300/50 rounded-xl p-6 backdrop-blur-sm">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Next Birthday</h4>
                <div className="text-center">
                  <div className="text-2xl font-semibold text-gray-900">
                    {new Date(ageData.additionalInfo.nextBirthday).toLocaleDateString()}
                  </div>
                  <div className="text-lg text-gray-700 mt-2">
                    {ageData.additionalInfo.daysUntilNextBirthday} days from now
                  </div>
                </div>
              </div>

              {/* Life Milestones */}
              <div className="bg-gray-200/50 border border-gray-300/50 rounded-xl p-6 backdrop-blur-sm">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Life Milestones</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {ageData.additionalInfo.milestones.slice(0, 8).map((milestone, index) => (
                    <div
                      key={index}
                      className={`p-4 rounded-lg ${
                        milestone.achieved
                          ? "bg-gray-300/50 text-gray-900 border border-gray-400/50"
                          : "bg-gray-300/30 text-gray-700 border border-gray-300/50"
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
              <div className="bg-gray-200/50 border border-gray-300/50 rounded-xl p-6 backdrop-blur-sm">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Time Spent Analysis</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-gray-300/50 rounded-lg">
                      <span className="text-gray-700">Sleeping</span>
                      <span className="font-semibold text-gray-900">
                        {formatTimeSpent(ageData.additionalInfo.timeSpent.sleeping)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-300/50 rounded-lg">
                      <span className="text-gray-700">Working</span>
                      <span className="font-semibold text-gray-900">
                        {formatTimeSpent(ageData.additionalInfo.timeSpent.working)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-300/50 rounded-lg">
                      <span className="text-gray-700">Eating</span>
                      <span className="font-semibold text-gray-900">
                        {formatTimeSpent(ageData.additionalInfo.timeSpent.eating)}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-gray-300/50 rounded-lg">
                      <span className="text-gray-700">Commuting</span>
                      <span className="font-semibold text-gray-900">
                        {formatTimeSpent(ageData.additionalInfo.timeSpent.commuting)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-300/50 rounded-lg">
                      <span className="text-gray-700">Leisure</span>
                      <span className="font-semibold text-gray-900">
                        {formatTimeSpent(ageData.additionalInfo.timeSpent.leisure)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-300/50 rounded-lg">
                      <span className="text-gray-700">Leap Years</span>
                      <span className="font-semibold text-gray-900">
                        {ageData.additionalInfo.leapYears} years
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-gray-200/50 border border-gray-300/50 rounded-xl p-8 text-center backdrop-blur-sm">
              <div className="text-6xl mb-4">🎂</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Ready to Calculate Your Age?</h3>
              <p className="text-gray-700">
                Enter your birth date and discover your age in various time units, 
                life milestones, and interesting time statistics.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Fun Facts */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Fun Age Facts</h3>
        <div className="bg-gray-200/50 border border-gray-300/50 rounded-xl p-6 backdrop-blur-sm">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="bg-gray-300/50 p-4 rounded-lg text-center">
              <div className="font-semibold text-gray-900">Average Lifespan</div>
              <div className="text-gray-700">~29,200 days (80 years)</div>
            </div>
            <div className="bg-gray-300/50 p-4 rounded-lg text-center">
              <div className="font-semibold text-gray-900">Oldest Person</div>
              <div className="text-gray-700">~44,000 days (122 years)</div>
            </div>
            <div className="bg-gray-300/50 p-4 rounded-lg text-center">
              <div className="font-semibold text-gray-900">Leap Year Bonus</div>
              <div className="text-gray-700">Extra day every 4 years</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
