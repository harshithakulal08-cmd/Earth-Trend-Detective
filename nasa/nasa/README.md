# 🛰️ NASA Data Detectives

An educational, interactive web platform empowering students, citizen scientists, and researchers to explore real NASA Earth Science satellite data, detect climate trends, and understand environmental change through rigorous, accessible statistical analysis.

---

## 📌 Project Overview & MVP Scope

NASA Data Detectives bridges the gap between raw Earth observation datasets and high school / undergraduate education. By selecting a geographic region and timeframe, users can analyze monthly anomalies, compute decadal trends (Ordinary Least Squares & Theil-Sen estimator), evaluate statistical significance (Mann-Kendall test), and receive plain-language verdicts.

### The 5 MVP Earth Science Variables

| Variable | Earth System Sphere | Target NASA Product / Source | Units | Description |
| :--- | :--- | :--- | :--- | :--- |
| **Surface Temperature** | Atmosphere / Land | MERRA-2 (M2TMNXSLV) | °C / K | Monthly mean 2-meter air temperature |
| **Total Precipitation** | Hydrosphere | GPM IMERG / MERRA-2 | mm/month | Monthly precipitation accumulation |
| **Soil Moisture** | Hydrosphere / Land | SMAP / GLDAS | $m^3/m^3$ | Surface / root zone soil moisture content |
| **Aerosol Optical Depth** | Atmosphere | MODIS Terra/Aqua / MERRA-2 | Dimensionless | 550nm atmospheric particulate concentration |
| **Vegetation Index (NDVI)** | Biosphere | MODIS Terra (MOD13C2) | Dimensionless (-1 to 1) | Normalized Difference Vegetation Index (greenness) |

---

## 🛠️ Technology Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, Leaflet (interactive spatial bounding box selector), Chart.js / Plotly (time series & confidence intervals)
- **Backend**: FastAPI (Python 3.13), Pydantic v2, Uvicorn, NumPy, SciPy, Pandas
- **Data Access & Caching**: NASA Earthdata API via `earthaccess`, SHA-256 hashed disk cache with offline demo fallbacks
- **Security & Quality**: Gitleaks pre-commit secret scanning, strict CORS, input validation, non-root Docker containers, OWASP-aligned security headers
- **DevOps**: Docker, Docker Compose

---

## 📂 Project Structure

```text
nasa/
├── .github/                     # CI/CD workflows and automated checks
├── .gitignore                   # Excludes secrets (.env), caches, node_modules
├── .env.example                 # Example environment variables template
├── .gitleaks.toml               # Secret detection rules configuration
├── .pre-commit-config.yaml      # Git hooks configuration (Gitleaks, linting)
├── docker-compose.yml           # Multi-container orchestration
├── README.md                    # Project documentation
├── backend/                     # FastAPI Python Backend
│   ├── app/
│   │   ├── api/                 # REST API route handlers
│   │   ├── core/                # App configuration, security settings
│   │   ├── data/                # Variable catalogue & pre-cached datasets
│   │   ├── services/            # NASA data access & statistical engine
│   │   └── main.py              # Application entrypoint & middleware
│   ├── tests/                   # Pytest test suite
│   ├── Dockerfile               # Production non-root container image
│   └── requirements.txt         # Pinned Python dependencies
└── frontend/                    # React + TypeScript + Vite Frontend
    ├── src/
    │   ├── components/          # Map, chart, wizard, & results components
    │   ├── hooks/               # Custom React data hooks
    │   ├── services/            # API client
    │   ├── App.tsx              # Root application component
    │   └── main.tsx             # Entry point
    ├── public/                  # Static assets
    ├── Dockerfile               # Production multi-stage Nginx container
    └── package.json             # NPM dependencies & scripts
```

---

## 🚀 Quickstart Guide

### Prerequisites
- Node.js (v20+ recommended)
- Python (v3.11+ recommended)
- Git
- (Optional) Docker & Docker Compose

### 1. Clone & Setup Environment
```bash
git clone <repository-url>
cd nasa
cp .env.example .env
```

Edit `.env` to supply your NASA Earthdata credentials (register free at [urs.earthdata.nasa.gov](https://urs.earthdata.nasa.gov/)). Note: The platform includes offline pre-cached demo datasets so you can run and test without active credentials.

### 2. Run Backend
```bash
cd backend
python -m venv .venv
# On Windows:
.venv\Scripts\activate
# On macOS/Linux:
# source .venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```
API Documentation will be available at: [http://localhost:8000/docs](http://localhost:8000/docs)

### 3. Run Frontend
```bash
cd frontend
npm install
npm run dev
```
Frontend will be available at: [http://localhost:5173](http://localhost:5173)

### 4. Running with Docker Compose
```bash
docker-compose up --build
```
- Frontend: [http://localhost:3000](http://localhost:3000)
- Backend: [http://localhost:8000](http://localhost:8000)

---

## 🔒 Security & Secret Scanning

We use **Gitleaks** to prevent credentials from ever entering the Git history.
To run a local secret scan:
```bash
# If gitleaks is installed:
gitleaks detect --verbose --config .gitleaks.toml

# Using pre-commit:
pre-commit install
pre-commit run --all-files
```

---

## 🗺️ Roadmap & Milestones

- [x] **Step 1: Decide scope and stack** (Structure, Git, .gitignore, .env.example, README, Gitleaks)
- [ ] **Step 2: Get NASA data access working** (`earthaccess`, disk caching, NASA hostnames allowlist, 3 demo datasets)
- [ ] **Step 3: Build the variable catalogue** (5 variables in JSON with student-friendly definitions, search endpoint)
- [ ] **Step 4: Build the statistics engine** (Deseasonalization, OLS & Theil-Sen per decade, Mann-Kendall, t-test, CI)
- [ ] **Step 5: Build a secure API** (`POST /analyze`, strict Pydantic bounds, rate limiting, error abstraction)
- [ ] **Step 6: Build the front end** (Leaflet map bbox tool, presets, variable picker, time series chart, results verdict)
- [ ] **Step 7: Add guided wizard and demos** (3-question wizard, 2 offline demo walkthroughs)
- [ ] **Step 8: Harden security** (CSP, security headers, abuse tests, non-root Docker, SECURITY.md)
- [ ] **Step 9: Test and polish** (Scientific validation, loading/empty states, citations, uncertainty notes)
- [ ] **Step 10: Deploy and prepare demo** (Deployment configurations, 3-minute presentation script)

