import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.config import settings

client = TestClient(app)


def test_abuse_oversized_bbox():
    # Longitude inverted or out-of-range bbox
    payload = {
        "variable_id": "merra2_t2m",
        "bbox": [-190.0, -100.0, 190.0, 100.0],
        "start_date": "2000-01",
        "end_date": "2020-12",
        "deseasonalized": True
    }
    response = client.post("/api/analyze", json=payload)
    assert response.status_code == 422


def test_abuse_inverted_lat_lon():
    # min_lat >= max_lat
    payload = {
        "variable_id": "merra2_t2m",
        "bbox": [10.0, 50.0, 20.0, 10.0],  # min_lat (50) > max_lat (10)
        "start_date": "2000-01",
        "end_date": "2020-12",
        "deseasonalized": True
    }
    response = client.post("/api/analyze", json=payload)
    assert response.status_code == 422


def test_abuse_malformed_dates():
    # Bad date format
    payload = {
        "variable_id": "merra2_t2m",
        "bbox": [-10.0, 10.0, 10.0, 30.0],
        "start_date": "not-a-date",
        "end_date": "2020-13",
        "deseasonalized": True
    }
    response = client.post("/api/analyze", json=payload)
    assert response.status_code == 422


def test_abuse_injection_strings():
    # SQL injection / XSS attempt in variable_id
    payload = {
        "variable_id": "merra2_t2m'; DROP TABLE users; -- <script>alert(1)</script>",
        "bbox": [-10.0, 10.0, 10.0, 30.0],
        "start_date": "2000-01",
        "end_date": "2020-12",
        "deseasonalized": True
    }
    response = client.post("/api/analyze", json=payload)
    assert response.status_code == 422


def test_security_headers_present():
    response = client.get("/health")
    assert response.status_code == 200
    headers = response.headers
    assert headers.get("X-Content-Type-Options") == "nosniff"
    assert headers.get("X-Frame-Options") == "DENY"
    assert headers.get("Referrer-Policy") == "strict-origin-when-cross-origin"
    assert "Content-Security-Policy" in headers


def test_catalogue_endpoint():
    response = client.get("/api/variables")
    assert response.status_code == 200
    data = response.json()
    assert data["count"] == 5
    vars_list = data["variables"]
    var_ids = {v["id"] for v in vars_list}
    assert "merra2_t2m" in var_ids
    assert "gpm_precip" in var_ids
    assert "smap_soil_moisture" in var_ids


def test_demos_endpoint():
    response = client.get("/api/demos")
    assert response.status_code == 200
    data = response.json()
    assert data["count"] >= 3
    demo_ids = [d["id"] for d in data["demos"]]
    assert "arctic_warming" in demo_ids


def test_successful_analyze_endpoint():
    payload = {
        "variable_id": "merra2_t2m",
        "bbox": [-180.0, 66.5, 180.0, 90.0],
        "start_date": "2000-01",
        "end_date": "2023-12",
        "deseasonalized": True
    }
    response = client.post("/api/analyze", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert "statistics" in data
    assert data["statistics"]["is_valid"] is True
    assert "ols" in data["statistics"]
    assert "verdict" in data["statistics"]

