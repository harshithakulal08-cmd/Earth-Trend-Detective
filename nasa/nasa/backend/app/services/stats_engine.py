import math
from typing import List, Dict, Any, Optional, Tuple
import numpy as np
import scipy.stats as stats
import pandas as pd


def compute_monthly_climatology(dates: List[str], values: List[float]) -> Dict[int, float]:
    """Compute the multi-year average (climatology) for each month (1=Jan .. 12=Dec)."""
    month_buckets: Dict[int, List[float]] = {m: [] for m in range(1, 13)}
    for d_str, v in zip(dates, values):
        month = int(d_str.split("-")[1])
        month_buckets[month].append(v)
    
    climatology = {}
    for m in range(1, 13):
        vals = month_buckets[m]
        climatology[m] = float(np.mean(vals)) if vals else 0.0
    return climatology


def deseasonalize_series(time_series: List[Dict[str, Any]]) -> Tuple[List[Dict[str, Any]], Dict[int, float]]:
    """
    Remove the repeating seasonal annual cycle by subtracting each month's climatological mean.
    Returns:
        anomalies: List of {date, raw_value, anomaly, climatology}
        climatology: Dict of month -> mean
    """
    dates = [item["date"] for item in time_series]
    values = [item["value"] for item in time_series]
    climatology = compute_monthly_climatology(dates, values)
    
    anomaly_records = []
    for d_str, raw_v in zip(dates, values):
        month = int(d_str.split("-")[1])
        clim = climatology[month]
        anomaly = raw_v - clim
        anomaly_records.append({
            "date": d_str,
            "raw_value": round(float(raw_v), 4),
            "climatology": round(float(clim), 4),
            "anomaly": round(float(anomaly), 4),
        })
    return anomaly_records, climatology


def compute_mann_kendall(values: List[float]) -> Dict[str, Any]:
    """
    Calculate the Mann-Kendall non-parametric monotonic trend test.
    Returns test statistic S, variance, standardized Z, p-value, and Kendall's Tau.
    """
    y = np.asarray(values, dtype=float)
    n = len(y)
    if n < 3:
        return {
            "s": 0,
            "tau": 0.0,
            "z": 0.0,
            "p_value": 1.0,
            "significant_at_05": False,
            "trend": "no trend",
        }

    # Compute S = sum(sgn(yj - yi)) for j > i
    s = 0
    for i in range(n - 1):
        diffs = y[i + 1:] - y[i]
        s += int(np.sum(np.sign(diffs)))

    # Compute variance of S with tie correction
    unique_vals, counts = np.unique(y, return_counts=True)
    tie_adjustment = np.sum(counts * (counts - 1) * (2 * counts + 5))
    var_s = (n * (n - 1) * (2 * n + 5) - tie_adjustment) / 18.0

    if var_s <= 0:
        z = 0.0
        p_val = 1.0
    else:
        std_s = math.sqrt(var_s)
        if s > 0:
            z = (s - 1.0) / std_s
        elif s < 0:
            z = (s + 1.0) / std_s
        else:
            z = 0.0
        p_val = 2.0 * (1.0 - stats.norm.cdf(abs(z)))

    total_pairs = n * (n - 1) / 2.0
    tau = s / total_pairs if total_pairs > 0 else 0.0

    if p_val < 0.05:
        trend_label = "increasing" if s > 0 else "decreasing"
    else:
        trend_label = "no trend"

    return {
        "s": int(s),
        "tau": round(float(tau), 4),
        "z": round(float(z), 4),
        "p_value": round(float(p_val), 6),
        "significant_at_05": bool(p_val < 0.05),
        "trend": trend_label,
    }


def detect_extreme_events(anomaly_records: List[Dict[str, Any]], units: str) -> Dict[str, Any]:
    """Identify record extremes and statistically rare climate anomalies (> 2 standard deviations)."""
    anomalies = np.array([r["anomaly"] for r in anomaly_records], dtype=float)
    raw_vals = np.array([r["raw_value"] for r in anomaly_records], dtype=float)
    
    std_anom = float(np.std(anomalies)) if len(anomalies) > 1 else 1.0
    if std_anom == 0:
        std_anom = 1.0

    # Record high and low
    max_idx = int(np.argmax(raw_vals))
    min_idx = int(np.argmin(raw_vals))
    
    record_high = {
        "date": anomaly_records[max_idx]["date"],
        "raw_value": anomaly_records[max_idx]["raw_value"],
        "anomaly": anomaly_records[max_idx]["anomaly"],
        "z_score": round(float(anomaly_records[max_idx]["anomaly"] / std_anom), 2),
    }

    record_low = {
        "date": anomaly_records[min_idx]["date"],
        "raw_value": anomaly_records[min_idx]["raw_value"],
        "anomaly": anomaly_records[min_idx]["anomaly"],
        "z_score": round(float(anomaly_records[min_idx]["anomaly"] / std_anom), 2),
    }

    # Anomalies exceeding 2.0 sigma
    extreme_months = []
    for r in anomaly_records:
        z = r["anomaly"] / std_anom
        if abs(z) >= 1.96:
            extreme_months.append({
                "date": r["date"],
                "raw_value": r["raw_value"],
                "anomaly": r["anomaly"],
                "z_score": round(float(z), 2),
                "type": "Extreme Warm/High (+2σ)" if z > 0 else "Extreme Cold/Low (-2σ)"
            })

    # Sort extremes by absolute z-score descending
    extreme_months.sort(key=lambda x: abs(x["z_score"]), reverse=True)

    return {
        "std_deviation": round(std_anom, 4),
        "record_high": record_high,
        "record_low": record_low,
        "extremes_count": len(extreme_months),
        "top_extremes": extreme_months[:6],
    }


def compute_comprehensive_stats(
    time_series: List[Dict[str, Any]],
    units: str,
    variable_name: str,
    deseasonalized: bool = True
) -> Dict[str, Any]:
    """
    Compute area-averaged time series trend analysis:
    - OLS slope per decade + t-test + 95% CI
    - Theil-Sen slope per decade + 95% CI
    - Mann-Kendall monotonic trend test
    - Extreme climate events (> 2σ anomalies)
    - Plain-language high school student verdict
    """
    n = len(time_series)
    if n < 12:
        return {
            "error": "Series too short",
            "message": f"Time series contains only {n} monthly points. A minimum of 24 months is required for trend analysis.",
            "is_valid": False,
        }

    # Compute deseasonalized anomalies
    anomaly_records, climatology = deseasonalize_series(time_series)
    
    # Choose values for trend calculation (anomalies if deseasonalized, else raw)
    if deseasonalized:
        analysis_values = [item["anomaly"] for item in anomaly_records]
    else:
        analysis_values = [item["raw_value"] for item in anomaly_records]

    dates = [item["date"] for item in time_series]
    
    # Convert dates to fractional years (e.g., 2000.0833)
    year_fractions = []
    for d in dates:
        parts = d.split("-")
        yr = int(parts[0])
        mo = int(parts[1])
        year_fractions.append(yr + (mo - 0.5) / 12.0)
    
    x = np.array(year_fractions, dtype=float)
    y = np.array(analysis_values, dtype=float)

    # 1. OLS Regression (Ordinary Least Squares)
    ols_res = stats.linregress(x, y)
    slope_per_year = float(ols_res.slope)
    slope_per_decade = slope_per_year * 10.0
    intercept = float(ols_res.intercept)
    r_value = float(ols_res.rvalue)
    r_squared = float(r_value ** 2)
    ols_p_value = float(ols_res.pvalue)
    stderr_decade = float(ols_res.stderr) * 10.0 if ols_res.stderr else 0.0

    # 95% Confidence interval for OLS slope per decade
    df = n - 2
    t_crit = float(stats.t.ppf(0.975, df=df)) if df > 0 else 1.96
    ols_ci_margin = t_crit * stderr_decade
    ols_ci_95 = [
        round(slope_per_decade - ols_ci_margin, 4),
        round(slope_per_decade + ols_ci_margin, 4),
    ]

    # Fitted trendline points for charting
    trend_line = [
        {"date": d, "fitted_value": round(float(slope_per_year * x_val + intercept), 4)}
        for d, x_val in zip(dates, x)
    ]

    # 2. Theil-Sen Robust Estimator
    theil_res = stats.theilslopes(y, x, alpha=0.95)
    theil_slope_decade = float(theil_res.slope) * 10.0
    theil_ci_95 = [
        round(float(theil_res.low_slope) * 10.0, 4),
        round(float(theil_res.high_slope) * 10.0, 4),
    ]
    theil_intercept = float(theil_res.intercept)

    # 3. Mann-Kendall Non-Parametric Test
    mk_result = compute_mann_kendall(analysis_values)

    # 4. Extreme Climate Outliers & Records
    extreme_events = detect_extreme_events(anomaly_records, units)

    # 5. Generate Plain-Language Verdict
    verdict = _generate_plain_language_verdict(
        n=n,
        variable_name=variable_name,
        units=units,
        slope_per_decade=slope_per_decade,
        ols_p_value=ols_p_value,
        ols_ci_95=ols_ci_95,
        mk_result=mk_result,
        r_squared=r_squared,
        deseasonalized=deseasonalized,
    )

    return {
        "is_valid": True,
        "sample_size_months": n,
        "span_years": round(float(x[-1] - x[0]), 1),
        "deseasonalized": deseasonalized,
        "ols": {
            "slope_per_decade": round(slope_per_decade, 4),
            "slope_per_year": round(slope_per_year, 5),
            "intercept": round(intercept, 4),
            "r_squared": round(r_squared, 4),
            "p_value": round(ols_p_value, 6),
            "stderr_per_decade": round(stderr_decade, 4),
            "confidence_interval_95": ols_ci_95,
            "significant": bool(ols_p_value < 0.05),
        },
        "theil_sen": {
            "slope_per_decade": round(theil_slope_decade, 4),
            "intercept": round(theil_intercept, 4),
            "confidence_interval_95": theil_ci_95,
        },
        "mann_kendall": mk_result,
        "extreme_events": extreme_events,
        "verdict": verdict,
        "trend_line": trend_line,
        "processed_series": anomaly_records,
        "climatology": {int(k): round(v, 4) for k, v in climatology.items()},
    }


def _generate_plain_language_verdict(
    n: int,
    variable_name: str,
    units: str,
    slope_per_decade: float,
    ols_p_value: float,
    ols_ci_95: List[float],
    mk_result: Dict[str, Any],
    r_squared: float,
    deseasonalized: bool,
) -> Dict[str, Any]:
    """Craft an accessible, intuitive conclusion tailored for students and citizen scientists."""
    direction = "upward (increasing)" if slope_per_decade > 0 else "downward (decreasing)"
    
    # Statistical significance judgment
    is_sig = ols_p_value < 0.05 and mk_result["significant_at_05"]
    
    if n < 36:
        badge = "⚠️ Caution: Short Record"
        headline = f"Short Record ({n} months) – Preliminary Analysis Only"
        explanation = (
            f"While a rate of {slope_per_decade:+.3f} {units}/decade is measured, "
            f"climate records under 3 years are dominated by short-term weather noise. "
            f"More data is required before confirming a long-term climate trend."
        )
    elif is_sig:
        badge = "✅ Statistically Significant Trend"
        headline = f"Definite {direction.capitalize()} Trend Detected"
        explanation = (
            f"Over this period, {variable_name.lower()} changed at a statistically significant rate of "
            f"{slope_per_decade:+.3f} {units} per decade (p = {ols_p_value:.4f}). "
            f"Both the linear regression and the non-parametric Mann-Kendall test agree (Tau = {mk_result['tau']}), "
            f"meaning there is less than a 5% chance this pattern is random noise. "
            f"We are 95% confident the true decadal rate lies between {ols_ci_95[0]:+.3f} and {ols_ci_95[1]:+.3f} {units}."
        )
    else:
        badge = "ℹ️ No Significant Trend"
        headline = "No Clear Long-Term Trend Detected"
        explanation = (
            f"The computed slope is {slope_per_decade:+.3f} {units} per decade, but the p-value is {ols_p_value:.3f} "
            f"(above the standard 0.05 threshold). The variation observed in this region is within normal bounds of "
            f"year-to-year natural climate variability."
        )

    return {
        "badge": badge,
        "headline": headline,
        "direction": "upward" if slope_per_decade > 0 else "downward",
        "rate_per_decade_str": f"{slope_per_decade:+.3f} {units}/decade",
        "ci_95_str": f"[{ols_ci_95[0]:+.3f} to {ols_ci_95[1]:+.3f}] {units}/decade",
        "is_significant": is_sig,
        "explanation": explanation,
        "educational_tip": (
            "Deseasonalization subtracts the average January from every January (and so on), "
            "removing the natural summer/winter swing so that true multi-year climate shifts stand out clearly."
            if deseasonalized else
            "Raw series include the full annual summer-to-winter cycle. Try enabling deseasonalization to uncover underlying trends."
        ),
    }
