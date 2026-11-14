import React from "react";

interface AboutMethodologyModalProps {
  isOpen: boolean;
  lang: "en" | "fr";
  onClose: () => void;
}

export const AboutMethodologyModal: React.FC<AboutMethodologyModalProps> = ({
  isOpen,
  lang,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <dialog id="about-modal" className="about-modal-dialog" open aria-modal="true" role="dialog">
      <div className="about-modal-shell">
        <header className="about-modal-header flex-between">
          <div className="brand-lockup">
            <span className="brand-name">
              from<strong>earth</strong>
            </span>
            <em>／</em>
            <span className="brand-year">2050</span>
          </div>
          <button className="compare-close" type="button" onClick={onClose} aria-label="Close">
            ×
          </button>
        </header>

        <div className="about-modal-body">
          <h3>
            {lang === "en"
              ? "About zenvyra · 2050"
              : "À propos de zenvyra · 2050"}
          </h3>
          <p>
            {lang === "en"
              ? "zenvyra · 2050 is an immersive planetary climate experience. It translates complex IPCC CMIP6 projection ensembles into a tactile 3D globe, allowing humanity to witness how their hometowns, ecosystems, and megacities could transform between 2026 and 2050."
              : "zenvyra · 2050 est une expérience climatique planétaire immersive. Elle traduit les ensembles de projections CMIP6 du GIEC en un globe 3D interactif, permettant à chacun d'observer comment sa ville, ses écosystèmes et ses métropoles pourraient évoluer entre 2026 et 2050."}
          </p>

          <h4>{lang === "en" ? "Five Core Risk Layers" : "Cinq calques de risque"}</h4>
          <ul className="about-layers-list">
            <li>
              <strong>R-01 {lang === "en" ? "Extreme Heatwaves" : "Vagues de chaleur"}</strong>:{" "}
              {lang === "en"
                ? "Frequency and intensity of days breaching wet-bulb human tolerance."
                : "Fréquence et intensité des journées dépassant le seuil de tolérance humaine."}
            </li>
            <li>
              <strong>R-02 {lang === "en" ? "Drought & Soil Moisture" : "Sécheresse & Déficit hydrique"}</strong>:{" "}
              {lang === "en"
                ? "Summer agricultural and deep aquifer depletion."
                : "Épuisement des nappes phréatiques et stress hydrique agricole."}
            </li>
            <li>
              <strong>R-03 {lang === "en" ? "Wildfires & Fire Weather" : "Incendies & Risque feux"}</strong>:{" "}
              {lang === "en"
                ? "Fire weather indices across forests, chaparral, and savannahs."
                : "Indices météorologiques de propagation des feux de forêts et savanes."}
            </li>
            <li>
              <strong>R-04 {lang === "en" ? "Flooding & Sea Level Rise" : "Montée des eaux & Inondations"}</strong>:{" "}
              {lang === "en"
                ? "Coastal tidal surges combined with extreme precipitation events."
                : "Surcotes marines associées aux épisodes de précipitations torrentielles."}
            </li>
            <li>
              <strong>R-05 {lang === "en" ? "Population Exposure" : "Population exposée"}</strong>:{" "}
              {lang === "en"
                ? "Demographics inhabiting vulnerable informal housing and unconditioned density."
                : "Démographie résidant en habitat vulnérable et zones minérales denses."}
            </li>
          </ul>

          <div className="about-credit-footer">
            <p>
              Powered by <strong>Zenvyra</strong> Planetary Climate Intelligence.
            </p>
          </div>
        </div>
      </div>
    </dialog>
  );
};

