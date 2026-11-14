import React from "react";
import { AlertCircle } from "lucide-react";

export const UncertaintyNote: React.FC = () => {
  return (
    <footer className="footer-section">
      <div className="uncertainty-box">
        <div className="flex-align footer-title-row">
          <AlertCircle size={18} className="icon-blue" />
          <h3 className="footer-title">Scientific Uncertainty, Spatial Resolution & Limitations</h3>
        </div>
        <p className="footer-text">
          Area-averaged time series simplify spatial variance across complex topography. Satellite sensors undergo orbital drift,
          cloud contamination, and atmospheric attenuation. While deseasonalization isolates multi-year anomalies, cyclic climate modes
          such as the El Niño–Southern Oscillation (ENSO), Pacific Decadal Oscillation (PDO), and North Atlantic Oscillation (NAO)
          can induce multi-year fluctuations that may resemble trends over short spans. All statistical inferences should be corroborated
          against multi-sensor peer-reviewed climate assessments.
        </p>

        <div className="citations-grid">
          <div className="citation-item">
            <strong>MERRA-2 Reanalysis (Temperature, Aerosols):</strong>
            <span>Gelaro et al. (2017), The Modern-Era Retrospective Analysis for Research and Applications, Version 2 (MERRA-2), J. Climate. DOI: 10.1175/JCLI-D-16-0758.1</span>
          </div>

          <div className="citation-item">
            <strong>GPM IMERG (Precipitation):</strong>
            <span>Huffman et al. (2019), NASA Global Precipitation Measurement (GPM) Integrated Multi-satellitE Retrievals. DOI: 10.5067/GPM/IMERG/3B-MONTH/07</span>
          </div>

          <div className="citation-item">
            <strong>SMAP & GLDAS (Soil Moisture):</strong>
            <span>Entekhabi et al. (2010), The Soil Moisture Active Passive (SMAP) Mission, Proc. IEEE. DOI: 10.5067/5Z7E59X8LMCK</span>
          </div>

          <div className="citation-item">
            <strong>MODIS Terra/Aqua (NDVI & Aerosols):</strong>
            <span>Didan, K. (2015), MOD13C2 MODIS/Terra Vegetation Indices Monthly L3 Global 0.05Deg CMG V006. DOI: 10.5067/MODIS/MOD13C2.061</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
