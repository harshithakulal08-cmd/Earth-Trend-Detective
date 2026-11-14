import React from "react";
import { Sparkles, PlayCircle, Globe } from "lucide-react";
import { EarthGlobe3D } from "./EarthGlobe3D";

interface NavbarProps {
  onOpenWizard: () => void;
  onOpenDemos: () => void;
  onOpenPlanetaryModal?: () => void;
  backendHealthy: boolean | null;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenWizard,
  onOpenDemos,
  onOpenPlanetaryModal,
  backendHealthy,
}) => {
  return (
    <header className="navbar">
      <div className="nav-container flex-between">
        {/* Zenvyra Brand with Single Real 3D Rotating Earth Globe */}
        <div
          className="nav-brand flex-align"
          onClick={onOpenPlanetaryModal}
          style={{ cursor: "pointer" }}
          title="Click to open interactive 3D Planetary Explorer"
        >
          <EarthGlobe3D size={48} />
          <div className="brand-text-container">
            <h1 className="brand-title brand-title-zenvyra">Zenvyra</h1>
            <span className="brand-subtitle">Earth Science Climate Trend & Statistical Engine</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="nav-actions flex-align">
          {onOpenPlanetaryModal && (
            <button
              type="button"
              className="nav-btn demo-btn flex-align"
              onClick={onOpenPlanetaryModal}
              title="Open full interactive 3D Earth Globe"
            >
              <Globe size={16} />
              <span>3D Globe View</span>
            </button>
          )}

          <button
            type="button"
            className="nav-btn wizard-btn flex-align"
            onClick={onOpenWizard}
          >
            <Sparkles size={16} />
            <span>Guided Wizard (3 Questions)</span>
          </button>

          <button
            type="button"
            className="nav-btn demo-btn flex-align"
            onClick={onOpenDemos}
          >
            <PlayCircle size={16} />
            <span>Interactive Demos</span>
          </button>

          {/* Backend Status indicator */}
          <div className="status-indicator flex-align" title="FastAPI Backend Health Status">
            <span
              className={`status-dot ${
                backendHealthy === true
                  ? "dot-green"
                  : backendHealthy === false
                  ? "dot-red"
                  : "dot-yellow"
              }`}
            />
            <span className="status-label">
              {backendHealthy === true ? "API Online" : "Checking API..."}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
