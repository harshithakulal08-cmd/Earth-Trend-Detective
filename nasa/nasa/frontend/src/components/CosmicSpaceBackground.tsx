import React, { useEffect, useRef } from "react";
import * as THREE from "three";

export const CosmicSpaceBackground: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    let width = window.innerWidth;
    let height = window.innerHeight;

    // 1. Scene, Camera, WebGL Renderer
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x040a16, 0.0035);

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    camera.position.set(0, 0, 70);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);

    // =========================================================================
    // 2. PROCEDURAL PLANETARY TEXTURE GENERATORS (0 Network Lag, 100% Reliable)
    // =========================================================================

    // A. Mars Texture (Rusty iron-oxide with dark basalt plains & polar ice)
    const createMarsTexture = () => {
      const c = document.createElement("canvas");
      c.width = 512;
      c.height = 256;
      const ctx = c.getContext("2d")!;
      // Base rust
      ctx.fillStyle = "#a84318";
      ctx.fillRect(0, 0, 512, 256);
      // Dark volcanic plains (Acidalia / Syrtis Major)
      ctx.fillStyle = "#63260c";
      for (let i = 0; i < 28; i++) {
        const x = (i * 37) % 512;
        const y = 60 + Math.sin(i * 1.3) * 60;
        ctx.beginPath();
        ctx.ellipse(x, y, 40 + (i % 5) * 6, 20 + (i % 3) * 5, i * 0.2, 0, Math.PI * 2);
        ctx.fill();
      }
      // Bright dusty highlands
      ctx.fillStyle = "#c95e28";
      for (let i = 0; i < 20; i++) {
        const x = (i * 47 + 20) % 512;
        const y = 140 + Math.cos(i * 0.9) * 45;
        ctx.beginPath();
        ctx.ellipse(x, y, 35, 18, -i * 0.1, 0, Math.PI * 2);
        ctx.fill();
      }
      // North & South Polar Ice Caps
      ctx.fillStyle = "#f8fafc";
      ctx.fillRect(0, 0, 512, 14);
      ctx.fillRect(0, 242, 512, 14);
      const tex = new THREE.CanvasTexture(c);
      tex.wrapS = THREE.RepeatWrapping;
      return tex;
    };

    // B. Saturn Gas Giant Texture (Banded amber, ochre, ivory & beige clouds)
    const createSaturnTexture = () => {
      const c = document.createElement("canvas");
      c.width = 512;
      c.height = 256;
      const ctx = c.getContext("2d")!;
      const grad = ctx.createLinearGradient(0, 0, 0, 256);
      grad.addColorStop(0.0, "#634d28");
      grad.addColorStop(0.15, "#a8894f");
      grad.addColorStop(0.3, "#e2c586");
      grad.addColorStop(0.42, "#cb9f56");
      grad.addColorStop(0.5, "#fae3a6");
      grad.addColorStop(0.6, "#d1aa64");
      grad.addColorStop(0.75, "#b58e48");
      grad.addColorStop(0.9, "#8a6d36");
      grad.addColorStop(1.0, "#544020");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 512, 256);
      const tex = new THREE.CanvasTexture(c);
      tex.wrapS = THREE.RepeatWrapping;
      return tex;
    };

    // C. Saturn Concentric Rings Texture (Semi-translucent radial rings)
    const createSaturnRingTexture = () => {
      const c = document.createElement("canvas");
      c.width = 256;
      c.height = 1;
      const ctx = c.getContext("2d")!;
      const grad = ctx.createLinearGradient(0, 0, 256, 0);
      grad.addColorStop(0.0, "rgba(0,0,0,0)");
      grad.addColorStop(0.1, "rgba(215, 185, 130, 0.2)");
      grad.addColorStop(0.3, "rgba(235, 210, 160, 0.75)");
      grad.addColorStop(0.55, "rgba(245, 225, 180, 0.9)");
      grad.addColorStop(0.62, "rgba(0,0,0,0.05)"); // Cassini Division gap!
      grad.addColorStop(0.66, "rgba(200, 175, 120, 0.65)");
      grad.addColorStop(0.9, "rgba(180, 150, 100, 0.4)");
      grad.addColorStop(1.0, "rgba(0,0,0,0)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 256, 1);
      return new THREE.CanvasTexture(c);
    };

    // D. Jupiter Gas Giant Texture (Banded clouds with Great Red Spot)
    const createJupiterTexture = () => {
      const c = document.createElement("canvas");
      c.width = 512;
      c.height = 256;
      const ctx = c.getContext("2d")!;
      const grad = ctx.createLinearGradient(0, 0, 0, 256);
      grad.addColorStop(0.0, "#3d2b1f");
      grad.addColorStop(0.15, "#8a6142");
      grad.addColorStop(0.28, "#d9b38c");
      grad.addColorStop(0.38, "#6e4325");
      grad.addColorStop(0.5, "#e8cca8");
      grad.addColorStop(0.62, "#965b32");
      grad.addColorStop(0.78, "#c49a6c");
      grad.addColorStop(1.0, "#3d2b1f");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 512, 256);
      // Great Red Spot
      ctx.fillStyle = "#b84221";
      ctx.beginPath();
      ctx.ellipse(320, 155, 32, 18, 0, 0, Math.PI * 2);
      ctx.fill();
      const tex = new THREE.CanvasTexture(c);
      tex.wrapS = THREE.RepeatWrapping;
      return tex;
    };

    // E. Moon Texture (Cratered lunar surface)
    const createMoonTexture = () => {
      const c = document.createElement("canvas");
      c.width = 256;
      c.height = 128;
      const ctx = c.getContext("2d")!;
      ctx.fillStyle = "#8c9199";
      ctx.fillRect(0, 0, 256, 128);
      // Lunar maria
      ctx.fillStyle = "#5c6068";
      for (let i = 0; i < 16; i++) {
        const x = (i * 42) % 256;
        const y = 30 + (i % 4) * 20;
        ctx.beginPath();
        ctx.ellipse(x, y, 22, 14, i * 0.3, 0, Math.PI * 2);
        ctx.fill();
      }
      // Crater highlights
      ctx.fillStyle = "#cbd5e1";
      for (let i = 0; i < 20; i++) {
        const x = (i * 29 + 15) % 256;
        const y = 20 + (i % 5) * 18;
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fill();
      }
      const tex = new THREE.CanvasTexture(c);
      tex.wrapS = THREE.RepeatWrapping;
      return tex;
    };

    // =========================================================================
    // 3. ROTATING PLANETS IN DEEP SPACE (Placed around the cosmos)
    // =========================================================================

    const planetsGroup = new THREE.Group();
    scene.add(planetsGroup);

    // Planet 1: SATURN with 3D Rings (Upper Right Deep Cosmos)
    const saturnRadius = 4.2;
    const saturnGeo = new THREE.SphereGeometry(saturnRadius, 32, 32);
    const saturnMat = new THREE.MeshStandardMaterial({
      map: createSaturnTexture(),
      roughness: 0.8,
      metalness: 0.1,
    });
    const saturnMesh = new THREE.Mesh(saturnGeo, saturnMat);
    // Saturn's tilted rings
    const ringGeo = new THREE.RingGeometry(saturnRadius * 1.35, saturnRadius * 2.5, 64);
    const ringMat = new THREE.MeshBasicMaterial({
      map: createSaturnRingTexture(),
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85,
    });
    const saturnRings = new THREE.Mesh(ringGeo, ringMat);
    saturnRings.rotation.x = Math.PI / 2;
    saturnMesh.add(saturnRings);

    // Tilt Saturn on its 26.7° axis
    saturnMesh.rotation.z = (26.7 * Math.PI) / 180;
    saturnMesh.rotation.x = 0.25;
    // Position in deep upper right cosmos
    saturnMesh.position.set(42, 22, -35);
    planetsGroup.add(saturnMesh);

    // Planet 2: MARS (Middle Left Cosmos)
    const marsRadius = 2.4;
    const marsGeo = new THREE.SphereGeometry(marsRadius, 32, 32);
    const marsMat = new THREE.MeshStandardMaterial({
      map: createMarsTexture(),
      roughness: 0.85,
      metalness: 0.05,
    });
    const marsMesh = new THREE.Mesh(marsGeo, marsMat);
    marsMesh.rotation.z = (25.2 * Math.PI) / 180;
    marsMesh.position.set(-46, 6, -25);
    planetsGroup.add(marsMesh);

    // Planet 3: JUPITER (Distant Lower Right Cosmos)
    const jupiterRadius = 5.5;
    const jupiterGeo = new THREE.SphereGeometry(jupiterRadius, 32, 32);
    const jupiterMat = new THREE.MeshStandardMaterial({
      map: createJupiterTexture(),
      roughness: 0.75,
      metalness: 0.1,
    });
    const jupiterMesh = new THREE.Mesh(jupiterGeo, jupiterMat);
    jupiterMesh.rotation.z = (3.1 * Math.PI) / 180;
    jupiterMesh.position.set(38, -32, -45);
    planetsGroup.add(jupiterMesh);

    // Planet 4: THE MOON (Floating Upper Left)
    const moonRadius = 1.4;
    const moonGeo = new THREE.SphereGeometry(moonRadius, 24, 24);
    const moonMat = new THREE.MeshStandardMaterial({
      map: createMoonTexture(),
      roughness: 0.9,
      metalness: 0.05,
    });
    const moonMesh = new THREE.Mesh(moonGeo, moonMat);
    moonMesh.position.set(-28, 28, -18);
    planetsGroup.add(moonMesh);

    // =========================================================================
    // 4. TWINKLING 3D DEEP SPACE STARFIELD & COSMIC NEBULA PARTICLES
    // =========================================================================

    const starCount = 2200;
    const starPositions = new Float32Array(starCount * 3);
    const starColors = new Float32Array(starCount * 3);

    const colorPalette = [
      new THREE.Color(0xffffff), // Pure white
      new THREE.Color(0xa5f3fc), // Cyan ice
      new THREE.Color(0x60a5fa), // Electric Blue (Space Apps)
      new THREE.Color(0xfef08a), // Pale Yellow star
      new THREE.Color(0xfde047), // Neon Yellow accent
      new THREE.Color(0xdbeafe), // Light Blue
    ];

    for (let i = 0; i < starCount; i++) {
      // Spread stars across vast 3D sphere
      const r = 40 + Math.random() * 140;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);

      starPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      starPositions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      starPositions[i * 3 + 2] = r * Math.cos(phi) - 20;

      // Color selection
      const col = colorPalette[Math.floor(Math.random() * colorPalette.length)];
      starColors[i * 3] = col.r;
      starColors[i * 3 + 1] = col.g;
      starColors[i * 3 + 2] = col.b;
    }

    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute("position", new THREE.BufferAttribute(starPositions, 3));
    starGeo.setAttribute("color", new THREE.BufferAttribute(starColors, 3));

    // Circular star point texture
    const starCanvas = document.createElement("canvas");
    starCanvas.width = 16;
    starCanvas.height = 16;
    const sCtx = starCanvas.getContext("2d")!;
    const sGrad = sCtx.createRadialGradient(8, 8, 0, 8, 8, 8);
    sGrad.addColorStop(0, "rgba(255,255,255,1)");
    sGrad.addColorStop(0.3, "rgba(255,255,255,0.8)");
    sGrad.addColorStop(0.7, "rgba(0,119,255,0.3)");
    sGrad.addColorStop(1, "rgba(0,0,0,0)");
    sCtx.fillStyle = sGrad;
    sCtx.fillRect(0, 0, 16, 16);
    const starTex = new THREE.CanvasTexture(starCanvas);

    const starMat = new THREE.PointsMaterial({
      size: 1.35,
      map: starTex,
      vertexColors: true,
      transparent: true,
      opacity: 0.88,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const starField = new THREE.Points(starGeo, starMat);
    scene.add(starField);

    // =========================================================================
    // 5. SHOOTING STARS / METEORS (Traversing the cosmos periodically)
    // =========================================================================

    const meteorGeo = new THREE.BufferGeometry();
    const meteorPoints = new Float32Array([0, 0, 0, -4.5, -2.5, 0]);
    meteorGeo.setAttribute("position", new THREE.BufferAttribute(meteorPoints, 3));
    const meteorMat = new THREE.LineBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0,
      linewidth: 2,
    });
    const meteorLine = new THREE.Line(meteorGeo, meteorMat);
    scene.add(meteorLine);

    let meteorActive = false;
    let meteorProgress = 0;
    let meteorStart = new THREE.Vector3(-60, 45, 0);
    let meteorDir = new THREE.Vector3(1.4, -0.9, -0.3).normalize();

    // =========================================================================
    // 6. LIGHTING: SPACE SUN & DEEP BLUE COSMIC AMBIENT
    // =========================================================================

    // Ambient space light
    scene.add(new THREE.AmbientLight(0xffffff, 1.4));

    // Directional sunlight illuminating planetary crescents
    const sun = new THREE.DirectionalLight(0xfffaed, 2.2);
    sun.position.set(50, 30, 40);
    scene.add(sun);

    // Electric blue back rim light
    const rimLight = new THREE.DirectionalLight(0x0077ff, 0.8);
    rimLight.position.set(-40, -20, -30);
    scene.add(rimLight);

    // =========================================================================
    // 7. INTERACTIVE MOUSE PARALLAX
    // =========================================================================

    let mouseX = 0;
    let mouseY = 0;
    let targetCameraX = 0;
    let targetCameraY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = (e.clientX / window.innerWidth) * 2 - 1;
      mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
      targetCameraX = mouseX * 5.0;
      targetCameraY = mouseY * 3.5;
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });

    // Window Resize Handler
    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    window.addEventListener("resize", handleResize);

    // =========================================================================
    // 8. 60FPS ANIMATION LOOP: PLANETS ROTATING & STARS DRIFTING
    // =========================================================================

    let animId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      const delta = clock.getDelta();
      const elapsed = clock.getElapsedTime();

      // 1. ROTATE PLANETS ON THEIR AXES
      saturnMesh.rotation.y += 0.005; // Saturn rotates rapidly
      marsMesh.rotation.y += 0.004; // Mars rotational physics
      jupiterMesh.rotation.y += 0.006; // Jupiter fast revolution
      moonMesh.rotation.y += 0.002; // Moon slow synchronous spin

      // 2. ORBITAL DRIFT (Planets slowly glide through the cosmos)
      saturnMesh.position.x = 42 + Math.sin(elapsed * 0.04) * 2.5;
      saturnMesh.position.y = 22 + Math.cos(elapsed * 0.035) * 1.8;

      marsMesh.position.x = -46 + Math.cos(elapsed * 0.05) * 2.0;
      marsMesh.position.y = 6 + Math.sin(elapsed * 0.045) * 1.5;

      moonMesh.position.x = -28 + Math.sin(elapsed * 0.06) * 1.5;
      moonMesh.position.y = 28 + Math.cos(elapsed * 0.05) * 1.2;

      // 3. SLOW ROTATION OF THE STARFIELD
      starField.rotation.y += 0.0003;
      starField.rotation.x += 0.0001;

      // 4. METEOR / SHOOTING STAR LOGIC
      if (!meteorActive && Math.random() < 0.008) {
        meteorActive = true;
        meteorProgress = 0;
        meteorStart.set(
          (Math.random() - 0.5) * 80,
          20 + Math.random() * 30,
          (Math.random() - 0.5) * 20
        );
        meteorLine.position.copy(meteorStart);
      }

      if (meteorActive) {
        meteorProgress += delta * 1.8;
        meteorLine.position.addScaledVector(meteorDir, delta * 75);
        const alpha = Math.sin(meteorProgress * Math.PI);
        meteorMat.opacity = Math.max(0, alpha * 0.9);

        if (meteorProgress >= 1.0) {
          meteorActive = false;
          meteorMat.opacity = 0;
        }
      }

      // 5. SMOOTH CAMERA PARALLAX DAMPING
      camera.position.x += (targetCameraX - camera.position.x) * 0.03;
      camera.position.y += (targetCameraY - camera.position.y) * 0.03;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
      animId = requestAnimationFrame(animate);
    };

    animate();

    // Cleanup
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleResize);

      renderer.dispose();
      saturnGeo.dispose();
      saturnMat.dispose();
      ringGeo.dispose();
      ringMat.dispose();
      marsGeo.dispose();
      marsMat.dispose();
      jupiterGeo.dispose();
      jupiterMat.dispose();
      moonGeo.dispose();
      moonMat.dispose();
      starGeo.dispose();
      starMat.dispose();
      starTex.dispose();
      meteorGeo.dispose();
      meteorMat.dispose();

      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className="cosmic-space-background-canvas"
      aria-hidden="true"
    />
  );
};

