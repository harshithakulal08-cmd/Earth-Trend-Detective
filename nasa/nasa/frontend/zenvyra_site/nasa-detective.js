/**
 * NASA DATA DETECTIVE — PROFESSIONAL SCIENTIFIC SUITE
 * 2026 NASA Space Apps Challenge: Earth Science Change & Significance
 * Minimal, glassmorphic, telemetry-focused interface.
 */

(function () {
  'use strict';

  const API_BASE = '/api';

  // State
  let currentAnalysis = null;
  let activeHoverPoint = null;

  // Curated Bioclimatic Presets
  const PRESETS = {
    arctic: {
      name: 'Arctic Warming',
      label: 'Arctic Polar Cap (66.5°N – 90°N)',
      variable_id: 'merra2_t2m',
      bbox: [-180.0, 66.5, 180.0, 90.0],
      start_date: '2000-01',
      end_date: '2023-12'
    },
    amazon: {
      name: 'Amazon Drying',
      label: 'Amazon Basin Rainforest',
      variable_id: 'smap_soil_moisture',
      bbox: [-75.0, -15.0, -50.0, 5.0],
      start_date: '2000-01',
      end_date: '2023-12'
    },
    sahel: {
      name: 'Sahel Monsoon',
      label: 'African Sahel Transition Belt',
      variable_id: 'gpm_precip',
      bbox: [-15.0, 10.0, 30.0, 18.0],
      start_date: '2000-01',
      end_date: '2023-12'
    }
  };

  const REGIONS = {
    arctic: { name: 'Arctic Polar Cap (66.5°N – 90°N)', bbox: [-180.0, 66.5, 180.0, 90.0] },
    amazon: { name: 'Amazon Rainforest Basin', bbox: [-75.0, -15.0, -50.0, 5.0] },
    sahel: { name: 'African Sahel Transition Belt', bbox: [-15.0, 10.0, 30.0, 18.0] },
    mediterranean: { name: 'Mediterranean Basin', bbox: [-10.0, 30.0, 40.0, 46.0] },
    south_asia: { name: 'South Asia (Indo-Gangetic)', bbox: [65.0, 10.0, 95.0, 35.0] },
    north_america: { name: 'Continental North America', bbox: [-125.0, 25.0, -70.0, 50.0] },
    global: { name: 'Global Extent (-60° to 60°)', bbox: [-180.0, -60.0, 180.0, 60.0] }
  };

  let dom = {};

  function init() {
    createUI();
    cacheDOM();
    bindEvents();

    // Check URL query parameters
    const params = new URLSearchParams(window.location.search);
    if (params.has('detective') || params.has('nasa')) {
      const presetKey = params.get('preset') || 'arctic';
      setTimeout(() => {
        openModal();
        if (PRESETS[presetKey]) {
          dom.presetBtns.forEach(b => b.classList.toggle('active', b.getAttribute('data-preset') === presetKey));
          loadPreset(presetKey);
        } else {
          runAnalysis();
        }
      }, 400);
    }
  }

  function createUI() {
    // 1. Navigation Pill
    const trigger = document.createElement('button');
    trigger.id = 'nasa-detective-trigger';
    trigger.setAttribute('aria-label', 'NASA Climate Trends');
    trigger.innerHTML = `
      <span class="nasa-dot"></span>
      <span>NASA Trends</span>
    `;
    document.body.appendChild(trigger);

    // 2. Glassmorphic Modal
    const modal = document.createElement('div');
    modal.id = 'nasa-detective-modal';
    modal.className = 'nasa-modal-overlay';
    modal.innerHTML = `
      <div class="nasa-modal-container">
        <!-- Header -->
        <div class="nasa-glass-header">
          <div class="nasa-header-title-wrap">
            <h3 class="nasa-glass-title">NASA Trend Analysis</h3>
            <span class="nasa-tag">Space Apps 2026</span>
          </div>

          <div class="nasa-header-right">
            <!-- Preset Case Studies -->
            <div class="nasa-presets-bar">
              <button class="nasa-preset-btn active" data-preset="arctic">Arctic Warming</button>
              <button class="nasa-preset-btn" data-preset="amazon">Amazon Drying</button>
              <button class="nasa-preset-btn" data-preset="sahel">Sahel Monsoon</button>
            </div>
            <button id="nasa-close-modal" class="nasa-close-ico" aria-label="Close">×</button>
          </div>
        </div>

        <!-- Filter Bar -->
        <div class="nasa-filter-bar">
          <div class="nasa-filter-group">
            <div class="nasa-field">
              <span class="nasa-field-label">Variable</span>
              <select id="nasa-var-select" class="nasa-glass-select">
                <option value="merra2_t2m">Surface Temperature (MERRA-2, °C)</option>
                <option value="gpm_precip">Precipitation (GPM IMERG, mm/mo)</option>
                <option value="smap_soil_moisture">Soil Moisture (SMAP, m³/m³)</option>
                <option value="modis_aod">Aerosols (MODIS AOD 550nm)</option>
                <option value="modis_ndvi">Vegetation Index (MODIS NDVI)</option>
              </select>
            </div>

            <div class="nasa-field">
              <span class="nasa-field-label">Region</span>
              <select id="nasa-region-select" class="nasa-glass-select">
                <option value="arctic">Arctic Polar Cap (66.5°N – 90°N)</option>
                <option value="amazon">Amazon Rainforest Basin</option>
                <option value="sahel">African Sahel Transition Belt</option>
                <option value="mediterranean">Mediterranean Basin</option>
                <option value="south_asia">South Asia (Indo-Gangetic)</option>
                <option value="north_america">Continental North America</option>
                <option value="global">Global (-60° to 60°)</option>
              </select>
            </div>

            <div class="nasa-field">
              <label class="nasa-checkbox-wrap">
                <input id="nasa-deseason-check" type="checkbox" checked />
                <span>Deseasonalized</span>
              </label>
            </div>
          </div>

          <div class="nasa-filter-actions">
            <button id="nasa-run-btn" class="nasa-primary-btn">Analyze</button>
          </div>
        </div>

        <!-- Main Workspace -->
        <div class="nasa-modal-workspace">
          <!-- Chart -->
          <div class="nasa-chart-shell">
            <div class="nasa-chart-topline">
              <span id="nasa-series-title" class="nasa-series-title">Surface Air Temperature — Arctic Polar Cap (2000 – 2023)</span>
              <div class="nasa-series-legend">
                <div class="nasa-legend-entry">
                  <span class="nasa-legend-line" style="background: #39e6d4;"></span>
                  <span>Deseasonalized Anomaly</span>
                </div>
                <div class="nasa-legend-entry">
                  <span class="nasa-legend-line" style="background: #ff9d45; border-top: 1px dashed #ff9d45;"></span>
                  <span>Linear / Theil-Sen Trend</span>
                </div>
              </div>
            </div>

            <div class="nasa-canvas-viewport">
              <canvas id="nasa-timeseries-canvas"></canvas>
              <div id="nasa-chart-tooltip"></div>
            </div>
          </div>

          <!-- Telemetry Strip -->
          <div class="nasa-telemetry-bar">
            <div class="nasa-telemetry-cell">
              <span class="nasa-cell-label">Decadal Trend</span>
              <span id="nasa-stat-rate" class="nasa-cell-value">+0.651 °C / dec</span>
              <span id="nasa-stat-rate-sub" class="nasa-cell-sub">95% CI: [+0.58, +0.73]</span>
            </div>

            <div class="nasa-telemetry-cell">
              <span class="nasa-cell-label">Mann-Kendall Test</span>
              <span id="nasa-stat-mk" class="nasa-cell-value">
                <span id="nasa-stat-dot" class="nasa-indicator-dot sig"></span>
                <span id="nasa-stat-p">p &lt; 0.001</span>
              </span>
              <span id="nasa-stat-mk-sub" class="nasa-cell-sub">Z = 12.95 · τ = 0.51</span>
            </div>

            <div class="nasa-telemetry-cell">
              <span class="nasa-cell-label">Variance Explained</span>
              <span id="nasa-stat-r2" class="nasa-cell-value">R² = 0.50</span>
              <span id="nasa-stat-fit-sub" class="nasa-cell-sub">Std Error = 0.038</span>
            </div>

            <div class="nasa-telemetry-cell">
              <span class="nasa-cell-label">Net Shift</span>
              <span id="nasa-stat-total" class="nasa-cell-value">+1.56 °C</span>
              <span id="nasa-stat-total-sub" class="nasa-cell-sub">288 monthly observations</span>
            </div>
          </div>

          <!-- Footer Insight & Exports -->
          <div class="nasa-footer-strip">
            <div id="nasa-scientific-verdict" class="nasa-scientific-verdict">
              Statistically significant warming trend detected across 24 years (p &lt; 0.001). Seasonal variance removed via multi-year monthly climatology.
            </div>

            <div class="nasa-footer-actions">
              <button id="nasa-export-csv" class="nasa-ghost-btn">CSV</button>
              <button id="nasa-export-img" class="nasa-ghost-btn">PNG</button>
            </div>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }

  function cacheDOM() {
    dom = {
      trigger: document.getElementById('nasa-detective-trigger'),
      modal: document.getElementById('nasa-detective-modal'),
      closeModal: document.getElementById('nasa-close-modal'),
      presetBtns: document.querySelectorAll('.nasa-preset-btn'),

      varSelect: document.getElementById('nasa-var-select'),
      regionSelect: document.getElementById('nasa-region-select'),
      deseasonCheck: document.getElementById('nasa-deseason-check'),
      runBtn: document.getElementById('nasa-run-btn'),

      seriesTitle: document.getElementById('nasa-series-title'),
      canvas: document.getElementById('nasa-timeseries-canvas'),
      tooltip: document.getElementById('nasa-chart-tooltip'),

      statRate: document.getElementById('nasa-stat-rate'),
      statRateSub: document.getElementById('nasa-stat-rate-sub'),
      statDot: document.getElementById('nasa-stat-dot'),
      statP: document.getElementById('nasa-stat-p'),
      statMkSub: document.getElementById('nasa-stat-mk-sub'),
      statR2: document.getElementById('nasa-stat-r2'),
      statFitSub: document.getElementById('nasa-stat-fit-sub'),
      statTotal: document.getElementById('nasa-stat-total'),
      statTotalSub: document.getElementById('nasa-stat-total-sub'),
      verdictText: document.getElementById('nasa-scientific-verdict'),

      exportCsv: document.getElementById('nasa-export-csv'),
      exportImg: document.getElementById('nasa-export-img')
    };
  }

  function bindEvents() {
    // Open/Close
    dom.trigger.addEventListener('click', () => {
      openModal();
      if (!currentAnalysis) runAnalysis();
    });
    dom.closeModal.addEventListener('click', closeModal);
    dom.modal.addEventListener('click', (e) => {
      if (e.target === dom.modal) closeModal();
    });

    // Run
    dom.runBtn.addEventListener('click', () => runAnalysis());

    // Presets
    dom.presetBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        dom.presetBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const key = btn.getAttribute('data-preset');
        loadPreset(key);
      });
    });

    // Chart mouse interactions
    dom.canvas.addEventListener('mousemove', onChartMouseMove);
    dom.canvas.addEventListener('mouseleave', () => {
      dom.tooltip.style.opacity = '0';
      activeHoverPoint = null;
      renderChart(currentAnalysis);
    });

    // Exports
    dom.exportCsv.addEventListener('click', exportCSV);
    dom.exportImg.addEventListener('click', exportImage);

    // Resize
    window.addEventListener('resize', () => {
      if (dom.modal.classList.contains('active') && currentAnalysis) {
        renderChart(currentAnalysis);
      }
    });
  }

  function openModal() {
    dom.modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    dom.modal.classList.remove('active');
    document.body.style.overflow = '';
  }

  function loadPreset(key) {
    const p = PRESETS[key];
    if (!p) return;

    dom.varSelect.value = p.variable_id;
    dom.regionSelect.value = key;
    dom.deseasonCheck.checked = true;

    runAnalysisWithBbox(p.bbox, p.label, p.start_date, p.end_date);
  }

  async function runAnalysis() {
    const regionKey = dom.regionSelect.value;
    const regionObj = REGIONS[regionKey] || REGIONS.arctic;
    await runAnalysisWithBbox(regionObj.bbox, regionObj.name, '2000-01', '2023-12');
  }

  async function runAnalysisWithBbox(bbox, regionName, startDate = '2000-01', endDate = '2023-12') {
    dom.runBtn.disabled = true;
    dom.runBtn.textContent = 'Computing...';

    const payload = {
      variable_id: dom.varSelect.value,
      bbox: bbox,
      start_date: startDate,
      end_date: endDate,
      deseasonalized: dom.deseasonCheck.checked
    };

    try {
      const res = await fetch(`${API_BASE}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error('Analysis request failed');

      const data = await res.json();
      currentAnalysis = data;
      currentAnalysis.regionName = regionName;

      displayResults(data, regionName);
    } catch (err) {
      console.error(err);
    } finally {
      dom.runBtn.disabled = false;
      dom.runBtn.textContent = 'Analyze';
    }
  }

  function displayResults(data, regionName) {
    const stats = data.statistics || {};
    const meta = data.metadata || {};
    const mk = stats.mann_kendall || {};
    const ols = stats.ols || {};
    const verdict = stats.verdict || {};

    // Title
    dom.seriesTitle.textContent = `${meta.variable_name} — ${regionName} (${meta.start_date.slice(0, 4)} – ${meta.end_date.slice(0, 4)})`;

    // 1. Rate of Change
    const rateSign = ols.slope_per_decade > 0 ? '+' : '';
    dom.statRate.textContent = `${rateSign}${ols.slope_per_decade?.toFixed(3)} ${meta.units}/dec`;
    dom.statRateSub.textContent = verdict.ci_95_str ? `95% CI: ${verdict.ci_95_str}` : `95% CI [Theil-Sen slope]`;

    // 2. Mann-Kendall Significance
    const isSig = mk.significant_at_05 || verdict.is_significant;
    dom.statDot.className = `nasa-indicator-dot ${isSig ? 'sig' : 'non-sig'}`;
    const pStr = mk.p_value !== undefined ? (mk.p_value < 0.001 ? 'p < 0.001' : `p = ${mk.p_value.toFixed(3)}`) : 'N/A';
    dom.statP.textContent = `${isSig ? 'Significant' : 'Non-significant'} · ${pStr}`;
    dom.statMkSub.textContent = `Z = ${mk.z?.toFixed(2) || '0.00'} · τ = ${mk.tau?.toFixed(2) || '0.00'}`;

    // 3. R2 & Model Fit
    dom.statR2.textContent = ols.r_squared !== undefined ? `R² = ${ols.r_squared.toFixed(2)}` : 'R² = N/A';
    dom.statFitSub.textContent = `Std Error = ${ols.stderr_per_decade?.toFixed(3) || '0.00'}`;

    // 4. Net Cumulative Change
    const totalDelta = ols.slope_per_decade && stats.span_years ? (ols.slope_per_decade * (stats.span_years / 10)) : 0;
    dom.statTotal.textContent = `${totalDelta > 0 ? '+' : ''}${totalDelta.toFixed(2)} ${meta.units}`;
    dom.statTotalSub.textContent = `${stats.sample_size_months || 0} monthly observations`;

    // 5. Scientific Verdict
    dom.verdictText.textContent = verdict.explanation || 'Analysis complete.';

    renderChart(data);
  }

  function renderChart(data) {
    if (!data || !dom.canvas) return;

    const canvas = dom.canvas;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;

    const rect = canvas.parentElement.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;

    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, w, h);

    const series = data.time_series || [];
    const trend = data.trend_line || [];
    if (series.length < 2) return;

    const pad = { top: 16, right: 20, bottom: 26, left: 45 };
    const plotW = w - pad.left - pad.right;
    const plotH = h - pad.top - pad.bottom;

    const deseasonalized = data.metadata.deseasonalized;
    const values = series.map(d => deseasonalized ? d.anomaly : d.raw_value);
    const trendVals = trend.map(t => t.fitted_value);

    let allY = [...values, ...trendVals].filter(v => v !== null && !isNaN(v));
    let minY = Math.min(...allY);
    let maxY = Math.max(...allY);

    if (minY === maxY) {
      minY -= 1;
      maxY += 1;
    }
    const yMargin = (maxY - minY) * 0.1;
    minY -= yMargin;
    maxY += yMargin;

    const getX = (i) => pad.left + (i / (series.length - 1)) * plotW;
    const getY = (val) => pad.top + plotH - ((val - minY) / (maxY - minY)) * plotH;

    // Grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.lineWidth = 1;

    const ySteps = 4;
    for (let i = 0; i <= ySteps; i++) {
      const yVal = minY + (i / ySteps) * (maxY - minY);
      const yPos = getY(yVal);

      ctx.beginPath();
      ctx.moveTo(pad.left, yPos);
      ctx.lineTo(pad.left + plotW, yPos);
      ctx.stroke();

      ctx.fillStyle = 'rgba(255, 253, 226, 0.35)';
      ctx.font = '9px ui-monospace, monospace';
      ctx.textAlign = 'right';
      ctx.fillText(yVal.toFixed(2), pad.left - 6, yPos + 3);
    }

    // Zero baseline
    if (deseasonalized && minY <= 0 && maxY >= 0) {
      const zeroY = getY(0);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.setLineDash([2, 3]);
      ctx.beginPath();
      ctx.moveTo(pad.left, zeroY);
      ctx.lineTo(pad.left + plotW, zeroY);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // X-Axis Year Ticks
    const yearInterval = Math.max(1, Math.floor(series.length / 6));
    ctx.fillStyle = 'rgba(255, 253, 226, 0.35)';
    ctx.textAlign = 'center';

    for (let i = 0; i < series.length; i += yearInterval) {
      const d = series[i];
      const xPos = getX(i);
      ctx.fillText(d.date.slice(0, 4), xPos, h - pad.bottom + 14);
    }

    // Deseasonalized line
    ctx.beginPath();
    ctx.moveTo(getX(0), getY(values[0]));
    for (let i = 1; i < series.length; i++) {
      ctx.lineTo(getX(i), getY(values[i]));
    }
    ctx.strokeStyle = '#39e6d4';
    ctx.lineWidth = 1.4;
    ctx.stroke();

    // Fitted trend line
    if (trend.length === series.length) {
      ctx.beginPath();
      ctx.moveTo(getX(0), getY(trend[0].fitted_value));
      for (let i = 1; i < trend.length; i++) {
        ctx.lineTo(getX(i), getY(trend[i].fitted_value));
      }
      ctx.strokeStyle = '#ff9d45';
      ctx.lineWidth = 1.8;
      ctx.setLineDash([4, 4]);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Crosshair hover point
    if (activeHoverPoint !== null && activeHoverPoint >= 0 && activeHoverPoint < series.length) {
      const hp = activeHoverPoint;
      const hx = getX(hp);
      const hy = getY(values[hp]);

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(hx, pad.top);
      ctx.lineTo(hx, pad.top + plotH);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(hx, hy, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#ff9d45';
      ctx.fill();
    }
  }

  function onChartMouseMove(e) {
    if (!currentAnalysis || !currentAnalysis.time_series) return;

    const series = currentAnalysis.time_series;
    const trend = currentAnalysis.trend_line || [];
    const meta = currentAnalysis.metadata;
    const rect = dom.canvas.getBoundingClientRect();
    const pad = { top: 16, right: 20, bottom: 26, left: 45 };
    const plotW = rect.width - pad.left - pad.right;

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    if (mouseX < pad.left || mouseX > pad.left + plotW) {
      dom.tooltip.style.opacity = '0';
      activeHoverPoint = null;
      renderChart(currentAnalysis);
      return;
    }

    const ratio = (mouseX - pad.left) / plotW;
    const idx = Math.min(series.length - 1, Math.max(0, Math.round(ratio * (series.length - 1))));

    activeHoverPoint = idx;
    renderChart(currentAnalysis);

    const pt = series[idx];
    const tr = trend[idx];

    dom.tooltip.innerHTML = `
      <div><strong>${pt.date}</strong></div>
      <div>Anomaly: ${pt.anomaly > 0 ? '+' : ''}${pt.anomaly?.toFixed(3)} ${meta.units}</div>
      ${tr ? `<div>Trend: ${tr.fitted_value?.toFixed(3)} ${meta.units}</div>` : ''}
    `;

    const tipW = 140;
    let tipX = mouseX + 12;
    if (tipX + tipW > rect.width) tipX = mouseX - tipW - 12;
    let tipY = mouseY - 35;
    if (tipY < 6) tipY = 6;

    dom.tooltip.style.left = `${tipX}px`;
    dom.tooltip.style.top = `${tipY}px`;
    dom.tooltip.style.opacity = '1';
  }

  function exportCSV() {
    if (!currentAnalysis || !currentAnalysis.time_series) return;
    const series = currentAnalysis.time_series;
    const trend = currentAnalysis.trend_line || [];
    const meta = currentAnalysis.metadata;

    let csv = `Date,Raw_Value_${meta.units},Climatology_${meta.units},Anomaly_${meta.units},Trend_${meta.units}\n`;
    series.forEach((pt, i) => {
      csv += `${pt.date},${pt.raw_value},${pt.climatology},${pt.anomaly},${trend[i] ? trend[i].fitted_value : ''}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nasa_${meta.variable_id}_${meta.start_date}_${meta.end_date}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function exportImage() {
    if (!dom.canvas) return;
    const url = dom.canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `nasa_trend_${currentAnalysis?.metadata?.variable_id || 'analysis'}.png`;
    a.click();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
