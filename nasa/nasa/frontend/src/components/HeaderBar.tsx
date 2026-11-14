import React from "react";

interface HeaderBarProps {
  lang: "en" | "fr";
}

export const HeaderBar: React.FC<HeaderBarProps> = ({ lang }) => {
  return (
    <header id="titre" className="panneau">
      <h1 id="wordmark" aria-label="zenvyra">
        <span className="brand-lockup">
          <span className="brand-name">zenvyra</span>
        </span>
      </h1>
      <div className="micro" data-t="sousHeader">
        {lang === "en"
          ? "EXPLORE CLIMATE PROJECTIONS"
          : "EXPLORER LES PROJECTIONS CLIMATIQUES"}
      </div>
    </header>
  );
};

