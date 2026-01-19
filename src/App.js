import React, { useState } from "react";
import {
  DollarSign,
  TrendingUp,
  Calculator,
  Save,
  X,
  Eye,
  EyeOff,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export default function InvestmentCalculator() {
  const [inputs, setInputs] = useState({
    // Income settings
    startingIncome: 120000,
    salaryGrowthRate: 3,
    // Investment settings
    initialInvestment: 42000,
    investmentType: "fixed",
    fixedAmount: 1000,
    salaryPercentage: 10,
    years: 21,
    frequency: 1,
    expectedReturn: 8,
    // Fees
    entryFee: 0.5,
    managementFee: 0.2,
    // Tax
    taxRule: "NZ",
    investmentPauses: [],
  });

  const [savedScenarios, setSavedScenarios] = useState([]);
  const [scenarioName, setScenarioName] = useState("");
  const [visibleScenarios, setVisibleScenarios] = useState({});
  const [activeResultTab, setActiveResultTab] = useState("current");

  const handleChange = (field, value) => {
    setInputs((prev) => ({
      ...prev,
      [field]: ["taxRule", "investmentType"].includes(field)
        ? value
        : parseFloat(value) || 0,
    }));
  };

  const saveScenario = () => {
    if (scenarioName.trim()) {
      const scenario = {
        id: Date.now(),
        name: scenarioName,
        inputs: { ...inputs },
        results: calculateReturns(inputs),
      };
      setSavedScenarios((prev) => [...prev, scenario]);
      setVisibleScenarios((prev) => ({ ...prev, [scenario.id]: true }));
      setScenarioName("");
    }
  };

  const deleteScenario = (id) => {
    setSavedScenarios((prev) => prev.filter((s) => s.id !== id));
    setVisibleScenarios((prev) => {
      const newVisible = { ...prev };
      delete newVisible[id];
      return newVisible;
    });
  };

  const toggleScenarioVisibility = (id) => {
    setVisibleScenarios((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const getPIRRate = (income) => {
    if (income <= 48000) return 10.5;
    if (income <= 78000) return 17.5;
    return 28;
  };

  const getFIFRate = (income) => {
    if (income <= 15600) return 10.5;
    if (income <= 53500) return 17.5;
    if (income <= 78100) return 30;
    if (income <= 180000) return 33;
    return 39;
  };

  const calculateReturns = (data) => {
    const periodsPerYear = data.frequency;
    const totalPeriods = data.years * periodsPerYear;
    const returnPerPeriod = data.expectedReturn / 100 / periodsPerYear;
    const mgmtFeePerPeriod = data.managementFee / 100 / periodsPerYear;

    let portfolioValue = 0;
    let totalInvested = 0;
    let totalEntryFees = 0;
    let totalMgmtFees = 0;
    let totalTax = 0;
    let chartData = [];
    let milestones = [];

    // Add initial investment before the loop
    if (data.initialInvestment > 0) {
      const entryFee = data.initialInvestment * (data.entryFee / 100);
      console.log(
        `Initial Gross Investment: ${data.initialInvestment.toFixed(2)}`
      );
      console.log(`Entry Fee at 0: ${entryFee.toFixed(2)}`);
      const netAmount = data.initialInvestment - entryFee;
      totalInvested += data.initialInvestment;
      totalEntryFees += entryFee;
      portfolioValue += netAmount;
      console.log(`Portfolio at 0: ${portfolioValue.toFixed(2)}`);
    }

    // Record starting point
    chartData.push({
      year: 0,
      invested: Math.round(totalInvested),
      portfolioValue: Math.round(portfolioValue),
      totalWealth: Math.round(portfolioValue),
    });

    // Yearly tax trackers
    let yearlyGrossGrowth = 0;
    let yearlyMgmtFees = 0;

    for (let period = 1; period <= totalPeriods; period++) {
      const currentYearFrac =
        Math.floor(period / periodsPerYear) +
        (period % periodsPerYear) / periodsPerYear;
      const currentYear = Math.floor(currentYearFrac);
      const isStartOfYear = period % periodsPerYear === 0; // Adjusted for loop starting at 1
      const isEndOfYear =
        period % periodsPerYear === 0 || period === totalPeriods;

      if (isStartOfYear) {
        yearlyGrossGrowth = 0;
        yearlyMgmtFees = 0;
      }

      let currentIncome =
        data.startingIncome *
        Math.pow(1 + data.salaryGrowthRate / 100, currentYear);

      let contribution =
        data.investmentType === "fixed"
          ? data.fixedAmount
          : (currentIncome / periodsPerYear) * (data.salaryPercentage / 100);

      contribution = Math.max(0, contribution);

      const entryFee = contribution * (data.entryFee / 100);
      const netContribution = contribution - entryFee;

      totalInvested += contribution;
      totalEntryFees += entryFee;
      portfolioValue += netContribution;

      // Growth
      if (portfolioValue > 0) {
        const growth = portfolioValue * returnPerPeriod;
        console.log(`Growth at ${period}: ${growth.toFixed(2)}`);
        portfolioValue += growth;
        yearlyGrossGrowth += growth;
        console.log(
          `Portfolio Value at ${period}: ${portfolioValue.toFixed(2)}`
        );
      }

      // Management fee
      if (portfolioValue > 0) {
        const mgmtFee = portfolioValue * mgmtFeePerPeriod;
        console.log(`Management fee at ${period}: ${mgmtFee.toFixed(2)}`);
        portfolioValue -= mgmtFee;
        totalMgmtFees += mgmtFee;
        yearlyMgmtFees += mgmtFee;
        console.log(
          `Portfolio Value at ${period}: ${portfolioValue.toFixed(2)}`
        );
      }

      // Tax (PIR or FIF) at end of year
      if (isEndOfYear && portfolioValue > 0) {
        const taxableGain = Math.max(0, yearlyGrossGrowth - yearlyMgmtFees);

        let taxRate = 0;
        if (data.taxRule === "pir") {
          const pirRate = getPIRRate(currentIncome) / 100;
          const taxThisYear = taxableGain * pirRate;
          portfolioValue -= taxThisYear;
          totalTax += taxThisYear;
        } else if (data.taxRule === "fif") {
          const fifRate = getFIFRate(currentIncome) / 100;
          const taxThisYear = taxableGain * fifRate;
          portfolioValue -= taxThisYear;
          totalTax += taxThisYear;
        }

        console.log(`Taxable gain at ${period}: ${taxableGain.toFixed(2)}`);
        console.log(`Total tax at ${period}: ${totalTax.toFixed(2)}`);
        console.log(
          `Portfolio Value at ${period}: ${portfolioValue.toFixed(2)}`
        );
      }

      // Record data
      if (period % periodsPerYear === 0 || period === totalPeriods) {
        chartData.push({
          year: Math.round(currentYearFrac),
          invested: Math.round(totalInvested),
          portfolioValue: Math.round(portfolioValue),
          totalWealth: Math.round(portfolioValue),
        });
      }
    }

    // Final withdrawal fee
    if (portfolioValue > 0 && data.entryFee > 0) {
      const withdrawalFee = portfolioValue * (data.entryFee / 100);
      portfolioValue -= withdrawalFee;
      totalEntryFees += withdrawalFee;
      console.log(`Final withdrawal fee is ${withdrawalFee.toFixed(2)}`);
      console.log(`Final portfolio value is ${portfolioValue.toFixed(2)}`);
    }

    const totalWealth = portfolioValue;
    const netReturn =
      totalInvested > 0
        ? ((totalWealth - totalInvested) / totalInvested) * 100
        : 0;

    return {
      totalInvested: Math.round(totalInvested),
      portfolioValue: Math.round(portfolioValue),
      totalEntryFees: Math.round(totalEntryFees),
      totalMgmtFees: Math.round(totalMgmtFees),
      tax: Math.round(totalTax),
      totalWealth: Math.round(totalWealth),
      netReturn,
      chartData,
      milestones,
    };
  };

  const calculateMortgagePayment = (principal, monthlyRate, numPayments) => {
    if (monthlyRate === 0) return principal / numPayments;
    return (
      (principal * (monthlyRate * Math.pow(1 + monthlyRate, numPayments))) /
      (Math.pow(1 + monthlyRate, numPayments) - 1)
    );
  };

  const calculateRemainingMortgage = (
    principal,
    monthlyRate,
    totalPayments,
    paymentsMade
  ) => {
    if (paymentsMade >= totalPayments) return 0;
    const monthlyPayment = calculateMortgagePayment(
      principal,
      monthlyRate,
      totalPayments
    );
    let balance = principal;
    for (let i = 0; i < Math.min(paymentsMade, totalPayments); i++) {
      const interest = balance * monthlyRate;
      const principalPayment = monthlyPayment - interest;
      balance -= principalPayment;
    }
    return Math.max(0, balance);
  };

  const currentResults = calculateReturns(inputs);

  const getLineColor = (index) =>
    ["#10B981", "#3B82F6", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899"][
      index % 6
    ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 md:p-8 text-white">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp size={32} />
              <h1 className="text-2xl md:text-3xl font-bold">
                NZ Stock Investment Calculator
              </h1>
            </div>
            <p className="text-blue-100">
              Plan your financial future with realistic scenarios
            </p>
          </div>

          <div className="p-4 md:p-8">
            {/* Save Scenario */}
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-xl border-2 border-purple-200 mb-6">
              <div className="flex flex-col md:flex-row gap-4">
                <input
                  type="text"
                  value={scenarioName}
                  onChange={(e) => setScenarioName(e.target.value)}
                  placeholder="Scenario name"
                  className="flex-1 px-4 py-2 border rounded-lg"
                />
                <button
                  onClick={saveScenario}
                  className="flex items-center justify-center gap-2 bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700"
                >
                  <Save size={20} />
                  Save
                </button>
              </div>

              {savedScenarios.length > 0 && (
                <div className="mt-4 space-y-2">
                  <p className="text-sm font-semibold">Saved Scenarios:</p>
                  {savedScenarios.map((scenario) => (
                    <div
                      key={scenario.id}
                      className="flex items-center gap-2 bg-white p-3 rounded"
                    >
                      <button
                        onClick={() => toggleScenarioVisibility(scenario.id)}
                        className="text-purple-600"
                      >
                        {visibleScenarios[scenario.id] ? (
                          <Eye size={20} />
                        ) : (
                          <EyeOff size={20} />
                        )}
                      </button>
                      <span className="flex-1 font-medium">
                        {scenario.name}
                      </span>
                      <span className="text-sm text-gray-600">
                        $
                        {scenario.results.totalWealth.toLocaleString("en-US", {
                          maximumFractionDigits: 0,
                        })}
                      </span>
                      <button
                        onClick={() => deleteScenario(scenario.id)}
                        className="text-red-600"
                      >
                        <X size={20} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Input Grid */}
            <div className="grid lg:grid-cols-2 gap-6 mb-8">
              {/* Income & Investment */}
              <div className="space-y-4">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <Calculator size={20} />
                  Income & Investment
                </h2>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Starting Income ($)
                  </label>
                  <input
                    type="number"
                    value={inputs.startingIncome}
                    onChange={(e) =>
                      handleChange("startingIncome", e.target.value)
                    }
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Annual Salary Growth (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={inputs.salaryGrowthRate}
                    onChange={(e) =>
                      handleChange("salaryGrowthRate", e.target.value)
                    }
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Typical: 2-4% inflation, 3-7% with progression
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Initial Investment ($)
                  </label>
                  <input
                    type="number"
                    value={inputs.initialInvestment}
                    onChange={(e) =>
                      handleChange("initialInvestment", e.target.value)
                    }
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Investment Type
                  </label>
                  <select
                    value={inputs.investmentType}
                    onChange={(e) =>
                      handleChange("investmentType", e.target.value)
                    }
                    className="w-full px-4 py-2 border rounded-lg"
                  >
                    <option value="fixed">Fixed Amount</option>
                    <option value="percentage">Percentage of Salary</option>
                  </select>
                </div>
                {inputs.investmentType === "fixed" ? (
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Amount per Investment ($)
                    </label>
                    <input
                      type="number"
                      value={inputs.fixedAmount}
                      onChange={(e) =>
                        handleChange("fixedAmount", e.target.value)
                      }
                      className="w-full px-4 py-2 border rounded-lg"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Salary Percentage (%)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={inputs.salaryPercentage}
                      onChange={(e) =>
                        handleChange("salaryPercentage", e.target.value)
                      }
                      className="w-full px-4 py-2 border rounded-lg"
                    />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Investment Period (years)
                  </label>
                  <input
                    type="number"
                    value={inputs.years}
                    onChange={(e) => handleChange("years", e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Frequency
                  </label>
                  <select
                    value={inputs.frequency}
                    onChange={(e) => handleChange("frequency", e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg"
                  >
                    <option value="1">Annually</option>
                    <option value="4">Quarterly</option>
                    <option value="12">Monthly</option>
                    <option value="26">Fortnightly</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Expected Return (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={inputs.expectedReturn}
                    onChange={(e) =>
                      handleChange("expectedReturn", e.target.value)
                    }
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    NZ shares ~9%, US ~10%, bonds ~5%
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Entry Fee (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={inputs.entryFee}
                    onChange={(e) => handleChange("entryFee", e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Management Fee (% p.a.)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={inputs.managementFee}
                    onChange={(e) =>
                      handleChange("managementFee", e.target.value)
                    }
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>
              </div>

              {/* Tax & Events */}
              <div className="space-y-4">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  Tax
                </h2>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Tax Rule
                  </label>
                  <select
                    value={inputs.taxRule}
                    onChange={(e) => handleChange("taxRule", e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg"
                  >
                    <option value="pir">PIR (PIE/KiwiSaver)</option>
                    <option value="fif">FIF (Direct Overseas)</option>
                    <option value="NZ">New Zealand Investment</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Chart */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4">Growth Comparison</h2>
              <div className="bg-white p-4 rounded-lg border">
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="year"
                      type="number"
                      domain={[0, inputs.years]}
                    />
                    <YAxis
                      tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                    />
                    <Tooltip formatter={(v) => `$${v.toLocaleString()}`} />
                    <Legend />
                    <Line
                      type="monotone"
                      data={currentResults.chartData}
                      dataKey="totalWealth"
                      stroke="#6366F1"
                      strokeWidth={3}
                      dot={false}
                      name="Current Scenario"
                    />
                    {savedScenarios.map(
                      (scenario, idx) =>
                        visibleScenarios[scenario.id] && (
                          <Line
                            key={scenario.id}
                            data={scenario.results.chartData}
                            type="monotone"
                            dataKey="totalWealth"
                            stroke={getLineColor(idx)}
                            strokeWidth={2}
                            dot={false}
                            name={scenario.name}
                          />
                        )
                    )}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Results with Tabs */}
            <div className="bg-green-50 p-6 rounded-xl border-2 border-green-200 mb-6">
              <h2 className="text-2xl font-bold mb-4">Results</h2>
              <div className="flex gap-2 mb-6 overflow-x-auto">
                <button
                  onClick={() => setActiveResultTab("current")}
                  className={`px-4 py-2 rounded-lg font-medium ${
                    activeResultTab === "current"
                      ? "bg-green-600 text-white"
                      : "bg-white"
                  }`}
                >
                  Current
                </button>
                {savedScenarios.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setActiveResultTab(s.id)}
                    className={`px-4 py-2 rounded-lg font-medium ${
                      activeResultTab === s.id
                        ? "bg-green-600 text-white"
                        : "bg-white"
                    }`}
                  >
                    {s.name}
                  </button>
                ))}
              </div>

              {(() => {
                const results =
                  activeResultTab === "current"
                    ? currentResults
                    : savedScenarios.find((s) => s.id === activeResultTab)
                        ?.results || currentResults;
                const settings =
                  activeResultTab === "current"
                    ? inputs
                    : savedScenarios.find((s) => s.id === activeResultTab)
                        ?.inputs || inputs;

                return (
                  <>
                <div className="flex flex-wrap gap-4 mb-4">
                  <div className="bg-white p-4 rounded-lg w-40">
                    <p className="text-sm text-gray-600">Total Invested</p>
                    <p className="text-2xl font-bold">
                      $
                      {results.totalInvested.toLocaleString("en-US", {
                        maximumFractionDigits: 0,
                      })}
                    </p>
                  </div>

                  <div className="bg-white p-4 rounded-lg w-40">
                    <p className="text-sm text-gray-600">Portfolio (after tax)</p>
                    <p className="text-2xl font-bold text-blue-600">
                      $
                      {results.portfolioValue.toLocaleString("en-US", {
                        maximumFractionDigits: 0,
                      })}
                    </p>
                  </div>

                  <div className="bg-white p-4 rounded-lg w-40">
                    <p className="text-sm text-gray-600">Net Return (%)</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {results.netReturn.toFixed(2)}%
                    </p>
                  </div>

                  <div className="bg-white p-4 rounded-lg w-40">
                    <p className="text-sm text-gray-600">Total Entry Fees</p>
                    <p className="text-xl font-bold text-orange-600">
                      $
                      {results.totalEntryFees.toLocaleString("en-US", {
                        maximumFractionDigits: 0,
                      })}
                    </p>
                  </div>

                  <div className="bg-white p-4 rounded-lg w-40">
                    <p className="text-sm text-gray-600">Total Mgmt Fees</p>
                    <p className="text-xl font-bold text-red-600">
                      $
                      {results.totalMgmtFees.toLocaleString("en-US", {
                        maximumFractionDigits: 0,
                      })}
                    </p>
                  </div>

                  <div className="bg-white p-4 rounded-lg w-40">
                    <p className="text-sm text-gray-600">Estimated Tax</p>
                    <p className="text-xl font-bold text-purple-600">
                      $
                      {results.tax.toLocaleString("en-US", {
                        maximumFractionDigits: 0,
                      })}
                    </p>
                  </div>
                </div>

                    <div className="bg-green-600 p-6 rounded-lg text-white mb-4">
                      <p className="text-green-100 text-sm">Total Wealth</p>
                      <p className="text-4xl font-bold">
                        $
                        {results.totalWealth.toLocaleString("en-US", {
                          maximumFractionDigits: 0,
                        })}
                      </p>
                    </div>


                  </>
                );
              })()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
