import pytest
import numpy as np
import scipy.stats as stats
from app.services.stats_engine import (
    compute_mann_kendall,
    deseasonalize_series,
    compute_comprehensive_stats,
    compute_monthly_climatology,
)


def test_mann_kendall_synthetic_trend():
    # 1. Strictly increasing series: S should be positive, p-value very small
    x = list(range(1, 31))
    mk = compute_mann_kendall(x)
    assert mk["s"] > 0
    assert mk["tau"] == 1.0
    assert mk["p_value"] < 0.001
    assert mk["significant_at_05"] is True
    assert mk["trend"] == "increasing"

    # Compare Kendall Tau with scipy.stats.kendalltau
    scipy_res = stats.kendalltau(list(range(len(x))), x)
    assert pytest.approx(mk["tau"], 0.001) == float(scipy_res.statistic)

    # 2. Strictly decreasing series: S should be negative
    y = list(range(30, 0, -1))
    mk_dec = compute_mann_kendall(y)
    assert mk_dec["s"] < 0
    assert mk_dec["tau"] == -1.0
    assert mk_dec["significant_at_05"] is True
    assert mk_dec["trend"] == "decreasing"


def test_deseasonalize_series():
    # Construct 24 months with an exact repeating cycle
    series = []
    cycle = [10.0, 12.0, 15.0, 20.0, 25.0, 30.0, 32.0, 31.0, 26.0, 20.0, 14.0, 11.0]
    for year in [2020, 2021]:
        for m_idx, val in enumerate(cycle, start=1):
            date_str = f"{year}-{m_idx:02d}"
            series.append({"date": date_str, "value": val})

    anomalies, climatology = deseasonalize_series(series)
    assert len(anomalies) == 24
    assert len(climatology) == 12

    # Because year 1 and year 2 are identical, climatology equals the cycle exactly,
    # and all anomalies should be approximately 0.0
    for item in anomalies:
        assert pytest.approx(item["anomaly"], abs=1e-3) == 0.0


def test_comprehensive_stats_ols_and_theil_sen():
    # 48 months of linear warming with known rate: 0.1 deg/year = 1.0 deg/decade
    dates = []
    series = []
    base_val = 15.0
    for yr in range(2000, 2004):
        for mo in range(1, 13):
            d_str = f"{yr}-{mo:02d}"
            # Month index 0 to 47
            month_idx = (yr - 2000) * 12 + (mo - 1)
            warming = month_idx * (0.1 / 12.0)
            series.append({"date": d_str, "value": base_val + warming})

    res = compute_comprehensive_stats(series, "°C", "Temperature", deseasonalized=False)
    assert res["is_valid"] is True
    assert res["sample_size_months"] == 48

    # OLS slope per decade should be close to 1.0
    assert pytest.approx(res["ols"]["slope_per_decade"], 0.05) == 1.0
    assert res["ols"]["p_value"] < 0.01
    assert res["ols"]["significant"] is True

    # Theil-Sen slope should also be close to 1.0
    assert pytest.approx(res["theil_sen"]["slope_per_decade"], 0.05) == 1.0

    # Verdict
    assert res["verdict"]["is_significant"] is True
    assert "Definite" in res["verdict"]["headline"]

