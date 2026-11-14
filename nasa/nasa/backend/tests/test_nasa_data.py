import pytest
from app.services.nasa_data import is_allowed_nasa_url, get_cache_filename, NASADataService


def test_allowed_nasa_urls():
    # Valid NASA endpoints
    assert is_allowed_nasa_url("https://urs.earthdata.nasa.gov/api/v1") is True
    assert is_allowed_nasa_url("https://gesdisc.eosdis.nasa.gov/data") is True
    assert is_allowed_nasa_url("https://appeears.earthdatacloud.nasa.gov/api") is True
    assert is_allowed_nasa_url("https://data.lpdaac.usgs.gov/products") is True
    assert is_allowed_nasa_url("https://asf.alaska.edu/sar") is True

    # Malicious / SSRF attempts
    assert is_allowed_nasa_url("https://malicious-site.com/exploit") is False
    assert is_allowed_nasa_url("http://169.254.169.254/latest/meta-data") is False
    assert is_allowed_nasa_url("http://localhost:8000/internal") is False
    assert is_allowed_nasa_url("https://nasa.gov.evilcorp.com") is False
    assert is_allowed_nasa_url("") is False


def test_cache_filename_deterministic():
    fn1, digest1 = get_cache_filename("merra2_t2m", [-180.0, 66.5, 180.0, 90.0], "2000-01", "2023-12")
    fn2, digest2 = get_cache_filename("merra2_t2m", [-180.0, 66.5, 180.0, 90.0], "2000-01", "2023-12")
    assert fn1 == fn2
    assert digest1 == digest2
    assert fn1.startswith("merra2_t2m_")
    assert fn1.endswith(".json")


def test_demo_datasets_cached():
    svc = NASADataService()
    # Check Arctic temperature demo
    cached = svc.get_cached_series("merra2_t2m", [-180.0, 66.5, 180.0, 90.0], "2000-01", "2023-12")
    assert cached is not None
    assert len(cached["time_series"]) == 288
    assert cached["variable_id"] == "merra2_t2m"

