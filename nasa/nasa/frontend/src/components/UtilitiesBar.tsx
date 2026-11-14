import React, { useState } from "react";
import { soundscape } from "../services/AudioEngine";

interface UtilitiesBarProps {
  lang: "en" | "fr";
  setLang: (l: "en" | "fr") => void;
  onRestart: () => void;
  onOpenAbout: () => void;
}

export const UtilitiesBar: React.FC<UtilitiesBarProps> = ({
  lang,
  setLang,
  onRestart,
  onOpenAbout,
}) => {
  const [isSoundOn, setIsSoundOn] = useState(false);

  const toggleSound = () => {
    const active = soundscape.toggle();
    setIsSoundOn(active);
  };

  return (
    <div id="util" className="panneau">
      <div className="menu-groupe">
        {/* Ambient Generative Sound Toggle */}
        <button
          id="bouton-son"
          type="button"
          className={`bouton-ico fa-lien ${isSoundOn ? "son-actif" : ""}`}
          onClick={toggleSound}
          title={lang === "en" ? "Toggle space audio drone" : "Activer/désactiver l'ambiance sonore"}
        >
          {lang === "en" ? `Sound · ${isSoundOn ? "on" : "off"}` : `Son · ${isSoundOn ? "on" : "off"}`}
        </button>

        {/* Language Switcher */}
        <button
          id="bouton-langue"
          type="button"
          className="bouton-ico fa-lien"
          onClick={() => setLang(lang === "en" ? "fr" : "en")}
          title={lang === "en" ? "Switch to French" : "Passer en anglais"}
        >
          {lang === "en" ? "FR" : "EN"}
        </button>

        {/* Restart / Letter from Earth */}
        <button
          id="bouton-recommencer"
          type="button"
          className="bouton-ico"
          onClick={onRestart}
          title={lang === "en" ? "Replay Letter from Earth" : "Rejouer la lettre de la Terre"}
        >
          {lang === "en" ? "Restart" : "Recommencer"}
        </button>

        {/* Info / About Cog */}
        <button
          id="bouton-reglages"
          type="button"
          className="bouton-ico"
          onClick={onOpenAbout}
          title={lang === "en" ? "About & Climate Methodology" : "À propos & Méthodologie"}
          aria-label="Settings & Info"
        >
          <svg className="rouage" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
            <path
              d="M19.14 12.94a7.07 7.07 0 0 0 0-1.88l2.03-1.58a.5.5 0 0 0 .12-.61l-1.92-3.32a.5.5 0 0 0-.59-.22l-2.39.96a7.03 7.03 0 0 0-1.62-.94l-.36-2.54a.49.49 0 0 0-.48-.41h-3.84a.48.48 0 0 0-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96a.5.5 0 0 0-.59.22L2.74 8.87a.49.49 0 0 0 .12.61l2.03 1.58a7.07 7.07 0 0 0 0 1.88l-2.03 1.58a.5.5 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.04.24.24.41.47.41h3.84c.24 0 .44-.17.48-.41l.36-2.54c.59-.24 1.12-.56 1.62-.94l2.39.96c.22.07.47 0 .59-.22l1.92-3.32a.5.5 0 0 0-.12-.61l-2.03-1.58ZM12 15.6a3.6 3.6 0 1 1 0-7.2 3.6 3.6 0 0 1 0 7.2Z"
              fill="currentColor"
              fillRule="evenodd"
            />
          </svg>
        </button>
      </div>
    </div>
  );
};

