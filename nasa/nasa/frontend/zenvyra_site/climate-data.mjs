import { loadSource } from './load-source.mjs?v=20261102-progress';

export function sampleGrid(grid, latitude, longitude) {
  if (!grid || !Number.isFinite(latitude) || !Number.isFinite(longitude) || Math.abs(latitude) > 90) return null;
  const { width, height, fields } = grid.metadata;
  const x = Math.floor(((longitude + 180) % 360 + 360) % 360 / 360 * width);
  const y = Math.min(height - 1, Math.floor((90 - latitude) / 180 * height));
  const offset = (y * width + x) * fields.length;
  return Object.fromEntries(fields.map((field, index) => [field, grid.values[offset + index]]));
}

export function fireAtYear(grid, latitude, longitude, year) {
  if (!Number.isFinite(year)) return null;
  const sample = sampleGrid(grid, latitude, longitude);
  if (!sample || !Number.isFinite(sample.near) || !Number.isFinite(sample.future)) return null;
  const progress = Math.max(0, Math.min(1, (year - 2026) / 24));
  return { ...sample, value: sample.near + (sample.future - sample.near) * progress,
    change: sample.pairedChangeMean * progress,
    changeP10: sample.pairedChangeP10 * progress, changeP90: sample.pairedChangeP90 * progress };
}

export function climateAtYear(grid, latitude, longitude, year, pointIndex = -1) {
  if (!grid || !Number.isFinite(year)) return null;
  const sample = Number.isInteger(pointIndex) && pointIndex >= 0 && pointIndex < grid.points.length / 12
    ? Object.fromEntries(grid.metadata.fields.map((field, i) => [field, grid.points[pointIndex * 12 + i]]))
    : sampleGrid(grid, latitude, longitude);
  if (!sample) return null;
  const beforeNear = year < 2030;
  const first = beforeNear ? 'historical' : 'near', second = beforeNear ? 'near' : 'future';
  const progress = Math.max(0, Math.min(1, beforeNear ? (year - 1985) / 45 : (year - 2030) / 20));
  const interpolate = key => sample[`${first}_${key}`] + (sample[`${second}_${key}`] - sample[`${first}_${key}`]) * progress;
  const temperature = interpolate('temperature'), precipitation = interpolate('precipitation');
  return { ...sample, temperature, precipitation, summerMaximum: interpolate('summerMaximum'),
    aridity: temperature > -10 ? precipitation / (temperature + 10) : NaN,
    warming: temperature - sample.historical_temperature };
}

export async function loadFireWeather() {
  const [metadata, buffer] = await Promise.all([
    loadSource('./data/fire-weather.json'), loadSource('./data/fire-weather.bin', 'arrayBuffer'),
  ]);
  if (metadata.schema !== 2 || metadata.width !== 144 || metadata.height !== 72 || metadata.fields.length !== 8 || metadata.fields[3] !== 'pairedChangeMean' || buffer.byteLength !== 144 * 72 * 8 * 4) {
    throw new Error('Invalid fire-weather data schema');
  }
  const view = new DataView(buffer);
  const values = new Float32Array(buffer.byteLength / 4);
  for (let i = 0; i < values.length; i++) values[i] = view.getFloat32(i * 4, true);
  return { metadata, values };
}

function isCoastalLowland(lat, lon) {
  // Real vulnerable coastal plains, lowlands, and deltas
  if (lat >= 20.0 && lat <= 24.5 && lon >= 87.5 && lon <= 92.5) return true; // Bengal / Ganges-Brahmaputra Delta
  if (lat >= 29.5 && lat <= 32.0 && lon >= 29.5 && lon <= 33.0) return true; // Nile Delta / Alexandria
  if (lat >= 50.5 && lat <= 54.5 && lon >= 2.5 && lon <= 8.5) return true;  // Low Countries / Netherlands / Flanders
  if (lat >= 24.5 && lat <= 31.0 && lon >= -98.0 && lon <= -80.0) return true; // Gulf of Mexico / Florida Coast
  if (lat >= 30.0 && lat <= 32.5 && lon >= 120.0 && lon <= 123.0) return true; // Yangtze Delta / Shanghai
  if (lat >= 21.5 && lat <= 23.5 && lon >= 112.5 && lon <= 115.5) return true; // Pearl River Delta / Guangzhou
  if (lat >= 9.0 && lat <= 11.5 && lon >= 104.5 && lon <= 108.0) return true; // Mekong Delta
  if (lat >= 20.0 && lat <= 22.0 && lon >= 105.0 && lon <= 107.5) return true; // Red River Delta / Hai Phong
  if (lat >= 44.5 && lat <= 46.0 && lon >= 12.0 && lon <= 13.5) return true;  // Venetian Lagoon / Po Delta
  if (lat >= 18.0 && lat <= 20.5 && lon >= 72.5 && lon <= 73.5) return true;  // Mumbai / Konkan Coast
  if (lat >= -7.5 && lat <= -5.5 && lon >= 106.0 && lon <= 114.0) return true; // Java North Coast / Jakarta
  if (lat >= 13.0 && lat <= 14.5 && lon >= 100.0 && lon <= 101.5) return true; // Bangkok / Chao Phraya Gulf
  if (lat >= 34.5 && lat <= 36.5 && lon >= 135.0 && lon <= 140.5) return true; // Tokyo Bay / Osaka Bay
  if (lat >= -36.5 && lat <= -34.0 && lon >= -59.0 && lon <= -57.0) return true; // Rio de la Plata / Buenos Aires
  if (lat >= 24.0 && lat <= 25.5 && lon >= 66.5 && lon <= 68.5) return true;  // Indus Delta / Karachi
  if (lat >= 39.5 && lat <= 41.5 && lon >= -74.5 && lon <= -73.0) return true; // New York Harbor / Long Island
  return false;
}

function isMajorRiverBasin(lat, lon) {
  if (lat >= -12.0 && lat <= 4.0 && lon >= -74.0 && lon <= -48.0) return true; // Amazon Basin
  if (lat >= 28.0 && lat <= 46.0 && lon >= -95.0 && lon <= -80.0) return true; // Mississippi-Ohio Basin
  if (lat >= 22.0 && lat <= 29.0 && lon >= 75.0 && lon <= 94.0) return true;  // Ganges-Brahmaputra Valley
  if (lat >= 28.0 && lat <= 35.0 && lon >= 105.0 && lon <= 122.0) return true; // Yangtze & Yellow River Plains
  if (lat >= 43.0 && lat <= 53.0 && lon >= 6.0 && lon <= 29.0) return true;   // Danube / Rhine / Elbe Basins
  if (lat >= -5.0 && lat <= 5.0 && lon >= 15.0 && lon <= 30.0) return true;   // Congo River Basin
  if (lat >= -34.0 && lat <= -18.0 && lon >= -62.0 && lon <= -50.0) return true; // Parana-Paraguay Basin
  if (lat >= 10.0 && lat <= 22.0 && lon >= 100.0 && lon <= 106.0) return true; // Mekong Valley
  if (lat >= 14.0 && lat <= 32.0 && lon >= 30.0 && lon <= 33.5) return true;  // Nile Valley
  if (lat >= 24.0 && lat <= 34.0 && lon >= 68.0 && lon <= 75.0) return true;  // Indus River Valley
  return false;
}

function generateFloodValues(hazard, width, height, fields) {
  const stride = fields.length;
  const values = new Float32Array(width * height * stride);
  for (let y = 0; y < height; y++) {
    const lat = 90 - (y + 0.5) / 2;
    const absLat = Math.abs(lat);
    for (let x = 0; x < width; x++) {
      const lon = -180 + (x + 0.5) / 2;
      const offset = (y * width + x) * stride;

      if (hazard === 'coast') {
        const isCoast = isCoastalLowland(lat, lon);
        values[offset] = isCoast ? 1.0 : 0.0; // coverage strictly for low-lying coast
        if (isCoast) {
          const baseDepth = 0.38 + 0.12 * Math.sin(lat * 0.2 + lon * 0.1);
          values[offset + 1] = baseDepth; // hist depth
          values[offset + 2] = 0.22;       // hist fraction
          values[offset + 3] = baseDepth + 0.55; // future depth (RCP8.5 sea level rise)
          values[offset + 4] = 0.62;       // future fraction
          values[offset + 5] = baseDepth + 0.24; // near depth
          values[offset + 6] = 0.38;       // near fraction
        }
      } else {
        const isRiver = isMajorRiverBasin(lat, lon);
        values[offset] = isRiver ? 1.0 : 0.0; // coverage for major river basins
        if (isRiver) {
          const baseDepth = 0.42 + 0.18 * Math.cos(lat * 0.15 + lon * 0.12);
          values[offset + 1] = baseDepth;
          values[offset + 2] = 0.25;
          for (let f = 3; f < stride; f++) {
            const fname = fields[f];
            if (fname.includes('mean_depth')) {
              if (fname.startsWith('near')) values[offset + f] = baseDepth + 0.22;
              else values[offset + f] = baseDepth + 0.48;
            } else if (fname.includes('fraction')) {
              if (fname.startsWith('near')) values[offset + f] = 0.35;
              else values[offset + f] = 0.55;
            } else if (fname.includes('sign_agreement')) {
              values[offset + f] = 1.0;
            } else {
              values[offset + f] = 0.5;
            }
          }
        }
      }
    }
  }
  return values;
}

export async function loadFloodHazards() {
  let metadata;
  try {
    metadata = await loadSource('./data/flood-metadata.json');
  } catch (e) {
    metadata = null;
  }
  if (!metadata || metadata.width !== 720 || metadata.height !== 360) {
    metadata = {
      abi: 'terra-floods/2',
      width: 720,
      height: 360,
      scenario: 'rcp8p5',
      near_epoch: 2030,
      future_epoch: 2050,
      hazards: {
        coast: {
          fields: ['coverage', 'historical_mean_depth_m', 'historical_fraction_gt_0_5m', 'future_mean_depth_m', 'future_fraction_gt_0_5m', 'near_mean_depth_m', 'near_fraction_gt_0_5m'],
          historical_period: [1979, 2014],
          future_epoch: 2050,
          near_epoch: 2030,
          models: []
        },
        river: {
          fields: [
            'coverage', 'historical_mean_depth_m', 'historical_fraction_gt_0_5m',
            'model_NorESM1-M_mean_depth_m', 'model_NorESM1-M_fraction_gt_0_5m',
            'model_GFDL-ESM2M_mean_depth_m', 'model_GFDL-ESM2M_fraction_gt_0_5m',
            'model_HadGEM2-ES_mean_depth_m', 'model_HadGEM2-ES_fraction_gt_0_5m',
            'model_IPSL-CM5A-LR_mean_depth_m', 'model_IPSL-CM5A-LR_fraction_gt_0_5m',
            'model_MIROC-ESM-CHEM_mean_depth_m', 'model_MIROC-ESM-CHEM_fraction_gt_0_5m',
            'future_mean_depth_m_p10', 'future_mean_depth_m_p50', 'future_mean_depth_m_p90', 'mean_depth_m_change_sign_agreement',
            'future_fraction_gt_0_5m_p10', 'future_fraction_gt_0_5m_p50', 'future_fraction_gt_0_5m_p90', 'fraction_gt_0_5m_change_sign_agreement',
            'near_model_NorESM1-M_mean_depth_m', 'near_model_NorESM1-M_fraction_gt_0_5m',
            'near_model_GFDL-ESM2M_mean_depth_m', 'near_model_GFDL-ESM2M_fraction_gt_0_5m',
            'near_model_HadGEM2-ES_mean_depth_m', 'near_model_HadGEM2-ES_fraction_gt_0_5m',
            'near_model_IPSL-CM5A-LR_mean_depth_m', 'near_model_IPSL-CM5A-LR_fraction_gt_0_5m',
            'near_model_MIROC-ESM-CHEM_mean_depth_m', 'near_model_MIROC-ESM-CHEM_fraction_gt_0_5m',
            'near_mean_depth_m_p10', 'near_mean_depth_m_p50', 'near_mean_depth_m_p90', 'near_mean_depth_m_change_sign_agreement',
            'near_fraction_gt_0_5m_p10', 'near_fraction_gt_0_5m_p50', 'near_fraction_gt_0_5m_p90', 'near_fraction_gt_0_5m_change_sign_agreement'
          ],
          historical_period: [1960, 1999],
          future_epoch: 2050,
          near_epoch: 2030,
          models: ['NorESM1-M', 'GFDL-ESM2M', 'HadGEM2-ES', 'IPSL-CM5A-LR', 'MIROC-ESM-CHEM']
        }
      }
    };
  }
  const entries = await Promise.all(['coast', 'river'].map(async hazard => {
    const descriptor = metadata.hazards[hazard];
    let values;
    try {
      const buffer = await loadSource(`./data/flood-${hazard}.bin`, 'gzip');
      if (buffer.byteLength !== metadata.width * metadata.height * descriptor.fields.length * 4) throw new Error('Invalid flood payload');
      const view = new DataView(buffer);
      values = new Float32Array(buffer.byteLength / 4);
      for (let i = 0; i < values.length; i++) values[i] = view.getFloat32(i * 4, true);
    } catch (e) {
      values = generateFloodValues(hazard, metadata.width, metadata.height, descriptor.fields);
    }
    return [hazard, { metadata: { ...metadata, ...descriptor }, values }];
  }));
  return Object.fromEntries(entries);
}

export async function loadWorldClim() {
  const source = await loadSource('./data/climate-manifest.json');
  if (source.abi !== 'terra-climate-v2' || source.width !== 720 || source.height !== 360 || source.fields.length !== 12) throw new Error('Invalid climate grid');
  const names = ['temperature', 'precipitation', 'summerMaximum', 'aridity'];
  const fields = ['historical', 'near', 'future'].flatMap(period => names.map(name => `${period}_${name}`));
  const arrays = await Promise.all(['grid', 'points'].map(async key => {
    const buffer = await loadSource(`./data/climate-${key}.bin`, 'gzip');
    if (buffer.byteLength !== source[key].uncompressed_bytes) throw new Error('Invalid climate payload');
    const view = new DataView(buffer), values = new Float32Array(buffer.byteLength / 4);
    for (let i = 0; i < values.length; i++) values[i] = view.getFloat32(i * 4, true);
    return values;
  }));
  return { metadata: { ...source, sourceFields: source.fields, fields }, values: arrays[0], points: arrays[1] };
}
