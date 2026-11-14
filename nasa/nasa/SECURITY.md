# 🛡️ Security Policy: NASA Data Detectives

## Supported Versions
| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |

## Reporting a Vulnerability
We take the security of NASA Data Detectives seriously. If you believe you have discovered a security vulnerability, please report it responsibly by contacting the maintainers directly or opening a confidential security advisory.

Please include:
- A detailed description of the vulnerability.
- Steps to reproduce or proof-of-concept (PoC).
- Potential impact.

We commit to acknowledging your report within 48 hours and providing a remediation timeline.

---

## 🔒 Security Posture & Controls

### 1. SSRF & NASA Hostname Allowlisting
All external requests for satellite observations are strictly verified against an allowlist of authorized NASA Earthdata and DAAC domains (e.g., `*.nasa.gov`, `*.earthdata.nasa.gov`, `*.eosdis.nasa.gov`, `*.asf.alaska.edu`). Attempts to supply internal IPs, localhost, or third-party addresses are rejected immediately.

### 2. Strict Input Bounds & Pydantic Validation
- Variable IDs are matched against an explicit allowlist.
- Latitudes are clamped to $[-90.0, 90.0]$, longitudes to $[-180.0, 180.0]$, and bounding box surface area is restricted to avoid server resource exhaustion.
- Dates are strictly validated to `YYYY-MM` formats within the satellite era ($1980 - 2030$).

### 3. Secret Protection & Gitleaks
NASA Earthdata login credentials (`EARTHDATA_USERNAME`, `EARTHDATA_PASSWORD`) must **only** reside in server environment variables or `.env` files that are excluded by `.gitignore`. Automated Gitleaks scanning runs in CI and as a pre-commit hook to prevent accidental secret commits.

### 4. Rate Limiting & Resource Protection
An in-memory sliding-window rate limiter prevents abuse and API denial-of-service by limiting client requests. Requests are bound by a 30-second execution timeout.

### 5. Security Headers
All API responses include strict OWASP headers:
- `Content-Security-Policy`
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy`
- `Strict-Transport-Security` (in production mode)

### 6. Non-Root Container Execution
All Docker images run under an unprivileged `appuser` / `nginx` user to mitigate potential container breakout vectors.

