import os
import json
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

router = APIRouter(prefix="/api/variables", tags=["Variables"])

CATALOG_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "catalog.json")

def load_catalog() -> List[dict]:
    with open(CATALOG_PATH, "r", encoding="utf-8") as f:
        return json.load(f)

@router.get("", summary="List and search Earth science variables")
async def list_variables(
    q: Optional[str] = Query(None, description="Search keyword in variable name or definition"),
    sphere: Optional[str] = Query(None, description="Filter by Earth system sphere: land, air, water"),
):
    try:
        catalog = load_catalog()
    except Exception:
        raise HTTPException(status_code=500, detail="Unable to load variable catalogue")

    results = catalog

    if sphere:
        sphere_clean = sphere.strip().lower()
        results = [v for v in results if v.get("sphere", "").lower() == sphere_clean]

    if q:
        query_lower = q.strip().lower()
        results = [
            v for v in results
            if query_lower in v.get("name", "").lower()
            or query_lower in v.get("short_name", "").lower()
            or query_lower in v.get("plain_definition", "").lower()
            or query_lower in v.get("why_it_matters", "").lower()
            or query_lower in v.get("id", "").lower()
        ]

    return {
        "count": len(results),
        "variables": results
    }

@router.get("/{variable_id}", summary="Get detailed metadata for a variable")
async def get_variable(variable_id: str):
    catalog = load_catalog()
    for v in catalog:
        if v["id"].lower() == variable_id.lower():
            return v
    raise HTTPException(status_code=404, detail="Variable not found in catalogue")

