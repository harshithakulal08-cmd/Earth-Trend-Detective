import React, { useEffect, useRef, useState } from "react";
import type { CityClimateData } from "../data/zenvyraCities";

interface StoryCardModalProps {
  isOpen: boolean;
  city: CityClimateData | null;
  year: number;
  lang: "en" | "fr";
  onClose: () => void;
}

export const StoryCardModal: React.FC<StoryCardModalProps> = ({
  isOpen,
  city,
  year,
  lang,
  onClose,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [includeTrajectory, setIncludeTrajectory] = useState(true);
  const [includeScore, setIncludeScore] = useState(true);

  useEffect(() => {
    if (!isOpen || !city || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = 540;
    const h = 960;
    canvas.width = w;
    canvas.height = h;

    // 1. Dark Cosmic Gradient Background
    const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
    bgGrad.addColorStop(0, "#050606");
    bgGrad.addColorStop(0.4, "#0b151e");
    bgGrad.addColorStop(1, "#040505");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // Stars
    ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
    for (let i = 0; i < 90; i++) {
      const sx = (i * 137.5) % w;
      const sy = (i * 83.1) % h;
      ctx.fillRect(sx, sy, 1.2, 1.2);
    }

    // 2. Center Earth Illustration
    const cx = w / 2;
    const cy = 380;
    const r = 160;

    // Earth Halo
    const haloGrad = ctx.createRadialGradient(cx, cy, r * 0.9, cx, cy, r * 1.3);
    haloGrad.addColorStop(0, "rgba(56, 189, 248, 0.35)");
    haloGrad.addColorStop(0.5, "rgba(0, 119, 255, 0.15)");
    haloGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = haloGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, r * 1.3, 0, Math.PI * 2);
    ctx.fill();

    // Planet Body
    const globeGrad = ctx.createRadialGradient(cx - 50, cy - 50, 10, cx, cy, r);
    globeGrad.addColorStop(0, "#194a82");
    globeGrad.addColorStop(0.7, "#0d2b52");
    globeGrad.addColorStop(1, "#051326");
    ctx.fillStyle = globeGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();

    // Thermal Heatwave Glow on Earth
    ctx.fillStyle = "rgba(255, 82, 48, 0.45)";
    ctx.beginPath();
    ctx.arc(cx + 20, cy - 10, 75, 0, Math.PI * 2);
    ctx.fill();

    // 3. Brand Lockup Top
    ctx.fillStyle = "#e2e8f0";
    ctx.font = "300 24px -apple-system, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("zenvyra  /  2050", cx, 80);

    ctx.fillStyle = "#94a3b8";
    ctx.font = "500 11px monospace";
    ctx.fillText("PLANETARY CLIMATE PROJECTION", cx, 110);

    // 4. City Title
    ctx.fillStyle = "#ffffff";
    ctx.font = "600 42px -apple-system, sans-serif";
    ctx.fillText(city.name, cx, 600);

    ctx.fillStyle = "#94a3b8";
    ctx.font = "400 18px -apple-system, sans-serif";
    ctx.fillText(`${city.country} · ${city.scope[lang]}`, cx, 635);

    // 5. Score & Metrics
    if (includeScore) {
      const yearRatio = (year - 2026) / (2050 - 2026);
      const score = Math.round(city.score2026 + (city.score2050 - city.score2026) * yearRatio);
      ctx.fillStyle = city.statusColor;
      ctx.font = "700 48px -apple-system, sans-serif";
      ctx.fillText(`${score}/100`, cx, 715);

      ctx.fillStyle = "#cbd5e1";
      ctx.font = "400 13px monospace";
      ctx.fillText("RESILIENCE INDEX", cx, 745);
    }

    if (includeTrajectory) {
      ctx.fillStyle = "#f87171";
      ctx.font = "500 16px -apple-system, sans-serif";
      ctx.fillText(`+${city.tempAnomaly2050}°C Anomaly · +${city.heatwaveDays2050} Heat Days/yr`, cx, 800);

      ctx.fillStyle = "#94a3b8";
      ctx.font = "400 14px -apple-system, sans-serif";
      ctx.fillText(`"${city.verdict[lang]}"`, cx, 835);
    }

    // Footer
    ctx.fillStyle = "#64748b";
    ctx.font = "400 12px monospace";
    ctx.fillText("https://zenvyra.love", cx, 915);
  }, [isOpen, city, year, lang, includeTrajectory, includeScore]);

  if (!isOpen || !city) return null;

  const handleDownload = () => {
    if (!canvasRef.current) return;
    const link = document.createElement("a");
    link.download = `zenvyra-2050-${city.id}.png`;
    link.href = canvasRef.current.toDataURL("image/png");
    link.click();
  };

  return (
    <div id="story-popup" role="dialog" aria-modal="true">
      <div className="pedago-carte story-carte">
        <div className="pedago-titre flex-between">
          <div className="flex-align">
            <span className="pastille-pedago" style={{ background: "#4D7CF2" }} />
            <span id="story-titre">{lang === "en" ? "Story Snapshot" : "Instantané Story"}</span>
          </div>
          <button id="story-fermer" type="button" onClick={onClose} aria-label="Close">
            <svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true">
              <path d="M1 1 L11 11 M11 1 L1 11" stroke="currentColor" strokeWidth="1.6" />
            </svg>
          </button>
        </div>

        <div className="story-corps">
          <canvas id="story-apercu" ref={canvasRef} width="540" height="960" />

          <div className="story-opts">
            <label className="story-opt">
              <input
                type="checkbox"
                checked={includeScore}
                onChange={(e) => setIncludeScore(e.target.checked)}
              />
              <span style={{ marginLeft: 8 }}>{lang === "en" ? "Resilience Score" : "Score de résilience"}</span>
            </label>

            <label className="story-opt">
              <input
                type="checkbox"
                checked={includeTrajectory}
                onChange={(e) => setIncludeTrajectory(e.target.checked)}
              />
              <span style={{ marginLeft: 8 }}>{lang === "en" ? "Climate Trajectory" : "Trajectoire climatique"}</span>
            </label>

            <button id="story-partager" className="entree-pedago" type="button" onClick={handleDownload}>
              <span>{lang === "en" ? "Download Story Image" : "Télécharger l'image Story"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
