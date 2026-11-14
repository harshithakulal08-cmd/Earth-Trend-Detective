import React, { useState } from "react";
import type { EarthVariable, SphereType } from "../types";
import { REGION_PRESETS } from "../presets";
import { Sparkles, X, ArrowRight, CheckCircle2, Wind, Droplets, Mountain } from "lucide-react";

interface WizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  variables: EarthVariable[];
  onApplyRecommendation: (config: {
    variableId: string;
    bbox: [number, number, number, number];
    startDate: string;
    endDate: string;
    presetId: string;
  }) => void;
}

export const WizardModal: React.FC<WizardModalProps> = ({
  isOpen,
  onClose,
  variables,
  onApplyRecommendation,
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedSphere, setSelectedSphere] = useState<SphereType>("air");
  const [selectedRegionId, setSelectedRegionId] = useState<string>("arctic");
  const [timeframe, setTimeframe] = useState<"full" | "decade">("full");

  if (!isOpen) return null;

  // Filter presets matching sphere or general
  const filteredPresets = REGION_PRESETS;

  // Generate recommended variable based on user choices
  const getRecommendation = () => {
    const region = REGION_PRESETS.find((r) => r.id === selectedRegionId) || REGION_PRESETS[0];
    let recommendedVarId = region.recommended_var;

    if (selectedSphere === "air") {
      recommendedVarId = region.id === "indo_gangetic" ? "modis_aod" : "merra2_t2m";
    } else if (selectedSphere === "water") {
      recommendedVarId = "gpm_precip";
    } else if (selectedSphere === "land") {
      recommendedVarId = region.id === "amazon" ? "smap_soil_moisture" : "modis_ndvi";
    }

    const start_date = timeframe === "full" ? "2000-01" : "2014-01";
    const end_date = "2023-12";

    return {
      variableId: recommendedVarId,
      bbox: region.bbox,
      startDate: start_date,
      endDate: end_date,
      presetId: region.id,
      regionName: region.name,
    };
  };

  const rec = getRecommendation();
  const recVar = variables.find((v) => v.id === rec.variableId) || variables[0];

  const handleFinish = () => {
    onApplyRecommendation({
      variableId: rec.variableId,
      bbox: rec.bbox,
      startDate: rec.startDate,
      endDate: rec.endDate,
      presetId: rec.presetId,
    });
    onClose();
  };

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal-card">
        <div className="modal-header flex-between">
          <div className="flex-align">
            <Sparkles className="icon-purple" size={22} />
            <h3 className="modal-title">NASA Detective Guided Investigation Wizard</h3>
          </div>
          <button type="button" className="close-btn" onClick={onClose} aria-label="Close wizard">
            <X size={18} />
          </button>
        </div>

        {/* Wizard Stepper Progress */}
        <div className="wizard-stepper">
          <div className={`step-item ${step >= 1 ? "step-active" : ""}`}>1. Earth Sphere</div>
          <div className="step-line" />
          <div className={`step-item ${step >= 2 ? "step-active" : ""}`}>2. Location</div>
          <div className="step-line" />
          <div className={`step-item ${step >= 3 ? "step-active" : ""}`}>3. Timeline & Recommendation</div>
        </div>

        {/* Step 1: Sphere Choice */}
        {step === 1 && (
          <div className="wizard-body">
            <h4 className="wizard-question">Question 1: Which Earth System sphere do you want to investigate?</h4>
            <div className="wizard-options-grid">
              <button
                type="button"
                className={`wizard-option-card ${selectedSphere === "air" ? "option-selected" : ""}`}
                onClick={() => setSelectedSphere("air")}
              >
                <Wind size={28} className="icon-blue" />
                <div className="option-title">Atmosphere & Air</div>
                <div className="option-desc">Surface temperatures, air masses, heatwaves, and smoke/dust aerosol optical depth.</div>
              </button>

              <button
                type="button"
                className={`wizard-option-card ${selectedSphere === "water" ? "option-selected" : ""}`}
                onClick={() => setSelectedSphere("water")}
              >
                <Droplets size={28} className="icon-blue" />
                <div className="option-title">Hydrosphere & Water</div>
                <div className="option-desc">Monthly precipitation, monsoons, storm belts, and flood/drought shifts.</div>
              </button>

              <button
                type="button"
                className={`wizard-option-card ${selectedSphere === "land" ? "option-selected" : ""}`}
                onClick={() => setSelectedSphere("land")}
              >
                <Mountain size={28} className="icon-blue" />
                <div className="option-title">Biosphere & Land</div>
                <div className="option-desc">Root-zone soil moisture, rainforest health, and vegetation greenness (NDVI).</div>
              </button>
            </div>

            <div className="wizard-footer">
              <div />
              <button type="button" className="primary-btn flex-align" onClick={() => setStep(2)}>
                <span>Next Question</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Location Choice */}
        {step === 2 && (
          <div className="wizard-body">
            <h4 className="wizard-question">Question 2: Which geographic climate hotspot would you like to explore?</h4>
            <div className="wizard-options-grid">
              {filteredPresets.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  className={`wizard-option-card ${selectedRegionId === preset.id ? "option-selected" : ""}`}
                  onClick={() => setSelectedRegionId(preset.id)}
                >
                  <div className="option-title">{preset.name}</div>
                  <div className="option-desc">{preset.description}</div>
                </button>
              ))}
            </div>

            <div className="wizard-footer flex-between">
              <button type="button" className="secondary-btn" onClick={() => setStep(1)}>
                Back
              </button>
              <button type="button" className="primary-btn flex-align" onClick={() => setStep(3)}>
                <span>Next Question</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Timeframe & Final Recommendation */}
        {step === 3 && (
          <div className="wizard-body">
            <h4 className="wizard-question">Question 3: What time horizon do you want to inspect?</h4>
            <div className="wizard-options-grid-2">
              <button
                type="button"
                className={`wizard-option-card ${timeframe === "full" ? "option-selected" : ""}`}
                onClick={() => setTimeframe("full")}
              >
                <div className="option-title">Full Modern Satellite Era (2000 - 2023)</div>
                <div className="option-desc">24 full years (288 monthly observations). Best for testing decadal climate significance.</div>
              </button>

              <button
                type="button"
                className={`wizard-option-card ${timeframe === "decade" ? "option-selected" : ""}`}
                onClick={() => setTimeframe("decade")}
              >
                <div className="option-title">Recent Decade (2014 - 2023)</div>
                <div className="option-desc">10 recent years (120 monthly observations). Focuses on recent climate accelerations.</div>
              </button>
            </div>

            {/* Generated Detective Recommendation */}
            <div className="recommendation-box">
              <div className="rec-header flex-align">
                <CheckCircle2 size={20} className="icon-success" />
                <strong>Recommended Investigation:</strong>
              </div>
              <div className="rec-details">
                <div><strong>Variable:</strong> {recVar?.name || "Surface Temperature"} ({recVar?.units})</div>
                <div><strong>Region:</strong> {rec.regionName}</div>
                <div><strong>Time Span:</strong> {rec.startDate} to {rec.endDate}</div>
                <div className="rec-reason">
                  <em>Why this setup:</em> {recVar?.why_it_matters}
                </div>
              </div>
            </div>

            <div className="wizard-footer flex-between">
              <button type="button" className="secondary-btn" onClick={() => setStep(2)}>
                Back
              </button>
              <button type="button" className="primary-btn flex-align" onClick={handleFinish}>
                <Sparkles size={16} />
                <span>Launch This Investigation</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
