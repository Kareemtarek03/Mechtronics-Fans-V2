import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useFormData } from "../context/FormContext";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  CartesianGrid,
  Legend,
} from "recharts";
import "./ResultsPage.css";

// Piecewise Cubic Interpolation (Excel-compatible) - Same as backend
class PiecewiseCubicInterpolator {
  constructor(x, y) {
    this.x = [...x];
    this.y = [...y];
    this.n = x.length;

    // Calculate cubic coefficients for each segment
    this.segments = [];
    for (let i = 0; i < this.n - 1; i++) {
      const x0 = this.x[i];
      const x1 = this.x[i + 1];
      const y0 = this.y[i];
      const y1 = this.y[i + 1];

      const x0_cubed = Math.pow(x0, 3);
      const x1_cubed = Math.pow(x1, 3);

      // Excel's method: Y = aX³ + b
      const a = (y1 - y0) / (x1_cubed - x0_cubed);
      const b = y0 - a * x0_cubed;

      this.segments.push({
        xMin: Math.min(x0, x1),
        xMax: Math.max(x0, x1),
        c3: a,
        c0: b,
      });
    }
  }

  at(xi) {
    // Find the segment containing xi
    for (const seg of this.segments) {
      if (xi >= seg.xMin && xi <= seg.xMax) {
        return seg.c3 * Math.pow(xi, 3) + seg.c0;
      }
    }

    // Extrapolation using nearest segment
    const seg =
      xi < this.segments[0].xMin
        ? this.segments[0]
        : this.segments[this.segments.length - 1];
    return seg.c3 * Math.pow(xi, 3) + seg.c0;
  }
}

function cubicSplineInterpolation(xArray, yArray, numSamples = 100) {
  if (!xArray || !yArray || xArray.length < 2 || yArray.length < 2) return [];

  const interpolator = new PiecewiseCubicInterpolator(xArray, yArray);

  const xMin = Math.min(...xArray);
  const xMax = Math.max(...xArray);
  const step = (xMax - xMin) / (numSamples - 1);

  const result = [];
  for (let i = 0; i < numSamples; i++) {
    const x = xMin + i * step;
    const y = interpolator.at(x);
    result.push({ x: parseFloat(x.toFixed(2)), y: parseFloat(y.toFixed(2)) });
  }

  return result;
}

// Calculate Sound Power LW(A) spectrum
// Formula: LW(A) = 62 + 10*LOG10(Motor Input Power) + 10*LOG10(Static Pressure)
// Motor Input Power = (Fan Input Power / Motor Efficiency) * (1 + SPF)
// Octave band corrections from base LW(A)
function calculateSoundPowerSpectrum(fanInputPower, staticPressure, motorEfficiency, spf, directivityFactor, distanceFromSource) {
  // Ensure positive values for logarithm
  if (!fanInputPower || fanInputPower <= 0 || !staticPressure || staticPressure <= 0) {
    return null;
  }

  // Default motor efficiency to 0.85 (85%) if not provided
  const efficiencyValue = motorEfficiency && motorEfficiency > 0 ? motorEfficiency : 0.85;

  // Default SPF to 0.05 (5%) if not provided
  const spfValue = spf != null ? spf / 100 : 0.05;

  // Default sound data values
  const Q = directivityFactor || 2;  // Directivity factor
  const r = distanceFromSource || 1; // Distance in meters

  // Calculate Motor Input Power
  // Formula: Motor Input Power = (Fan Input Power / Motor Efficiency) * (1 + SPF)
  const motorInputPower = (fanInputPower / efficiencyValue) * (1 + spfValue);

  // Calculate base LW(A) in dB(A)
  // Formula: LW(A) = 62 + 10*log10(Motor Input Power in kW) + 10*log10(Static Pressure in Pa)
  const lwA = 62 + 10 * Math.log10(motorInputPower) + 10 * Math.log10(staticPressure);

  // Calculate LP(A) - Sound Pressure Level
  // Formula: LP(A) = LW(A) - ABS(10 * LOG10(Q / (4 * PI * r^2)))
  const distanceAttenuation = Math.abs(10 * Math.log10(Q / (4 * Math.PI * Math.pow(r, 2))));
  const lpA = lwA - distanceAttenuation;

  // Octave band frequencies and their corrections from LW(A) and LP(A)
  // LW corrections
  const lwOctaveBands = [
    { frequency: 62, correction: -31.7, label: '62 ' },
    { frequency: 125, correction: -20.7, label: '125 ' },
    { frequency: 250, correction: -4.2, label: '250 ' },
    { frequency: 500, correction: -6.7, label: '500 ' },
    { frequency: 1000, correction: -5.7, label: '1000' },
    { frequency: 2000, correction: -7.7, label: '2000' },
    { frequency: 4000, correction: -10.7, label: '4000' },
    { frequency: 8000, correction: -15.7, label: '8000' },
  ];

  // LP(A) corrections (from the image provided)
  const lpOctaveBands = [
    { frequency: 62, correction: -31.81, label: '62' },
    { frequency: 125, correction: -20.81, label: '125' },
    { frequency: 250, correction: -4.31, label: '250' },
    { frequency: 500, correction: -6.81, label: '500' },
    { frequency: 1000, correction: -5.81, label: '1000' },
    { frequency: 2000, correction: -7.81, label: '2000' },
    { frequency: 4000, correction: -10.81, label: '4000' },
    { frequency: 8000, correction: -15.81, label: '8000' },
  ];

  // Calculate sound power level for each octave band (LW)
  const lwSpectrumData = lwOctaveBands.map(band => ({
    frequency: band.label,
    freqValue: band.frequency,
    soundPower: parseFloat((lwA + band.correction).toFixed(1)),
    correction: band.correction,
  }));

  // Calculate sound pressure level for each octave band (LP)
  const lpSpectrumData = lpOctaveBands.map(band => ({
    frequency: band.label,
    freqValue: band.frequency,
    soundPressure: parseFloat((lpA + band.correction).toFixed(1)),
    correction: band.correction,
  }));

  return {
    lwA: parseFloat(lwA.toFixed(1)),
    lpA: parseFloat(lpA.toFixed(1)),
    motorInputPower: parseFloat(motorInputPower.toFixed(2)),
    distanceAttenuation: parseFloat(distanceAttenuation.toFixed(2)),
    Q,
    r,
    lwSpectrum: lwSpectrumData,
    lpSpectrum: lpSpectrumData,
    // Keep spectrum for backward compatibility
    spectrum: lwSpectrumData,
  };
}

export default function ResultsPage() {
  const navigate = useNavigate();
  const { results: contextResults, units, input } = useFormData();
  const [selectedFanIndex, setSelectedFanIndex] = useState(null);
  const [currentGraphIndex, setCurrentGraphIndex] = useState(0);
  const [activeTab, setActiveTab] = useState('performance'); // 'performance', 'curve', or 'noise'
  // Redesigned Results Page with tabbed interface

  // Graph types for cycling - using the recalculated arrays from backend
  const graphTypes = [
    { name: 'Static Pressure', dataKey: 'StaticPressureNew', airflowKey: 'AirFlowNew', unit: units?.pressure || 'Pa', color: '#3b82f6' },
    { name: 'Fan Input Power', dataKey: 'FanInputPowerNew', airflowKey: 'AirFlowNew', unit: units?.power || 'kW', color: '#10b981' },
    { name: 'Velocity Pressure', dataKey: 'VelocityPressureNew', airflowKey: 'AirFlowNew', unit: units?.pressure || 'Pa', color: '#f59e0b' },
    { name: 'Static Efficiency', dataKey: 'FanStaticEfficiency', airflowKey: 'AirFlowNew', unit: '%', multiplier: 100, color: '#8b5cf6' },
    { name: 'Total Efficiency', dataKey: 'FanTotalEfficiency', airflowKey: 'AirFlowNew', unit: '%', multiplier: 100, color: '#ec4899' },
  ];

  const handlePrevGraph = () => {
    setCurrentGraphIndex((prev) => (prev === 0 ? graphTypes.length - 1 : prev - 1));
  };

  const handleNextGraph = () => {
    setCurrentGraphIndex((prev) => (prev === graphTypes.length - 1 ? 0 : prev + 1));
  };

  // Extract results from context
  const apiData = contextResults?.data;

  const formatValue = (v) => {
    if (v === null || v === undefined) return "-";
    if (typeof v === "number")
      return v.toLocaleString(undefined, { maximumFractionDigits: 6 });
    return String(v);
  };

  const getDefaultForField = (type, name) => {
    const DEFAULTS = {
      units: { airFlow: "CFM", pressure: "Pa", power: "kW", fanType: "AF-L" },
      input: { RPM: 1440, TempC: 20, NoPhases: 3, SPF: 5, Safety: 5 },
    };
    return DEFAULTS[type][name];
  };

  // Check if we have valid data
  if (!contextResults || !apiData || !apiData.data || !Array.isArray(apiData.data)) {
    return (
      <div className="results-page-container" style={{ minHeight: 'calc(100vh - 80px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#374151' }}>No Results Found</h1>
          <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>Please perform a search first.</p>
          <button
            className="btn-primary"
            onClick={() => navigate("/")}
            style={{ padding: '0.5rem 1rem', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '0.375rem', cursor: 'pointer' }}
          >
            Go to Search
          </button>
        </div>
      </div>
    );
  }

  const fans = apiData.data;

  return (
    <div style={{ minHeight: "100vh", background: "#0f172a", color: "#e2e8f0", paddingTop: "80px" }}>
      <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "2rem" }}>
        {/* Header */}
        <div className="results-header" style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2rem', color: '#ffffff', marginBottom: '1rem', fontWeight: 'bold' }}>
            Matched Fans
          </h1>
        </div>

        {/* Results Table */}
        <div className="results-table-container">
          <table className="results-table">
            <thead>
              <tr>
                <th className="center">No</th>
                <th className="center">Model Number</th>
                <th className="center">Static Pressure ({units?.pressure || getDefaultForField("units", "pressure")})</th>
                <th className="center">Fan Input Power ({units?.power || getDefaultForField("units", "power")})</th>
                <th className="center">Velocity Pressure ({units?.pressure || getDefaultForField("units", "pressure")})</th>
                <th className="center">Static Efficiency (%)</th>
                <th className="center">Total Efficiency (%)</th>
              </tr>
            </thead>
            <tbody>
              {fans.map((fan, idx) => {
                const predictions = fan.predictions || {};
                const pressureValue = predictions.StaticPressurePred?.toFixed(2) || "-";
                const powerValue = predictions.FanInputPowerPred?.toFixed(2) || "-";
                const velocityPressureValue = predictions.VelocityPressurePred?.toFixed(2) || "-";
                const staticEfficiencyValue = predictions.FanStaticEfficiencyPred
                  ? (predictions.FanStaticEfficiencyPred * 100).toFixed(2)
                  : "-";
                const totalEfficiencyValue = predictions.FanTotalEfficiencyPred
                  ? (predictions.FanTotalEfficiencyPred * 100).toFixed(2)
                  : "-";

                return (
                  <tr
                    key={idx}
                    className={selectedFanIndex === idx ? "selected" : ""}
                    onClick={() => setSelectedFanIndex(selectedFanIndex === idx ? null : idx)}
                  >
                    <td className="center">{fan.No ?? "-"}</td>
                    <td className="center">
                      <span className="fan-model">{fan.FanModel || `Model ${fan.Id}`}</span>
                    </td>
                    <td className="center">{pressureValue}</td>
                    <td className="center">{powerValue}</td>
                    <td className="center">{velocityPressureValue}</td>
                    <td className="center">{staticEfficiencyValue}</td>
                    <td className="center">{totalEfficiencyValue}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Detailed Fan Information Card - Only show selected fan */}
        {selectedFanIndex !== null && (
          <div className="detail-section" style={{ marginTop: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ margin: 0 }}>
                Details for {fans[selectedFanIndex]?.FanModel || `Fan ${selectedFanIndex + 1}`}
              </h2>
              <button
                onClick={() => {
                  const fan = fans[selectedFanIndex];
                  // Open PDF in new tab
                  fetch('/api/pdf/datasheet', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                      fanData: fan,
                      userInput: input,
                      units: units,
                    }),
                  })
                    .then(response => response.blob())
                    .then(blob => {
                      const url = window.URL.createObjectURL(blob);
                      window.open(url, '_blank');
                    })
                    .catch(error => {
                      console.error('Error generating PDF:', error);
                      alert('Failed to generate PDF datasheet');
                    });
                }}
                style={{
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: 'white',
                  border: 'none',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(16, 185, 129, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.3)';
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                  <polyline points="10 9 9 9 8 9"></polyline>
                </svg>
                View Datasheet
              </button>
            </div>

            {/* Tab Buttons */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '2px solid #334155' }}>
              <button
                onClick={() => setActiveTab('performance')}
                style={{
                  background: 'transparent',
                  border: 'none',
                  padding: '1rem 2rem',
                  color: activeTab === 'performance' ? '#3b82f6' : '#cbd5e1',
                  fontSize: '1rem',
                  fontWeight: activeTab === 'performance' ? 'bold' : 'normal',
                  cursor: 'pointer',
                  borderBottom: activeTab === 'performance' ? '3px solid #3b82f6' : '3px solid transparent',
                  transition: 'all 0.2s',
                  marginBottom: '-2px'
                }}
                onMouseEnter={(e) => {
                  if (activeTab !== 'performance') e.target.style.color = '#e2e8f0';
                }}
                onMouseLeave={(e) => {
                  if (activeTab !== 'performance') e.target.style.color = '#cbd5e1';
                }}
              >
                Performance Data
              </button>
              <button
                onClick={() => setActiveTab('curve')}
                style={{
                  background: 'transparent',
                  border: 'none',
                  padding: '1rem 2rem',
                  color: activeTab === 'curve' ? '#3b82f6' : '#cbd5e1',
                  fontSize: '1rem',
                  fontWeight: activeTab === 'curve' ? 'bold' : 'normal',
                  cursor: 'pointer',
                  borderBottom: activeTab === 'curve' ? '3px solid #3b82f6' : '3px solid transparent',
                  transition: 'all 0.2s',
                  marginBottom: '-2px'
                }}
                onMouseEnter={(e) => {
                  if (activeTab !== 'curve') e.target.style.color = '#e2e8f0';
                }}
                onMouseLeave={(e) => {
                  if (activeTab !== 'curve') e.target.style.color = '#cbd5e1';
                }}
              >
                Fan Curve
              </button>
              <button
                onClick={() => setActiveTab('noise')}
                style={{
                  background: 'transparent',
                  border: 'none',
                  padding: '1rem 2rem',
                  color: activeTab === 'noise' ? '#3b82f6' : '#cbd5e1',
                  fontSize: '1rem',
                  fontWeight: activeTab === 'noise' ? 'bold' : 'normal',
                  cursor: 'pointer',
                  borderBottom: activeTab === 'noise' ? '3px solid #3b82f6' : '3px solid transparent',
                  transition: 'all 0.2s',
                  marginBottom: '-2px'
                }}
                onMouseEnter={(e) => {
                  if (activeTab !== 'noise') e.target.style.color = '#e2e8f0';
                }}
                onMouseLeave={(e) => {
                  if (activeTab !== 'noise') e.target.style.color = '#cbd5e1';
                }}
              >
                Noise Graph
              </button>
            </div>

            {(() => {
              const item = fans[selectedFanIndex];
              const idx = selectedFanIndex;
              const summaryFields = {
                FanModel: item.FanModel,
                Id: item.Id,
                RPM: item.RPM,
                desigDensity: item.desigDensity,
                InputDensity: item.InputDensity,
              };

              const blades = item.Blades
                ? `${item.Blades.symbol || ""}${item.Blades.material ? ` (${item.Blades.material})` : ""
                } - ${item.Blades.noBlades || ""} blades @ ${item.Blades.angle || ""
                }°`
                : null;
              const imp = item.Impeller
                ? `${item.Impeller.conf || ""} (inner ${item.Impeller.innerDia || ""
                } mm)`
                : null;

              const motor = item.matchedMotor;
              let motorEffAvg = null;
              if (motor) {
                if (Array.isArray(motor.effCurve) && motor.effCurve.length) {
                  motorEffAvg =
                    motor.effCurve.reduce((a, b) => a + b, 0) /
                    motor.effCurve.length;
                }
              }

              return (
                <div key={idx}>
                  {/* Performance Data Section - Only show when activeTab is 'performance' */}
                  {activeTab === 'performance' && (
                    <div style={{ marginBottom: '1.5rem' }}>
                      <div className="detail-grid">
                        {/* Fan Specifications Card */}
                        <div className="detail-card">
                          <h4>Fan Specifications</h4>
                          <div className="detail-row">
                            <span className="detail-label">Input Density</span>
                            <span className="detail-value">{summaryFields.InputDensity || "-"}</span>
                          </div>
                          <div className="detail-row">
                            <span className="detail-label">Blades</span>
                            <span className="detail-value">{blades || "-"}</span>
                          </div>
                          <div className="detail-row">
                            <span className="detail-label">Impeller</span>
                            <span className="detail-value">{imp || "-"}</span>
                          </div>
                        </div>

                        {/* Motor Details Card */}
                        <div className="detail-card">
                          <h4>Motor Details</h4>
                          <div className="detail-row">
                            <span className="detail-label">Motor Model</span>
                            <span className="detail-value">{motor?.model || "-"}</span>
                          </div>
                          <div className="detail-row">
                            <span className="detail-label">Power (kW)</span>
                            <span className="detail-value">{formatValue(motor?.powerKW)}</span>
                          </div>
                          <div className="detail-row">
                            <span className="detail-label">No. of Poles</span>
                            <span className="detail-value">{formatValue(motor?.NoPoles)}</span>
                          </div>
                          <div className="detail-row">
                            <span className="detail-label">Volt / Phase / Freq</span>
                            <span className="detail-value">
                              {motor?.Phase === 1 ? "220" : motor?.Phase === 3 ? "380" : "-"} / {motor?.Phase || "-"} / 50 Hz
                            </span>
                          </div>
                          <div className="detail-row">
                            <span className="detail-label">Motor Efficiency</span>
                            <span className="detail-value">{motorEffAvg ? `${(motorEffAvg * 100).toFixed(2)}%` : "-"}</span>
                          </div>
                          <div className="detail-row">
                            <span className="detail-label">Insulation Class</span>
                            <span className="detail-value">{motor?.insClass || "-"}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Fan Curve Section - Only show when activeTab is 'curve' */}
                  {activeTab === 'curve' && (
                    <div style={{ marginBottom: '1.5rem' }}>
                      <div className="detail-card" style={{ position: 'relative' }}>
                        <h4>Fan Performance Curves</h4>
                        {/* Legend */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', justifyContent: 'center', marginBottom: '1rem' }}>
                          {graphTypes.map((graph) => (
                            <div key={graph.name} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <div style={{ width: '20px', height: '3px', backgroundColor: graph.color }}></div>
                              <span style={{ color: graph.color, fontSize: '0.85rem', fontWeight: '500' }}>{graph.name}</span>
                            </div>
                          ))}
                          {/* System Curve Legend */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{ width: '20px', height: '3px', backgroundColor: '#ef4444', borderStyle: 'dashed' }}></div>
                            <span style={{ color: '#ef4444', fontSize: '0.85rem', fontWeight: '500' }}>System Curve</span>
                          </div>
                        </div>
                        <div style={{ width: '100%', height: '450px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <ResponsiveContainer width="100%" height="100%">
                            {(() => {
                              // Get airflow data for x-axis
                              const airflowData = item['AirFlowNew'] || [];

                              // Build combined data for all curves
                              // First, get all valid airflow values and sort them
                              const validAirflows = airflowData.filter(v => v != null && !isNaN(v)).map(Number);
                              if (validAirflows.length < 2) {
                                return <div style={{ color: '#94a3b8' }}>Insufficient data for curves</div>;
                              }

                              const xMin = Math.min(...validAirflows);
                              const xMax = Math.max(...validAirflows);

                              // Generate evenly spaced x-axis ticks (10-12 ticks)
                              const tickCount = 12;
                              const rawStep = (xMax - xMin) / (tickCount - 1);
                              // Round step to a nice number
                              const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
                              const niceStep = Math.ceil(rawStep / magnitude) * magnitude;
                              const niceMin = Math.floor(xMin / niceStep) * niceStep;
                              const niceMax = Math.ceil(xMax / niceStep) * niceStep;
                              const xTicks = [];
                              for (let tick = niceMin; tick <= niceMax; tick += niceStep) {
                                xTicks.push(Math.round(tick));
                              }

                              // Prepare interpolated data for each curve
                              const curveData = {};
                              graphTypes.forEach((graph) => {
                                const yData = item[graph.dataKey] || [];
                                const validIndices = [];
                                for (let i = 0; i < airflowData.length; i++) {
                                  if (airflowData[i] != null && yData[i] != null &&
                                    !isNaN(airflowData[i]) && !isNaN(yData[i])) {
                                    validIndices.push(i);
                                  }
                                }
                                validIndices.sort((a, b) => airflowData[a] - airflowData[b]);
                                const xArray = validIndices.map(i => Number(airflowData[i]));
                                const yArray = validIndices.map(i => Number(yData[i]) * (graph.multiplier || 1));

                                if (xArray.length >= 2) {
                                  curveData[graph.dataKey] = cubicSplineInterpolation(xArray, yArray, 100);
                                } else {
                                  curveData[graph.dataKey] = xArray.map((x, i) => ({ x, y: yArray[i] }));
                                }
                              });

                              // Merge all curve data into a single dataset keyed by x
                              const mergedDataMap = new Map();
                              graphTypes.forEach((graph) => {
                                const data = curveData[graph.dataKey] || [];
                                data.forEach((point) => {
                                  const xKey = point.x.toFixed(2);
                                  if (!mergedDataMap.has(xKey)) {
                                    mergedDataMap.set(xKey, { x: point.x });
                                  }
                                  mergedDataMap.get(xKey)[graph.dataKey] = point.y;
                                });
                              });

                              // Calculate System Curve: y = a * x²
                              // a = predictedStaticPressure / (userAirflowInput²)
                              const itemPredictions = item.predictions || {};
                              const predictedStaticPressure = itemPredictions.StaticPressurePred;
                              const userAirflowInput = input?.airFlow;

                              if (predictedStaticPressure && userAirflowInput && userAirflowInput > 0) {
                                const coefficientA = predictedStaticPressure / Math.pow(userAirflowInput, 2);

                                // Generate System Curve points for all x values in mergedDataMap
                                mergedDataMap.forEach((dataPoint, xKey) => {
                                  const x = dataPoint.x;
                                  const systemY = coefficientA * Math.pow(x, 2);
                                  dataPoint.SystemCurve = systemY;
                                });
                              }

                              // Convert to array and sort by x
                              const mergedData = Array.from(mergedDataMap.values()).sort((a, b) => a.x - b.x);

                              // Calculate max values for each axis type
                              const maxPressure = Math.max(
                                ...mergedData.map(d => Math.max(d.StaticPressureNew || 0, d.VelocityPressureNew || 0))
                              );
                              const maxPower = Math.max(...mergedData.map(d => d.FanInputPowerNew || 0));
                              const maxEfficiency = Math.max(
                                ...mergedData.map(d => Math.max(d.FanStaticEfficiency || 0, d.FanTotalEfficiency || 0))
                              );

                              // Get prediction values for summary
                              const predictions = item.predictions || {};

                              return (
                                <LineChart data={mergedData} margin={{ top: 20, right: 120, left: 60, bottom: 50 }}>
                                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                  <XAxis
                                    dataKey="x"
                                    stroke="#94a3b8"
                                    tick={{ fill: '#94a3b8', fontSize: 11 }}
                                    ticks={xTicks}
                                    domain={[niceMin, niceMax]}
                                    type="number"
                                    label={{
                                      value: `Airflow (${units?.airFlow || 'CFM'})`,
                                      position: "insideBottom",
                                      offset: -10,
                                      fill: "#e2e8f0",
                                      style: { fontSize: '12px', fontWeight: '500' }
                                    }}
                                  />
                                  {/* Left Y-Axis: Pressure (Pa) */}
                                  <YAxis
                                    yAxisId="pressure"
                                    orientation="left"
                                    stroke="#3b82f6"
                                    tick={{ fill: '#3b82f6', fontSize: 11 }}
                                    domain={[0, Math.ceil(maxPressure * 1.1)]}
                                    label={{
                                      value: `Pressure (${units?.pressure || 'Pa'})`,
                                      angle: -90,
                                      position: "insideLeft",
                                      offset: -10,
                                      fill: "#3b82f6",
                                      style: { fontSize: '16px', fontWeight: '500', textAnchor: 'middle' }
                                    }}
                                  />
                                  {/* Right Y-Axis: Efficiency (%) */}
                                  <YAxis
                                    yAxisId="efficiency"
                                    orientation="right"
                                    stroke="#8b5cf6"
                                    tick={{ fill: '#8b5cf6', fontSize: 11 }}
                                    domain={[0, 100]}
                                    label={{
                                      value: 'Efficiency (%)',
                                      angle: 90,
                                      position: "right",
                                      offset: 0,
                                      dx: -20,
                                      fill: "#8b5cf6",
                                      style: { fontSize: '16px', fontWeight: '600', textAnchor: 'middle' }
                                    }}
                                  />
                                  {/* Far Right Y-Axis: Power (kW) */}
                                  <YAxis
                                    yAxisId="power"
                                    orientation="right"
                                    stroke="#10b981"
                                    tick={{ fill: '#10b981', fontSize: 11 }}
                                    domain={[0, Math.ceil(maxPower * 1.2)]}
                                    axisLine={{ stroke: '#10b981' }}
                                    tickLine={{ stroke: '#10b981' }}
                                    label={{
                                      value: `Power (${units?.power || 'kW'})`,
                                      angle: 90,
                                      position: "right",
                                      offset: 0,
                                      dx: 3,
                                      fill: "#10b981",
                                      style: { fontSize: '16px', fontWeight: '600', textAnchor: 'middle' }
                                    }}
                                  />
                                  <Tooltip
                                    contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "8px", color: "#e2e8f0" }}
                                    formatter={(value, name) => {
                                      if (name === 'SystemCurve') {
                                        return [value?.toFixed(2) || '-', 'System Curve'];
                                      }
                                      const graphType = graphTypes.find(g => g.dataKey === name);
                                      return [value?.toFixed(2) || '-', graphType?.name || name];
                                    }}
                                    labelFormatter={(label) => `Airflow: ${Number(label).toFixed(0)} ${units?.airFlow || 'CFM'}`}
                                  />
                                  {/* Static Pressure - Blue */}
                                  <Line
                                    yAxisId="pressure"
                                    type="monotone"
                                    dataKey="StaticPressureNew"
                                    stroke="#3b82f6"
                                    strokeWidth={2}
                                    dot={false}
                                    isAnimationActive={true}
                                  />
                                  {/* Fan Input Power - Green */}
                                  <Line
                                    yAxisId="power"
                                    type="monotone"
                                    dataKey="FanInputPowerNew"
                                    stroke="#10b981"
                                    strokeWidth={2}
                                    dot={false}
                                    isAnimationActive={true}
                                  />
                                  {/* Velocity Pressure - Orange */}
                                  <Line
                                    yAxisId="pressure"
                                    type="monotone"
                                    dataKey="VelocityPressureNew"
                                    stroke="#f59e0b"
                                    strokeWidth={2}
                                    dot={false}
                                    isAnimationActive={true}
                                  />
                                  {/* Static Efficiency - Purple */}
                                  <Line
                                    yAxisId="efficiency"
                                    type="monotone"
                                    dataKey="FanStaticEfficiency"
                                    stroke="#8b5cf6"
                                    strokeWidth={2}
                                    dot={false}
                                    isAnimationActive={true}
                                  />
                                  {/* Total Efficiency - Pink */}
                                  <Line
                                    yAxisId="efficiency"
                                    type="monotone"
                                    dataKey="FanTotalEfficiency"
                                    stroke="#ec4899"
                                    strokeWidth={2}
                                    dot={false}
                                    isAnimationActive={true}
                                  />
                                  {/* System Curve - Red Dashed */}
                                  <Line
                                    yAxisId="pressure"
                                    type="monotone"
                                    dataKey="SystemCurve"
                                    stroke="#ef4444"
                                    strokeWidth={2}
                                    strokeDasharray="5 5"
                                    dot={false}
                                    isAnimationActive={true}
                                  />
                                </LineChart>
                              );
                            })()}
                          </ResponsiveContainer>
                        </div>
                        {/* Summary Values */}
                        {(() => {
                          const predictions = item.predictions || {};
                          return (
                            <div style={{
                              display: 'grid',
                              gridTemplateColumns: 'repeat(5, 1fr)',
                              gap: '1rem',
                              marginTop: '1.5rem',
                              borderTop: '1px solid #334155',
                              paddingTop: '1rem'
                            }}>
                              <div style={{ textAlign: 'center' }}>
                                <div style={{ color: '#94a3b8', fontSize: '0.75rem', marginBottom: '0.25rem' }}>SP</div>
                                <div style={{ color: '#3b82f6', fontSize: '1.1rem', fontWeight: 'bold' }}>
                                  {predictions.StaticPressurePred?.toFixed(2) || '-'} <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{units?.pressure || 'Pa'}</span>
                                </div>
                              </div>
                              <div style={{ textAlign: 'center' }}>
                                <div style={{ color: '#94a3b8', fontSize: '0.75rem', marginBottom: '0.25rem' }}>Power</div>
                                <div style={{ color: '#10b981', fontSize: '1.1rem', fontWeight: 'bold' }}>
                                  {predictions.FanInputPowerPred?.toFixed(3) || '-'} <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{units?.power || 'kW'}</span>
                                </div>
                              </div>
                              <div style={{ textAlign: 'center' }}>
                                <div style={{ color: '#94a3b8', fontSize: '0.75rem', marginBottom: '0.25rem' }}>VP</div>
                                <div style={{ color: '#f59e0b', fontSize: '1.1rem', fontWeight: 'bold' }}>
                                  {predictions.VelocityPressurePred?.toFixed(2) || '-'} <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{units?.pressure || 'Pa'}</span>
                                </div>
                              </div>
                              <div style={{ textAlign: 'center' }}>
                                <div style={{ color: '#94a3b8', fontSize: '0.75rem', marginBottom: '0.25rem' }}>η Static</div>
                                <div style={{ color: '#8b5cf6', fontSize: '1.1rem', fontWeight: 'bold' }}>
                                  {predictions.FanStaticEfficiencyPred ? (predictions.FanStaticEfficiencyPred * 100).toFixed(1) : '-'} <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>%</span>
                                </div>
                              </div>
                              <div style={{ textAlign: 'center' }}>
                                <div style={{ color: '#94a3b8', fontSize: '0.75rem', marginBottom: '0.25rem' }}>η Total</div>
                                <div style={{ color: '#ec4899', fontSize: '1.1rem', fontWeight: 'bold' }}>
                                  {predictions.FanTotalEfficiencyPred ? (predictions.FanTotalEfficiencyPred * 100).toFixed(1) : '-'} <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>%</span>
                                </div>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  )}

                  {/* Noise Graph Section - Only show when activeTab is 'noise' */}
                  {activeTab === 'noise' && (
                    <div style={{ marginBottom: '1.5rem' }}>
                      {(() => {
                        const predictions = item.predictions || {};
                        const fanInputPower = predictions.FanInputPowerPred;
                        const staticPressure = predictions.StaticPressurePred;

                        // Get motor efficiency from matched motor
                        let motorEfficiency = 0.85;
                        if (motor && Array.isArray(motor.effCurve) && motor.effCurve.length > 0) {
                          motorEfficiency = motor.effCurve.reduce((a, b) => a + b, 0) / motor.effCurve.length;
                        }

                        // Get SPF and sound data from user input
                        const spf = input?.SPF || 5;
                        const directivityFactor = input?.directivityFactor || 2;
                        const distanceFromSource = input?.distanceFromSource || 1;

                        const noiseData = calculateSoundPowerSpectrum(
                          fanInputPower,
                          staticPressure,
                          motorEfficiency,
                          spf,
                          directivityFactor,
                          distanceFromSource
                        );

                        if (!noiseData) {
                          return (
                            <div className="detail-card" style={{
                              padding: '2rem',
                              textAlign: 'center',
                              color: '#94a3b8'
                            }}>
                              <p>Unable to calculate noise data. Missing fan input power or static pressure values.</p>
                            </div>
                          );
                        }

                        // Colors for bars
                        const lwBarColors = ['#3b82f6', '#2563eb', '#1d4ed8', '#1e40af', '#6366f1', '#4f46e5', '#4338ca', '#3730a3'];
                        const lpBarColors = ['#10b981', '#059669', '#047857', '#065f46', '#14b8a6', '#0d9488', '#0f766e', '#115e59'];

                        return (
                          <>
                            {/* Summary Cards */}
                            <div style={{
                              display: 'grid',
                              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                              gap: '1rem',
                              marginBottom: '1.5rem'
                            }}>
                              <div className="detail-card" style={{ padding: '1rem', textAlign: 'center' }}>
                                <div style={{ color: '#94a3b8', fontSize: '0.75rem', marginBottom: '0.25rem' }}>LW(A)</div>
                                <div style={{ color: '#3b82f6', fontSize: '1.5rem', fontWeight: 'bold' }}>
                                  {noiseData.lwA} <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>dB(A)</span>
                                </div>
                              </div>
                              <div className="detail-card" style={{ padding: '1rem', textAlign: 'center' }}>
                                <div style={{ color: '#94a3b8', fontSize: '0.75rem', marginBottom: '0.25rem' }}>LP(A)</div>
                                <div style={{ color: '#10b981', fontSize: '1.5rem', fontWeight: 'bold' }}>
                                  {noiseData.lpA} <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>dB(A)</span>
                                </div>
                              </div>
                              <div className="detail-card" style={{ padding: '1rem', textAlign: 'center' }}>
                                <div style={{ color: '#94a3b8', fontSize: '0.75rem', marginBottom: '0.25rem' }}>Motor Input Power</div>
                                <div style={{ color: '#8b5cf6', fontSize: '1.25rem', fontWeight: 'bold' }}>
                                  {noiseData.motorInputPower} <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>kW</span>
                                </div>
                              </div>
                              <div className="detail-card" style={{ padding: '1rem', textAlign: 'center' }}>
                                <div style={{ color: '#94a3b8', fontSize: '0.75rem', marginBottom: '0.25rem' }}>Directivity (Q)</div>
                                <div style={{ color: '#f59e0b', fontSize: '1.25rem', fontWeight: 'bold' }}>
                                  {noiseData.Q}
                                </div>
                              </div>
                              <div className="detail-card" style={{ padding: '1rem', textAlign: 'center' }}>
                                <div style={{ color: '#94a3b8', fontSize: '0.75rem', marginBottom: '0.25rem' }}>Distance (r)</div>
                                <div style={{ color: '#ec4899', fontSize: '1.25rem', fontWeight: 'bold' }}>
                                  {noiseData.r} <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>m</span>
                                </div>
                              </div>
                              <div className="detail-card" style={{ padding: '1rem', textAlign: 'center' }}>
                                <div style={{ color: '#94a3b8', fontSize: '0.75rem', marginBottom: '0.25rem' }}>Motor Efficiency</div>
                                <div style={{ color: '#06b6d4', fontSize: '1.25rem', fontWeight: 'bold' }}>
                                  {(motorEfficiency * 100).toFixed(1)} <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>%</span>
                                </div>
                              </div>
                            </div>

                            {/* Two Graphs Side by Side */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
                              {/* LW(A) Graph */}
                              <div className="detail-card">
                                <h4>Sound Power Spectrum</h4>
                                <div style={{ width: '100%', height: '350px' }}>
                                  <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={noiseData.lwSpectrum} margin={{ top: 20, right: 30, left: 50, bottom: 50 }}>
                                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                      <XAxis
                                        dataKey="frequency"
                                        stroke="#94a3b8"
                                        tick={{ fill: '#94a3b8', fontSize: 11 }}
                                        label={{ value: 'Frequency ( HZ )', position: 'insideBottom', offset: -10, fill: '#e2e8f0', style: { fontSize: '12px' } }}
                                      />
                                      <YAxis
                                        stroke="#94a3b8"
                                        tick={{ fill: '#94a3b8', fontSize: 11 }}
                                        domain={['auto', 'auto']}
                                        label={{ value: 'LW (dB)', angle: -90, position: 'insideLeft', fill: '#e2e8f0', style: { fontSize: '12px', textAnchor: 'middle' } }}
                                      />
                                      <Tooltip
                                        contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#e2e8f0' }}
                                        formatter={(value) => [`${value} dB`, 'LW']}
                                        labelFormatter={(label) => `Frequency: ${label}`}
                                      />
                                      <Bar dataKey="soundPower" radius={[4, 4, 0, 0]}>
                                        {noiseData.lwSpectrum.map((entry, index) => (
                                          <Cell key={`lw-cell-${index}`} fill={lwBarColors[index % lwBarColors.length]} />
                                        ))}
                                      </Bar>
                                    </BarChart>
                                  </ResponsiveContainer>
                                </div>
                              </div>

                              {/* LP(A) Graph */}
                              <div className="detail-card">
                                <h4>Sound Pressure Spectrum </h4>
                                <div style={{ width: '100%', height: '350px' }}>
                                  <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={noiseData.lpSpectrum} margin={{ top: 20, right: 30, left: 50, bottom: 50 }}>
                                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                      <XAxis
                                        dataKey="frequency"
                                        stroke="#94a3b8"
                                        tick={{ fill: '#94a3b8', fontSize: 11 }}
                                        label={{ value: 'Frequency ( HZ )', position: 'insideBottom', offset: -10, fill: '#e2e8f0', style: { fontSize: '12px' } }}
                                      />
                                      <YAxis
                                        stroke="#94a3b8"
                                        tick={{ fill: '#94a3b8', fontSize: 11 }}
                                        domain={['auto', 'auto']}
                                        label={{ value: 'LP (dB)', angle: -90, position: 'insideLeft', fill: '#e2e8f0', style: { fontSize: '12px', textAnchor: 'middle' } }}
                                      />
                                      <Tooltip
                                        contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#e2e8f0' }}
                                        formatter={(value) => [`${value} dB`, 'LP']}
                                        labelFormatter={(label) => `Frequency: ${label}`}
                                      />
                                      <Bar dataKey="soundPressure" radius={[4, 4, 0, 0]}>
                                        {noiseData.lpSpectrum.map((entry, index) => (
                                          <Cell key={`lp-cell-${index}`} fill={lpBarColors[index % lpBarColors.length]} />
                                        ))}
                                      </Bar>
                                    </BarChart>
                                  </ResponsiveContainer>
                                </div>
                              </div>
                            </div>

                            {/* Combined Data Table */}
                            <div className="detail-card" style={{ marginTop: '1.5rem' }}>
                              <h4>Octave Band Data</h4>
                              <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                                  <thead>
                                    <tr style={{ borderBottom: '2px solid #334155' }}>
                                      <th style={{ padding: '0.75rem', textAlign: 'center', color: '#94a3b8' }}>Frequency</th>
                                      {noiseData.lwSpectrum.map((band, i) => (
                                        <th key={i} style={{ padding: '0.75rem', textAlign: 'center', color: '#e2e8f0' }}>
                                          {band.frequency}
                                        </th>
                                      ))}
                                    </tr>
                                  </thead>
                                  <tbody>
                                    <tr style={{ borderBottom: '1px solid #334155' }}>
                                      <td style={{ padding: '0.75rem', textAlign: 'center', color: '#94a3b8' }}>LW (dB)</td>
                                      {noiseData.lwSpectrum.map((band, i) => (
                                        <td key={i} style={{ padding: '0.75rem', textAlign: 'center', color: '#3b82f6', fontWeight: '600' }}>
                                          {band.soundPower}
                                        </td>
                                      ))}
                                    </tr>
                                    <tr style={{ borderBottom: '1px solid #334155' }}>
                                      <td style={{ padding: '0.75rem', textAlign: 'center', color: '#94a3b8' }}>LP (dB)</td>
                                      {noiseData.lpSpectrum.map((band, i) => (
                                        <td key={i} style={{ padding: '0.75rem', textAlign: 'center', color: '#10b981', fontWeight: '600' }}>
                                          {band.soundPressure}
                                        </td>
                                      ))}
                                    </tr>

                                  </tbody>
                                </table>
                              </div>
                            </div>

                            {/* Formula Reference */}
                            <div className="detail-card" style={{ marginTop: '1.5rem' }}>
                              <h4>Formulas</h4>
                              <div style={{ fontSize: '0.875rem', color: '#94a3b8', lineHeight: '2' }}>
                                <div><strong style={{ color: '#e2e8f0' }}>Motor Input Power</strong> = (Fan Input Power / Motor Efficiency) × (1 + SPF)</div>
                                <div><strong style={{ color: '#e2e8f0' }}>LW(A)</strong> = 62 + 10×log₁₀(Motor Input Power) + 10×log₁₀(Static Pressure)</div>
                                <div><strong style={{ color: '#e2e8f0' }}>LP(A)</strong> = LW(A) − |10×log₁₀(Q / (4×π×r²))|</div>
                                <div style={{ marginTop: '0.5rem', color: '#64748b', fontSize: '0.8rem' }}>
                                  Where: Q = Directivity Factor ({noiseData.Q}), r = Distance ({noiseData.r}m)
                                </div>
                              </div>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        )}

        {/* Back to Search */}
        <div style={{ textAlign: 'center', marginTop: '3rem', marginBottom: '3rem' }}>
          <button
            onClick={() => navigate("/fan-selection")}
            style={{
              background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
              color: 'white',
              border: 'none',
              padding: '0.875rem 2rem',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: '600',
              boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
              transition: 'all 0.3s ease',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(59, 130, 246, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.3)';
            }}
          >
            <span>←</span> Back to Search
          </button>
        </div>
      </div>
    </div>
  );
}
