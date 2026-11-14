import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { ZENVYRA_CITIES, type CityClimateData } from "../data/zenvyraCities";

export type RiskLayerType = "chaleur" | "secheresse" | "feux" | "inondations" | "pop";

interface InteractiveGlobe3DProps {
  year: number;
  activeLayer: RiskLayerType;
  layerVisible: boolean;
  selectedCity: CityClimateData | null;
  onSelectCity: (city: CityClimateData) => void;
  onHoverCoords: (coords: { lat: number; lon: number; tempAnomaly: number } | null) => void;
}

export const InteractiveGlobe3D: React.FC<InteractiveGlobe3DProps> = ({
  year,
  activeLayer,
  layerVisible,
  selectedCity,
  onSelectCity,
  onHoverCoords,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const targetRotationRef = useRef<{ x: number; y: number } | null>(null);

  // Helper: lat/lon to 3D Vector3
  const latLonToVector3 = (lat: number, lon: number, radius: number): THREE.Vector3 => {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lon + 180) * (Math.PI / 180);
    const x = -(radius * Math.sin(phi) * Math.cos(theta));
    const z = radius * Math.sin(phi) * Math.sin(theta);
    const y = radius * Math.cos(phi);
    return new THREE.Vector3(x, y, z);
  };

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    let width = window.innerWidth;
    let height = window.innerHeight;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 1000);
    camera.position.set(0, 0, 4.4);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);

    // 2. Cosmic Deep Space Stars
    const starCount = 1200;
    const starGeo = new THREE.BufferGeometry();
    const starPos = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      const r = 40 + Math.random() * 80;
      const th = Math.random() * Math.PI * 2;
      const ph = Math.acos(2 * Math.random() - 1);
      starPos[i * 3] = r * Math.sin(ph) * Math.cos(th);
      starPos[i * 3 + 1] = r * Math.sin(ph) * Math.sin(th);
      starPos[i * 3 + 2] = r * Math.cos(ph);
    }
    starGeo.setAttribute("position", new THREE.BufferAttribute(starPos, 3));
    const starMat = new THREE.PointsMaterial({
      color: 0xe2e8f0,
      size: 0.8,
      transparent: true,
      opacity: 0.65,
    });
    const starMesh = new THREE.Points(starGeo, starMat);
    scene.add(starMesh);

    // 3. Central Earth Pivot Group
    const earthGroup = new THREE.Group();
    earthGroup.rotation.z = (23.4 * Math.PI) / 180; // Earth's natural tilt
    scene.add(earthGroup);

    // Earth Base Sphere Mesh
    const earthRadius = 1.6;
    const globeGeo = new THREE.SphereGeometry(earthRadius, 64, 64);

    // Instant High-Resolution Canvas Texture
    const canvas = document.createElement("canvas");
    canvas.width = 2048;
    canvas.height = 1024;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      const grad = ctx.createLinearGradient(0, 0, 0, 1024);
      grad.addColorStop(0, "#06132b");
      grad.addColorStop(0.5, "#0b2b5c");
      grad.addColorStop(1, "#06132b");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 2048, 1024);

      // Continents painter
      const toX = (lon: number) => ((lon + 180) / 360) * 2048;
      const toY = (lat: number) => ((90 - lat) / 180) * 1024;
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

      // Landmasses
      drawP([[71, 28], [75, 60], [77, 105], [72, 140], [65, 175], [55, 160], [40, 130], [30, 122], [22, 115], [10, 105], [15, 80], [25, 65], [30, 50], [38, 45], [42, 30], [45, 15], [55, 8], [62, 5], [70, 20]], "#265434");
      drawP([[35, -5], [32, 32], [22, 38], [14, 45], [10, 15], [5, 2], [15, -16], [30, -10]], "#8c6b39");
      drawP([[14, 15], [10, 44], [-5, 40], [-25, 32], [-34, 18], [-28, 15], [-10, 12], [4, 8]], "#1e4d27");
      drawP([[70, -165], [72, -130], [68, -95], [60, -65], [52, -55], [45, -65], [30, -82], [25, -80], [15, -92], [20, -105], [32, -118], [48, -125], [58, -140], [65, -168]], "#265434");
      drawP([[12, -75], [5, -52], [-5, -35], [-22, -40], [-35, -55], [-55, -68], [-52, -75], [-20, -70], [-5, -80], [5, -78]], "#194723");
      drawP([[28, 70], [25, 85], [18, 82], [8, 78], [18, 73], [24, 68]], "#255730");
      drawP([[-12, 132], [-15, 145], [-25, 152], [-38, 145], [-35, 115], [-22, 114], [-15, 125]], "#7d5d30");
      drawP([[-68, -180], [-68, 180], [-90, 180], [-90, -180]], "#cbd5e1");
    }
    const canvasTex = new THREE.CanvasTexture(canvas);
    canvasTex.colorSpace = THREE.SRGBColorSpace;

    const globeMat = new THREE.MeshStandardMaterial({
      map: canvasTex,
      roughness: 0.75,
      metalness: 0.05,
    });
    const globeMesh = new THREE.Mesh(globeGeo, globeMat);
    earthGroup.add(globeMesh);

    // Asynchronously upgrade with photographic texture if available
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load(
      "/textures/2k_earth_daymap.jpg",
      (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        globeMat.map = tex;
        globeMat.needsUpdate = true;
      },
      undefined,
      () => {
        textureLoader.load("/textures/earth_atmos_2048.jpg", (tex2) => {
          tex2.colorSpace = THREE.SRGBColorSpace;
          globeMat.map = tex2;
          globeMat.needsUpdate = true;
        });
      }
    );

    // 4. Dynamic Multi-Risk Climate Overlay Mesh
    // Procedural climate hazard texture that updates when layer or year changes
    const hazardCanvas = document.createElement("canvas");
    hazardCanvas.width = 1024;
    hazardCanvas.height = 512;
    const hctx = hazardCanvas.getContext("2d")!;
    const hazardTex = new THREE.CanvasTexture(hazardCanvas);
    hazardTex.colorSpace = THREE.SRGBColorSpace;

    const hazardMat = new THREE.MeshBasicMaterial({
      map: hazardTex,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending,
    });
    const hazardMesh = new THREE.Mesh(
      new THREE.SphereGeometry(earthRadius * 1.006, 64, 64),
      hazardMat
    );
    earthGroup.add(hazardMesh);

    // Function to re-render climate hazard heatmap onto canvas
    const updateHazardLayer = () => {
      hctx.clearRect(0, 0, 1024, 512);
      if (!layerVisible) {
        hazardTex.needsUpdate = true;
        return;
      }

      const yearRatio = (year - 2026) / (2050 - 2026); // 0.0 to 1.0

      // Render thermal hotspot heat anomalies for cities and continents
      ZENVYRA_CITIES.forEach((city) => {
        const cx = ((city.lon + 180) / 360) * 1024;
        const cy = ((90 - city.lat) / 180) * 512;

        let baseColor = "255, 82, 48"; // default R-01 Heatwaves (Crimson)
        let intensity = 0.35 + yearRatio * 0.55;
        let radius = 45 + yearRatio * 35;

        if (activeLayer === "secheresse") {
          baseColor = "234, 179, 8"; // R-02 Drought Gold
          intensity = 0.3 + yearRatio * 0.5;
          radius = 50 + yearRatio * 30;
        } else if (activeLayer === "feux") {
          baseColor = "239, 68, 68"; // R-03 Wildfires Flame
          intensity = 0.4 + yearRatio * 0.55;
          radius = 38 + yearRatio * 25;
        } else if (activeLayer === "inondations") {
          baseColor = "6, 182, 212"; // R-04 Flooding Cyan
          intensity = 0.35 + yearRatio * 0.45;
          radius = 42 + yearRatio * 30;
        } else if (activeLayer === "pop") {
          baseColor = "168, 85, 247"; // R-05 Population Purple
          intensity = 0.35 + yearRatio * 0.4;
          radius = 40 + yearRatio * 20;
        }

        const radGrad = hctx.createRadialGradient(cx, cy, 2, cx, cy, radius);
        radGrad.addColorStop(0, `rgba(${baseColor}, ${intensity})`);
        radGrad.addColorStop(0.5, `rgba(${baseColor}, ${intensity * 0.45})`);
        radGrad.addColorStop(1, "rgba(0,0,0,0)");
        hctx.fillStyle = radGrad;
        hctx.beginPath();
        hctx.arc(cx, cy, radius, 0, Math.PI * 2);
        hctx.fill();
      });

      hazardTex.needsUpdate = true;
    };
    updateHazardLayer();

    // 5. Delicate Atmospheric Glow
    const atmoGeo = new THREE.SphereGeometry(earthRadius * 1.03, 32, 32);
    const atmoMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.16,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
    });
    earthGroup.add(new THREE.Mesh(atmoGeo, atmoMat));

    // 6. 3D City Pins & Expanding Radar Rings
    const cityPins: { mesh: THREE.Mesh; ring: THREE.Mesh; city: CityClimateData }[] = [];
    ZENVYRA_CITIES.forEach((city) => {
      const pos = latLonToVector3(city.lat, city.lon, earthRadius * 1.008);

      // Core city beacon pin
      const pinGeo = new THREE.SphereGeometry(0.024, 12, 12);
      const pinMat = new THREE.MeshBasicMaterial({
        color: city.statusColor === "#ff5230" ? 0xff5230 : 0xffffff,
      });
      const pinMesh = new THREE.Mesh(pinGeo, pinMat);
      pinMesh.position.copy(pos);
      pinMesh.userData = { city };
      earthGroup.add(pinMesh);

      // Radar pulse ring
      const ringGeo = new THREE.RingGeometry(0.028, 0.046, 24);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.75,
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.position.copy(pos.clone().multiplyScalar(1.001));
      ringMesh.lookAt(pos.clone().multiplyScalar(2));
      earthGroup.add(ringMesh);

      cityPins.push({ mesh: pinMesh, ring: ringMesh, city });
    });

    // 7. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 0.6);
    sunLight.position.set(4, 3, 5);
    scene.add(sunLight);

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 0.35);
    rimLight.position.set(-4, -1, -3);
    scene.add(rimLight);

    // 8. Mouse & Drag Interaction
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;
    let rotSpeedX = 0;
    let rotSpeedY = 0;
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
      rotSpeedX = 0;
      rotSpeedY = 0;
    };

    const onMouseMove = (e: MouseEvent) => {
      mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

      if (isDragging) {
        const deltaX = e.clientX - prevMouseX;
        const deltaY = e.clientY - prevMouseY;
        rotSpeedY = deltaX * 0.005;
        rotSpeedX = deltaY * 0.005;
        earthGroup.rotation.y += rotSpeedY;
        earthGroup.rotation.x += rotSpeedX;
        prevMouseX = e.clientX;
        prevMouseY = e.clientY;
      } else {
        // Raycast over Earth for Glass Cursor coordinates
        raycaster.setFromCamera(mouse, camera);
        const hits = raycaster.intersectObject(globeMesh);
        if (hits.length > 0 && hits[0].point) {
          const pt = earthGroup.worldToLocal(hits[0].point.clone());
          const r = pt.length();
          const lat = 90 - (Math.acos(pt.y / r) * 180) / Math.PI;
          const lon = ((Math.atan2(pt.z, -pt.x) * 180) / Math.PI) - 180;
          const yearRatio = (year - 2026) / (2050 - 2026);
          const tempAnomaly = Number((1.2 + Math.abs(lat / 40) * 1.5 + yearRatio * 1.8).toFixed(1));
          onHoverCoords({ lat: Number(lat.toFixed(2)), lon: Number(lon.toFixed(2)), tempAnomaly });
        } else {
          onHoverCoords(null);
        }
      }
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    const onClick = (e: MouseEvent) => {
      mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      const pinMeshes = cityPins.map((p) => p.mesh);
      const hits = raycaster.intersectObjects(pinMeshes);
      if (hits.length > 0) {
        const hitCity = hits[0].object.userData.city as CityClimateData;
        if (hitCity) {
          onSelectCity(hitCity);
        }
      }
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      camera.position.z += e.deltaY * 0.0025;
      camera.position.z = Math.max(2.4, Math.min(6.5, camera.position.z));
    };

    const domElement = renderer.domElement;
    domElement.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    domElement.addEventListener("click", onClick);
    domElement.addEventListener("wheel", onWheel, { passive: false });

    // Resize Handler
    const onResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    window.addEventListener("resize", onResize);

    // 9. Camera Flight Interpolation to Selected City
    const focusOnCity = (city: CityClimateData) => {
      // Calculate target rotation to bring city to front center
      const targetY = -((city.lon + 90) * (Math.PI / 180));
      const targetX = (city.lat * 0.5) * (Math.PI / 180);
      targetRotationRef.current = { x: targetX, y: targetY };
    };

    if (selectedCity) {
      focusOnCity(selectedCity);
    }

    // 10. Animation Loop
    let animId: number;
    let ringScale = 1;

    const animate = () => {
      // Subtle planetary rotation when idle
      if (!isDragging && !targetRotationRef.current) {
        earthGroup.rotation.y += 0.0018;
      }

      // Smooth camera interpolation to target city
      if (targetRotationRef.current) {
        earthGroup.rotation.y += (targetRotationRef.current.y - earthGroup.rotation.y) * 0.06;
        earthGroup.rotation.x += (targetRotationRef.current.x - earthGroup.rotation.x) * 0.06;

        if (
          Math.abs(targetRotationRef.current.y - earthGroup.rotation.y) < 0.005 &&
          Math.abs(targetRotationRef.current.x - earthGroup.rotation.x) < 0.005
        ) {
          targetRotationRef.current = null;
        }
      }

      // Inertia decay
      if (!isDragging) {
        earthGroup.rotation.y += rotSpeedY;
        earthGroup.rotation.x += rotSpeedX;
        rotSpeedY *= 0.94;
        rotSpeedX *= 0.94;
      }

      // Animate pulsing city radar rings
      ringScale += 0.02;
      if (ringScale > 2.8) ringScale = 0.8;
      cityPins.forEach((pin) => {
        pin.ring.scale.set(ringScale, ringScale, 1);
        (pin.ring.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 0.9 - ringScale / 2.8);
      });

      renderer.render(scene, camera);
      animId = requestAnimationFrame(animate);
    };
    animate();

    // Cleanup
    return () => {
      cancelAnimationFrame(animId);
      domElement.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      domElement.removeEventListener("click", onClick);
      domElement.removeEventListener("wheel", onWheel);
      window.removeEventListener("resize", onResize);

      renderer.dispose();
      globeGeo.dispose();
      globeMat.dispose();
      hazardTex.dispose();
      hazardMat.dispose();
      canvasTex.dispose();
      starGeo.dispose();
      starMat.dispose();

      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [year, activeLayer, layerVisible, selectedCity]);

  return <div ref={mountRef} className="globe-webgl-mount" />;
};
