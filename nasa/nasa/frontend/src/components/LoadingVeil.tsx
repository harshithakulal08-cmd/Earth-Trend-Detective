import React, { useEffect, useState } from "react";

interface LoadingVeilProps {
  isVisible: boolean;
  lang: "en" | "fr";
  onEnter: () => void;
}

export const LoadingVeil: React.FC<LoadingVeilProps> = ({
  isVisible,
  lang,
  onEnter,
}) => {
  const [progress, setProgress] = useState(0);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!isVisible) return;

    let current = 0;
    const interval = setInterval(() => {
      current += Math.floor(Math.random() * 8) + 4;
      if (current >= 100) {
        current = 100;
        clearInterval(interval);
        setIsReady(true);
      }
      setProgress(current);
    }, 45);

    return () => clearInterval(interval);
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div id="voile">
      <div className="v-grain" aria-hidden="true" />
      <div className="v-centre">
        <div className="v-eyebrow">
          <span>{lang === "en" ? "A DATA-DRIVEN PORTRAIT" : "UN PORTRAIT DE DONNÉES"}</span>
        </div>

        <div id="v-wordmark" aria-hidden="true">
          <span className="v-masque">
            <span className="lettre brand-lockup">
              <span className="brand-name">
                from<strong>earth</strong>
              </span>
              <em>／</em>
              <span className="brand-year">2050</span>
            </span>
          </span>
        </div>

        <div className="v-eyebrow v-eyebrow-bas">
          <span>{lang === "en" ? "OF OUR HOME IN 2050" : "DE NOTRE PLANÈTE EN 2050"}</span>
        </div>

        <div className="v-charge">
          <span id="jauge" className="v-mono">
            {progress}%
          </span>
          <span className="v-barre">
            <i id="v-barre-fill" style={{ width: `${progress}%` }} />
          </span>
          <svg className="v-etoile" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 0 L13.6 10.4 L24 12 L13.6 13.6 L12 24 L10.4 13.6 L0 12 L10.4 10.4 Z" />
          </svg>
        </div>

        {isReady && (
          <button id="bouton-entree" className="entree" type="button" onClick={onEnter}>
            <span>{lang === "en" ? "INITIALIZE" : "INITIALISER"}</span>
          </button>
        )}
      </div>
    </div>
  );
};

