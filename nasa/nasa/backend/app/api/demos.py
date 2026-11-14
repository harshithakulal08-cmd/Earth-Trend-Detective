from fastapi import APIRouter

router = APIRouter(prefix="/api/demos", tags=["Demos"])

DEMOS = [
    {
        "id": "arctic_warming",
        "title": "Arctic Amplification & Polar Warming",
        "subtitle": "Discover why the Arctic is warming three times faster than the rest of the planet",
        "sphere": "air",
        "variable_id": "merra2_t2m",
        "variable_name": "Surface Air Temperature",
        "bbox": [-180.0, 66.5, 180.0, 90.0],
        "region_name": "Arctic Polar Cap (66.5°N - 90°N)",
        "start_date": "2000-01",
        "end_date": "2023-12",
        "expected_finding": "Statistically significant warming rate exceeding +0.65°C per decade with p < 0.001.",
        "story": "As reflective sea ice melts into dark ocean water, more solar heat is absorbed, causing an accelerating warming feedback loop known as Arctic Amplification."
    },
    {
        "id": "sahel_recovery",
        "title": "Sahel Monsoon Variability & Rain Trends",
        "subtitle": "Analyze rainfall fluctuations across Africa's fragile semi-arid Sahel transition zone",
        "sphere": "water",
        "variable_id": "gpm_precip",
        "variable_name": "Total Monthly Precipitation",
        "bbox": [-15.0, 10.0, 30.0, 18.0],
        "region_name": "African Sahel Belt (10°N - 18°N)",
        "start_date": "2000-01",
        "end_date": "2023-12",
        "expected_finding": "Intense summer monsoon peaks each July-August with multi-year oscillation cycles.",
        "story": "Following devastating droughts in the 1970s and 1980s, NASA satellite observations reveal how the West African monsoon has evolved and influenced pastoralist livelihoods."
    },
    {
        "id": "amazon_drying",
        "title": "Amazon Basin Soil Moisture & Drought Stress",
        "subtitle": "Examine drying trends and severe drought episodes across Earth's largest rainforest",
        "sphere": "land",
        "variable_id": "smap_soil_moisture",
        "variable_name": "Root-Zone Soil Moisture",
        "bbox": [-75.0, -15.0, -50.0, 5.0],
        "region_name": "Amazon Basin Rainforest",
        "start_date": "2000-01",
        "end_date": "2023-12",
        "expected_finding": "Noticeable negative trend in root-zone soil moisture alongside major drought dips in 2005, 2010, and 2015-16.",
        "story": "Deforestation and altered moisture recycling have diminished soil moisture retention, making the Amazon canopy more vulnerable to seasonal fires."
    }
]

@router.get("", summary="Get pre-configured interactive demo walkthroughs")
async def get_demos():
    return {
        "count": len(DEMOS),
        "demos": DEMOS
    }

