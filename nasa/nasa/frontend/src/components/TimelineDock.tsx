import React from "react";
import type { RiskLayerType } from "./InteractiveGlobe3D";

interface TimelineDockProps {
  year: number;
  setYear: (y: number) => void;
  activeLayer: RiskLayerType;
  setActiveLayer: (layer: RiskLayerType) => void;
  layerVisible: boolean;
  setLayerVisible: (vis: boolean) => void;
  lang: "en" | "fr";
}

export const TimelineDock: React.FC<TimelineDockProps> = ({
  year,
  setYear,
  activeLayer,
  setActiveLayer,
  layerVisible,
  setLayerVisible,
  lang,
}) => {
  const distanceText =
    lang === "en"
      ? year === 2026
        ? "current baseline"
        : `in ${year - 2026} years`
      : year === 2026
      ? "référence actuelle"
      : `d'ici ${year - 2026} ans`;

  const layers: { key: RiskLayerType; code: string; nameEn: string; nameFr: string; color: string }[] = [
    { key: "chaleur", code: "R-01", nameEn: "Heatwaves", nameFr: "Vagues de chaleur", color: "#ff5230" },
    { key: "secheresse", code: "R-02", nameEn: "Drought", nameFr: "Sécheresse", color: "#eab308" },
    { key: "feux", code: "R-03", nameEn: "Wildfires", nameFr: "Incendies", color: "#ef4444" },
    { key: "inondations", code: "R-04", nameEn: "Flooding", nameFr: "Inondations", color: "#06b6d4" },
    { key: "pop", code: "R-05", nameEn: "Population", nameFr: "Population", color: "#a855f7" },
  ];

  return (
    <div id="globe-dock">
      {/* 1. Year Projection Timeline */}
      <div id="timeline" className="panneau">
        <div className="micro" data-t="panelYear">
          {lang === "en" ? "PROJECTED YEAR" : "ANNÉE DE PROJECTION"}
        </div>
        <div id="an" className="an">
          {year}
        </div>
        <div id="an-distance" className="an-distance">
          {distanceText}
        </div>

        <div className="regle" aria-hidden="true">
          <span className="tick tick-2026">2026</span>
          <span className="tick tick-2030">2030</span>
          <span className="tick tick-2035">2035</span>
          <span className="tick tick-2040">2040</span>
          <span className="tick tick-2045">2045</span>
          <span className="tick tick-2050">2050</span>
        </div>

        <input
          id="curseur"
          type="range"
          min="2026"
          max="2050"
          step="1"
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          aria-label={lang === "en" ? "Projected year slider" : "Curseur d'année de projection"}
        />
      </div>

      {/* 2. Risk Layers Selector */}
      <div id="calques" className="panneau">
        <div className="calques-header flex-between">
          <div className="micro">{lang === "en" ? "CLIMATE RISK LAYERS" : "CALQUES DE RISQUES"}</div>
          <button
            id="layer-visibility"
            type="button"
            className={!layerVisible ? "layer-hidden" : ""}
            onClick={() => setLayerVisible(!layerVisible)}
            title={lang === "en" ? "Toggle layer visibility" : "Afficher/masquer le calque"}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              />
              <circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" strokeWidth="1.8" />
              {!layerVisible && <line x1="2" y1="2" x2="22" y2="22" stroke="currentColor" strokeWidth="2" />}
            </svg>
          </button>
        </div>

        <div className="calques-list">
          {layers.map((l) => {
            const isActive = activeLayer === l.key;
            return (
              <button
                key={l.key}
                type="button"
                className={`calque ${isActive ? "actif" : ""}`}
                data-cle={l.key}
                onClick={() => {
                  setActiveLayer(l.key);
                  if (!layerVisible) setLayerVisible(true);
                }}
              >
                <span className="pastille" style={{ background: isActive ? l.color : "transparent" }} />
                <span className="nom">{lang === "en" ? l.nameEn : l.nameFr}</span>
                <span className="code">{l.code}</span>
              </button>
            );
          })}
        </div>

        {/* Legend Scale */}
        <div id="visible-legend">
          <div className="ux-legend-mode">
            {lang === "en" ? "Thermal Anomaly Scale (°C above pre-industrial)" : "Échelle d'anomalie thermique (°C)"}
          </div>
          <div className="legend-gradient-bar" />
          <div className="legend-labels flex-between">
            <span>+0.5°C</span>
            <span>+2.0°C</span>
            <span>+3.5°C</span>
            <span>+6.0°C</span>
          </div>
        </div>
      </div>
    </div>
  );
};
