import type { EarthVariable, AnalysisResponse, DemoItem } from "../types";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

export async function fetchVariables(q?: string, sphere?: string): Promise<EarthVariable[]> {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (sphere) params.set("sphere", sphere);
  
  const res = await fetch(`${API_BASE}/variables?${params.toString()}`);
  if (!res.ok) {
    throw new Error(`Failed to load variables: ${res.statusText}`);
  }
  const data = await res.json();
  return data.variables || [];
}

export async function analyzeData(payload: {
  variable_id: string;
  bbox: [number, number, number, number];
  start_date: string;
  end_date: string;
  deseasonalized: boolean;
}): Promise<AnalysisResponse> {
  const res = await fetch(`${API_BASE}/analyze`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const message = errorData.detail || `Analysis failed with status ${res.status}`;
    throw new Error(message);
  }

  return await res.json();
}

export async function fetchDemos(): Promise<DemoItem[]> {
  const res = await fetch(`${API_BASE}/demos`);
  if (!res.ok) {
    throw new Error("Failed to load demo walkthroughs");
  }
  const data = await res.json();
  return data.demos || [];
}

export async function checkBackendHealth(): Promise<{ status: string; environment: string } | null> {
  try {
    const res = await fetch(`${API_BASE.replace("/api", "")}/health`, { method: "GET" });
    if (res.ok) return await res.json();
    return null;
  } catch {
    return null;
  }
}
