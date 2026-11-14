import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { REGION_PRESETS } from "../presets";
import { COUNTRIES_DATA } from "../data/countries";
import type { CountryHeatData } from "../data/countries";
import {
  MapPin,
  Globe,
  Square,
  Search,
  Flame,
  X,
  TrendingUp,
  Thermometer,
} from "lucide-react";

interface MapSelectorProps {
  bbox: [number, number, number, number]; // [min_lon, min_lat, max_lon, max_lat]
  onBboxChange: (newBbox: [number, number, number, number]) => void;
  selectedPresetId?: string;
  onSelectPreset?: (presetId: string) => void;
  onAnalyzeCountryHeat?: (bbox: [number, number, number, number]) => void;
}

export const MapSelector: React.FC<MapSelectorProps> = ({
  bbox,
  onBboxChange,
  selectedPresetId,
  onSelectPreset,
  onAnalyzeCountryHeat,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const rectangleRef = useRef<L.Rectangle | null>(null);
  const thermalCircleRef = useRef<L.Circle | null>(null);
  const countryMarkerRef = useRef<L.Marker | null>(null);
  const peerMarkersRef = useRef<L.Marker[]>([]);

  // Map Layer Style: default to Real Earth Satellite from space
  const [mapStyle, setMapStyle] = useState<"satellite" | "topo">("satellite");
  const satelliteLayerRef = useRef<L.TileLayer | null>(null);
  const labelsLayerRef = useRef<L.TileLayer | null>(null);
  const topoLayerRef = useRef<L.TileLayer | null>(null);

  const [isDrawing, setIsDrawing] = useState(false);
  const startLatLngRef = useRef<L.LatLng | null>(null);
  const activeDrawRectRef = useRef<L.Rectangle | null>(null);

  // Country Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<CountryHeatData | null>(null);
  const selectedCountryRef = useRef<CountryHeatData | null>(null);
  selectedCountryRef.current = selectedCountry;

  const [minLon, minLat, maxLon, maxLat] = bbox;

  // Filter countries matching query
  const query = searchQuery.trim().toLowerCase();
  const filteredCountries = query
    ? COUNTRIES_DATA.filter((c) => {
        const nameMatch = c.name.toLowerCase().includes(query);
        const codeMatch = c.code.toLowerCase() === query;
        const contMatch = c.continent.toLowerCase().includes(query);
        const aliasMatch = c.aliases?.some((a) => a.toLowerCase().includes(query));
        return nameMatch || codeMatch || contMatch || aliasMatch;
      })
    : [];

  const clearPeerMarkers = () => {
    if (mapRef.current) {
      peerMarkersRef.current.forEach((m) => {
        try {
          mapRef.current?.removeLayer(m);
        } catch {
          // ignore cleanup
        }
      });
    }
    peerMarkersRef.current = [];
  };

  // Initialize Leaflet Map with Real Earth Satellite Basemap
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [20, 0],
      zoom: 2,
      minZoom: 1,
      maxZoom: 12,
      worldCopyJump: true,
    });

    // 1. Real Photographic Earth from Space (Satellite Imagery)
    const satelliteLayer = L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      {
        attribution: '&copy; <a href="https://www.esri.com/">Esri</a> Earth Satellite Imagery',
        maxZoom: 18,
      }
    );

    // 2. Crisp Country Boundaries & Place Names Overlay
    const labelsLayer = L.tileLayer(
      "https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
      {
        attribution: "",
        maxZoom: 18,
      }
    );

    // 3. Alternative Clean Topography Map
    const topoLayer = L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
      {
        attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; OpenStreetMap',
        subdomains: "abcd",
        maxZoom: 19,
      }
    );

    satelliteLayerRef.current = satelliteLayer;
    labelsLayerRef.current = labelsLayer;
    topoLayerRef.current = topoLayer;

    // Default: Photographic Earth from Space
    satelliteLayer.addTo(map);
    labelsLayer.addTo(map);

    // Event listener for action button inside popup
    map.on("popupopen", (e) => {
      const container = e.popup.getElement();
      const btn = container?.querySelector(".popup-analyze-btn");
      if (btn) {
        btn.addEventListener("click", () => {
          if (selectedCountryRef.current && onAnalyzeCountryHeat) {
            onAnalyzeCountryHeat(selectedCountryRef.current.bbox);
          }
        });
      }
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [onAnalyzeCountryHeat]);

  // Handle Layer Switcher Toggle (Satellite Earth vs Topo)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !satelliteLayerRef.current || !labelsLayerRef.current || !topoLayerRef.current) return;

    if (mapStyle === "satellite") {
      if (map.hasLayer(topoLayerRef.current)) map.removeLayer(topoLayerRef.current);
      if (!map.hasLayer(satelliteLayerRef.current)) map.addLayer(satelliteLayerRef.current);
      if (!map.hasLayer(labelsLayerRef.current)) map.addLayer(labelsLayerRef.current);
    } else {
      if (map.hasLayer(satelliteLayerRef.current)) map.removeLayer(satelliteLayerRef.current);
      if (map.hasLayer(labelsLayerRef.current)) map.removeLayer(labelsLayerRef.current);
      if (!map.hasLayer(topoLayerRef.current)) map.addLayer(topoLayerRef.current);
    }
  }, [mapStyle]);

  // Update bounding box rectangle when bbox props change (when not drawing and no country selected)
  useEffect(() => {
    if (!mapRef.current || isDrawing || selectedCountry) return;

    const bounds = L.latLngBounds([minLat, minLon], [maxLat, maxLon]);

    if (rectangleRef.current) {
      rectangleRef.current.setBounds(bounds);
      rectangleRef.current.setStyle({
        color: "#2563eb",
        fillColor: "#3b82f6",
        fillOpacity: 0.22,
        weight: 2,
      });
    } else {
      const rect = L.rectangle(bounds, {
        color: "#2563eb",
        weight: 2,
        fillColor: "#3b82f6",
        fillOpacity: 0.22,
      }).addTo(mapRef.current);
      rectangleRef.current = rect;
    }
  }, [minLon, minLat, maxLon, maxLat, isDrawing, selectedCountry]);

  // Handle Box Drawing Mode
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (isDrawing) {
      map.dragging.disable();
      map.getContainer().style.cursor = "crosshair";

      const onMouseDown = (e: L.LeafletMouseEvent) => {
        startLatLngRef.current = e.latlng;

        if (activeDrawRectRef.current) {
          map.removeLayer(activeDrawRectRef.current);
        }

        activeDrawRectRef.current = L.rectangle(
          L.latLngBounds(e.latlng, e.latlng),
          {
            color: "#ff0000",
            weight: 2,
            fillColor: "#ff0000",
            fillOpacity: 0.35,
            dashArray: "4, 4",
          }
        ).addTo(map);
      };

      const onMouseMove = (e: L.LeafletMouseEvent) => {
        if (!startLatLngRef.current || !activeDrawRectRef.current) return;
        const currentBounds = L.latLngBounds(startLatLngRef.current, e.latlng);
        activeDrawRectRef.current.setBounds(currentBounds);
      };

      const onMouseUp = (e: L.LeafletMouseEvent) => {
        if (!startLatLngRef.current) return;
        const start = startLatLngRef.current;
        const end = e.latlng;

        const newMinLat = Math.min(start.lat, end.lat);
        const newMaxLat = Math.max(start.lat, end.lat);
        const newMinLon = Math.min(start.lng, end.lng);
        const newMaxLon = Math.max(start.lng, end.lng);

        // Minimum threshold of 0.3 degrees
        if (newMaxLat - newMinLat > 0.3 && newMaxLon - newMinLon > 0.3) {
          onBboxChange([
            parseFloat(newMinLon.toFixed(2)),
            parseFloat(newMinLat.toFixed(2)),
            parseFloat(newMaxLon.toFixed(2)),
            parseFloat(newMaxLat.toFixed(2)),
          ]);
          setSelectedCountry(null);
          clearPeerMarkers();
          if (countryMarkerRef.current && mapRef.current) {
            mapRef.current.removeLayer(countryMarkerRef.current);
            countryMarkerRef.current = null;
          }
          if (thermalCircleRef.current && mapRef.current) {
            mapRef.current.removeLayer(thermalCircleRef.current);
            thermalCircleRef.current = null;
          }
          if (onSelectPreset) {
            onSelectPreset(""); // custom
          }
        }

        if (activeDrawRectRef.current) {
          map.removeLayer(activeDrawRectRef.current);
          activeDrawRectRef.current = null;
        }

        startLatLngRef.current = null;
        setIsDrawing(false);
      };

      map.on("mousedown", onMouseDown);
      map.on("mousemove", onMouseMove);
      map.on("mouseup", onMouseUp);

      return () => {
        map.off("mousedown", onMouseDown);
        map.off("mousemove", onMouseMove);
        map.off("mouseup", onMouseUp);
        map.dragging.enable();
        map.getContainer().style.cursor = "";
      };
    } else {
      map.dragging.enable();
      map.getContainer().style.cursor = "";
    }
  }, [isDrawing, onBboxChange, onSelectPreset]);

  // Build Rich HTML for Country Heat Index & Comparison Basket Popup
  const generatePopupContent = (country: CountryHeatData): string => {
    const isExtreme = country.heatIndexLevel === "Extreme";
    const isSevere = country.heatIndexLevel === "Severe";
    const isHigh = country.isHighHeat;

    const badgeClass = isExtreme
      ? "popup-badge-extreme"
      : isSevere
      ? "popup-badge-severe"
      : isHigh
      ? "popup-badge-elevated"
      : "popup-badge-normal";

    const badgeLabel = isExtreme
      ? "🔥 EXTREME HEAT ANOMALY"
      : isSevere
      ? "🔥 SEVERE HEAT ALERT"
      : isHigh
      ? "⚠️ ELEVATED HEAT ZONE"
      : "🟢 NORMAL BASELINE RANGE";

    // Comparison basket peer rows HTML
    const peerRowsHtml = country.comparisonBasket.comparisonPeers
      .map((peer) => {
        const isPeerHigh = peer.tempC >= 28;
        const diffText =
          peer.diffC > 0
            ? `+${peer.diffC.toFixed(1)}°C`
            : `${peer.diffC.toFixed(1)}°C`;
        const diffClass = peer.diffC > 0 ? "peer-diff-hot" : "peer-diff-cool";

        return `
          <div class="popup-basket-item">
            <span class="basket-peer-name">${peer.flag} ${peer.name}</span>
            <div class="basket-peer-stats">
              <span class="basket-peer-temp ${isPeerHigh ? "text-heat-high" : "text-heat-mid"}">${peer.tempC.toFixed(1)}°C</span>
              <span class="basket-peer-diff ${diffClass}">(${diffText})</span>
            </div>
          </div>
        `;
      })
      .join("");

    return `
      <div class="zenvyra-heat-popup">
        <div class="popup-header">
          <div class="popup-title-row">
            <span class="popup-flag">${country.flag}</span>
            <div>
              <h3 class="popup-country-name">${country.name}</h3>
              <span class="popup-continent">${country.continent} • Lat: ${country.centroid[0].toFixed(1)}°, Lon: ${country.centroid[1].toFixed(1)}°</span>
            </div>
          </div>
          <span class="popup-badge ${badgeClass}">${badgeLabel}</span>
        </div>

        <div class="popup-temp-hero">
          <div class="popup-temp-digits">
            <span class="popup-temp-c">${country.currentTempC.toFixed(1)}°C</span>
            <span class="popup-temp-f">/ ${country.currentTempF.toFixed(1)}°F</span>
          </div>
          <div class="popup-anomaly-row">
            <span class="popup-anomaly-pill ${country.globalMeanDiffC > 0 ? "anomaly-hot" : "anomaly-cool"}">
              ${country.globalMeanDiffC > 0 ? "+" : ""}${country.globalMeanDiffC.toFixed(1)}°C vs Global Mean (15°C)
            </span>
            <span class="popup-heat-score">Thermal Index: <strong>${country.heatScore}/100</strong></span>
          </div>
        </div>

        <!-- Heat Comparison Basket Section -->
        <div class="popup-basket-box">
          <div class="popup-basket-header">
            <strong>📊 Global Heat Comparison Basket</strong>
            <span class="popup-rank-tag">${country.comparisonBasket.thermalRank}</span>
          </div>

          <p class="popup-alert-narrative">${country.comparisonBasket.alertMessage}</p>

          <div class="popup-benchmark-grid">
            <div class="popup-benchmark-card">
              <span class="bm-label">Planetary Baseline</span>
              <span class="bm-val">15.0°C</span>
              <span class="bm-delta ${country.globalMeanDiffC > 0 ? "text-hot" : "text-cool"}">
                ${country.globalMeanDiffC > 0 ? "+" : ""}${country.globalMeanDiffC.toFixed(1)}°C Delta
              </span>
            </div>
            <div class="popup-benchmark-card">
              <span class="bm-label">Continental Mean</span>
              <span class="bm-val">${country.comparisonBasket.continentAverageC.toFixed(1)}°C</span>
              <span class="bm-delta ${country.currentTempC - country.comparisonBasket.continentAverageC > 0 ? "text-hot" : "text-cool"}">
                ${country.currentTempC - country.comparisonBasket.continentAverageC > 0 ? "+" : ""}${(country.currentTempC - country.comparisonBasket.continentAverageC).toFixed(1)}°C Delta
              </span>
            </div>
          </div>

          <div class="popup-basket-list">
            <div class="basket-list-title">Country Heat Index Comparison Basket:</div>
            ${peerRowsHtml}
          </div>
        </div>

        <!-- Action Button -->
        <div class="popup-footer">
          <button type="button" class="popup-analyze-btn">
            🚀 Run Decadal Heat Trend Analysis (2000–2024)
          </button>
        </div>
      </div>
    `;
  };

  // Handle Country Selection: Fly to map on Real Earth, mark in RED, mark peer countries
  const handleSelectCountry = (country: CountryHeatData) => {
    setSelectedCountry(country);
    setSearchQuery(country.name);
    setIsDropdownOpen(false);
    setIsDrawing(false);

    // Update coordinates in App
    onBboxChange(country.bbox);
    if (onSelectPreset) {
      onSelectPreset(""); // Clear preset active state
    }

    const map = mapRef.current;
    if (!map) return;

    const bounds = L.latLngBounds(
      [country.bbox[1], country.bbox[0]],
      [country.bbox[3], country.bbox[2]]
    );

    // 1. CLEAR PREVIOUS SELECTION LAYERS
    if (rectangleRef.current) {
      map.removeLayer(rectangleRef.current);
      rectangleRef.current = null;
    }
    if (thermalCircleRef.current) {
      map.removeLayer(thermalCircleRef.current);
      thermalCircleRef.current = null;
    }
    if (countryMarkerRef.current) {
      map.removeLayer(countryMarkerRef.current);
      countryMarkerRef.current = null;
    }

    // 2. IMMEDIATELY DRAW GLOWING RED BOUNDING BOX OVER SATELLITE EARTH
    const redRect = L.rectangle(bounds, {
      color: "#ff0000",
      weight: 4.5,
      fillColor: "#ff0000",
      fillOpacity: 0.38,
      className: "glowing-red-country-box",
    }).addTo(map);
    rectangleRef.current = redRect;

    // 3. IMMEDIATELY DRAW PULSING RED THERMAL ZONE (CIRCLE COVERING FOOTPRINT)
    const latSpan = Math.abs(country.bbox[3] - country.bbox[1]);
    const lonSpan = Math.abs(country.bbox[2] - country.bbox[0]);
    const radiusMeters = Math.max(latSpan, lonSpan) * 48000;

    const redCircle = L.circle(country.centroid, {
      radius: radiusMeters,
      color: "#ff2222",
      weight: 2.5,
      fillColor: "#ff0000",
      fillOpacity: 0.22,
      dashArray: "6, 8",
      className: "pulsing-red-thermal-circle",
    }).addTo(map);
    thermalCircleRef.current = redCircle;

    // 4. CREATE PULSING SATELLITE RADAR BEACON AT CENTROID
    const pulsingRedIcon = L.divIcon({
      className: "pulsing-beacon-container",
      html: `
        <div class="thermal-beacon-beacon">
          <div class="beacon-pulse-ring beacon-pulse-ring-1"></div>
          <div class="beacon-pulse-ring beacon-pulse-ring-2"></div>
          <div class="beacon-core-dot">
            <span class="beacon-inner-flame">🔥</span>
          </div>
        </div>
      `,
      iconSize: [48, 48],
      iconAnchor: [24, 24],
      popupAnchor: [0, -28],
    });

    const marker = L.marker(country.centroid, {
      icon: pulsingRedIcon,
      zIndexOffset: 2000,
      title: `${country.name}: Heat Temperature Index ${country.currentTempC}°C`,
    }).addTo(map);
    countryMarkerRef.current = marker;

    // 5. BIND POPUP WITH autoPan: false TO PREVENT ABORTING FLYTO ANIMATION
    const popupHtml = generatePopupContent(country);
    marker.bindPopup(popupHtml, {
      className: "zenvyra-custom-leaflet-popup",
      maxWidth: 390,
      minWidth: 320,
      autoPan: false,
      closeButton: true,
      autoClose: false,
      closeOnClick: false,
    });

    // 6. CINEMATIC FLY-TO ANIMATION DIRECTLY TO TARGET BOUNDS
    map.flyToBounds(bounds, {
      padding: [50, 50],
      maxZoom: 6,
      duration: 1.2,
    });

    // 7. RELIABLY OPEN POPUP ON MOVEEND + TIMER BACKUP
    const triggerPopup = () => {
      try {
        if (marker && map && !marker.isPopupOpen()) {
          marker.openPopup();
        }
      } catch (err) {
        console.warn("Could not open marker popup:", err);
      }
    };

    map.once("moveend", triggerPopup);
    setTimeout(triggerPopup, 1250);

    // 8. If Temperature is High, mark peer comparison countries across the Earth map!
    clearPeerMarkers();
    if (country.isHighHeat) {
      country.comparisonBasket.comparisonPeers.forEach((peer) => {
        const peerObj = COUNTRIES_DATA.find(
          (c) => c.name.toLowerCase() === peer.name.toLowerCase()
        );
        if (peerObj && peerObj.id !== country.id && mapRef.current) {
          const isPeerExtreme = peerObj.currentTempC >= 35;
          const peerIcon = L.divIcon({
            className: "peer-map-marker-wrapper",
            html: `
              <div class="peer-map-marker ${isPeerExtreme ? "peer-marker-extreme" : "peer-marker-high"}" title="Compare with ${peerObj.name} (${peerObj.currentTempC}°C)">
                <span class="peer-map-flag">${peerObj.flag}</span>
                <span class="peer-map-label">${peerObj.name}</span>
                <span class="peer-map-temp">${peerObj.currentTempC.toFixed(1)}°C</span>
              </div>
            `,
            iconSize: [115, 28],
            iconAnchor: [57, 14],
          });

          const pMarker = L.marker(peerObj.centroid, {
            icon: peerIcon,
            zIndexOffset: 400,
            title: `Heat Basket: ${peerObj.name} (${peerObj.currentTempC}°C)`,
          }).addTo(mapRef.current);

          pMarker.on("click", () => {
            handleSelectCountry(peerObj);
          });

          peerMarkersRef.current.push(pMarker);
        }
      });
    }
  };

  // Smart Search Execution (Enter key or Locate button)
  const handleExecuteSearch = (rawQuery?: string) => {
    const q = (rawQuery !== undefined ? rawQuery : searchQuery).trim().toLowerCase();
    if (!q) return;

    // 1. Exact name match
    let match = COUNTRIES_DATA.find((c) => c.name.toLowerCase() === q);
    // 2. Alias match (e.g. "usa", "uk", "uae", "russia")
    if (!match) {
      match = COUNTRIES_DATA.find((c) => c.aliases?.some((a) => a.toLowerCase() === q));
    }
    // 3. StartsWith name match
    if (!match) {
      match = COUNTRIES_DATA.find((c) => c.name.toLowerCase().startsWith(q));
    }
    // 4. Includes name or aliases
    if (!match) {
      match = COUNTRIES_DATA.find(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.aliases?.some((a) => a.toLowerCase().includes(q))
      );
    }
    // 5. Code match (e.g. "IN", "US", "EG", "SA")
    if (!match) {
      match = COUNTRIES_DATA.find((c) => c.code.toLowerCase() === q);
    }

    if (match) {
      handleSelectCountry(match);
    }
  };

  const handleClearCountry = () => {
    setSelectedCountry(null);
    setSearchQuery("");
    setIsDropdownOpen(false);
    clearPeerMarkers();
    const map = mapRef.current;
    if (countryMarkerRef.current && map) {
      map.removeLayer(countryMarkerRef.current);
      countryMarkerRef.current = null;
    }
    if (rectangleRef.current && map) {
      map.removeLayer(rectangleRef.current);
      rectangleRef.current = null;
    }
    if (thermalCircleRef.current && map) {
      map.removeLayer(thermalCircleRef.current);
      thermalCircleRef.current = null;
    }
  };

  const handlePresetClick = (preset: typeof REGION_PRESETS[0]) => {
    setIsDrawing(false);
    setSelectedCountry(null);
    clearPeerMarkers();
    const map = mapRef.current;
    if (countryMarkerRef.current && map) {
      map.removeLayer(countryMarkerRef.current);
      countryMarkerRef.current = null;
    }
    if (thermalCircleRef.current && map) {
      map.removeLayer(thermalCircleRef.current);
      thermalCircleRef.current = null;
    }
    onBboxChange(preset.bbox);
    if (onSelectPreset) {
      onSelectPreset(preset.id);
    }
  };

  const handleManualCoord = (index: number, val: number) => {
    const updated: [number, number, number, number] = [...bbox];
    updated[index] = val;
    onBboxChange(updated);
  };

  // Trending Hot Countries quick chips
  const HOT_TRENDING_COUNTRIES = [
    { name: "India", id: "india" },
    { name: "Saudi Arabia", id: "saudi_arabia" },
    { name: "Egypt", id: "egypt" },
    { name: "Spain", id: "spain" },
    { name: "Brazil", id: "brazil" },
    { name: "USA", id: "united_states" },
    { name: "Australia", id: "australia" },
  ];

  return (
    <div className="card-box geographic-study-card">
      {/* Card Header with Map Style Toggle */}
      <div className="section-header flex-between">
        <div className="flex-align">
          <Globe className="icon-blue" size={20} />
          <h2 className="section-title">1. Earth Satellite Map &amp; Heat Navigator</h2>
        </div>

        <div className="flex-align">
          {/* Earth Satellite Map Switcher */}
          <div className="map-layer-switcher flex-align" role="group" aria-label="Map Style">
            <button
              type="button"
              className={`layer-toggle-btn ${mapStyle === "satellite" ? "layer-btn-active" : ""}`}
              onClick={() => setMapStyle("satellite")}
              title="View photographic Earth satellite imagery from space"
            >
              🛰️ Earth Satellite
            </button>
            <button
              type="button"
              className={`layer-toggle-btn ${mapStyle === "topo" ? "layer-btn-active" : ""}`}
              onClick={() => setMapStyle("topo")}
              title="View clean topography map"
            >
              🗺️ Topo Map
            </button>
          </div>

          <button
            type="button"
            className={`action-btn ${isDrawing ? "draw-active-btn" : ""}`}
            onClick={() => setIsDrawing(!isDrawing)}
            title="Click to draw a custom study bounding box by dragging on the map"
          >
            <Square size={14} className={isDrawing ? "icon-red" : "icon-blue"} />
            <span>{isDrawing ? "Cancel Drawing" : "Draw Box"}</span>
          </button>
          <span className="badge-pill area-pill">
            Area: {((maxLon - minLon) * (maxLat - minLat)).toFixed(0)} sq°
          </span>
        </div>
      </div>

      {/* Prominent Aesthetic Country Search Bar */}
      <div className="country-search-wrapper">
        <div className="search-input-box flex-align">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            className="country-search-input"
            placeholder="Search any country (e.g. India, Saudi Arabia, Egypt, Spain, Brazil, USA, Russia...)"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setIsDropdownOpen(true);
            }}
            onFocus={() => setIsDropdownOpen(true)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleExecuteSearch();
              }
            }}
          />
          {searchQuery && (
            <button
              type="button"
              className="search-clear-btn"
              onClick={handleClearCountry}
              title="Clear search"
            >
              <X size={16} />
            </button>
          )}

          {/* Locate Country Action Button */}
          <button
            type="button"
            className="search-locate-btn flex-align"
            onClick={() => handleExecuteSearch()}
            title="Locate country and indicate in RED on the satellite Earth map"
          >
            <Search size={14} />
            <span>Locate</span>
          </button>
        </div>

        {/* Live Filter Autocomplete Dropdown */}
        {isDropdownOpen && searchQuery.trim().length > 0 && (
          <div className="country-dropdown-menu">
            {filteredCountries.length > 0 ? (
              filteredCountries.map((c) => (
                <div
                  key={c.id}
                  className="country-dropdown-item flex-between"
                  onClick={() => handleSelectCountry(c)}
                >
                  <div className="flex-align">
                    <span className="dropdown-flag">{c.flag}</span>
                    <div className="dropdown-country-info">
                      <span className="dropdown-country-name">{c.name}</span>
                      <span className="dropdown-country-continent">{c.continent}</span>
                    </div>
                  </div>
                  <div className="flex-align">
                    <span
                      className={`dropdown-temp-badge ${
                        c.isHighHeat ? "temp-badge-hot" : "temp-badge-norm"
                      }`}
                    >
                      {c.isHighHeat ? "🔥" : "🌡️"} {c.currentTempC.toFixed(1)}°C
                    </span>
                    <button type="button" className="dropdown-select-btn flex-align">
                      <span>Point &amp; Mark 🔴</span>
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="country-dropdown-empty">
                No matching country found. Press Enter to locate or pick a thermal hotspot below.
              </div>
            )}
          </div>
        )}

        {/* Quick Hotspot Country Chips */}
        <div className="quick-hotspot-row flex-align">
          <span className="quick-chip-label flex-align">
            <Flame size={13} className="text-heat-high" />
            <span>Thermal Hotspots:</span>
          </span>
          <div className="quick-chips-scroller">
            {HOT_TRENDING_COUNTRIES.map((chip) => {
              const countryObj = COUNTRIES_DATA.find((c) => c.id === chip.id);
              if (!countryObj) return null;
              const isSelected = selectedCountry?.id === countryObj.id;

              return (
                <button
                  key={chip.id}
                  type="button"
                  className={`hotspot-chip ${isSelected ? "hotspot-chip-active" : ""}`}
                  onClick={() => handleSelectCountry(countryObj)}
                  title={`Select ${countryObj.name} (${countryObj.currentTempC}°C)`}
                >
                  <span>{countryObj.flag} {countryObj.name}</span>
                  <span className="chip-temp">{countryObj.currentTempC.toFixed(1)}°C</span>
                  {countryObj.isHighHeat && <span className="chip-fire">🔥</span>}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Selected Country Active Banner */}
      {selectedCountry && (
        <div className="country-active-banner flex-between">
          <div className="flex-align">
            <div className="active-banner-pulse" />
            <span className="active-banner-flag">{selectedCountry.flag}</span>
            <div>
              <strong className="active-country-title">
                {selectedCountry.name} Marked in Luminous RED Thermal Zone
              </strong>
              <div className="active-banner-sub">
                Surface Temp: <strong className="text-heat-high">{selectedCountry.currentTempC}°C ({selectedCountry.currentTempF}°F)</strong> • {selectedCountry.globalMeanDiffC > 0 ? `+${selectedCountry.globalMeanDiffC}°C vs Global Normal` : "Normal"} • {selectedCountry.comparisonBasket.thermalRank}
              </div>
            </div>
          </div>

          <div className="flex-align">
            {onAnalyzeCountryHeat && (
              <button
                type="button"
                className="banner-analyze-btn flex-align"
                onClick={() => onAnalyzeCountryHeat(selectedCountry.bbox)}
                title="Run decadal temperature analysis on this country"
              >
                <TrendingUp size={14} />
                <span>Analyze Heat Trend</span>
              </button>
            )}
            <button
              type="button"
              className="banner-dismiss-btn"
              onClick={handleClearCountry}
              title="Clear country selection"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {isDrawing ? (
        <div className="draw-banner flex-align">
          <Square size={16} className="icon-red" />
          <span>
            <strong>Drawing Mode Active:</strong> Click and drag across the photographic Earth satellite map to define your study area.
          </span>
        </div>
      ) : (
        <p className="instruction-text">
          Showing <strong>Photographic Earth from Space</strong>. Search any country or click Locate to fly directly to it and mark it in <strong>glowing RED</strong>.
        </p>
      )}

      {/* Region Presets */}
      <div className="preset-grid" role="group" aria-label="Region Presets">
        {REGION_PRESETS.map((preset) => {
          const isActive = selectedPresetId === preset.id && !selectedCountry;
          return (
            <button
              key={preset.id}
              type="button"
              className={`preset-btn ${isActive ? "preset-btn-active" : ""}`}
              onClick={() => handlePresetClick(preset)}
              title={preset.description}
            >
              <MapPin size={14} className={isActive ? "icon-active" : "icon-gray"} />
              <span>{preset.name}</span>
            </button>
          );
        })}
      </div>

      {/* Map Viewport showing Real Photographic Earth with Floating HUD Overlay */}
      <div className="map-viewport-wrapper">
        <div
          ref={mapContainerRef}
          className="map-viewport"
          aria-label="Interactive photographic world map showing selected study region"
        />

        {/* Floating Country Heat HUD (Always visible and anchored when country is selected) */}
        {selectedCountry && (
          <div className="map-floating-heat-hud" role="region" aria-label="Selected Country Thermal Status">
            <div className="flex-between hud-top-row">
              <div className="flex-align">
                <span className="hud-country-flag">{selectedCountry.flag}</span>
                <div>
                  <strong className="hud-country-name">{selectedCountry.name}</strong>
                  <span className="hud-country-continent">{selectedCountry.continent}</span>
                </div>
              </div>
              <span className={`hud-level-pill level-${selectedCountry.heatIndexLevel.toLowerCase()}`}>
                {selectedCountry.heatIndexLevel === "Extreme" ? "🔥 Extreme Heat" : selectedCountry.heatIndexLevel}
              </span>
            </div>

            <div className="hud-temp-metric flex-between">
              <div>
                <span className="hud-temp-c">{selectedCountry.currentTempC.toFixed(1)}°C</span>
                <span className="hud-temp-f">/ {selectedCountry.currentTempF.toFixed(1)}°F</span>
              </div>
              <div className="hud-delta-tag">
                {selectedCountry.globalMeanDiffC > 0 ? `+${selectedCountry.globalMeanDiffC.toFixed(1)}°C` : `${selectedCountry.globalMeanDiffC.toFixed(1)}°C`} vs Normal
              </div>
            </div>

            <div className="hud-rank-line">
              <strong>Rank:</strong> {selectedCountry.comparisonBasket.thermalRank}
            </div>

            <div className="hud-actions-row flex-between">
              {onAnalyzeCountryHeat && (
                <button
                  type="button"
                  className="hud-action-btn-analyze flex-align"
                  onClick={() => onAnalyzeCountryHeat(selectedCountry.bbox)}
                  title="Run decadal temperature analysis on this country"
                >
                  <TrendingUp size={13} />
                  <span>Analyze Heat</span>
                </button>
              )}
              <button
                type="button"
                className="hud-action-btn-recenter flex-align"
                onClick={() => {
                  if (mapRef.current) {
                    const bounds = L.latLngBounds(
                      [selectedCountry.bbox[1], selectedCountry.bbox[0]],
                      [selectedCountry.bbox[3], selectedCountry.bbox[2]]
                    );
                    mapRef.current.flyToBounds(bounds, { padding: [50, 50], duration: 1.0 });
                    if (countryMarkerRef.current) countryMarkerRef.current.openPopup();
                  }
                }}
                title="Re-center map on country"
              >
                <MapPin size={13} />
                <span>Center</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Dedicated Global Heat Comparison Basket & Temperature Index Labeling */}
      {selectedCountry && (
        <div className="heat-comparison-basket-panel">
          <div className="flex-between basket-panel-header">
            <div className="flex-align">
              <Thermometer size={18} className="text-heat-high" />
              <h3 className="basket-panel-title">
                Global Heat Comparison Basket: {selectedCountry.name}
              </h3>
            </div>
            <span className={`basket-status-badge level-${selectedCountry.heatIndexLevel.toLowerCase()}`}>
              {selectedCountry.isHighHeat ? "🔥 High Thermal Anomaly" : "🟢 Normal Baseline"}
            </span>
          </div>

          {/* Temperature Index Present Country Labeling */}
          <div className="present-country-index-card">
            <div className="flex-between">
              <div className="flex-align">
                <span className="present-country-flag">{selectedCountry.flag}</span>
                <div>
                  <h4 className="present-country-name">{selectedCountry.name}</h4>
                  <span className="present-country-rank">{selectedCountry.comparisonBasket.thermalRank}</span>
                </div>
              </div>
              <div className="present-temp-display">
                <span className="present-temp-num">{selectedCountry.currentTempC.toFixed(1)}°C</span>
                <span className="present-temp-f">/ {selectedCountry.currentTempF.toFixed(1)}°F</span>
              </div>
            </div>

            <div className="present-index-meta-grid">
              <div className="index-meta-item">
                <span className="meta-label">Thermal Index</span>
                <strong className="meta-val text-heat-high">{selectedCountry.heatScore}/100</strong>
              </div>
              <div className="index-meta-item">
                <span className="meta-label">Planetary Anomaly</span>
                <strong className={`meta-val ${selectedCountry.globalMeanDiffC > 0 ? "text-heat-high" : "text-sky"}`}>
                  {selectedCountry.globalMeanDiffC > 0 ? "+" : ""}{selectedCountry.globalMeanDiffC.toFixed(1)}°C
                </strong>
              </div>
              <div className="index-meta-item">
                <span className="meta-label">All-Time Record</span>
                <strong className="meta-val">{selectedCountry.historicalRecordHighC.toFixed(1)}°C</strong>
              </div>
              <div className="index-meta-item">
                <span className="meta-label">Continent Mean</span>
                <strong className="meta-val">{selectedCountry.comparisonBasket.continentAverageC.toFixed(1)}°C</strong>
              </div>
            </div>
          </div>

          {/* Peer Country Comparison Rows */}
          <div className="basket-comparison-list">
            <div className="basket-subheading flex-between">
              <span>Comparing {selectedCountry.name} with Other Countries in Basket:</span>
              <span className="basket-hint">Click any country to point on Earth map 📍</span>
            </div>

            <div className="basket-peer-grid">
              {selectedCountry.comparisonBasket.comparisonPeers.map((peer, idx) => {
                const peerObj = COUNTRIES_DATA.find((c) => c.name.toLowerCase() === peer.name.toLowerCase());
                const diffWithCurrent = peer.tempC - selectedCountry.currentTempC;
                const isPeerHotter = diffWithCurrent > 0;

                return (
                  <div
                    key={idx}
                    className="basket-peer-card flex-between"
                    onClick={() => peerObj && handleSelectCountry(peerObj)}
                    style={{ cursor: peerObj ? "pointer" : "default" }}
                    title={peerObj ? `Click to navigate map to ${peer.name}` : undefined}
                  >
                    <div className="flex-align">
                      <span className="peer-card-flag">{peer.flag}</span>
                      <div>
                        <strong className="peer-card-name">{peer.name}</strong>
                        <span className="peer-card-diff">
                          {diffWithCurrent === 0
                            ? "Equal"
                            : isPeerHotter
                            ? `+${diffWithCurrent.toFixed(1)}°C hotter`
                            : `${Math.abs(diffWithCurrent).toFixed(1)}°C cooler`}
                        </span>
                      </div>
                    </div>

                    <div className="peer-card-stats flex-align">
                      <span className={`peer-card-temp ${peer.tempC >= 28 ? "text-heat-high" : "text-heat-mid"}`}>
                        {peer.tempC.toFixed(1)}°C
                      </span>
                      {peerObj && (
                        <button type="button" className="peer-point-btn" title="Point to country on map">
                          Point 📍
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Coordinate Display & Manual Fine-tuning */}
      <div className="coord-grid">
        <div className="coord-item">
          <label htmlFor="min-lat">Min Latitude (°S/°N)</label>
          <input
            id="min-lat"
            type="number"
            step="0.5"
            min="-90"
            max="89"
            value={minLat}
            onChange={(e) => handleManualCoord(1, parseFloat(e.target.value) || 0)}
          />
        </div>
        <div className="coord-item">
          <label htmlFor="max-lat">Max Latitude (°S/°N)</label>
          <input
            id="max-lat"
            type="number"
            step="0.5"
            min="-89"
            max="90"
            value={maxLat}
            onChange={(e) => handleManualCoord(3, parseFloat(e.target.value) || 0)}
          />
        </div>
        <div className="coord-item">
          <label htmlFor="min-lon">Min Longitude (°W/°E)</label>
          <input
            id="min-lon"
            type="number"
            step="0.5"
            min="-180"
            max="179"
            value={minLon}
            onChange={(e) => handleManualCoord(0, parseFloat(e.target.value) || 0)}
          />
        </div>
        <div className="coord-item">
          <label htmlFor="max-lon">Max Longitude (°W/°E)</label>
          <input
            id="max-lon"
            type="number"
            step="0.5"
            min="-179"
            max="180"
            value={maxLon}
            onChange={(e) => handleManualCoord(2, parseFloat(e.target.value) || 0)}
          />
        </div>
      </div>
    </div>
  );
};
