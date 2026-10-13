"use client";

import { useEffect, useRef } from "react";
import {
  AmbientLight,
  BoxGeometry,
  CanvasTexture,
  Color,
  DirectionalLight,
  ExtrudeGeometry,
  Group,
  HemisphereLight,
  Mesh,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  PerspectiveCamera,
  type Path,
  PlaneGeometry,
  PointLight,
  Scene,
  Shape,
  ShapeGeometry,
  SphereGeometry,
  TorusGeometry,
  WebGLRenderer,
} from "three";

const RECORD_RED = "#e5484d";
const BAR_COUNT = 15;

function roundedRect<T extends Path>(
  target: T,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  target.moveTo(x + r, y);
  target.lineTo(x + w - r, y);
  target.quadraticCurveTo(x + w, y, x + w, y + r);
  target.lineTo(x + w, y + h - r);
  target.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  target.lineTo(x + r, y + h);
  target.quadraticCurveTo(x, y + h, x, y + h - r);
  target.lineTo(x, y + r);
  target.quadraticCurveTo(x, y, x + r, y);
  return target;
}

function themeColor(name: string, fallback: string): Color {
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return new Color(value || fallback);
}

/** Soft radial shadow under the mark, drawn once into a canvas texture. */
function shadowTexture(): CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 128;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    gradient.addColorStop(0, "rgba(0,0,0,0.35)");
    gradient.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 128, 128);
  }
  return new CanvasTexture(canvas);
}

/**
 * The Roll mark in 3D: a screen frame with the camera bubble on its corner and
 * a live waveform inside. Follows the pointer, pauses off-screen, and renders a
 * single still frame when the user prefers reduced motion.
 */
export function HeroScene({ onUnsupported }: { onUnsupported: () => void }) {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = container.current;
    if (!host) return;

    let renderer: WebGLRenderer;
    try {
      renderer = new WebGLRenderer({ antialias: true, alpha: true, powerPreference: "low-power" });
    } catch {
      onUnsupported();
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    host.append(renderer.domElement);
    renderer.domElement.setAttribute("aria-hidden", "true");

    const scene = new Scene();
    const camera = new PerspectiveCamera(32, 1, 0.1, 50);
    camera.position.set(0, 0.2, 9);

    // Lighting: soft fill plus a warm key light and a faint red bounce from the bubble.
    scene.add(new HemisphereLight(0xffffff, 0x2a2622, 1.1));
    scene.add(new AmbientLight(0xffffff, 0.25));
    const key = new DirectionalLight(0xffffff, 2.2);
    key.position.set(3, 5, 6);
    scene.add(key);
    const bounce = new PointLight(RECORD_RED, 6, 4);
    bounce.position.set(1.6, -1.1, 1.2);
    scene.add(bounce);

    const mark = new Group();
    scene.add(mark);

    // Screen frame: rounded rectangle with a rounded hole, extruded with a bevel.
    const W = 3.4;
    const H = 2.4;
    const frameShape = roundedRect(new Shape(), -W / 2, -H / 2, W, H, 0.48);
    const hole = new Shape();
    roundedRect(hole, -W / 2 + 0.24, -H / 2 + 0.24, W - 0.48, H - 0.48, 0.28);
    frameShape.holes.push(hole);
    const frameGeometry = new ExtrudeGeometry(frameShape, {
      depth: 0.26,
      bevelEnabled: true,
      bevelThickness: 0.06,
      bevelSize: 0.05,
      bevelSegments: 5,
      curveSegments: 32,
    });
    frameGeometry.center();
    const frameMaterial = new MeshPhysicalMaterial({
      roughness: 0.32,
      metalness: 0.1,
      clearcoat: 0.6,
    });
    mark.add(new Mesh(frameGeometry, frameMaterial));

    // Glass screen.
    const glassGeometry = new ShapeGeometry(
      roundedRect(new Shape(), -W / 2 + 0.24, -H / 2 + 0.24, W - 0.48, H - 0.48, 0.28),
      24,
    );
    const glassMaterial = new MeshPhysicalMaterial({
      transparent: true,
      opacity: 0.1,
      roughness: 0.1,
      clearcoat: 1,
    });
    const glass = new Mesh(glassGeometry, glassMaterial);
    glass.position.z = -0.05;
    mark.add(glass);

    // Waveform: the "voice" being recorded.
    const barGeometry = new BoxGeometry(0.075, 1, 0.05);
    const barMaterial = new MeshStandardMaterial({
      roughness: 0.6,
      transparent: true,
      opacity: 0.55,
    });
    const bars: Mesh[] = [];
    for (let i = 0; i < BAR_COUNT; i += 1) {
      const bar = new Mesh(barGeometry, barMaterial);
      bar.position.set((i - (BAR_COUNT - 1) / 2) * 0.16, 0.05, -0.02);
      mark.add(bar);
      bars.push(bar);
    }

    // Camera bubble: red sphere with a ring in the page colour, like the 2D logo.
    const bubble = new Group();
    bubble.position.set(W / 2 - 0.15, -H / 2 + 0.05, 0.42);
    const sphereGeometry = new SphereGeometry(0.62, 64, 64);
    const sphereMaterial = new MeshPhysicalMaterial({
      color: RECORD_RED,
      roughness: 0.28,
      clearcoat: 1,
      clearcoatRoughness: 0.15,
    });
    bubble.add(new Mesh(sphereGeometry, sphereMaterial));
    const ringGeometry = new TorusGeometry(0.74, 0.085, 24, 96);
    const ringMaterial = new MeshStandardMaterial({ roughness: 0.4 });
    const ring = new Mesh(ringGeometry, ringMaterial);
    bubble.add(ring);
    mark.add(bubble);

    // Contact shadow.
    const shadowGeometry = new PlaneGeometry(5, 1.6);
    const shadowMap = shadowTexture();
    const shadowMaterial = new MeshBasicMaterial({
      map: shadowMap,
      transparent: true,
      depthWrite: false,
    });
    const shadow = new Mesh(shadowGeometry, shadowMaterial);
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = -2.15;
    scene.add(shadow);

    const applyTheme = () => {
      const foreground = themeColor("--foreground", "#1f1e1c");
      const background = themeColor("--background", "#fbfbfa");
      frameMaterial.color.copy(foreground);
      glassMaterial.color.copy(foreground);
      barMaterial.color.copy(foreground);
      ringMaterial.color.copy(background);
      shadowMaterial.opacity = document.documentElement.classList.contains("dark") ? 0.8 : 0.35;
    };
    applyTheme();
    const themeObserver = new MutationObserver(applyTheme);
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    const resize = () => {
      const { width, height } = host.getBoundingClientRect();
      if (width === 0 || height === 0) return;
      renderer.setSize(width, height, false);
      renderer.domElement.style.width = "100%";
      renderer.domElement.style.height = "100%";
      camera.aspect = width / height;
      // Pull back on narrow (portrait) layouts so the whole mark stays in view.
      camera.position.z = camera.aspect < 1 ? 11.5 : 9;
      camera.updateProjectionMatrix();
    };
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(host);
    resize();

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const pointer = { x: 0, y: 0 };
    const onPointerMove = (event: PointerEvent) => {
      const rect = host.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
      pointer.y = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
    };

    const pose = (t: number) => {
      const targetY = -0.35 + pointer.x * 0.35 + Math.sin(t * 0.35) * 0.08;
      const targetX = 0.12 + pointer.y * 0.22;
      mark.rotation.y += (targetY - mark.rotation.y) * 0.06;
      mark.rotation.x += (targetX - mark.rotation.x) * 0.06;
      mark.position.y = Math.sin(t * 0.8) * 0.06;
      bubble.position.z = 0.42 + Math.sin(t * 1.6) * 0.06;
      bubble.scale.setScalar(1 + Math.sin(t * 3.2) * 0.025);
      bars.forEach((bar, i) => {
        const wave =
          Math.abs(Math.sin(t * 2.4 + i * 0.55)) * Math.abs(Math.sin(t * 0.9 + i * 0.21));
        bar.scale.y = 0.12 + wave * 1.1;
      });
    };

    if (reducedMotion) {
      pose(1.2);
      mark.rotation.set(0.12, -0.35, 0);
      renderer.render(scene, camera);
    }

    let frame = 0;
    let visible = true;
    const start = performance.now();
    const loop = () => {
      frame = requestAnimationFrame(loop);
      if (!visible || document.hidden) return;
      pose((performance.now() - start) / 1000);
      renderer.render(scene, camera);
    };
    const visibility = new IntersectionObserver(([entry]) => {
      visible = entry?.isIntersecting ?? true;
    });
    visibility.observe(host);
    if (!reducedMotion) {
      window.addEventListener("pointermove", onPointerMove, { passive: true });
      loop();
    }

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", onPointerMove);
      visibility.disconnect();
      resizeObserver.disconnect();
      themeObserver.disconnect();
      for (const disposable of [
        frameGeometry,
        frameMaterial,
        glassGeometry,
        glassMaterial,
        barGeometry,
        barMaterial,
        sphereGeometry,
        sphereMaterial,
        ringGeometry,
        ringMaterial,
        shadowGeometry,
        shadowMaterial,
        shadowMap,
      ]) {
        disposable.dispose();
      }
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [onUnsupported]);

  return <div ref={container} className="size-full" />;
}
