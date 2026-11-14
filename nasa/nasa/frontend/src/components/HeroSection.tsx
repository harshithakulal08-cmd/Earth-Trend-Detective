import React from "react";
import { Sparkles, PlayCircle, ArrowDown, Orbit } from "lucide-react";
import { Hero3DEarthAnimation } from "./Hero3DEarthAnimation";

interface HeroSectionProps {
  onOpenWizard: () => void;
  onOpenDemos: () => void;
  onScrollToWorkspace: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onOpenWizard,
  onOpenDemos,
  onScrollToWorkspace,
}) => {
  return (
    <section className="hero-section">
      {/* Background Scientific Orbit Pattern (NASA Space Apps Guideline at 25% Opacity) */}
      <div className="hero-orbit-pattern-bg" />

      <div className="hero-container">
        {/* Left Column: Hero Text & Actions */}
        <div className="hero-content">
          <div className="hero-badge flex-align">
            <Orbit size={15} className="text-neon-yellow" />
            <span className="badge-text-spaceapps">NASA SPACE APPS • ZENVYRA PLANETARY OBSERVATORY</span>
          </div>

          <h1 className="hero-heading">
            Decode Earth's Climate Signals with <span className="highlight-neon-yellow">3D Satellite Rigor</span>
          </h1>

          <p className="hero-subheading">
            Transform multi-decade NASA Earth observations into actionable statistical intelligence.
            Isolate long-term temperature, moisture, and vegetation trends from seasonal weather noise
            using dual statistical engines (OLS &amp; Mann-Kendall) with beginner-friendly student verdicts.
          </p>

          <div className="hero-cta-group">
            <button
              type="button"
              className="hero-primary-btn flex-align"
              onClick={onScrollToWorkspace}
            >
              <span>Launch Climate Workspace</span>
              <ArrowDown size={16} />
            </button>

            <button
              type="button"
              className="hero-secondary-btn flex-align"
              onClick={onOpenWizard}
            >
              <Sparkles size={16} className="text-neon-yellow" />
              <span>3-Question Wizard</span>
            </button>

            <button
              type="button"
              className="hero-outline-btn flex-align"
              onClick={onOpenDemos}
            >
              <PlayCircle size={16} />
              <span>Interactive Demos</span>
            </button>
          </div>

          {/* Quick Scientific Badges (Space Apps Deep Blue & Electric Blue Palette) */}
          <div className="hero-stats-row">
            <div className="hero-stat-pill">
              <strong className="text-neon-yellow">5 Earth Spheres</strong>
              <span>Air, Water, Land, Aerosols, Ice</span>
            </div>
            <div className="hero-stat-pill">
              <strong className="text-neon-yellow">24+ Years Data</strong>
              <span>2000–Present Monthly Series</span>
            </div>
            <div className="hero-stat-pill">
              <strong className="text-neon-yellow">95% Confidence</strong>
              <span>OLS &amp; Non-Parametric Rigor</span>
            </div>
          </div>
        </div>

        {/* Right Column: Interactive 3D Earth, Orbiting Satellites & Hotspots */}
        <div className="hero-visual">
          <Hero3DEarthAnimation />
        </div>
      </div>
    </section>
  );
};
