import React from "react";
import type { CityClimateData } from "../data/zenvyraCities";

interface DiagnosticDrawerProps {
  city: CityClimateData | null;
  year: number;
  lang: "en" | "fr";
  onClose: () => void;
  onOpenCompare: () => void;
  onOpenShare: () => void;
}

export const DiagnosticDrawer: React.FC<DiagnosticDrawerProps> = ({
  city,
  year,
  lang,
  onClose,
  onOpenCompare,
  onOpenShare,
}) => {
  if (!city) return null;

  // Interpolate score and temperature anomaly based on current year
  const yearRatio = (year - 2026) / (2050 - 2026);
  const currentScore = Math.round(city.score2026 + (city.score2050 - city.score2026) * yearRatio);
  const currentTempAnomaly = (city.tempAnomaly2026 + (city.tempAnomaly2050 - city.tempAnomaly2026) * yearRatio).toFixed(1);
  const currentHeatDays = Math.round(city.heatwaveDays2026 + (city.heatwaveDays2050 - city.heatwaveDays2026) * yearRatio);

  return (
    <aside id="dossier" className="dossier-open" role="region" aria-label="City Climate Diagnostic">
      {/* 1. Header */}
      <header className="fiche-entete">
        <div>
          <p id="dossier-scope">{city.scope[lang]}</p>
          <h2 id="dossier-nom">
            {city.name}, <span className="dossier-country">{city.country}</span>
          </h2>
        </div>
        <button id="dossier-croix" type="button" onClick={onClose} aria-label="Close">
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
            <path d="M6 6 L18 18 M18 6 L6 18" stroke="currentColor" strokeWidth="1.8" />
          </svg>
        </button>
      </header>

      {/* 2. Timeline Context */}
      <div id="dossier-temps">
        <span className="fiche-temps-label">
          {lang === "en" ? `PROJECTION ${year} · IN ${year - 2026} YEARS` : `PROJECTION ${year} · D'ICI ${year - 2026} ANS`}
        </span>
      </div>

      <div className="fiche-corps">
        {/* 3. Climate Verdict & Resilience Score */}
        <section className="fiche-bilan">
          <div id="dossier-verdict" className="verdict">
            <span className="point" style={{ background: city.statusColor }} />
            <h3 id="dossier-verdict-txt">{city.verdict[lang]}</h3>
          </div>

          <p id="dossier-conseil" className="conseil">
            {city.advisory[lang]}
          </p>

          <div className="fiche-indice">
            <div className="score">
              <span id="dossier-score" className="valeur" style={{ color: city.statusColor }}>
                {currentScore}
              </span>
              <span className="score-sur">/100</span>
            </div>
            <div>
              <p className="indice-titre">
                {lang === "en" ? "CLIMATE RESILIENCE INDEX" : "INDICE D'HABITABILITÉ"}
              </p>
              <p className="fiche-secondaire">
                {lang === "en" ? "SSP3-7.0 high-emission trajectory" : "Trajectoire d'émissions élevées SSP3-7.0"}
              </p>
            </div>
          </div>

          <p className="score-method-note">
            {lang === "en"
              ? "Downscaled CMIP6 multi-model climate ensemble with urban heat island coupling."
              : "Ensemble multi-modèles CMIP6 avec couplage d'îlot de chaleur urbain."}
          </p>

          {/* City Duel / Comparison Button */}
          <button id="dossier-duel" className="duel" type="button" onClick={onOpenCompare}>
            <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true" style={{ marginRight: 8 }}>
              <path d="M3 10h14M12 5l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="1.8" />
            </svg>
            <span>{lang === "en" ? "Compare with another city" : "Comparer avec une autre ville"}</span>
          </button>
        </section>

        {/* 4. Risk Breakdown Table */}
        <section className="fiche-risques">
          <div className="fiche-section-titre flex-between">
            <h3>{lang === "en" ? "KEY CLIMATE RISKS" : "INDICATEURS DE RISQUE"}</h3>
            <span id="dossier-annee">{year}</span>
          </div>

          <div className="risk-metrics-grid">
            <div className="risk-metric-card">
              <div className="risk-metric-header">
                <span className="risk-metric-icon">🔥</span>
                <span className="risk-metric-label">{city.breakdown.heatLabel[lang]}</span>
              </div>
              <strong className="risk-metric-val">+{currentHeatDays} {lang === "en" ? "days/yr" : "j/an"}</strong>
              <small className="risk-metric-sub">
                {lang === "en" ? `Projected anomaly: +${currentTempAnomaly}°C` : `Anomalie projetée : +${currentTempAnomaly}°C`}
              </small>
            </div>

            <div className="risk-metric-card">
              <div className="risk-metric-header">
                <span className="risk-metric-icon">💧</span>
                <span className="risk-metric-label">{city.breakdown.droughtLabel[lang]}</span>
              </div>
              <strong className="risk-metric-val">{city.breakdown.droughtVal}</strong>
              <small className="risk-metric-sub">{city.droughtDeficit2050}</small>
            </div>

            <div className="risk-metric-card">
              <div className="risk-metric-header">
                <span className="risk-metric-icon">🌲</span>
                <span className="risk-metric-label">{city.breakdown.fireLabel[lang]}</span>
              </div>
              <strong className="risk-metric-val">{city.wildfireRisk2050[lang]}</strong>
              <small className="risk-metric-sub">{city.breakdown.fireVal}</small>
            </div>

            <div className="risk-metric-card">
              <div className="risk-metric-header">
                <span className="risk-metric-icon">🌊</span>
                <span className="risk-metric-label">{city.breakdown.floodLabel[lang]}</span>
              </div>
              <strong className="risk-metric-val">{city.floodRisk2050[lang]}</strong>
              <small className="risk-metric-sub">{city.breakdown.floodVal}</small>
            </div>

            <div className="risk-metric-card">
              <div className="risk-metric-header">
                <span className="risk-metric-icon">👥</span>
                <span className="risk-metric-label">{city.breakdown.popLabel[lang]}</span>
              </div>
              <strong className="risk-metric-val">{city.breakdown.popVal}</strong>
              <small className="risk-metric-sub">
                {lang === "en" ? `Total population: ${city.population}` : `Population totale : ${city.population}`}
              </small>
            </div>
          </div>
        </section>

        {/* 5. Share View Action */}
        <div className="dossier-share-footer">
          <button type="button" className="share-story-btn" onClick={onOpenShare}>
            <span>{lang === "en" ? "Generate Story Snapshot" : "Créer une story à partager"}</span>
          </button>
        </div>
      </div>
    </aside>
  );
};
