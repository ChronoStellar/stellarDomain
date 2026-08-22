'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

/**
 * Ambient starfield.
 *
 * Reads --star-color / --star-opacity from the active theme so it stays visible
 * in light mode (where a white starfield was previously invisible), reacts to
 * scroll, pauses when offscreen or when the tab is hidden, and renders a single
 * static frame when the visitor prefers reduced motion.
 */
export default function ThreeBackground({
  isFixed = true,
  density = 1,
}: {
  isFixed?: boolean;
  density?: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const parent = container.parentElement || document.body;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const readTheme = () => {
      const styles = getComputedStyle(document.documentElement);
      const rgb = styles.getPropertyValue('--star-color').trim().split(/\s+/).map(Number);
      const opacity = parseFloat(styles.getPropertyValue('--star-opacity')) || 0.6;
      const color =
        rgb.length === 3 && rgb.every((n) => !Number.isNaN(n))
          ? new THREE.Color(rgb[0] / 255, rgb[1] / 255, rgb[2] / 255)
          : new THREE.Color(0x888888);
      return { color, opacity };
    };

    const scene = new THREE.Scene();
    scene.background = null;

    const camera = new THREE.PerspectiveCamera(75, parent.clientWidth / parent.clientHeight, 0.1, 1000);
    camera.position.z = 400;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
    renderer.setSize(parent.clientWidth, parent.clientHeight);
    // Cap DPR — a 3x pixel ratio triples fragment cost for an ambient effect.
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    container.replaceChildren(renderer.domElement);

    // Two layers at different depths so scroll produces real parallax rather
    // than a single flat plane drifting.
    const layers: THREE.Points[] = [];
    const layerSpecs = [
      { count: Math.round(1100 * density), spread: 2000, size: 2.4, depth: 1 },
      { count: Math.round(700 * density), spread: 1200, size: 1.4, depth: 0.45 },
    ];

    const { color: starColor, opacity: starOpacity } = readTheme();

    for (const spec of layerSpecs) {
      const geometry = new THREE.BufferGeometry();
      const vertices: number[] = [];
      for (let i = 0; i < spec.count; i++) {
        vertices.push(
          THREE.MathUtils.randFloatSpread(spec.spread),
          THREE.MathUtils.randFloatSpread(spec.spread),
          THREE.MathUtils.randFloatSpread(spec.spread),
        );
      }
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));

      const material = new THREE.PointsMaterial({
        color: starColor,
        size: spec.size,
        transparent: true,
        opacity: starOpacity * (spec.depth === 1 ? 1 : 0.7),
        sizeAttenuation: true,
      });

      const points = new THREE.Points(geometry, material);
      points.userData.depth = spec.depth;
      scene.add(points);
      layers.push(points);
    }

    const applyTheme = () => {
      const { color, opacity } = readTheme();
      for (const layer of layers) {
        const mat = layer.material as THREE.PointsMaterial;
        mat.color.copy(color);
        mat.opacity = opacity * (layer.userData.depth === 1 ? 1 : 0.7);
        mat.needsUpdate = true;
      }
      renderer.render(scene, camera);
    };

    let scrollTarget = 0;
    let scrollCurrent = 0;
    const onScroll = () => {
      scrollTarget = window.scrollY;
    };
    window.addEventListener('scroll', onScroll, { passive: true });

    let animationFrameId = 0;
    let running = false;

    const renderFrame = () => {
      // Ease toward the scroll position so the parallax feels weighted.
      scrollCurrent += (scrollTarget - scrollCurrent) * 0.06;
      for (const layer of layers) {
        const depth = layer.userData.depth as number;
        layer.rotation.y += 0.0004 * depth;
        layer.rotation.x += 0.00015 * depth;
        layer.position.y = scrollCurrent * 0.12 * depth;
      }
      renderer.render(scene, camera);
    };

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      renderFrame();
    };

    const start = () => {
      if (running || reduceMotion) return;
      running = true;
      animate();
    };

    const stop = () => {
      if (!running) return;
      running = false;
      cancelAnimationFrame(animationFrameId);
    };

    if (reduceMotion) {
      // Static single frame: the texture without the motion.
      renderer.render(scene, camera);
    } else {
      start();
    }

    // Only animate while the canvas is actually on screen.
    const observer = new IntersectionObserver(
      ([entry]) => (entry.isIntersecting ? start() : stop()),
      { threshold: 0 },
    );
    observer.observe(container);

    const onVisibility = () => (document.hidden ? stop() : start());
    document.addEventListener('visibilitychange', onVisibility);

    // Repaint when the theme attribute flips.
    const themeObserver = new MutationObserver(applyTheme);
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });

    const handleResize = () => {
      const width = parent.clientWidth;
      const height = parent.clientHeight;
      if (!width || !height) return;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
      if (reduceMotion) renderer.render(scene, camera);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      stop();
      observer.disconnect();
      themeObserver.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', onScroll);
      for (const layer of layers) {
        layer.geometry.dispose();
        (layer.material as THREE.PointsMaterial).dispose();
      }
      renderer.domElement.remove();
      renderer.dispose();
    };
  }, [density]);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      style={{
        position: isFixed ? 'fixed' : 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        pointerEvents: 'none',
      }}
    />
  );
}
