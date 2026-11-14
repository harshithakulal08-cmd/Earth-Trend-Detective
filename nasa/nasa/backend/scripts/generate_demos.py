import os
import json
from app.services.nasa_data import NASADataService, get_cache_filename

def main():
    svc = NASADataService()
    demos = [
        {
            "key": "arctic_temp",
            "var": "merra2_t2m",
            "bbox": [-180.0, 66.5, 180.0, 90.0],
            "start": "2000-01",
            "end": "2023-12",
            "desc": "Arctic Polar Cap (Warming Amplification)",
        },
        {
            "key": "sahel_precip",
            "var": "gpm_precip",
            "bbox": [-15.0, 10.0, 30.0, 18.0],
            "start": "2000-01",
            "end": "2023-12",
            "desc": "Sahel Belt (Monsoon Rainfall & Drought Recovery)",
        },
        {
            "key": "amazon_soil",
            "var": "smap_soil_moisture",
            "bbox": [-75.0, -15.0, -50.0, 5.0],
            "start": "2000-01",
            "end": "2023-12",
            "desc": "Amazon Basin (Soil Moisture & Drying Trend)",
        },
    ]

    for d in demos:
        series = svc._generate_realistic_earth_series(d["var"], d["bbox"], d["start"], d["end"], False)
        series["demo_preset"] = d["desc"]
        fn, digest = get_cache_filename(d["var"], d["bbox"], d["start"], d["end"])

        for target_dir in [svc.demo_dir, svc.cache_dir]:
            os.makedirs(target_dir, exist_ok=True)
            p = os.path.join(target_dir, fn)
            with open(p, "w", encoding="utf-8") as f:
                json.dump(series, f, indent=2)

        named_p = os.path.join(svc.demo_dir, f"{d['key']}.json")
        with open(named_p, "w", encoding="utf-8") as f:
            json.dump(series, f, indent=2)

        print(f"Generated demo {d['key']} -> {fn} ({len(series['time_series'])} months)")

if __name__ == "__main__":
    main()

