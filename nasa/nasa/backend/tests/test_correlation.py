import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_correlation_endpoint():
    payload = {
        "primary_variable_id": "merra2_t2m",
        "secondary_variable_id": "smap_soil_moisture",
        "bbox": [-75.0, -15.0, -50.0, 5.0],
        "start_date": "2000-01",
        "end_date": "2023-12",
        "deseasonalized": True,
    }
    response = client.post("/api/analyze/correlate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert "pearson" in data
    assert "r" in data["pearson"]
    assert "p_value" in data["pearson"]
    assert "scatter_points" in data
    assert len(data["scatter_points"]) == 288
    assert "verdict" in data
    assert "correlation" in data["verdict"].lower()


def test_correlation_invalid_variable():
    payload = {
        "primary_variable_id": "invalid_var",
        "secondary_variable_id": "smap_soil_moisture",
        "bbox": [-75.0, -15.0, -50.0, 5.0],
        "start_date": "2000-01",
        "end_date": "2023-12",
        "deseasonalized": True,
    }
    response = client.post("/api/analyze/correlate", json=payload)
    assert response.status_code == 422

