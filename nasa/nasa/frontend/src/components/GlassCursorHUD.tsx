import React, { useEffect, useState } from "react";

interface GlassCursorHUDProps {
  coords: { lat: number; lon: number; tempAnomaly: number } | null;
  year: number;
}

export const GlassCursorHUD: React.FC<GlassCursorHUDProps> = ({ coords, year }) => {
  const [pos, setPos] = useState({ x: -100, y: -100 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setPos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  if (!coords) return null;

  const latStr = `${Math.abs(coords.lat).toFixed(1)}° ${coords.lat >= 0 ? "N" : "S"}`;
  const lonStr = `${Math.abs(coords.lon).toFixed(1)}° ${coords.lon >= 0 ? "E" : "W"}`;

  return (
    <div
      id="hud"
      className="glass-cursor-pill"
      style={{
        transform: `translate3d(${pos.x + 16}px, ${pos.y + 16}px, 0)`,
      }}
    >
      <div className="glass-cursor-coord">
        <span>{latStr}</span>, <span>{lonStr}</span>
      </div>
      <div className="glass-cursor-temp">
        <span className="dot-pulse" />
        <strong>+{coords.tempAnomaly}°C</strong>
        <small className="hud-year">({year})</small>
      </div>
    </div>
  );
};

