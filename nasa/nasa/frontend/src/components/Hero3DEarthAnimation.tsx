import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { Orbit, Compass, RefreshCw } from "lucide-react";

interface Hotspot3D {
  name: string;
  lat: number;
  lon: number;
  temp: string;
  color: number;
}

const THERMAL_HOTSPOTS: Hotspot3D[] = [
  { name: "India", lat: 20.5937, lon: 78.9629, temp: "34.2°C", color: 0xff3333 },
  { name: "Sahara / Egypt", lat: 26.8206, lon: 30.8025, temp: "38.6°C", color: 0xff2222 },
  { name: "Iberian Peninsula", lat: 40.4637, lon: -3.7492, temp: "29.4°C", color: 0xff4422 },
  { name: "Amazon Basin", lat: -14.235, lon: -51.9253, temp: "31.5°C", color: 0xff3333 },
  { name: "Arabian Peninsula", lat: 23.8859, lon: 45.0792, temp: "41.2°C", color: 0xff1111 },
  { name: "Arctic Warming Ridge", lat: 72.0, lon: 15.0, temp: "+2.8x Warming", color: 0x38bdf8 },
];

export const Hero3DEarthAnimation: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [activeSpeed, setActiveSpeed] = useState<"normal" | "fast">("normal");
  const speedMultiplierRef = useRef(1);
  speedMultiplierRef.current = activeSpeed === "fast" ? 2.2 : 1.0;

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 500;
    const height = container.clientHeight || 500;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 1000);
    camera.position.set(0, 0.8, 6.2);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2.5));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);

    // 2. Earth Globe Mesh with Instant Complete Equirectangular Texture
    const earthRadius = 2.1;
    const earthGeo = new THREE.SphereGeometry(earthRadius, 64, 64);

    // Create instant Earth canvas so globe is immediately complete with zero flash
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
      // Continents
      drawP([[71, 28], [75, 60], [77, 105], [72, 140], [65, 175], [55, 160], [40, 130], [30, 122], [22, 115], [10, 105], [15, 80], [25, 65], [30, 50], [38, 45], [42, 30], [45, 15], [55, 8], [62, 5], [70, 20]], "#2d633b");
      drawP([[35, -5], [32, 32], [22, 38], [14, 45], [10, 15], [5, 2], [15, -16], [30, -10]], "#a88147");
      drawP([[14, 15], [10, 44], [-5, 40], [-25, 32], [-34, 18], [-28, 15], [-10, 12], [4, 8]], "#22562d");
      drawP([[70, -165], [72, -130], [68, -95], [60, -65], [52, -55], [45, -65], [30, -82], [25, -80], [15, -92], [20, -105], [32, -118], [48, -125], [58, -140], [65, -168]], "#2d633b");
      drawP([[12, -75], [5, -52], [-5, -35], [-22, -40], [-35, -55], [-55, -68], [-52, -75], [-20, -70], [-5, -80], [5, -78]], "#1c5028");
      drawP([[28, 70], [25, 85], [18, 82], [8, 78], [18, 73], [24, 68]], "#2d683a");
      drawP([[-12, 132], [-15, 145], [-25, 152], [-38, 145], [-35, 115], [-22, 114], [-15, 125]], "#946f3a");
      drawP([[-68, -180], [-68, 180], [-90, 180], [-90, -180]], "#e2e8f0");
      ctx.fillStyle = "rgba(255, 255, 255, 0.28)";
      for (let i = 0; i < 20; i++) {
        const cx = (i * 54) % 1024;
        const cy = 180 + Math.sin(i * 0.9) * 55;
        ctx.beginPath();
        ctx.ellipse(cx, cy, 55, 12, 0.1, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    const initialTex = new THREE.CanvasTexture(canvas);
    initialTex.colorSpace = THREE.SRGBColorSpace;

    const earthMat = new THREE.MeshStandardMaterial({
      map: initialTex,
      roughness: 0.65,
      metalness: 0.05,
    });
    const earthMesh = new THREE.Mesh(earthGeo, earthMat);
    // Earth's natural 23.4° axial tilt
    earthMesh.rotation.z = (23.4 * Math.PI) / 180;
    scene.add(earthMesh);

    // Texture Loader: NASA Blue Marble Photorealistic Texture
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load(
      "/textures/earth_atmos_2048.jpg",
      (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        earthMat.color.setHex(0xffffff);
        earthMat.map = tex;
        earthMat.needsUpdate = true;
      },
      undefined,
      () => {
        textureLoader.load("/textures/2k_earth_daymap.jpg", (fallback) => {
          fallback.colorSpace = THREE.SRGBColorSpace;
          earthMat.color.setHex(0xffffff);
          earthMat.map = fallback;
          earthMat.needsUpdate = true;
        });
      }
    );

    // 3. Atmospheric Halo Glow (NASA Space Apps Electric Blue)
    const atmosphereGeo = new THREE.SphereGeometry(earthRadius * 1.035, 48, 48);
    const atmosphereMat = new THREE.MeshBasicMaterial({
      color: 0x0077ff,
      transparent: true,
      opacity: 0.18,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
    });
    const atmosphereMesh = new THREE.Mesh(atmosphereGeo, atmosphereMat);
    scene.add(atmosphereMesh);

    // Helper: convert lat/lon to 3D Cartesian coordinates on sphere
    const latLonToVector3 = (lat: number, lon: number, radius: number): THREE.Vector3 => {
      const phi = (90 - lat) * (Math.PI / 180);
      const theta = (lon + 180) * (Math.PI / 180);
      const x = -(radius * Math.sin(phi) * Math.cos(theta));
      const z = radius * Math.sin(phi) * Math.sin(theta);
      const y = radius * Math.cos(phi);
      return new THREE.Vector3(x, y, z);
    };

    // 4. 3D Thermal Hotspot Markers & Pulsing Radar Rings on Earth's Surface
    const pulseRings: { mesh: THREE.Mesh; scale: number; baseRadius: number; position: THREE.Vector3 }[] = [];
    THERMAL_HOTSPOTS.forEach((spot) => {
      const pos = latLonToVector3(spot.lat, spot.lon, earthRadius * 1.004);

      // Core red beacon pin
      const pinGeo = new THREE.SphereGeometry(0.045, 16, 16);
      const pinMat = new THREE.MeshBasicMaterial({ color: spot.color });
      const pinMesh = new THREE.Mesh(pinGeo, pinMat);
      pinMesh.position.copy(pos);
      earthMesh.add(pinMesh);

      // Expanding 3D pulse ring
      const ringGeo = new THREE.RingGeometry(0.05, 0.08, 24);
      const ringMat = new THREE.MeshBasicMaterial({
        color: spot.color,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.85,
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.position.copy(pos.clone().multiplyScalar(1.002));
      ringMesh.lookAt(pos.clone().multiplyScalar(2));
      earthMesh.add(ringMesh);

      pulseRings.push({
        mesh: ringMesh,
        scale: 1,
        baseRadius: 0.05,
        position: pos,
      });
    });

    // 5. NASA Space Apps Neon Yellow 3D Orbit Trajectory Rings (25% Opacity Guideline)
    // Orbit 1: Polar Earth Observation (Terra / Aqua satellite path)
    const createOrbitLine = (radiusX: number, radiusY: number, tiltZ: number, tiltX: number, colorHex: number) => {
      const curvePoints: THREE.Vector3[] = [];
      const segments = 128;
      for (let i = 0; i <= segments; i++) {
        const theta = (i / segments) * Math.PI * 2;
        const x = radiusX * Math.cos(theta);
        const y = radiusY * Math.sin(theta);
        curvePoints.push(new THREE.Vector3(x, y, 0));
      }
      const orbitGeo = new THREE.BufferGeometry().setFromPoints(curvePoints);
      const orbitMat = new THREE.LineBasicMaterial({
        color: colorHex,
        transparent: true,
        opacity: 0.28, // Matches ~25% opacity guideline
        linewidth: 1.5,
      });
      const orbitLine = new THREE.Line(orbitGeo, orbitMat);
      orbitLine.rotation.z = tiltZ;
      orbitLine.rotation.x = tiltX;
      return orbitLine;
    };

    // Orbit 1: Polar Orbit (Neon Yellow #FFE600)
    const orbitPolar = createOrbitLine(3.1, 3.1, Math.PI / 4, Math.PI / 3, 0xffe600);
    scene.add(orbitPolar);

    // Orbit 2: Inclined Tropical Orbit (Neon Yellow #FFE600)
    const orbitTropical = createOrbitLine(3.4, 3.4, -Math.PI / 6, Math.PI / 8, 0xffe600);
    scene.add(orbitTropical);

    // Coordinate Horizon Grid Ring (NASA Space Apps scientific patterns at 25% opacity)
    const coordRing = createOrbitLine(2.7, 2.7, Math.PI / 2, 0, 0x38bdf8);
    (coordRing.material as THREE.LineBasicMaterial).opacity = 0.22;
    scene.add(coordRing);

    // 6. 3D Animated Satellite Models orbiting along the Neon Yellow paths
    const createSatelliteMesh = (panelColorHex: number) => {
      const satGroup = new THREE.Group();

      // Satellite main chassis (metallic cuboid)
      const bodyGeo = new THREE.BoxGeometry(0.12, 0.08, 0.08);
      const bodyMat = new THREE.MeshStandardMaterial({
        color: 0xd4d4d8,
        metalness: 0.9,
        roughness: 0.2,
      });
      const body = new THREE.Mesh(bodyGeo, bodyMat);
      satGroup.add(body);

      // Solar Panels in Electric Blue
      const panelGeo = new THREE.BoxGeometry(0.26, 0.04, 0.01);
      const panelMat = new THREE.MeshStandardMaterial({
        color: panelColorHex,
        metalness: 0.7,
        roughness: 0.3,
        emissive: panelColorHex,
        emissiveIntensity: 0.25,
      });
      const leftPanel = new THREE.Mesh(panelGeo, panelMat);
      leftPanel.position.set(-0.18, 0, 0);
      satGroup.add(leftPanel);

      const rightPanel = new THREE.Mesh(panelGeo, panelMat);
      rightPanel.position.set(0.18, 0, 0);
      satGroup.add(rightPanel);

      // Telemetry Beacon in Neon Yellow (#FFE600)
      const beaconGeo = new THREE.SphereGeometry(0.025, 8, 8);
      const beaconMat = new THREE.MeshBasicMaterial({ color: 0xffe600 });
      const beacon = new THREE.Mesh(beaconGeo, beaconMat);
      beacon.position.set(0, 0.06, 0);
      satGroup.add(beacon);

      return satGroup;
    };

    const satPolar = createSatelliteMesh(0x0077ff);
    scene.add(satPolar);

    const satTropical = createSatelliteMesh(0x38bdf8);
    scene.add(satTropical);

    // 3D Moon Mesh rotating and orbiting Earth
    const moonRadius = 0.42;
    const moonGeo = new THREE.SphereGeometry(moonRadius, 24, 24);
    const moonCanvas = document.createElement("canvas");
    moonCanvas.width = 256;
    moonCanvas.height = 128;
    const mCtx = moonCanvas.getContext("2d")!;
    mCtx.fillStyle = "#8a8f98";
    mCtx.fillRect(0, 0, 256, 128);
    mCtx.fillStyle = "#5c6068";
    for (let i = 0; i < 16; i++) {
      const x = (i * 39) % 256;
      const y = 20 + (i % 4) * 22;
      mCtx.beginPath();
      mCtx.ellipse(x, y, 16, 11, i * 0.25, 0, Math.PI * 2);
      mCtx.fill();
    }
    mCtx.fillStyle = "#cbd5e1";
    for (let i = 0; i < 18; i++) {
      const x = (i * 27 + 10) % 256;
      const y = 15 + (i % 5) * 20;
      mCtx.beginPath();
      mCtx.arc(x, y, 2.5, 0, Math.PI * 2);
      mCtx.fill();
    }
    const moonTex = new THREE.CanvasTexture(moonCanvas);
    const moonMat = new THREE.MeshStandardMaterial({
      map: moonTex,
      roughness: 0.9,
      metalness: 0.05,
    });
    const moonMesh = new THREE.Mesh(moonGeo, moonMat);
    scene.add(moonMesh);

    // Neon Yellow Lunar Orbit Trajectory (25% opacity)
    const moonOrbitLine = createOrbitLine(4.2, 4.2, Math.PI / 10, Math.PI / 6, 0xffe600);
    (moonOrbitLine.material as THREE.LineBasicMaterial).opacity = 0.22;
    scene.add(moonOrbitLine);

    // 7. Lighting System: Space Apps Electric Blue & Sunlight
    // Uniform ambient so no dark cutouts occur
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.8);
    scene.add(ambientLight);

    // Sunlight from top-left (following Space Apps 45° gradient light vector)
    const sunLight = new THREE.DirectionalLight(0xffffff, 0.65);
    sunLight.position.set(4, 3, 4);
    scene.add(sunLight);

    // Electric Blue space rim light
    const electricBlueLight = new THREE.DirectionalLight(0x0077ff, 0.75);
    electricBlueLight.position.set(-3, -1, -3);
    scene.add(electricBlueLight);

    // 8. Mouse Drag & Inertia Interactive Rotation
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;
    let rotSpeedX = 0;
    let rotSpeedY = 0;

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const deltaX = e.clientX - prevMouseX;
      const deltaY = e.clientY - prevMouseY;
      rotSpeedY = deltaX * 0.005;
      rotSpeedX = deltaY * 0.005;
      earthMesh.rotation.y += rotSpeedY;
      earthMesh.rotation.x += rotSpeedX;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    container.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);

    // Resize Observer
    const resizeObserver = new ResizeObserver(() => {
      if (!container) return;
      const w = container.clientWidth || 500;
      const h = container.clientHeight || 500;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    });
    resizeObserver.observe(container);

    // 9. High-Performance 60FPS 3D Animation Loop
    let animId: number;
    let satAnglePolar = 0;
    let satAngleTropical = Math.PI / 2;
    let moonAngle = Math.PI / 3;

    const animate = () => {
      const speed = speedMultiplierRef.current;

      // Smooth Earth Self-Rotation
      if (!isDragging) {
        earthMesh.rotation.y += 0.004 * speed;
        // Dampen inertia
        rotSpeedX *= 0.95;
        rotSpeedY *= 0.95;
        earthMesh.rotation.x += rotSpeedX;
        earthMesh.rotation.y += rotSpeedY;
      }

      // Animate Polar Satellite (Terra/Aqua) along Neon Yellow Orbit 1
      satAnglePolar += 0.012 * speed;
      const polarR = 3.1;
      const px = polarR * Math.cos(satAnglePolar);
      const py = polarR * Math.sin(satAnglePolar);
      const pVec = new THREE.Vector3(px, py, 0);
      pVec.applyAxisAngle(new THREE.Vector3(0, 0, 1), Math.PI / 4);
      pVec.applyAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI / 3);
      satPolar.position.copy(pVec);
      satPolar.rotation.y += 0.02;
      satPolar.rotation.x += 0.01;

      // Animate Tropical Satellite along Orbit 2
      satAngleTropical += 0.016 * speed;
      const tropR = 3.4;
      const tx = tropR * Math.cos(satAngleTropical);
      const ty = tropR * Math.sin(satAngleTropical);
      const tVec = new THREE.Vector3(tx, ty, 0);
      tVec.applyAxisAngle(new THREE.Vector3(0, 0, 1), -Math.PI / 6);
      tVec.applyAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI / 8);
      satTropical.position.copy(tVec);
      satTropical.rotation.z += 0.015;

      // Animate 3D Moon Orbiting around Earth
      moonAngle += 0.005 * speed;
      const mr = 4.2;
      const mx = mr * Math.cos(moonAngle);
      const my = mr * Math.sin(moonAngle);
      const mVec = new THREE.Vector3(mx, my, 0);
      mVec.applyAxisAngle(new THREE.Vector3(0, 0, 1), Math.PI / 10);
      mVec.applyAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI / 6);
      moonMesh.position.copy(mVec);
      moonMesh.rotation.y += 0.003;

      // Animate Expanding Thermal Hotspot Radar Rings
      pulseRings.forEach((ring) => {
        ring.scale += 0.015 * speed;
        if (ring.scale > 2.6) {
          ring.scale = 0.8;
        }
        ring.mesh.scale.set(ring.scale, ring.scale, 1);
        (ring.mesh.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 1.0 - ring.scale / 2.6);
      });

      renderer.render(scene, camera);
      animId = requestAnimationFrame(animate);
    };

    animate();

    // Cleanup
    return () => {
      cancelAnimationFrame(animId);
      container.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      resizeObserver.disconnect();

      renderer.dispose();
      initialTex.dispose();
      earthGeo.dispose();
      earthMat.dispose();
      atmosphereGeo.dispose();
      atmosphereMat.dispose();
      orbitPolar.geometry.dispose();
      (orbitPolar.material as THREE.Material).dispose();
      orbitTropical.geometry.dispose();
      (orbitTropical.material as THREE.Material).dispose();
      coordRing.geometry.dispose();
      (coordRing.material as THREE.Material).dispose();
      moonGeo.dispose();
      moonMat.dispose();
      moonTex.dispose();
      moonOrbitLine.geometry.dispose();
      (moonOrbitLine.material as THREE.Material).dispose();

      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      className="hero-3d-scene-container"
      title="Interactive 3D Earth: Drag to rotate, observe orbiting NASA satellites & thermal hotspots"
    >
      {/* 3D WebGL Canvas Mount */}
      <div ref={mountRef} className="hero-3d-canvas" />

      {/* 3D HUD Telemetry Overlay (NASA Space Apps Guideline Styling) */}
      <div className="hero-3d-hud-overlay">
        <div className="hud-badge-row flex-between">
          <span className="hud-orbit-status flex-align">
            <Orbit size={13} className="text-neon-yellow" />
            <span>3D SATELLITE ORBIT SIMULATION</span>
          </span>

          <button
            type="button"
            className="hud-speed-toggle flex-align"
            onClick={() => setActiveSpeed(activeSpeed === "normal" ? "fast" : "normal")}
            title="Toggle orbital simulation velocity"
          >
            <RefreshCw size={11} className={activeSpeed === "fast" ? "animate-spin" : ""} />
            <span>{activeSpeed === "fast" ? "2.2x Fast Orbit" : "1.0x Real-Time"}</span>
          </button>
        </div>

        <div className="hud-legend-row flex-between">
          <div className="flex-align">
            <span className="hud-dot hud-dot-yellow" />
            <span>Neon Yellow Trajectory (25% Opacity)</span>
          </div>
          <div className="flex-align">
            <span className="hud-dot hud-dot-red" />
            <span>Thermal Radar Beacons</span>
          </div>
        </div>

        <div className="hud-drag-hint">
          <Compass size={12} />
          <span>Click &amp; Drag 3D Earth to Rotate</span>
        </div>
      </div>
    </div>
  );
};

