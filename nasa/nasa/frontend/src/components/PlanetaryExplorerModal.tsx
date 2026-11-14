import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { REGION_PRESETS } from "../presets";
import type { RegionPreset } from "../types";
import { X, Globe, Sparkles, MapPin, ArrowRight } from "lucide-react";

interface PlanetaryExplorerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectRegion: (preset: RegionPreset) => void;
  currentPresetId?: string;
}

export const PlanetaryExplorerModal: React.FC<PlanetaryExplorerModalProps> = ({
  isOpen,
  onClose,
  onSelectRegion,
  currentPresetId,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [selectedPreset, setSelectedPreset] = useState<RegionPreset>(
    REGION_PRESETS.find((p) => p.id === currentPresetId) || REGION_PRESETS[0]
  );

  const globeRef = useRef<THREE.Mesh | null>(null);

  useEffect(() => {
    if (!isOpen || !mountRef.current) return;

    const container = mountRef.current;
    const width = container.clientWidth || 380;
    const height = 380;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.z = 2.75;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    container.appendChild(renderer.domElement);

    // Instant Complete NASA Blue Marble Equirectangular Texture (zero white flash)
    const canvas = document.createElement("canvas");
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      const g = ctx.createLinearGradient(0, 0, 0, 512);
      g.addColorStop(0, "#081d3d");
      g.addColorStop(0.5, "#0e3a73");
      g.addColorStop(1, "#081d3d");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 1024, 512);

      const toX = (lon: number) => ((lon + 180) / 360) * 1024;
      const toY = (lat: number) => ((90 - lat) / 180) * 512;
      const drawP = (coords: [number, number][], fill: string) => {
        ctx.fillStyle = fill;
        ctx.beginPath();
        coords.forEach(([lat, lon], idx) => {
          const x = toX(lon);
          const y = toY(lat);
          if (idx === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.closePath();
        ctx.fill();
      };
      drawP([[71, 28], [75, 60], [77, 105], [72, 140], [65, 175], [55, 160], [40, 130], [30, 122], [22, 115], [10, 105], [15, 80], [25, 65], [30, 50], [38, 45], [42, 30], [45, 15], [55, 8], [62, 5], [70, 20]], "#2d633b");
      drawP([[35, -5], [32, 32], [22, 38], [14, 45], [10, 15], [5, 2], [15, -16], [30, -10]], "#a88147");
      drawP([[14, 15], [10, 44], [-5, 40], [-25, 32], [-34, 18], [-28, 15], [-10, 12], [4, 8]], "#22562d");
      drawP([[70, -165], [72, -130], [68, -95], [60, -65], [52, -55], [45, -65], [30, -82], [25, -80], [15, -92], [20, -105], [32, -118], [48, -125], [58, -140], [65, -168]], "#2d633b");
      drawP([[12, -75], [5, -52], [-5, -35], [-22, -40], [-35, -55], [-55, -68], [-52, -75], [-20, -70], [-5, -80], [5, -78]], "#1c5028");
      drawP([[28, 70], [25, 85], [18, 82], [8, 78], [18, 73], [24, 68]], "#2d683a");
      drawP([[-12, 132], [-15, 145], [-25, 152], [-38, 145], [-35, 115], [-22, 114], [-15, 125]], "#946f3a");
      drawP([[-68, -180], [-68, 180], [-90, 180], [-90, -180]], "#e2e8f0");
    }
    const initialTex = new THREE.CanvasTexture(canvas);
    initialTex.colorSpace = THREE.SRGBColorSpace;

    // Photographic Earth Texture with initial instant complete map
    const textureLoader = new THREE.TextureLoader();
    const globeGeo = new THREE.SphereGeometry(1, 64, 64);
    const globeMat = new THREE.MeshStandardMaterial({
      map: initialTex,
      roughness: 0.7,
      metalness: 0.05,
    });
    const globe = new THREE.Mesh(globeGeo, globeMat);
    globe.rotation.z = (23.4 * Math.PI) / 180;
    scene.add(globe);
    globeRef.current = globe;

    // NASA Space Apps Neon Yellow Orbit Ring at 25% Opacity
    const orbitPoints: THREE.Vector3[] = [];
    for (let i = 0; i <= 64; i++) {
      const th = (i / 64) * Math.PI * 2;
      orbitPoints.push(new THREE.Vector3(1.35 * Math.cos(th), 1.35 * Math.sin(th), 0));
    }
    const orbitGeo = new THREE.BufferGeometry().setFromPoints(orbitPoints);
    const orbitMat = new THREE.LineBasicMaterial({
      color: 0xffe600,
      transparent: true,
      opacity: 0.25,
    });
    const orbitLine = new THREE.Line(orbitGeo, orbitMat);
    orbitLine.rotation.x = Math.PI / 3;
    orbitLine.rotation.y = Math.PI / 6;
    scene.add(orbitLine);

    textureLoader.load(
      "/textures/earth_atmos_2048.jpg",
      (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        globeMat.color.setHex(0xffffff);
        globeMat.map = tex;
        globeMat.needsUpdate = true;
      },
      undefined,
      () => {
        textureLoader.load("/textures/2k_earth_daymap.jpg", (fallbackTex) => {
          fallbackTex.colorSpace = THREE.SRGBColorSpace;
          globeMat.color.setHex(0xffffff);
          globeMat.map = fallbackTex;
          globeMat.needsUpdate = true;
        });
      }
    );

    // Balanced Complete Illumination (No harsh shadows or blown out white)
    scene.add(new THREE.AmbientLight(0xffffff, 1.45));
    const keyLight = new THREE.DirectionalLight(0xffffff, 0.45);
    keyLight.position.set(2, 1, 3);
    scene.add(keyLight);

    const blueGlow = new THREE.DirectionalLight(0x60a5fa, 0.5);
    blueGlow.position.set(-2, 0, -2);
    scene.add(blueGlow);

    // Interactive mouse drag to rotate
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging || !globe) return;
      const deltaX = e.clientX - prevMouseX;
      const deltaY = e.clientY - prevMouseY;
      globe.rotation.y += deltaX * 0.006;
      globe.rotation.x += deltaY * 0.006;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    const domElement = renderer.domElement;
    domElement.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);

    let animId: number;
    const animate = () => {
      if (!isDragging && globe) {
        globe.rotation.y += 0.005;
      }
      renderer.render(scene, camera);
      animId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(animId);
      domElement.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      renderer.dispose();
      initialTex.dispose();
      globeGeo.dispose();
      globeMat.dispose();
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleApply = (preset: RegionPreset) => {
    onSelectRegion(preset);
    onClose();
  };

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal-card modal-card-wide">
        <div className="modal-header flex-between">
          <div className="flex-align">
            <Globe className="icon-blue" size={24} />
            <h3 className="modal-title">Zenvyra 3D Planetary Climate Explorer</h3>
          </div>
          <button type="button" className="close-btn" onClick={onClose} aria-label="Close planetary explorer">
            <X size={18} />
          </button>
        </div>

        <p className="modal-subtitle">
          Rotate the complete 3D Earth and explore regional hotspots across the globe.
        </p>

        <div className="planetary-grid">
          {/* Left: 3D Earth Globe Canvas */}
          <div className="globe-canvas-card">
            <div ref={mountRef} className="globe-3d-mount" />
            <span className="globe-hint">🖱️ Click & Drag to spin the 3D globe</span>
          </div>

          {/* Right: Regional Hotspots List */}
          <div className="hotspots-list">
            <h4 className="hotspots-title">Earth Observation Hotspots:</h4>
            <div className="hotspots-scroll">
              {REGION_PRESETS.map((preset) => {
                const isSelected = selectedPreset.id === preset.id;
                return (
                  <div
                    key={preset.id}
                    className={`hotspot-card ${isSelected ? "hotspot-card-selected" : ""}`}
                    onClick={() => setSelectedPreset(preset)}
                  >
                    <div className="flex-between">
                      <div className="flex-align">
                        <MapPin size={15} className={isSelected ? "icon-active" : "icon-gray"} />
                        <strong>{preset.name}</strong>
                      </div>
                      <span className="badge-pill">{preset.sphere.toUpperCase()}</span>
                    </div>
                    <p className="hotspot-desc">{preset.description}</p>
                    {isSelected && (
                      <button
                        type="button"
                        className="hotspot-select-btn flex-align"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleApply(preset);
                        }}
                      >
                        <Sparkles size={14} />
                        <span>Load This Hotspot into Workspace</span>
                        <ArrowRight size={14} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="modal-footer flex-end">
          <button type="button" className="secondary-btn" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
