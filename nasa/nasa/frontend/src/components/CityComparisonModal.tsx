import React, { useState } from "react";
import { ZENVYRA_CITIES, type CityClimateData } from "../data/zenvyraCities";

interface CityComparisonModalProps {
  isOpen: boolean;
  baseCity: CityClimateData;
  lang: "en" | "fr";
  year: number;
  onClose: () => void;
}

export const CityComparisonModal: React.FC<CityComparisonModalProps> = ({
  isOpen,
  baseCity,
  lang,
  year,
  onClose,
}) => {
  const [cityA, setCityA] = useState<CityClimateData>(baseCity);
  const [cityB, setCityB] = useState<CityClimateData>(
    ZENVYRA_CITIES.find((c) => c.id !== baseCity.id) || ZENVYRA_CITIES[1]
  );

  if (!isOpen) return null;

  const handleSwap = () => {
    const temp = cityA;
    setCityA(cityB);
    setCityB(temp);
  };

  return (
    <dialog id="city-comparison" open aria-modal="true" role="dialog">
      <div className="compare-shell">
        <header>
          <div>
            <div className="compare-eyebrow">
              {lang === "en" ? `CLIMATE PROJECTION ${year} · DUEL` : `PROJECTION CLIMATIQUE ${year} · DUEL`}
            </div>
            <h2>{lang === "en" ? "Compare City Trajectories" : "Comparer deux trajectoires"}</h2>
          </div>
          <button className="compare-close" type="button" onClick={onClose} aria-label="Close">
            ×
          </button>
        </header>

        {/* City Selectors */}
        <div className="compare-pickers-row flex-between">
          <div className="compare-city-box">
            <label>{lang === "en" ? "First City" : "Première ville"}</label>
            <select
              value={cityA.id}
              onChange={(e) => {
                const found = ZENVYRA_CITIES.find((c) => c.id === e.target.value);
                if (found) setCityA(found);
              }}
              className="compare-select"
            >
              {ZENVYRA_CITIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}, {c.country}
                </option>
              ))}
            </select>
          </div>

          <button className="compare-swap" type="button" onClick={handleSwap} title="Swap cities">
            ⇄ {lang === "en" ? "Swap" : "Inverser"}
          </button>

          <div className="compare-city-box">
            <label>{lang === "en" ? "Second City" : "Seconde ville"}</label>
            <select
              value={cityB.id}
              onChange={(e) => {
                const found = ZENVYRA_CITIES.find((c) => c.id === e.target.value);
                if (found) setCityB(found);
              }}
              className="compare-select"
            >
              {ZENVYRA_CITIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}, {c.country}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Comparison Table */}
        <div className="compare-table-wrap">
          <table>
            <thead>
              <tr>
                <th>{lang === "en" ? "Metric" : "Indicateur"}</th>
                <th>{cityA.name}</th>
                <th>{cityB.name}</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <strong>{lang === "en" ? "Resilience Score" : "Indice de résilience"}</strong>
                  <small>{lang === "en" ? "Scale 0 (worst) to 100 (best)" : "Échelle 0 (pire) à 100 (meilleur)"}</small>
                </td>
                <td>
                  <strong style={{ color: cityA.statusColor }}>{cityA.score2050}/100</strong>
                  <span className="compare-change">2026: {cityA.score2026}/100</span>
                </td>
                <td>
                  <strong style={{ color: cityB.statusColor }}>{cityB.score2050}/100</strong>
                  <span className="compare-change">2026: {cityB.score2026}/100</span>
                </td>
              </tr>

              <tr>
                <td>
                  <strong>{lang === "en" ? "2050 Heat Anomaly" : "Anomalie thermique 2050"}</strong>
                  <small>{lang === "en" ? "Above pre-industrial mean" : "Par rapport à l'ère préindustrielle"}</small>
                </td>
                <td>
                  <strong>+{cityA.tempAnomaly2050}°C</strong>
                </td>
                <td>
                  <strong>+{cityB.tempAnomaly2050}°C</strong>
                </td>
              </tr>

              <tr>
                <td>
                  <strong>{lang === "en" ? "Annual Heatwave Days" : "Jours de canicule par an"}</strong>
                  <small>{lang === "en" ? "Extreme thermal threshold" : "Seuil thermique extrême"}</small>
                </td>
                <td>
                  <strong>+{cityA.heatwaveDays2050} j/an</strong>
                </td>
                <td>
                  <strong>+{cityB.heatwaveDays2050} j/an</strong>
                </td>
              </tr>

              <tr>
                <td>
                  <strong>{lang === "en" ? "Drought & Water Stress" : "Déficit hydrique & sécheresse"}</strong>
                  <small>{lang === "en" ? "Summer soil moisture drop" : "Baisse d'humidité estivale"}</small>
                </td>
                <td>
                  <span>{cityA.droughtDeficit2050}</span>
                </td>
                <td>
                  <span>{cityB.droughtDeficit2050}</span>
                </td>
              </tr>

              <tr>
                <td>
                  <strong>{lang === "en" ? "Wildfire / Vegetation" : "Risque incendie & végétation"}</strong>
                </td>
                <td>
                  <span>{cityA.wildfireRisk2050[lang]}</span>
                </td>
                <td>
                  <span>{cityB.wildfireRisk2050[lang]}</span>
                </td>
              </tr>

              <tr>
                <td>
                  <strong>{lang === "en" ? "Coastal & Flood Hazard" : "Risque inondation & submersion"}</strong>
                </td>
                <td>
                  <span>{cityA.floodRisk2050[lang]}</span>
                </td>
                <td>
                  <span>{cityB.floodRisk2050[lang]}</span>
                </td>
              </tr>

              <tr>
                <td>
                  <strong>{lang === "en" ? "Overall Verdict" : "Verdict global"}</strong>
                </td>
                <td>
                  <p className="compare-verdict-text">{cityA.verdict[lang]}</p>
                </td>
                <td>
                  <p className="compare-verdict-text">{cityB.verdict[lang]}</p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </dialog>
  );
};
