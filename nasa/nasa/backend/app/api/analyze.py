import asyncio
import re
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, HTTPException, Depends, Request, status
from pydantic import BaseModel, Field, field_validator, model_validator
import numpy as np
import scipy.stats as stats
from app.core.rate_limit import check_rate_limit
from app.services.nasa_data import NASADataService
from app.services.stats_engine import compute_comprehensive_stats, deseasonalize_series

router = APIRouter(prefix="/api/analyze", tags=["Analysis"])

ALLOWED_VARIABLES = {
    "merra2_t2m",
    "gpm_precip",
    "smap_soil_moisture",
    "modis_aod",
    "modis_ndvi",
}

DATE_REGEX = re.compile(r"^\d{4}-(0[1-9]|1[0-2])$")
MAX_BBOX_AREA_SQ_DEG = 64800.0  # Max Earth surface span
REQUEST_TIMEOUT_SECONDS = 30.0

class AnalyzeRequest(BaseModel):
    variable_id: str = Field(..., description="Target Earth science variable ID from allowlist")
    bbox: List[float] = Field(..., min_length=4, max_length=4, description="Bounding box [min_lon, min_lat, max_lon, max_lat]")
    start_date: str = Field(..., description="Start date in YYYY-MM format (e.g. 2000-01)")
    end_date: str = Field(..., description="End date in YYYY-MM format (e.g. 2023-12)")
    deseasonalized: bool = Field(True, description="Whether to subtract monthly climatology to remove seasonal cycle")

    @field_validator("variable_id")
    @classmethod
    def validate_variable(cls, v: str) -> str:
        clean_v = v.strip().lower()
        if clean_v not in ALLOWED_VARIABLES:
            raise ValueError(
                f"Variable '{v}' is not recognized. Must be one of: {', '.join(sorted(ALLOWED_VARIABLES))}"
            )
        return clean_v

    @field_validator("start_date", "end_date")
    @classmethod
    def validate_date_format(cls, v: str) -> str:
        v_clean = v.strip()
        if not DATE_REGEX.match(v_clean):
            raise ValueError("Dates must be in valid YYYY-MM format between 01 and 12 (e.g. 2010-06)")
        year = int(v_clean.split("-")[0])
        if year < 1980 or year > 2030:
            raise ValueError("Date year must be between 1980 and 2030")
        return v_clean

    @field_validator("bbox")
    @classmethod
    def validate_bbox(cls, v: List[float]) -> List[float]:
        min_lon, min_lat, max_lon, max_lat = v
        if not (-180.0 <= min_lon <= 180.0 and -180.0 <= max_lon <= 180.0):
            raise ValueError("Longitude must be between -180.0 and 180.0 degrees")
        if not (-90.0 <= min_lat <= 90.0 and -90.0 <= max_lat <= 90.0):
            raise ValueError("Latitude must be between -90.0 and 90.0 degrees")
        if min_lat >= max_lat:
            raise ValueError(f"min_lat ({min_lat}) must be strictly less than max_lat ({max_lat})")
        if min_lon >= max_lon:
            raise ValueError(f"min_lon ({min_lon}) must be strictly less than max_lon ({max_lon})")

        width = max_lon - min_lon
        height = max_lat - min_lat
        area = width * height
        if area > MAX_BBOX_AREA_SQ_DEG:
            raise ValueError(f"Bounding box area ({area:.1f} sq deg) exceeds maximum allowed limit")
        return [float(c) for c in v]

    @model_validator(mode="after")
    def validate_date_range(self) -> "AnalyzeRequest":
        start_y, start_m = map(int, self.start_date.split("-"))
        end_y, end_m = map(int, self.end_date.split("-"))
        start_months = start_y * 12 + start_m
        end_months = end_y * 12 + end_m

        if start_months > end_months:
            raise ValueError("start_date must be earlier than or equal to end_date")
        span = end_months - start_months + 1
        if span < 12:
            raise ValueError("Analysis requires at least 12 months of monthly data for seasonal evaluation")
        return self


class CorrelateRequest(BaseModel):
    primary_variable_id: str = Field(..., description="First variable ID (X-axis)")
    secondary_variable_id: str = Field(..., description="Second variable ID (Y-axis)")
    bbox: List[float] = Field(..., min_length=4, max_length=4)
    start_date: str = Field(...)
    end_date: str = Field(...)
    deseasonalized: bool = Field(True)

    @field_validator("primary_variable_id", "secondary_variable_id")
    @classmethod
    def validate_variable(cls, v: str) -> str:
        clean_v = v.strip().lower()
        if clean_v not in ALLOWED_VARIABLES:
            raise ValueError(f"Variable '{v}' must be one of: {', '.join(sorted(ALLOWED_VARIABLES))}")
        return clean_v

    @field_validator("start_date", "end_date")
    @classmethod
    def validate_date_format(cls, v: str) -> str:
        v_clean = v.strip()
        if not DATE_REGEX.match(v_clean):
            raise ValueError("Dates must be in valid YYYY-MM format")
        return v_clean

    @field_validator("bbox")
    @classmethod
    def validate_bbox(cls, v: List[float]) -> List[float]:
        min_lon, min_lat, max_lon, max_lat = v
        if not (-180.0 <= min_lon <= 180.0 and -180.0 <= max_lon <= 180.0):
            raise ValueError("Invalid longitude bounds")
        if not (-90.0 <= min_lat <= 90.0 and -90.0 <= max_lat <= 90.0):
            raise ValueError("Invalid latitude bounds")
        if min_lat >= max_lat or min_lon >= max_lon:
            raise ValueError("Min coordinates must be strictly less than Max coordinates")
        return [float(c) for c in v]


data_service = NASADataService()

@router.post("", dependencies=[Depends(check_rate_limit)], summary="Analyze Earth science trends for a region and period")
async def analyze_variable(request: Request, body: AnalyzeRequest):
    """
    Execute statistical trend detection on area-averaged NASA Earth observations:
    - Area-averaged time series
    - Deseasonalized anomalies
    - Ordinary Least Squares (OLS) slope per decade & t-test
    - Theil-Sen robust slope & 95% confidence interval
    - Mann-Kendall monotonic trend test
    - Extreme events detection (> 2σ outliers)
    - Plain-language verdict for students
    """
    try:
        raw_data = await asyncio.wait_for(
            data_service.fetch_variable_series(
                variable=body.variable_id,
                bbox=body.bbox,
                start_date=body.start_date,
                end_date=body.end_date,
            ),
            timeout=REQUEST_TIMEOUT_SECONDS
        )

        time_series = raw_data.get("time_series", [])
        units = raw_data.get("units", "")
        var_name = raw_data.get("variable_name", body.variable_id)

        stats_result = compute_comprehensive_stats(
            time_series=time_series,
            units=units,
            variable_name=var_name,
            deseasonalized=body.deseasonalized
        )

        return {
            "status": "success",
            "cached": raw_data.get("cached", False),
            "is_demo_mode": raw_data.get("is_demo_mode", False),
            "metadata": {
                "variable_id": body.variable_id,
                "variable_name": var_name,
                "units": units,
                "bbox": body.bbox,
                "start_date": body.start_date,
                "end_date": body.end_date,
                "deseasonalized": body.deseasonalized,
                "data_source": raw_data.get("data_source", "NASA Earth Science Data"),
            },
            "statistics": stats_result,
            "time_series": stats_result.get("processed_series", []),
            "trend_line": stats_result.get("trend_line", []),
        }

    except asyncio.TimeoutError:
        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail="The analysis query timed out. Please select a smaller bounding box or date range."
        )
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while analyzing NASA satellite observations. Please verify input parameters."
        )


@router.post("/correlate", dependencies=[Depends(check_rate_limit)], summary="Cross-correlate two Earth variables")
async def correlate_variables(request: Request, body: CorrelateRequest):
    """
    Compute cross-correlation and regression between two Earth variables over identical space & time:
    - Pearson correlation coefficient (r) & p-value
    - Spearman rank correlation (rho) & p-value
    - Linear regression slope & intercept
    - Scatter points for bivariate plotting
    - Plain-language interaction takeaway
    """
    try:
        # Fetch both series concurrently
        task_primary = data_service.fetch_variable_series(
            variable=body.primary_variable_id,
            bbox=body.bbox,
            start_date=body.start_date,
            end_date=body.end_date,
        )
        task_secondary = data_service.fetch_variable_series(
            variable=body.secondary_variable_id,
            bbox=body.bbox,
            start_date=body.start_date,
            end_date=body.end_date,
        )

        data_x, data_y = await asyncio.gather(task_primary, task_secondary)

        series_x = data_x.get("time_series", [])
        series_y = data_y.get("time_series", [])

        # Deseasonalize if requested
        if body.deseasonalized:
            anom_x, _ = deseasonalize_series(series_x)
            anom_y, _ = deseasonalize_series(series_y)
            vals_x = [pt["anomaly"] for pt in anom_x]
            vals_y = [pt["anomaly"] for pt in anom_y]
        else:
            vals_x = [pt["value"] for pt in series_x]
            vals_y = [pt["value"] for pt in series_y]

        min_len = min(len(vals_x), len(vals_y))
        if min_len < 12:
            raise HTTPException(status_code=400, detail="Insufficient overlapping data points for correlation")

        x = np.array(vals_x[:min_len], dtype=float)
        y = np.array(vals_y[:min_len], dtype=float)

        # Pearson r
        pearson_res = stats.pearsonr(x, y)
        r_val = float(pearson_res.statistic)
        p_val = float(pearson_res.pvalue)

        # Spearman rho
        spearman_res = stats.spearmanr(x, y)
        rho_val = float(spearman_res.statistic)

        # Linear Fit
        lin_res = stats.linregress(x, y)
        slope = float(lin_res.slope)
        intercept = float(lin_res.intercept)

        # Scatter points
        scatter_points = []
        for i in range(min_len):
            d = series_x[i]["date"]
            scatter_points.append({
                "date": d,
                "x": round(float(x[i]), 4),
                "y": round(float(y[i]), 4),
            })

        # Plain language takeaway
        strength = "strong" if abs(r_val) >= 0.6 else "moderate" if abs(r_val) >= 0.3 else "weak"
        direction = "positive" if r_val > 0 else "negative"
        is_sig = p_val < 0.05

        if is_sig:
            verdict_text = (
                f"Statistically significant {strength} {direction} correlation (r = {r_val:+.3f}, p = {p_val:.4f}). "
                f"When {data_x.get('variable_name', 'X')} increases, {data_y.get('variable_name', 'Y')} systematically "
                f"{'increases' if r_val > 0 else 'decreases'} at a rate of {slope:+.3f} {data_y.get('units')} per unit change."
            )
        else:
            verdict_text = (
                f"No statistically significant correlation found (r = {r_val:+.3f}, p = {p_val:.3f} > 0.05). "
                f"Variations in these two variables appear to operate largely independently in this region."
            )

        return {
            "status": "success",
            "primary": {
                "variable_id": body.primary_variable_id,
                "variable_name": data_x.get("variable_name"),
                "units": data_x.get("units"),
            },
            "secondary": {
                "variable_id": body.secondary_variable_id,
                "variable_name": data_y.get("variable_name"),
                "units": data_y.get("units"),
            },
            "pearson": {
                "r": round(r_val, 4),
                "r_squared": round(float(r_val ** 2), 4),
                "p_value": round(p_val, 6),
                "significant": is_sig,
            },
            "spearman": {
                "rho": round(rho_val, 4),
            },
            "regression": {
                "slope": round(slope, 4),
                "intercept": round(intercept, 4),
            },
            "verdict": verdict_text,
            "scatter_points": scatter_points,
        }

    except HTTPException:
        raise
    except Exception:
        raise HTTPException(
            status_code=500,
            detail="An error occurred while computing bivariate cross-correlation."
        )
