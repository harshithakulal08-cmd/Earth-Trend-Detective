import React from "react";
import type { DemoItem } from "../types";
import { PlayCircle, X } from "lucide-react";

interface DemosModalProps {
  isOpen: boolean;
  onClose: () => void;
  demos: DemoItem[];
  onSelectDemo: (demo: DemoItem) => void;
}

export const DemosModal: React.FC<DemosModalProps> = ({
  isOpen,
  onClose,
  demos,
  onSelectDemo,
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal-card modal-card-wide">
        <div className="modal-header flex-between">
          <div className="flex-align">
            <PlayCircle className="icon-blue" size={22} />
            <h3 className="modal-title">Pre-Cached Climate Detective Demo Walkthroughs</h3>
          </div>
          <button type="button" className="close-btn" onClick={onClose} aria-label="Close demos modal">
            <X size={18} />
          </button>
        </div>

        <p className="modal-subtitle">
          These curated demonstrations use verified, pre-cached NASA satellite observations to run instantaneously with zero external network delays.
        </p>

        <div className="demos-grid">
          {demos.map((d) => (
            <div key={d.id} className="demo-card">
              <div className="demo-card-header flex-between">
                <span className="demo-sphere-tag">{d.sphere.toUpperCase()}</span>
                <span className="demo-period">{d.start_date} → {d.end_date}</span>
              </div>
              <h4 className="demo-title">{d.title}</h4>
              <p className="demo-subtitle">{d.subtitle}</p>

              <div className="demo-story-box">
                <p><strong>Story:</strong> {d.story}</p>
                <p className="expected-text"><strong>Key Finding:</strong> {d.expected_finding}</p>
              </div>

              <div className="demo-meta">
                <span>📍 {d.region_name}</span>
                <span>🛰️ {d.variable_name}</span>
              </div>

              <button
                type="button"
                className="demo-launch-btn"
                onClick={() => {
                  onSelectDemo(d);
                  onClose();
                }}
              >
                <PlayCircle size={16} />
                <span>Run Instant Demo Analysis</span>
              </button>
            </div>
          ))}
        </div>

        <div className="modal-footer flex-end">
          <button type="button" className="secondary-btn" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
