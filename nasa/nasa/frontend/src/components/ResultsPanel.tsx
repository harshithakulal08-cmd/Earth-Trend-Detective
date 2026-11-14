import React, { useState } from "react";
import type { ComprehensiveStats } from "../types";
import {
  CheckCircle,
  Info,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Award,
  Zap,
  Printer,
  Flame,
  Snowflake,
} from "lucide-react";

interface ResultsPanelProps {
  stats: ComprehensiveStats;
  units: string;
}

export const ResultsPanel: React.FC<ResultsPanelProps> = ({ stats, units }) => {
  const [showExplainer, setShowExplainer] = useState(false);
  const [showExtremes, setShowExtremes] = useState(true);

  const { verdict, ols, theil_sen, mann_kendall, extreme_events } = stats;

  const getVerdictBadgeClass = () => {
    if (verdict.badge.includes("Significant")) return "verdict-banner-success";
    if (verdict.badge.includes("Caution")) return "verdict-banner-warning";
    return "verdict-banner-neutral";
  };

  const handlePrintReport = () => {
    window.print();
  };

  return (
    <div className="card-box results-card">
      <div className="section-header flex-between">
        <div className="flex-align">
          <Award className="icon-blue" size={20} />
          <h2 className="section-title">4. Statistical Detection &amp; Verdict</h2>
        </div>

        <div className="flex-align">
          <button
            type="button"
            className="action-btn"
            onClick={handlePrintReport}
            title="Generate and print official Student Lab Report"
          >
            <Printer size={14} />
            <span>Print Lab Report</span>
          </button>

          <button
            type="button"
            className="explain-toggle-btn"
            onClick={() => setShowExplainer(!showExplainer)}
          >
            <HelpCircle size={15} />
            <span>{showExplainer ? "Hide Explanations" : "Explain Stats"}</span>
            {showExplainer ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>

      {/* Main Verdict Banner */}
      <div className={`verdict-banner ${getVerdictBadgeClass()}`}>
        <div className="flex-align">
          {verdict.is_significant ? (
            <CheckCircle size={22} className="icon-success" />
          ) : (
            <Info size={22} className="icon-info" />
          )}
          <div>
            <div className="verdict-headline">{verdict.headline}</div>
            <div className="verdict-subtext">{verdict.badge}</div>
          </div>
        </div>
      </div>

      {/* NASA Space Apps 3D Circular Award Badges (Section 4 Brand Guidelines) */}
      <div className="spaceapps-awards-row flex-between" role="group" aria-label="Scientific Recognition Awards">
        <div className="award-circular-badge flex-align" title="Certified statistical significance (>95% confidence)">
          <div className="badge-3d-sphere badge-sphere-gold">
            <span className="badge-3d-icon">🏆</span>
          </div>
          <div className="badge-info">
            <strong className="badge-title">Trend Detection Award</strong>
            <span className="badge-sub">{verdict.is_significant ? "Confidence > 95% (p < 0.05)" : "Indeterminate Baseline"}</span>
          </div>
        </div>

        <div className="award-circular-badge flex-align" title="Verified against dual OLS & Mann-Kendall statistical engines">
          <div className="badge-3d-sphere badge-sphere-blue">
            <span className="badge-3d-icon">⚡</span>
          </div>
          <div className="badge-info">
            <strong className="badge-title">Statistical Rigor</strong>
            <span className="badge-sub">OLS + Mann-Kendall Dual Engine</span>
          </div>
        </div>

        <div className="award-circular-badge flex-align" title="Multi-decade satellite time-series analysis certified">
          <div className="badge-3d-sphere badge-sphere-yellow">
            <span className="badge-3d-icon">🛰️</span>
          </div>
          <div className="badge-info">
            <strong className="badge-title">NASA Data Detective</strong>
            <span className="badge-sub">24+ Year Satellite Series</span>
          </div>
        </div>
      </div>

      {/* Key Metric Stat Cards */}
      <div className="stat-cards-grid">
        {/* Metric 1: Decadal Rate */}
        <div className="stat-card">
          <span className="stat-card-title">Decadal Rate (OLS)</span>
          <div className="stat-card-value">{verdict.rate_per_decade_str}</div>
          <span className="stat-card-note">Slope extrapolated per 10 years</span>
        </div>

        {/* Metric 2: 95% Confidence Interval */}
        <div className="stat-card">
          <span className="stat-card-title">95% Confidence Interval</span>
          <div className="stat-card-value text-sm">{verdict.ci_95_str}</div>
          <span className="stat-card-note">Likely range of true decadal trend</span>
        </div>

        {/* Metric 3: Mann-Kendall Test */}
        <div className="stat-card">
          <span className="stat-card-title">Mann-Kendall Rank Test</span>
          <div className="stat-card-value">
            Tau = {mann_kendall.tau}
          </div>
          <span className="stat-card-note">
            p = {mann_kendall.p_value} ({mann_kendall.trend})
          </span>
        </div>

        {/* Metric 4: R-Squared */}
        <div className="stat-card">
          <span className="stat-card-title">Linear Fit (R²)</span>
          <div className="stat-card-value">
            {(ols.r_squared * 100).toFixed(1)}%
          </div>
          <span className="stat-card-note">Variance explained by linear trend</span>
        </div>
      </div>

      {/* Extreme Climate Events & Outlier Analysis */}
      {extreme_events && (
        <div className="extreme-events-box">
          <div className="flex-between">
            <div className="flex-align">
              <Zap size={16} className="icon-purple" />
              <h4 className="extreme-title">
                Extreme Climate Records &amp; Outliers ({extreme_events.extremes_count} Months &gt; 2σ)
              </h4>
            </div>
            <button
              type="button"
              className="action-btn text-xs"
              onClick={() => setShowExtremes(!showExtremes)}
            >
              {showExtremes ? "Collapse" : "Expand"}
            </button>
          </div>

          {showExtremes && (
            <div className="extreme-details-grid">
              <div className="record-mini-card">
                <div className="flex-align text-rose">
                  <Flame size={15} />
                  <strong>All-Time Record High</strong>
                </div>
                <div className="record-val">
                  {extreme_events.record_high.raw_value} {units} ({extreme_events.record_high.date})
                </div>
                <span className="record-anom">
                  Anomaly: {extreme_events.record_high.anomaly > 0 ? "+" : ""}{extreme_events.record_high.anomaly} {units} (z = +{extreme_events.record_high.z_score}σ)
                </span>
              </div>

              <div className="record-mini-card">
                <div className="flex-align text-sky">
                  <Snowflake size={15} />
                  <strong>All-Time Record Low</strong>
                </div>
                <div className="record-val">
                  {extreme_events.record_low.raw_value} {units} ({extreme_events.record_low.date})
                </div>
                <span className="record-anom">
                  Anomaly: {extreme_events.record_low.anomaly} {units} (z = {extreme_events.record_low.z_score}σ)
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Plain Language Interpretation */}
      <div className="explanation-prose">
        <h4 className="prose-title">Plain-Language Scientific Takeaway:</h4>
        <p className="prose-text">{verdict.explanation}</p>
        <div className="educational-callout">
          <Info size={16} className="icon-blue" />
          <span>{verdict.educational_tip}</span>
        </div>
      </div>

      {/* Robustness Comparison: OLS vs Theil-Sen */}
      <div className="estimator-comparison-box">
        <h4 className="comparison-title">Comparison of Linear vs Robust Non-Parametric Estimator:</h4>
        <div className="table-responsive">
          <table className="stats-table">
            <thead>
              <tr>
                <th>Statistical Method</th>
                <th>Rate per Decade</th>
                <th>95% Confidence Interval</th>
                <th>Resistance to Outliers</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <strong>Ordinary Least Squares (OLS)</strong>
                </td>
                <td>{ols.slope_per_decade > 0 ? "+" : ""}{ols.slope_per_decade} {units}/decade</td>
                <td>[{ols.confidence_interval_95[0]} to {ols.confidence_interval_95[1]}]</td>
                <td>Standard (sensitive to extreme spikes)</td>
              </tr>
              <tr>
                <td>
                  <strong>Theil-Sen Median Estimator</strong>
                </td>
                <td>{theil_sen.slope_per_decade > 0 ? "+" : ""}{theil_sen.slope_per_decade} {units}/decade</td>
                <td>[{theil_sen.confidence_interval_95[0]} to {theil_sen.confidence_interval_95[1]}]</td>
                <td>High (resists up to 29% outliers)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Explainer Accordion Panel */}
      {showExplainer && (
        <div className="explainer-drawer" id="explainer-section">
          <h3 className="explainer-title">🎓 The Detective's Guide to Climate Statistics</h3>
          <div className="explainer-grid">
            <div className="explainer-item">
              <h5>🎲 What is a p-value?</h5>
              <p>
                Imagine flipping a coin 100 times. If it lands on heads 52 times, that’s just random luck.
                If it lands on heads 95 times, something is definitely rigged! A <strong>p-value &lt; 0.05</strong> means
                there is less than a 5% chance that the temperature change we measured was just random weather noise.
              </p>
            </div>

            <div className="explainer-item">
              <h5>🎯 What is a 95% Confidence Interval?</h5>
              <p>
                Real climate data is full of noisy months. Rather than giving just one number, scientists calculate a
                bracket: <em>"We are 95% confident the true multi-decade rate lies between {verdict.ci_95_str}."</em>
                If this entire bracket stays above zero, warming is proven beyond reasonable doubt.
              </p>
            </div>

            <div className="explainer-item">
              <h5>🛡️ Why use Theil-Sen along with OLS?</h5>
              <p>
                A single massive volcanic eruption (like Mt. Pinatubo) or a super El Niño can spike temperatures for a few months.
                Standard linear regression (OLS) gets pulled by these spikes. <strong>Theil-Sen</strong> calculates slopes between
                every single pair of points and picks the median, ignoring outlier spikes.
              </p>
            </div>

            <div className="explainer-item">
              <h5>📈 What is the Mann-Kendall Test?</h5>
              <p>
                Mann-Kendall is a non-parametric test: it doesn't assume the climate warms in a straight line.
                It counts whether later months are systematically higher than earlier months. A positive Kendall’s Tau
                confirms a persistent upward monotonic drift.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
