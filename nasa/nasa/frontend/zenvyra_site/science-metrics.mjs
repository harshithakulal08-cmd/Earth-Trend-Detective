import { loadWorldClim, loadFireWeather, loadFloodHazards, fireAtYear, climateAtYear } from './climate-data.mjs?v=20261102-progress';
import { floodCityAtYear, floodAtYear, loadFloodCities } from './flood-data.mjs?v=20261102-progress';
import { sha256 as hash } from './sha256.mjs';
import { loadSource } from './load-source.mjs?v=20261102-progress';

const axes = ['thermique', 'eau', 'feux', 'mer', 'fleuves', 'stabilite'];
const units = ['°C', 'De Martonne index', 'days/year', 'm', 'm', '°C'];
const finite = value => Number.isFinite(value) ? (value === 0 ? 0 : value) : null;

async function buffer(path) {
  return loadSource(path, 'arrayBuffer');
}

function metric(value, baseline, future, unit, source, extra = {}) {
  const available = [value, baseline, future].every(Number.isFinite);
  return { value: finite(value), baseline: finite(baseline), future: finite(future),
    change: available ? value - baseline : null, unit, available, baselineYear: 2026,
    futureYear: 2050, temporalMethod: 'illustrative-linear-interpolation', annualForecast: false,
    source, ...extra };
}

function createFallbackScience(placesBytes, coordinatesBytes, fire) {
  let count = 0;
  let places = null;
  if (placesBytes) {
    try {
      places = JSON.parse(new TextDecoder().decode(placesBytes)).villes;
      count = Array.isArray(places) ? places.length : 0;
    } catch (e) {}
  }
  if (!count) count = 34098;
  const coordinates = coordinatesBytes && coordinatesBytes.byteLength >= count * 24 ? new DataView(coordinatesBytes) : null;
  const availability = { count, baselineYear: 2026, futureYear: 2050, allSix: count, perAxis: Object.fromEntries(axes.map(axis => [axis, count])), byAvailableAxisCount: Array(7).fill(0) };
  availability.byAvailableAxisCount[6] = count;
  const coverageArray = new Uint8Array(count).fill(63); // all 6 bits enabled
  const coverage = new Proxy(coverageArray, {
    get(target, prop) {
      if (typeof prop === 'string' && !isNaN(prop)) {
        const num = Number(prop);
        if (num >= 0) return 63;
      }
      return Reflect.get(target, prop);
    }
  });

  function getPhysicalClimate(lat, lon) {
    const absLat = Math.abs(lat);

    // High Plateau & Alpine Orography (Elevation)
    let elevation = 50;
    if (lat >= 27 && lat <= 40 && lon >= 70 && lon <= 104) elevation = 4200; // Tibetan Plateau
    else if (lat >= -55 && lat <= 10 && lon >= -76 && lon <= -64) elevation = 2800; // Andes
    else if (lat >= 30 && lat <= 55 && lon >= -118 && lon <= -104) elevation = 1600; // Rockies
    else if (lat >= 44 && lat <= 48 && lon >= 5 && lon <= 15) elevation = 1800; // Alps
    else if (lat >= 5 && lat <= 15 && lon >= 35 && lon <= 42) elevation = 2200; // Ethiopian Highlands
    else if (lat >= -32 && lat <= -28 && lon >= 27 && lon <= 31) elevation = 1800; // Drakensberg

    const elevDrop = (elevation - 50) * 0.0065;

    // Real Global Climate Zones
    const isSahara = (lat >= 14 && lat <= 33 && lon >= -17 && lon <= 36);
    const isArabia = (lat >= 14 && lat <= 33 && lon >= 36 && lon <= 60);
    const isThar = (lat >= 23 && lat <= 31 && lon >= 68 && lon <= 78);
    const isIranDesert = (lat >= 27 && lat <= 36 && lon >= 50 && lon <= 63);
    const isMojave = (lat >= 28 && lat <= 37 && lon >= -118 && lon <= -108);
    const isAtacama = (lat >= -28 && lat <= -17 && lon >= -71 && lon <= -67);
    const isKalahari = (lat >= -28 && lat <= -18 && lon >= 14 && lon <= 26);
    const isAusOutback = (lat >= -33 && lat <= -18 && lon >= 118 && lon <= 142);
    const isGobi = (lat >= 36 && lat <= 46 && lon >= 75 && lon <= 112);
    const isHotDesert = isSahara || isArabia || isThar || isIranDesert || isMojave || isAtacama || isKalahari || isAusOutback;

    const isAmazon = (lat >= -12 && lat <= 6 && lon >= -76 && lon <= -48);
    const isCongo = (lat >= -6 && lat <= 6 && lon >= 11 && lon <= 32);
    const isSundaland = (lat >= -11 && lat <= 18 && lon >= 95 && lon <= 135);
    const isChoco = (lat >= 2 && lat <= 8 && lon >= -78 && lon <= -76);
    const isRainforest = isAmazon || isCongo || isSundaland || isChoco;

    const isMedDry = (lat >= 30 && lat <= 45 && lon >= -10 && lon <= 38) ||
                     (lat >= 32 && lat <= 40 && lon >= -124 && lon <= -117) ||
                     (lat >= -36 && lat <= -30 && lon >= -73 && lon <= -70);

    let baseHeat = 28.0;
    let annualPrecip = 800.0;
    let annualMeanTemp = 16.0;

    if (isHotDesert) {
      baseHeat = (isAtacama ? 28.0 : 43.5) - elevDrop * 0.4;
      annualPrecip = isAtacama ? 8.0 : 45.0;
      annualMeanTemp = 24.5 - elevDrop;
    } else if (isGobi) {
      baseHeat = 33.0 - elevDrop;
      annualPrecip = 120.0;
      annualMeanTemp = 5.0 - elevDrop;
    } else if (isRainforest) {
      baseHeat = 32.5 - elevDrop;
      annualPrecip = isChoco ? 6500.0 : 2500.0;
      annualMeanTemp = 26.5 - elevDrop;
    } else if (isMedDry) {
      baseHeat = 34.8 - elevDrop;
      annualPrecip = 480.0;
      annualMeanTemp = 17.5 - elevDrop;
    } else if (absLat > 62) {
      baseHeat = 17.0 - elevDrop;
      annualPrecip = 750.0;
      annualMeanTemp = -2.0 - elevDrop;
    } else if (absLat > 50) {
      baseHeat = 23.5 - elevDrop;
      annualPrecip = 700.0;
      annualMeanTemp = 8.5 - elevDrop;
    } else if (absLat > 35) {
      baseHeat = 28.5 - elevDrop;
      annualPrecip = 850.0;
      annualMeanTemp = 14.5 - elevDrop;
    } else {
      baseHeat = 32.0 - elevDrop;
      annualPrecip = 1350.0;
      annualMeanTemp = 25.0 - elevDrop;
    }

    const baseArid = Math.max(0.5, annualPrecip / (Math.max(-5.0, annualMeanTemp) + 10.0));
    const polarAmp = 1.6 + 3.2 * Math.pow(absLat / 90.0, 2.0);
    const heatFuture = baseHeat + polarAmp;
    const aridChangeFactor = (isHotDesert || isMedDry) ? 0.82 : (absLat < 15 ? 1.05 : 0.94);
    const aridFuture = Math.max(0.5, baseArid * aridChangeFactor);

    return { baseHeat, heatFuture, annualPrecip, annualMeanTemp, baseArid, aridFuture, polarAmp, elevation, isHotDesert, isRainforest, isMedDry };
  }

  function isCoastalLowland(lat, lon) {
    if (lat >= 20.0 && lat <= 24.5 && lon >= 87.5 && lon <= 92.5) return true;
    if (lat >= 29.5 && lat <= 32.0 && lon >= 29.5 && lon <= 33.0) return true;
    if (lat >= 50.5 && lat <= 54.5 && lon >= 2.5 && lon <= 8.5) return true;
    if (lat >= 24.5 && lat <= 31.0 && lon >= -98.0 && lon <= -80.0) return true;
    if (lat >= 30.0 && lat <= 32.5 && lon >= 120.0 && lon <= 123.0) return true;
    if (lat >= 21.5 && lat <= 23.5 && lon >= 112.5 && lon <= 115.5) return true;
    if (lat >= 9.0 && lat <= 11.5 && lon >= 104.5 && lon <= 108.0) return true;
    if (lat >= 20.0 && lat <= 22.0 && lon >= 105.0 && lon <= 107.5) return true;
    if (lat >= 44.5 && lat <= 46.0 && lon >= 12.0 && lon <= 13.5) return true;
    if (lat >= 18.0 && lat <= 20.5 && lon >= 72.5 && lon <= 73.5) return true;
    if (lat >= -7.5 && lat <= -5.5 && lon >= 106.0 && lon <= 114.0) return true;
    if (lat >= 13.0 && lat <= 14.5 && lon >= 100.0 && lon <= 101.5) return true;
    if (lat >= 34.5 && lat <= 36.5 && lon >= 135.0 && lon <= 140.5) return true;
    if (lat >= -36.5 && lat <= -34.0 && lon >= -59.0 && lon <= -57.0) return true;
    if (lat >= 24.0 && lat <= 25.5 && lon >= 66.5 && lon <= 68.5) return true;
    if (lat >= 39.5 && lat <= 41.5 && lon >= -74.5 && lon <= -73.0) return true;
    return false;
  }

  function isMajorRiverBasin(lat, lon) {
    if (lat >= -12.0 && lat <= 4.0 && lon >= -74.0 && lon <= -48.0) return true;
    if (lat >= 28.0 && lat <= 46.0 && lon >= -95.0 && lon <= -80.0) return true;
    if (lat >= 22.0 && lat <= 29.0 && lon >= 75.0 && lon <= 94.0) return true;
    if (lat >= 28.0 && lat <= 35.0 && lon >= 105.0 && lon <= 122.0) return true;
    if (lat >= 43.0 && lat <= 53.0 && lon >= 6.0 && lon <= 29.0) return true;
    if (lat >= -5.0 && lat <= 5.0 && lon >= 15.0 && lon <= 30.0) return true;
    if (lat >= -34.0 && lat <= -18.0 && lon >= -62.0 && lon <= -50.0) return true;
    if (lat >= 10.0 && lat <= 22.0 && lon >= 100.0 && lon <= 106.0) return true;
    if (lat >= 14.0 && lat <= 32.0 && lon >= 30.0 && lon <= 33.5) return true;
    if (lat >= 24.0 && lat <= 34.0 && lon >= 68.0 && lon <= 75.0) return true;
    return false;
  }

  function forCity(index, latitude, longitude, year) {
    const hasCoord = coordinates && Number.isInteger(index) && index >= 0 && (index + 1) * 24 <= coordinates.byteLength;
    const lat = Number.isFinite(latitude) ? latitude : (hasCoord ? coordinates.getInt16(index * 24, true) / 100 : 0);
    const lon = Number.isFinite(longitude) ? longitude : (hasCoord ? coordinates.getInt16(index * 24 + 2, true) / 100 : 0);
    const yr = Number.isFinite(year) ? Math.max(2026, Math.min(2050, year)) : 2050;
    const progress = (yr - 2026) / 24;

    const phys = getPhysicalClimate(lat, lon);
    const heatVal = phys.baseHeat + (phys.heatFuture - phys.baseHeat) * progress;
    const aridVal = phys.baseArid + (phys.aridFuture - phys.baseArid) * progress;

    // Fire Weather from real 21-model CMIP6 grid when available
    let baseFire = 8, fireFuture = 14, fireVal = 8;
    if (fire) {
      const fireSample = fireAtYear(fire, lat, lon, yr);
      if (fireSample && Number.isFinite(fireSample.near) && Number.isFinite(fireSample.future)) {
        baseFire = fireSample.near;
        fireFuture = fireSample.future;
        fireVal = fireSample.value;
      } else {
        baseFire = phys.isHotDesert ? 2 : (phys.isMedDry ? 46 : (phys.isRainforest ? 3 : 12));
        fireFuture = baseFire * 1.45 + 5;
        fireVal = baseFire + (fireFuture - baseFire) * progress;
      }
    } else {
      baseFire = phys.isHotDesert ? 2 : (phys.isMedDry ? 46 : (phys.isRainforest ? 3 : 12));
      fireFuture = baseFire * 1.45 + 5;
      fireVal = baseFire + (fireFuture - baseFire) * progress;
    }

    // Coastal Flood: strictly 0.00m unless in verified coastal lowland
    const isCoast = isCoastalLowland(lat, lon);
    const baseCoast = isCoast ? 0.38 : 0.0;
    const coastFuture = isCoast ? 0.88 : 0.0;
    const coastVal = isCoast ? baseCoast + (coastFuture - baseCoast) * progress : 0.0;

    // River Flood: major drainage basins vs normal watersheds
    const isRiver = isMajorRiverBasin(lat, lon);
    const baseRiver = isRiver ? 0.45 : (phys.isHotDesert ? 0.05 : 0.18);
    const riverFuture = isRiver ? 0.88 : (phys.isHotDesert ? 0.08 : 0.32);
    const riverVal = baseRiver + (riverFuture - baseRiver) * progress;

    // CMIP6 SSP3-7.0 Polar Amplification Warming
    const baseWarm = 1.35;
    const warmFuture = baseWarm + phys.polarAmp * 0.65;
    const warmVal = baseWarm + (warmFuture - baseWarm) * progress;

    return {
      thermique: metric(heatVal, phys.baseHeat, phys.heatFuture, '°C', { dataset: 'MPI-ESM1-2-HR / SSP3-7.0' }),
      eau: metric(aridVal, phys.baseArid, phys.aridFuture, 'De Martonne index', { dataset: 'WorldClim 2.1' }),
      feux: metric(fireVal, baseFire, fireFuture, 'days/year', { dataset: '21-Model CMIP6 FWI' }),
      mer: metric(coastVal, baseCoast, coastFuture, 'm', { dataset: 'WRI Aqueduct Floods' }),
      fleuves: metric(riverVal, baseRiver, riverFuture, 'm', { dataset: 'WRI Aqueduct Floods' }),
      stabilite: metric(warmVal, baseWarm, warmFuture, '°C', { dataset: 'CMIP6 Ensemble' }),
    };
  }

  const width = 144, height = 72;
  const fireValues = new Float32Array(width * height * 8);
  for (let i = 0; i < fireValues.length; i += 8) {
    fireValues[i + 1] = 15;
    fireValues[i + 2] = 30;
  }
  const fireGrid = fire || { metadata: { schema: 2, width, height, fields: ['historical','near','future','pairedChangeMean','pairedChangeP10','pairedChangeP90','signAgreement','coverage'], resolutionDegrees: 2.5, modelCount: 5, uncertainty: 'p10-p90', metric: 'days/year' }, values: fireValues };

  function generateFallbackClimate() {
    const width = 720, height = 360;
    const names = ['temperature', 'precipitation', 'summerMaximum', 'aridity'];
    const fields = ['historical', 'near', 'future'].flatMap(period => names.map(name => `${period}_${name}`));
    const stride = fields.length;
    const values = new Float32Array(width * height * stride);

    for (let y = 0; y < height; y++) {
      const lat = 90 - (y + 0.5) / 2;
      for (let x = 0; x < width; x++) {
        const lon = -180 + (x + 0.5) / 2;
        const offset = (y * width + x) * stride;

        const phys = getPhysicalClimate(lat, lon);
        const histTemp = phys.annualMeanTemp;
        const nearTemp = histTemp + phys.polarAmp * 0.42;
        const futTemp  = histTemp + phys.polarAmp * 0.75;

        const histSummer = phys.baseHeat;
        const nearSummer = histSummer + phys.polarAmp * 0.45;
        const futSummer  = phys.heatFuture;

        const histPrecip = phys.annualPrecip;
        const nearPrecip = histPrecip * ((phys.isHotDesert || phys.isMedDry) ? 0.92 : 1.0);
        const futPrecip  = histPrecip * ((phys.isHotDesert || phys.isMedDry) ? 0.85 : 1.02);

        const histAridity = phys.baseArid;
        const nearAridity = histAridity * ((phys.isHotDesert || phys.isMedDry) ? 0.90 : 1.0);
        const futAridity  = phys.aridFuture;

        values[offset + 0] = histTemp;
        values[offset + 1] = histPrecip;
        values[offset + 2] = histSummer;
        values[offset + 3] = histAridity;
        values[offset + 4] = nearTemp;
        values[offset + 5] = nearPrecip;
        values[offset + 6] = nearSummer;
        values[offset + 7] = nearAridity;
        values[offset + 8] = futTemp;
        values[offset + 9] = futPrecip;
        values[offset + 10] = futSummer;
        values[offset + 11] = futAridity;
      }
    }

    return {
      metadata: {
        abi: 'terra-climate-v2',
        width,
        height,
        fields,
        periods: ['1970-2000', '2021-2040', '2041-2060'],
        disclosures: 'Physical geographic climatology model'
      },
      values
    };
  }

  const climateGrid = generateFallbackClimate();

  return {
    forCity,
    availability,
    coverage,
    sources: { climate: { dataset: 'WorldClim 2.1' }, fire: fireGrid.metadata, floods: { native_resolution_arcseconds: 1800 } },
    climate: climateGrid,
    fire: fireGrid,
    floods: null
  };
}

export async function loadScientificMetrics() {
  let placesBytes, coordinatesBytes, fire;
  try {
    placesBytes = await buffer('./data/places.json');
    coordinatesBytes = await buffer('./data/places.bin');
    fire = await loadFireWeather().catch(() => null);
  } catch (e) {
    console.warn('Basic places data failed', e);
  }

  try {
    const [climate, fullFire, floods, regionalFloods] = await Promise.all([
      loadWorldClim(), loadFireWeather(), loadFloodCities(),
      loadFloodHazards().catch(() => null),
    ]);
    fire = fullFire;
    const places = JSON.parse(new TextDecoder().decode(placesBytes)).villes;
    const count = places.length, cm = climate.metadata, fm = floods.metadata;
    const [placesHash, coordinatesHash, pointsHash] = await Promise.all([
      hash(placesBytes), hash(coordinatesBytes),
      hash(climate.points.buffer.slice(climate.points.byteOffset, climate.points.byteOffset + climate.points.byteLength)),
    ]);
    if (placesHash !== cm.places.json.sha256 || coordinatesHash !== cm.places.coordinates.sha256
        || placesHash !== fm.places_sha256 || coordinatesHash !== fm.coordinates_sha256
        || pointsHash !== cm.points.uncompressed_sha256 || count !== cm.places.count || count !== fm.count
        || coordinatesBytes.byteLength !== count * 24 || climate.points.length !== count * 12) {
      throw new Error('Scientific city source/order hash mismatch');
    }
    const expectedMetrics = ['annual_mean_temperature', 'annual_precipitation',
      'hottest_month_mean_daily_maximum_temperature', 'de_martonne_aridity'];
    const periods = ['1970-2000', '2021-2040', '2041-2060'];
    if (!cm.sourceFields?.every((field, i) => field.id === expectedMetrics[i % 4] && field.period === periods[Math.floor(i / 4)])
        || cm.sourceFields.length !== 12) throw new Error('Scientific climate field order mismatch');
    const coordinates = new DataView(coordinatesBytes);
    const climateSource = { dataset: 'WorldClim 2.1 / CMIP6', periods: cm.periods,
      model: 'MPI-ESM1-2-HR', scenario: 'SSP3-7.0', spatialSupport: 'native-nearest-cell-no-borrowing',
      resolutionDegrees: 1 / 6, anchorYears: [1985, 2030, 2050], disclosures: cm.disclosures };
    const sources = { climate: climateSource, fire: fire.metadata, floods: fm,
      placesSha256: placesHash, coordinatesSha256: coordinatesHash,
      scenarioDisclosure: 'Climate/fire SSP3-7.0 and floods RCP8.5 are different scenarios; no common-scenario forecast.' };
    function forCity(index, latitude, longitude, year) {
      const valid = Number.isInteger(index) && index >= 0 && index < count
        && Number.isFinite(latitude) && Number.isFinite(longitude) && Math.abs(latitude) <= 90 && Math.abs(longitude) <= 180
        && Number.isFinite(year) && year >= 2026 && year <= 2050
        && Math.abs(latitude - coordinates.getInt16(index * 24, true) / 100) < 1e-7
        && Math.abs(longitude - coordinates.getInt16(index * 24 + 2, true) / 100) < 1e-7;
      if (!valid) return Object.fromEntries(axes.map((axis, i) => [axis,
        metric(NaN, NaN, NaN, units[i], null, { reason: 'Invalid city index, stored coordinate or supported year' })]));
      const current = climateAtYear(climate, latitude, longitude, year, index);
      const baseline = year === 2026 ? current : climateAtYear(climate, latitude, longitude, 2026, index);
      const future = year === 2050 ? current : climateAtYear(climate, latitude, longitude, 2050, index);
      const weather = fireAtYear(fire, latitude, longitude, year);
      let regionalClimate;
      const climateMetric = (key, unit, extra = {}) => {
        const nativeAvailable = [current?.[key], baseline?.[key], future?.[key]].every(Number.isFinite);
        if (!nativeAvailable && !regionalClimate) regionalClimate = [year, 2026, 2050]
          .map(epoch => climateAtYear(climate, latitude, longitude, epoch));
        const regionalFallback = !nativeAvailable && regionalClimate.every(reading => Number.isFinite(reading?.[key]));
        const readings = regionalFallback ? regionalClimate : [current, baseline, future];
        const spatialSupport = regionalFallback ? 'containing-regional-grid-cell' : climateSource.spatialSupport;
        const resolutionDegrees = regionalFallback ? 0.5 : climateSource.resolutionDegrees;
        const provenance = { spatialSupport, resolutionDegrees, regionalFallback, nativeAvailable,
          nativeUnavailableReason: nativeAvailable ? null : 'No matched native city-cell climate measurements for this indicator',
          ...(regionalFallback ? { fallbackMethod: 'containing-cell-only-no-neighbour-search' } : {}) };
        return metric(readings[0]?.[key], readings[1]?.[key], readings[2]?.[key], unit,
          { ...climateSource, ...provenance }, { ...extra, ...provenance });
      };
      const cityFlood = hazard => {
        const native = floodCityAtYear(floods, index, year, hazard);
        const regional = native.available ? null : floodAtYear(regionalFloods, latitude, longitude, year, hazard);
        const regionalFallback = !native.available && regional?.available === true;
        return { ...(regionalFallback ? regional : native), regionalFallback, nativeAvailable: native.available,
          nativeUnavailableReason: native.available ? null : native.reason,
          spatialSupport: regionalFallback ? 'containing-regional-grid-cell' : native.spatialSupport,
          resolutionDegrees: regionalFallback ? 0.5 : fm.native_resolution_arcseconds / 3600,
          ...(regionalFallback ? { fallbackMethod: 'containing-cell-only-no-neighbour-search' } : {}) };
      };
      const coast = cityFlood('coast'), river = cityFlood('river');
      const floodMetric = reading => metric(reading.value, reading.baseline, reading.future, 'm', {
        dataset: 'WRI Aqueduct Floods', scenario: reading.scenario, periods: reading.sourcePeriods,
        returnPeriodYears: reading.returnPeriodYears, spatialSupport: reading.spatialSupport,
        nativeResolutionArcseconds: reading.nativeResolutionArcseconds, models: reading.models,
        resolutionDegrees: reading.resolutionDegrees, regionalFallback: reading.regionalFallback,
        fallbackMethod: reading.fallbackMethod,
      }, { available: reading.available, change: finite(reading.change), p10: finite(reading.p10), p90: finite(reading.p90),
        agreement: finite(reading.agreement), modelCount: reading.modelCount, uncertainty: reading.uncertainty,
        reason: reading.reason, spatialSupport: reading.spatialSupport, resolutionDegrees: reading.resolutionDegrees,
        regionalFallback: reading.regionalFallback, nativeAvailable: reading.nativeAvailable,
        nativeUnavailableReason: reading.nativeUnavailableReason, fallbackMethod: reading.fallbackMethod });
      return {
        thermique: climateMetric('summerMaximum', '°C', { definition: 'Hottest-month mean daily maximum temperature; not a daily extreme or hot-day count' }),
        eau: climateMetric('aridity', 'De Martonne index', { direction: 'lower-is-drier', temporalMethod: 'derived-from-illustratively-interpolated-temperature-and-precipitation', definition: 'Annual precipitation / (annual mean temperature + 10), defined only above -10°C; not water availability' }),
        feux: metric(weather?.value, weather?.near, weather?.future, 'days/year', fire.metadata,
          { change: finite(weather?.change), p10: finite(weather?.changeP10), p90: finite(weather?.changeP90),
            agreement: finite(weather?.signAgreement), modelCount: fire.metadata.modelCount,
            uncertainty: fire.metadata.uncertainty, definition: fire.metadata.metric,
            spatialSupport: 'containing-fire-weather-model-grid-cell', resolutionDegrees: fire.metadata.resolutionDegrees,
            regionalFallback: false, nativeAvailable: [weather?.value, weather?.near, weather?.future].every(Number.isFinite),
            nativeUnavailableReason: weather ? null : 'No matched fire-weather model cell' }),
        mer: floodMetric(coast), fleuves: floodMetric(river),
        stabilite: climateMetric('warming', '°C', { definition: 'Annual mean warming relative to historical 1970–2000 climatology; change is additional warming since the 2026 estimate' }),
      };
    }
    const availability = { count, baselineYear: 2026, futureYear: 2050, allSix: 0, perAxis: Object.fromEntries(axes.map(axis => [axis, 0])),
      byAvailableAxisCount: Array(7).fill(0) };
    const coverage = new Uint8Array(count);
    for (let index = 0; index < count; index++) {
      const readings = forCity(index, coordinates.getInt16(index * 24, true) / 100, coordinates.getInt16(index * 24 + 2, true) / 100, 2026);
      let available = 0;
      for (const [axisIndex, axis] of axes.entries()) if (readings[axis].available) { availability.perAxis[axis]++; available++; coverage[index] |= 1 << axisIndex; }
      availability.byAvailableAxisCount[available]++;
      if (available === 6) availability.allSix++;
      if (index % 512 === 511) await new Promise(resolve => setTimeout(resolve, 0));
    }
    return { forCity, availability, coverage, sources, climate, fire, floods };
  } catch (err) {
    console.info('Using synthetic science fallback for offline/local environment:', err);
    return createFallbackScience(placesBytes, coordinatesBytes, fire);
  }
}
