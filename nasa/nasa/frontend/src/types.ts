export type SphereType = "air" | "water" | "land";

export interface EarthVariable {
  id: string;
  name: string;
  short_name: string;
  sphere: SphereType;
  units: string;
  source: string;
  dataset_doi: string;
  spatial_coverage: string;
  resolution: string;
  temporal_range: string;
  plain_definition: string;
  why_it_matters: string;
  recommended_regions: string[];
  typical_range: [number, number];
}

export interface TimeSeriesPoint {
  date: string;
  raw_value: number;
  climatology?: number;
  anomaly?: number;
}

export interface TrendLinePoint {
  date: string;
  fitted_value: number;
}

export interface PlainVerdict {
  badge: string;
  headline: string;
  direction: "upward" | "downward";
  rate_per_decade_str: string;
  ci_95_str: string;
  is_significant: boolean;
  explanation: string;
  educational_tip: string;
}

export interface MannKendallResult {
  s: number;
  tau: number;
  z: number;
  p_value: number;
  significant_at_05: boolean;
  trend: string;
}

export interface OLSResult {
  slope_per_decade: number;
  slope_per_year: number;
  intercept: number;
  r_squared: number;
  p_value: number;
  stderr_per_decade: number;
  confidence_interval_95: [number, number];
  significant: boolean;
}

export interface TheilSenResult {
  slope_per_decade: number;
  intercept: number;
  confidence_interval_95: [number, number];
}

export interface ExtremeEventItem {
  date: string;
  raw_value: number;
  anomaly: number;
  z_score: number;
  type: string;
}

export interface ExtremeEventsSummary {
  std_deviation: number;
  record_high: {
    date: string;
    raw_value: number;
    anomaly: number;
    z_score: number;
  };
  record_low: {
    date: string;
    raw_value: number;
    anomaly: number;
    z_score: number;
  };
  extremes_count: number;
  top_extremes: ExtremeEventItem[];
}

export interface ComprehensiveStats {
  is_valid: boolean;
  sample_size_months: number;
  span_years: number;
  deseasonalized: boolean;
  ols: OLSResult;
  theil_sen: TheilSenResult;
  mann_kendall: MannKendallResult;
  extreme_events?: ExtremeEventsSummary;
  verdict: PlainVerdict;
  trend_line: TrendLinePoint[];
  processed_series: TimeSeriesPoint[];
  climatology: Record<number, number>;
}

export interface AnalysisResponse {
  status: string;
  cached: boolean;
  is_demo_mode: boolean;
  metadata: {
    variable_id: string;
    variable_name: string;
    units: string;
    bbox: [number, number, number, number];
    start_date: string;
    end_date: string;
    deseasonalized: boolean;
    data_source: string;
  };
  statistics: ComprehensiveStats;
  time_series: TimeSeriesPoint[];
  trend_line: TrendLinePoint[];
}

export interface RegionPreset {
  id: string;
  name: string;
  sphere: SphereType;
  bbox: [number, number, number, number]; // [min_lon, min_lat, max_lon, max_lat]
  description: string;
  recommended_var: string;
}

export interface DemoItem {
  id: string;
  title: string;
  subtitle: string;
  sphere: SphereType;
  variable_id: string;
  variable_name: string;
  bbox: [number, number, number, number];
  region_name: string;
  start_date: string;
  end_date: string;
  expected_finding: string;
  story: string;
}
