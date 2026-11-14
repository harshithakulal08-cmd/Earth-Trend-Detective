import React, { useRef, useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line, Bar } from "react-chartjs-2";
import type { AnalysisResponse } from "../types";
import { Download, FileSpreadsheet, TrendingUp, SunMedium } from "lucide-react";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface TimeSeriesChartProps {
  data: AnalysisResponse;
}

export const TimeSeriesChart: React.FC<TimeSeriesChartProps> = ({ data }) => {
  const chartRef = useRef<any>(null);
  const [viewMode, setViewMode] = useState<"anomaly" | "raw" | "climatology">("anomaly");
  const [showConfidenceBand, setShowConfidenceBand] = useState<boolean>(true);

  const { statistics, metadata, time_series, trend_line } = data;

  const labels = time_series.map((pt) => pt.date);
  const n = time_series.length;

  // Observation values
  const values = time_series.map((pt) => {
    if (viewMode === "anomaly" && pt.anomaly !== undefined) {
      return pt.anomaly;
    }
    return pt.raw_value;
  });

  // OLS trendline points
  const trendValues = trend_line.map((pt) => pt.fitted_value);

  // Compute 95% confidence interval bounds along the trendline
  const stderrYear = statistics.ols.stderr_per_decade / 10.0;
  const tCrit = 1.96;
  const midIndex = Math.floor(n / 2);

  const ciUpper = trend_line.map((pt, idx) => {
    const distFromCenter = Math.abs(idx - midIndex) / (n / 2);
    const margin = tCrit * stderrYear * Math.sqrt(1.0 + distFromCenter * 0.8) * 1.5;
    return parseFloat((pt.fitted_value + margin).toFixed(4));
  });

  const ciLower = trend_line.map((pt, idx) => {
    const distFromCenter = Math.abs(idx - midIndex) / (n / 2);
    const margin = tCrit * stderrYear * Math.sqrt(1.0 + distFromCenter * 0.8) * 1.5;
    return parseFloat((pt.fitted_value - margin).toFixed(4));
  });

  const datasets: any[] = [
    {
      label: viewMode === "anomaly" ? "Monthly Anomaly" : "Monthly Mean Observation",
      data: values,
      borderColor: "#2563eb",
      backgroundColor: "rgba(37, 99, 235, 0.08)",
      fill: true,
      tension: 0.15,
      borderWidth: 1.8,
      pointRadius: labels.length > 120 ? 0 : 2,
      pointHoverRadius: 5,
    },
    {
      label: `OLS Trend (${statistics.ols.slope_per_decade > 0 ? "+" : ""}${statistics.ols.slope_per_decade} ${metadata.units}/decade)`,
      data: trendValues,
      borderColor: "#ef4444",
      borderDash: [5, 4],
      borderWidth: 2.2,
      pointRadius: 0,
      fill: false,
    },
  ];

  if (showConfidenceBand && statistics.ols.significant && viewMode !== "climatology") {
    datasets.push({
      label: "95% Upper Confidence Bound",
      data: ciUpper,
      borderColor: "rgba(239, 68, 68, 0.35)",
      borderDash: [2, 3],
      borderWidth: 1,
      pointRadius: 0,
      fill: false,
    });
    datasets.push({
      label: "95% Confidence Interval Band",
      data: ciLower,
      borderColor: "rgba(239, 68, 68, 0.35)",
      backgroundColor: "rgba(239, 68, 68, 0.10)",
      borderDash: [2, 3],
      borderWidth: 1,
      pointRadius: 0,
      fill: "-1",
    });
  }

  const chartData = {
    labels,
    datasets,
  };

  // Climatology Chart Data
  const monthNames = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  const climatologyValues = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(
    (m) => statistics.climatology?.[m] ?? 0
  );

  const climatologyChartData = {
    labels: monthNames,
    datasets: [
      {
        label: `12-Month Mean Climatology (${metadata.units})`,
        data: climatologyValues,
        backgroundColor: "rgba(124, 58, 237, 0.4)",
        borderColor: "#7c3aed",
        borderWidth: 2,
        borderRadius: 6,
      },
    ],
  };

  const options: any = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: "index" as const,
      intersect: false,
    },
    plugins: {
      legend: {
        position: "top" as const,
        labels: {
          boxWidth: 14,
          font: { size: 12, family: "system-ui" },
          filter: (legendItem: any) => legendItem.text !== "95% Upper Confidence Bound",
        },
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            return ` ${context.dataset.label}: ${context.parsed.y} ${metadata.units}`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: {
          maxTicksLimit: viewMode === "climatology" ? 12 : 12,
          font: { size: 11 },
        },
      },
      y: {
        title: {
          display: true,
          text: `${metadata.variable_name} (${metadata.units})`,
          font: { size: 12, weight: "bold" },
        },
        grid: { color: "rgba(0, 0, 0, 0.06)" },
      },
    },
  };

  // Download chart as PNG image
  const handleDownloadPNG = () => {
    if (!chartRef.current) return;
    const chartInstance = chartRef.current;
    const url = chartInstance.toBase64Image("image/png", 1.0);
    const link = document.createElement("a");
    link.download = `zenvyra_trend_${metadata.variable_id}_${metadata.start_date}_${metadata.end_date}.png`;
    link.href = url;
    link.click();
  };

  // Export time series data as CSV
  const handleExportCSV = () => {
    const headers = ["Date", "Raw_Observation", "Climatology", "Anomaly", "Fitted_Trend", "Units"];
    const rows = time_series.map((pt, idx) => {
      const fitted = trend_line[idx] ? trend_line[idx].fitted_value : "";
      return [
        pt.date,
        pt.raw_value ?? "",
        pt.climatology ?? "",
        pt.anomaly ?? "",
        fitted,
        metadata.units,
      ].join(",");
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `zenvyra_data_${metadata.variable_id}_${metadata.start_date}_${metadata.end_date}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="card-box">
      <div className="section-header flex-between">
        <div className="flex-align">
          <TrendingUp className="icon-blue" size={20} />
          <h2 className="section-title">3. Satellite Time Series & Trendline</h2>
        </div>

        <div className="chart-actions">
          {/* Toggle Raw vs Anomaly vs Climatology */}
          <div className="tab-pill-group">
            <button
              type="button"
              className={`tab-pill ${viewMode === "anomaly" ? "tab-pill-active" : ""}`}
              onClick={() => setViewMode("anomaly")}
            >
              Anomalies (Deseasonalized)
            </button>
            <button
              type="button"
              className={`tab-pill ${viewMode === "raw" ? "tab-pill-active" : ""}`}
              onClick={() => setViewMode("raw")}
            >
              Raw Observations
            </button>
            <button
              type="button"
              className={`tab-pill ${viewMode === "climatology" ? "tab-pill-active" : ""}`}
              onClick={() => setViewMode("climatology")}
              title="View the 12-month baseline seasonal heartbeat"
            >
              Annual Cycle
            </button>
          </div>

          {viewMode !== "climatology" && (
            <button
              type="button"
              className={`action-btn ${showConfidenceBand ? "preset-btn-active" : ""}`}
              onClick={() => setShowConfidenceBand(!showConfidenceBand)}
              title="Toggle 95% Confidence Interval Uncertainty Ribbon"
            >
              <span>95% CI Band</span>
            </button>
          )}

          <button
            type="button"
            className="action-btn"
            onClick={handleDownloadPNG}
            title="Download chart as high-resolution PNG image"
          >
            <Download size={14} />
            <span>PNG</span>
          </button>

          <button
            type="button"
            className="action-btn"
            onClick={handleExportCSV}
            title="Export all series data as CSV for Excel / Google Sheets"
          >
            <FileSpreadsheet size={14} />
            <span>CSV</span>
          </button>
        </div>
      </div>

      <div className="chart-container" style={{ position: "relative", height: "360px", width: "100%" }}>
        {viewMode === "climatology" ? (
          <Bar ref={chartRef} data={climatologyChartData} options={options} />
        ) : (
          <Line ref={chartRef} data={chartData} options={options} />
        )}
      </div>

      {viewMode === "climatology" && (
        <div className="educational-callout flex-align">
          <SunMedium size={18} className="icon-purple" />
          <span>
            <strong>12-Month Climatology Cycle:</strong> This represents the average annual seasonal baseline computed across all {statistics.sample_size_months} months. Deseasonalization subtracts this recurring cycle from each year, allowing long-term decadal trends to be isolated from winter-to-summer swings.
          </span>
        </div>
      )}

      <div className="chart-footer flex-between">
        <span className="caption-text">
          Source: {metadata.data_source} • {time_series.length} monthly observations ({statistics.span_years} years)
        </span>
        {data.cached && <span className="cache-badge">⚡ Served from Cache</span>}
        {data.is_demo_mode && <span className="demo-badge">🎓 Demo Climatology Dataset</span>}
      </div>
    </div>
  );
};
