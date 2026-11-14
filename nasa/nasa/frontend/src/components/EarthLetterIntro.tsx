import React, { useEffect, useRef } from "react";
import * as THREE from "three";

interface EarthLetterIntroProps {
  isOpen: boolean;
  lang: "en" | "fr";
  onProceed: () => void;
}

export const EarthLetterIntro: React.FC<EarthLetterIntroProps> = ({
  isOpen,
  lang,
  onProceed,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!isOpen || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const width = 140;
    const height = 140;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.z = 2.8;

    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Stylized Pixel / Particle Earth Orb matching zenvyra.love
    const orbGroup = new THREE.Group();
    scene.add(orbGroup);

    // Inner wireframe sphere
    const wireGeo = new THREE.IcosahedronGeometry(0.95, 3);
    const wireMat = new THREE.MeshBasicMaterial({
      color: 0x39e6d4,
      wireframe: true,
      transparent: true,
      opacity: 0.28,
    });
    const wireMesh = new THREE.Mesh(wireGeo, wireMat);
    orbGroup.add(wireMesh);

    // Dotted point cloud for landmasses
    const particleCount = 600;
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = 1.0 + (Math.random() - 0.5) * 0.04;
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);
    }
    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.024,
      transparent: true,
      opacity: 0.85,
    });
    const pointsMesh = new THREE.Points(particleGeo, particleMat);
    orbGroup.add(pointsMesh);

    // Outer subtle cyan aura
    const auraGeo = new THREE.SphereGeometry(1.08, 16, 16);
    const auraMat = new THREE.MeshBasicMaterial({
      color: 0x39e6d4,
      transparent: true,
      opacity: 0.08,
      side: THREE.BackSide,
    });
    orbGroup.add(new THREE.Mesh(auraGeo, auraMat));

    let animId: number;
    const animate = () => {
      orbGroup.rotation.y += 0.008;
      orbGroup.rotation.x = Math.sin(Date.now() * 0.001) * 0.12;
      renderer.render(scene, camera);
      animId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(animId);
      renderer.dispose();
      wireGeo.dispose();
      wireMat.dispose();
      particleGeo.dispose();
      particleMat.dispose();
      auraGeo.dispose();
      auraMat.dispose();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <dialog id="earth-shell" className="earth-shell-dialog" open aria-label="A letter from Earth" lang={lang}>
      <div className="earth-letter-container">
        <canvas id="earth-orb" ref={canvasRef} aria-hidden="true" width={140} height={140} />

        <main id="earth-letter-main">
          <h1>{lang === "en" ? "Hello, Explorer." : "Bonjour, explorateur."}</h1>

          <div id="letter" className="letter">
            {lang === "en" ? (
              <>
                <p>Beyond our world lies a universe waiting to be discovered.</p>
                <p>From distant galaxies to our own pale blue dot, every star holds a story, every planet a mystery, and every discovery reveals another wonder of the universe.</p>
              </>
            ) : (
              <>
                <p>Au-delà de notre monde se trouve un univers qui attend d'être découvert.</p>
                <p>Des galaxies lointaines à notre propre point bleu pâle, chaque étoile recèle une histoire, chaque planète un mystère, et chaque découverte révèle une autre merveille de l'univers.</p>
              </>
            )}

            <p className="signature">Zenvyra.</p>
          </div>

          <div className="invitation">
            <button id="future" type="button" onClick={onProceed}>
              Enter Zenvyra
            </button>
          </div>
        </main>
      </div>

      <button
        id="scroll-explore"
        className="scroll-explore-indicator"
        type="button"
        aria-label="Scroll to explore"
        onClick={() => {
          const target = document.querySelector('.invitation') || document.getElementById('future');
          if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'center' });
          } else {
            onProceed();
          }
        }}
      >
        <span className="scroll-explore-text">SCROLL TO EXPLORE</span>
        <svg className="scroll-down-arrow" width="16" height="10" viewBox="0 0 16 10" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path d="M1.5 1.5L8 8L14.5 1.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </dialog>
  );
};

