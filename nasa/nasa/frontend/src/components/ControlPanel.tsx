import React from "react";
import type { EarthVariable, SphereType } from "../types";
import { Sliders, Calendar, Sparkles, Layers } from "lucide-react";

interface ControlPanelProps {
  variables: EarthVariable[];
  selectedVarId: string;
  onSelectVarId: (id: string) => void;
  startDate: string;
  endDate: string;
  onStartDateChange: (d: string) => void;
  onEndDateChange: (d: string) => void;
  deseasonalized: boolean;
  onDeseasonalizedChange: (v: boolean) => void;
  onAnalyze: () => void;
  isLoading: boolean;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  variables,
  selectedVarId,
  onSelectVarId,
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  deseasonalized,
  onDeseasonalizedChange,
  onAnalyze,
  isLoading,
}) => {
  const currentVar = variables.find((v) => v.id === selectedVarId) || variables[0];

  const getSphereBadgeClass = (sphere?: SphereType) => {
    switch (sphere) {
      case "air":
        return "badge-air";
      case "water":
        return "badge-water";
      case "land":
        return "badge-land";
      default:
        return "badge-default";
    }
  };

  return (
    <div className="card-box">
      <div className="section-header">
        <div className="flex-align">
          <Sliders className="icon-blue" size={20} />
          <h2 className="section-title">2. Target Variable & Timeline</h2>
        </div>
      </div>

      {/* Variable Selection */}
      <div className="form-group">
        <label htmlFor="var-select" className="form-label flex-between">
          <span>Earth Science Variable</span>
          {currentVar && (
            <span className={`sphere-pill ${getSphereBadgeClass(currentVar.sphere)}`}>
              Sphere: {currentVar.sphere.toUpperCase()}
            </span>
          )}
        </label>
        <select
          id="var-select"
          className="form-select"
          value={selectedVarId}
          onChange={(e) => onSelectVarId(e.target.value)}
        >
          {variables.map((v) => (
            <option key={v.id} value={v.id}>
              {v.name} ({v.units}) — {v.source.split(" ")[0]}
            </option>
          ))}
        </select>
      </div>

      {/* Variable Definition Card (High-School Level) */}
      {currentVar && (
        <div className="var-info-card">
          <div className="var-header">
            <strong>{currentVar.short_name}</strong>
            <span className="unit-tag">Units: {currentVar.units}</span>
          </div>
          <p className="var-def">{currentVar.plain_definition}</p>
          <div className="var-why">
            <span className="why-tag">Why it matters:</span> {currentVar.why_it_matters}
          </div>
          <div className="var-meta-row">
            <span>📡 Sensor: {currentVar.source}</span>
            <span>⏱️ Cadence: {currentVar.temporal_range}</span>
          </div>
        </div>
      )}

      {/* Date Range Selection */}
      <div className="date-grid">
        <div className="form-group">
          <label htmlFor="start-date" className="form-label flex-align">
            <Calendar size={14} />
            <span>Start Month</span>
          </label>
          <input
            id="start-date"
            type="month"
            className="form-input"
            min="1980-01"
            max="2025-12"
            value={startDate}
            onChange={(e) => onStartDateChange(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label htmlFor="end-date" className="form-label flex-align">
            <Calendar size={14} />
            <span>End Month</span>
          </label>
          <input
            id="end-date"
            type="month"
            className="form-input"
            min="1980-01"
            max="2025-12"
            value={endDate}
            onChange={(e) => onEndDateChange(e.target.value)}
          />
        </div>
      </div>

      {/* Deseasonalization Toggle */}
      <div className="toggle-box">
        <div className="toggle-left">
          <div className="flex-align">
            <Layers size={16} className="icon-purple" />
            <span className="toggle-label">Remove Seasonal Cycle (Deseasonalize)</span>
          </div>
          <p className="toggle-subtext">
            Subtracts the average January from every January (and so on) so annual summer-to-winter swings do not obscure multi-year climate trends.
          </p>
        </div>
        <label className="switch">
          <input
            type="checkbox"
            checked={deseasonalized}
            onChange={(e) => onDeseasonalizedChange(e.target.checked)}
          />
          <span className="slider round"></span>
        </label>
      </div>

      {/* Main Action Button */}
      <button
        type="button"
        className="analyze-btn"
        onClick={onAnalyze}
        disabled={isLoading}
      >
        {isLoading ? (
          <span className="flex-center">
            <span className="spinner"></span>
            Analyzing NASA Observations...
          </span>
        ) : (
          <span className="flex-center">
            <Sparkles size={18} />
            <span>Detect Climate Trends</span>
          </span>
        )}
      </button>
    </div>
  );
};
