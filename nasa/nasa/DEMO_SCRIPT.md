# 🎤 3-Minute Competition Demo Script: NASA Data Detectives

*Target Audience: Science Fair Judges, Hackathon Evaluators, STEM Educators, and NASA Open Source Reviewers.*
*Duration: Exactly 3 Minutes.*

---

## ⏱️ Act 1: The Problem & The Hook (0:00 - 0:40)

> *"Judges, NASA satellites collect petabytes of Earth observation data every single day. But for high school students and citizen scientists, accessing that data usually requires writing Python scripts, downloading gigabytes of NetCDF files, and wrestling with statistical anomalies.*
>
> *Too often, climate conversations devolve into opinions instead of empirical evidence.*
>
> *We built **NASA Data Detectives**—a fast, secure, and educational platform that turns any student into a climate scientist. In seconds, users can query real NASA Earth observations, isolate long-term climate signals from seasonal noise, compute rigorous statistics, and receive clear, accessible verdicts."*

---

## ⏱️ Act 2: The Guided Wizard & Hotspot Investigation (0:40 - 1:20)

*(Action: Click the "Guided Wizard (3 Questions)" purple button in the navbar.)*

> *"Let’s say a student has never studied Earth science before. They don't know dataset acronyms like MERRA-2 or MOD13C2.*
>
> *Our **3-Question Detective Wizard** asks:
> 1. Which Earth sphere interests you? *(Click Atmosphere / Air)*
> 2. Where on Earth? *(Click Arctic Polar Cap)*
> 3. Which timeline? *(Click Full Modern Satellite Era 2000-2023)*
>
> *With one click, the system recommends the exact NASA variable, draws the bounding box on our interactive Leaflet map, and fetches 24 years of monthly observations from our cached Earthdata engine."*

---

## ⏱️ Act 3: Statistical Rigor & The "Explain This" Verdict (1:20 - 2:05)

*(Action: Scroll to the Results Panel showing the Arctic Warming graph.)*

> *"Look at this graph. Weather fluctuates wildly between summer and winter. If you don't remove that annual cycle, true multi-decade trends get hidden. Our engine automatically **deseasonalizes** the series by subtracting monthly climatology.*
>
> *Next, notice our dual-statistical engine:
> - **Ordinary Least Squares (OLS)** measures a warming rate of **+0.72°C per decade** with a p-value far below 0.001.
> - But what if an outlier year skewed the result? We also run the **Theil-Sen non-parametric estimator** and the **Mann-Kendall rank test**, which confirms the upward monotonic trend with Kendall’s Tau = 0.58.
>
> *Crucially, we don't just dump numbers. Our plain-language verdict explains to the student that there is less than a 5% chance this warming is random weather luck, giving them the 95% confidence bracket."*

---

## ⏱️ Act 4: A Non-Significant Trend Comparison (2:05 - 2:30)

*(Action: Switch to a stable region, or click Sahel Belt Precipitation.)*

> *"Good science also means recognizing when there is **no** trend.
>
> *If we examine Sahel precipitation over the last 15 years, the platform displays an informative yellow banner: 'No Clear Long-Term Trend Detected (p = 0.38)'. It explains that the observed fluctuations are natural seasonal monsoon cycles, teaching students to avoid false positives."*

---

## ⏱️ Act 5: Enterprise Security & Architecture (2:30 - 3:00)

> *"Under the hood, NASA Data Detectives is built with production security from day one:
> - **Zero-Trust Host Allowlist:** External requests are strictly verified against authorized NASA domains (`*.nasa.gov`, `*.earthdata.nasa.gov`), blocking SSRF attacks cold.
> - **Pydantic Validation:** Every latitude, longitude, and date span is strictly bounded.
> - **Secret Hygiene:** NASA Earthdata credentials reside exclusively in environment variables, protected by pre-commit **Gitleaks** secret scans.
> - **Zero-Downtime Resilience:** With pre-cached offline demo fallbacks, this platform never crashes even if satellite servers undergo maintenance.
>
> *NASA Data Detectives puts the power of real satellite science directly into the hands of the next generation of researchers. Thank you!"*

