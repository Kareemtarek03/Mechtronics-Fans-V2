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

export default function ResultsPage() {
  const navigate = useNavigate();
  const { results: contextResults, units } = useFormData();
  const [selectedFanIndex, setSelectedFanIndex] = useState(null);
  const [currentGraphIndex, setCurrentGraphIndex] = useState(0);
  const [activeTab, setActiveTab] = useState('performance'); // 'performance' or 'curve'
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
            Selected Fans Comparison
          </h1>
        </div>

        {/* Results Table */}
        <div className="results-table-container">
          <table className="results-table">
            <thead>
              <tr>
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
            <h2>
              Details for {fans[selectedFanIndex]?.FanModel || `Fan ${selectedFanIndex + 1}`}
            </h2>
            
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
                ? `${item.Blades.symbol || ""}${
                    item.Blades.material ? ` (${item.Blades.material})` : ""
                  } - ${item.Blades.noBlades || ""} blades @ ${
                    item.Blades.angle || ""
                  }°`
                : null;
              const imp = item.Impeller
                ? `${item.Impeller.conf || ""} (inner ${
                    item.Impeller.innerDia || ""
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
                          <h4>{graphTypes[currentGraphIndex].name}</h4>
                          <div style={{ width: '100%', height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <ResponsiveContainer width="100%" height="100%">
                              {(() => {
                                const currentGraph = graphTypes[currentGraphIndex];
                                const airflowData = item[currentGraph.airflowKey] || [];
                                const yData = item[currentGraph.dataKey] || [];
                                
                                // Filter out null/undefined values and sort by airflow
                                const validIndices = [];
                                for (let i = 0; i < airflowData.length; i++) {
                                  if (airflowData[i] != null && yData[i] != null && 
                                      !isNaN(airflowData[i]) && !isNaN(yData[i])) {
                                    validIndices.push(i);
                                  }
                                }
                                
                                // Sort indices by airflow value
                                validIndices.sort((a, b) => airflowData[a] - airflowData[b]);
                                
                                // Create sorted arrays
                                const xArray = validIndices.map(i => Number(airflowData[i]));
                                const yArray = validIndices.map(i => Number(yData[i]) * (currentGraph.multiplier || 1));
                                
                                // Apply piecewise cubic interpolation (same as backend)
                                const interpolatedData = xArray.length >= 2 
                                  ? cubicSplineInterpolation(xArray, yArray, 100)
                                  : xArray.map((x, i) => ({ x, y: yArray[i] }));
                                
                                return (
                                  <LineChart data={interpolatedData} margin={{ top: 20, right: 40, left: 60, bottom: 50 }}>
                                    <XAxis 
                                      dataKey="x" 
                                      stroke="#94a3b8"
                                      tick={{ fill: '#94a3b8' }}
                                      label={{ 
                                        value: `Airflow (${units?.airFlow || 'CFM'})`, 
                                        position: "insideBottom", 
                                        offset: -10, 
                                        fill: "#e2e8f0",
                                        style: { fontSize: '14px', fontWeight: '500' }
                                      }} 
                                    />
                                    <YAxis 
                                      stroke="#94a3b8"
                                      tick={{ fill: '#94a3b8' }}
                                      label={{ 
                                        value: `${currentGraph.name} (${currentGraph.unit})`, 
                                        angle: -90, 
                                        position: "insideLeft",
                                        offset: 0,
                                        fill: "#e2e8f0",
                                        style: { fontSize: '14px', fontWeight: '500', textAnchor: 'middle' }
                                      }} 
                                    />
                                    <Tooltip 
                                      contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "8px", color: "#e2e8f0" }}
                                      formatter={(value) => [value.toFixed(2), currentGraph.name]}
                                      labelFormatter={(label) => `Airflow: ${label.toFixed(2)}`}
                                    />
                                    <Line 
                                      type="monotone" 
                                      dataKey="y" 
                                      stroke={currentGraph.color} 
                                      strokeWidth={3} 
                                      dot={{ fill: currentGraph.color, r: 3 }}
                                      activeDot={{ r: 6, fill: currentGraph.color }}
                                      isAnimationActive={true} 
                                    />
                                  </LineChart>
                                );
                              })()}
                            </ResponsiveContainer>
                          </div>
                          {/* Arrow Navigation Buttons */}
                          <div style={{ position: 'absolute', bottom: '0.5rem', right: '1.5rem', display: 'flex', gap: '0.5rem' }}>
                            <button 
                              onClick={handlePrevGraph}
                              style={{ 
                                background: '#3b82f6', 
                                color: 'white', 
                                border: 'none', 
                                borderRadius: '50%', 
                                width: '40px', 
                                height: '40px', 
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '1.25rem',
                                transition: 'background 0.2s'
                              }}
                              onMouseEnter={(e) => e.target.style.background = '#2563eb'}
                              onMouseLeave={(e) => e.target.style.background = '#3b82f6'}
                            >
                              ←
                            </button>
                            <button 
                              onClick={handleNextGraph}
                              style={{ 
                                background: '#3b82f6', 
                                color: 'white', 
                                border: 'none', 
                                borderRadius: '50%', 
                                width: '40px', 
                                height: '40px', 
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '1.25rem',
                                transition: 'background 0.2s'
                              }}
                              onMouseEnter={(e) => e.target.style.background = '#2563eb'}
                              onMouseLeave={(e) => e.target.style.background = '#3b82f6'}
                            >
                              →
                            </button>
                          </div>
                        </div>
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
