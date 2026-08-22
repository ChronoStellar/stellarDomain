'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import {
  CONSTELLATIONS,
  equatorialToCartesian,
  magnitudeToSize,
  magnitudeToOpacity,
} from '@/lib/constellations';

/**
 * Ambient sky: real constellations over a field of scattered stars.
 *
 * Constellation stars use their true J2000 right ascension and declination, so
 * Orion, the Big Dipper, Cassiopeia and the rest are the actual figures rather
 * than decorative joins. Each figure is scaled up about its own centroid —
 * at true angular size these span only a few degrees and would read as specks —
 * which preserves internal proportions while making the shapes legible.
 *
 * Reads --star-color / --star-opacity from the active theme so it stays visible
 * in light mode, reacts to scroll, pauses when offscreen or when the tab is
 * hidden, and renders a single static frame under prefers-reduced-motion.
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

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Size from the container itself, not its parent. When fixed, the container
    // is the viewport; measuring `document.body` instead returned the full
    // scroll height — several times too tall — so the canvas was drawn far
    // larger than the visible area and the figures fell outside it.
    const measure = () => {
      const rect = container.getBoundingClientRect();
      return {
        width: Math.max(1, Math.round(rect.width)),
        height: Math.max(1, Math.round(rect.height)),
      };
    };

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

    const initial = measure();
    const camera = new THREE.PerspectiveCamera(75, initial.width / initial.height, 0.1, 1000);
    camera.position.z = 400;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
    renderer.setSize(initial.width, initial.height);
    // Cap DPR — a 3x pixel ratio triples fragment cost for an ambient effect.
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    container.replaceChildren(renderer.domElement);

    const { color: themeColor, opacity: themeOpacity } = readTheme();

    // Everything that needs recoloring when the theme flips.
    const starMaterials: THREE.PointsMaterial[] = [];
    const lineMaterials: THREE.LineBasicMaterial[] = [];
    const disposables: (THREE.BufferGeometry | THREE.Material)[] = [];
    // Objects that move with scroll, each with its own parallax depth. Figures
    // additionally float along a slow Lissajous path so the sky feels alive
    // rather than pinned; `float` is absent for the scattered star layers.
    type Drifter = {
      object: THREE.Object3D;
      depth: number;
      spin: number;
      float?: {
        ampX: number;
        ampY: number;
        speedX: number;
        speedY: number;
        phaseX: number;
        phaseY: number;
        tiltAmp: number;
        tiltSpeed: number;
        tiltPhase: number;
        baseRotX: number;
        baseRotZ: number;
      };
    };
    const drifting: Drifter[] = [];

    /* ---- Constellation figures ------------------------------------------- */

    // Placed around the scene so figures don't overlap; depth drives parallax.
    // `span` is the target on-screen size of the figure's longest axis. It is a
    // target rather than a raw multiplier because constellations differ hugely
    // in true angular size — Lyra and Crux are compact, Ursa Major sprawls — so
    // a shared scale factor would render some as specks and others off-screen.
    // Pushed toward the edges and set well back in Z. Content occupies the
    // centre of the viewport, and figures drifting behind headline text read as
    // an accident rather than a backdrop.
    const placements = [
      { x: -820, y: 250, z: -420, span: 250, depth: 1.0 },
      { x: 760, y: 300, z: -480, span: 235, depth: 0.8 },
      { x: -700, y: -330, z: -450, span: 190, depth: 0.85 },
      { x: 820, y: -260, z: -400, span: 215, depth: 0.95 },
      { x: -260, y: 470, z: -560, span: 150, depth: 0.65 },
      { x: 300, y: -470, z: -520, span: 205, depth: 0.7 },
      { x: -880, y: -40, z: -600, span: 145, depth: 0.6 },
      { x: 880, y: 60, z: -560, span: 200, depth: 0.75 },
    ];

    CONSTELLATIONS.forEach((constellation, ci) => {
      const place = placements[ci % placements.length];
      const group = new THREE.Group();
      group.position.set(place.x, place.y, place.z);

      // Project each star, then re-center on the figure's centroid so `scale`
      // magnifies the shape in place instead of flinging it across the sky.
      const projected = constellation.stars.map((s) =>
        equatorialToCartesian(s.ra, s.dec, 1),
      );
      const centroid = projected.reduce(
        (acc, p) => [acc[0] + p[0] / projected.length, acc[1] + p[1] / projected.length, acc[2] + p[2] / projected.length],
        [0, 0, 0] as [number, number, number],
      );
      // Project onto the tangent plane at the figure's centroid, so it faces the
      // camera. Stars sit on a sphere and each constellation faces outward along
      // its own line of sight; without this the Big Dipper arrives edge-on, its
      // 235-unit span lying along Z behind a 72x66 smudge. Building an
      // orthonormal east/north/line-of-sight basis and taking the east and north
      // components lays every figure flat while preserving star-to-star geometry.
      const norm = Math.hypot(centroid[0], centroid[1], centroid[2]) || 1;
      const los: [number, number, number] = [centroid[0] / norm, centroid[1] / norm, centroid[2] / norm];
      const centroidRa = Math.atan2(los[2], los[0]);
      // East is the tangent in the direction of increasing right ascension.
      const east: [number, number, number] = [-Math.sin(centroidRa), 0, Math.cos(centroidRa)];
      // North completes the basis. The order matters: `east × los` points to the
      // celestial north pole, while `los × east` points south and silently flips
      // every figure upside down.
      const north: [number, number, number] = [
        east[1] * los[2] - east[2] * los[1],
        east[2] * los[0] - east[0] * los[2],
        east[0] * los[1] - east[1] * los[0],
      ];
      const dot = (a: [number, number, number], b: [number, number, number]) =>
        a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

      // Normalise by the figure's own longest axis so every constellation
      // arrives at a comparable on-screen size with its proportions intact.
      const centered = projected.map((p) => {
        const v: [number, number, number] = [p[0] - centroid[0], p[1] - centroid[1], p[2] - centroid[2]];
        return [dot(v, east), dot(v, north), dot(v, los)] as [number, number, number];
      });
      const extent = Math.max(
        ...[0, 1, 2].map((axis) => {
          const values = centered.map((p) => p[axis]);
          return Math.max(...values) - Math.min(...values);
        }),
      );
      const scale = extent > 1e-6 ? place.span / extent : place.span;
      const local = centered.map(
        (p) => [p[0] * scale, p[1] * scale, p[2] * scale] as [number, number, number],
      );

      // Stars: one draw call per figure, sized and faded by real magnitude.
      // PointsMaterial has a single size, so magnitude drives per-vertex scale
      // through a custom attribute consumed in onBeforeCompile.
      const starGeom = new THREE.BufferGeometry();
      const positions: number[] = [];
      const sizes: number[] = [];
      const alphas: number[] = [];
      constellation.stars.forEach((star, si) => {
        positions.push(...local[si]);
        sizes.push(magnitudeToSize(star.mag, 1.15));
        alphas.push(magnitudeToOpacity(star.mag));
      });
      starGeom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      starGeom.setAttribute('aSize', new THREE.Float32BufferAttribute(sizes, 1));
      starGeom.setAttribute('aAlpha', new THREE.Float32BufferAttribute(alphas, 1));

      const starMat = new THREE.PointsMaterial({
        color: themeColor,
        transparent: true,
        opacity: themeOpacity,
        sizeAttenuation: false,
        depthWrite: false,
      });

      // Per-star size and brightness, plus a soft round falloff so points read
      // as stars rather than squares.
      starMat.onBeforeCompile = (shader) => {
        shader.vertexShader = shader.vertexShader
          .replace(
            '#include <common>',
            `#include <common>
             attribute float aSize;
             attribute float aAlpha;
             varying float vAlpha;`,
          )
          .replace(
            '#include <begin_vertex>',
            `#include <begin_vertex>
             vAlpha = aAlpha;`,
          )
          .replace('gl_PointSize = size;', 'gl_PointSize = aSize;');

        shader.fragmentShader = shader.fragmentShader
          .replace(
            '#include <common>',
            `#include <common>
             varying float vAlpha;`,
          )
          .replace(
            '#include <opaque_fragment>',
            `float d = length(gl_PointCoord - vec2(0.5));
             if (d > 0.5) discard;
             float falloff = smoothstep(0.5, 0.08, d);
             gl_FragColor = vec4(outgoingLight, diffuseColor.a * vAlpha * falloff);`,
          );
      };

      const points = new THREE.Points(starGeom, starMat);
      group.add(points);
      starMaterials.push(starMat);
      disposables.push(starGeom, starMat);

      // Figure lines: the joins that make a constellation readable.
      const linePositions: number[] = [];
      for (const [a, b] of constellation.lines) {
        if (!local[a] || !local[b]) continue;
        linePositions.push(...local[a], ...local[b]);
      }
      const lineGeom = new THREE.BufferGeometry();
      lineGeom.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));

      const lineMat = new THREE.LineBasicMaterial({
        color: themeColor,
        transparent: true,
        // Kept faint: the joins should suggest the figure, not draw a diagram.
        opacity: themeOpacity * 0.14,
        depthWrite: false,
      });

      const lines = new THREE.LineSegments(lineGeom, lineMat);
      group.add(lines);
      lineMaterials.push(lineMat);
      disposables.push(lineGeom, lineMat);

      // A slight tilt stops the figures looking pasted flat, but stays shallow —
      // the tangent-plane projection above exists to make them face the viewer,
      // and a large rotation here would throw that away.
      group.rotation.set(
        (Math.random() - 0.5) * 0.1,
        (Math.random() - 0.5) * 0.12,
        (Math.random() - 0.5) * 0.5,
      );

      scene.add(group);
      // Incommensurate x/y speeds trace an open Lissajous figure, so a
      // constellation never visibly repeats the same loop. Amplitude scales
      // with depth: nearer figures travel further, reinforcing the parallax.
      drifting.push({
        object: group,
        depth: place.depth,
        spin: 0.00006,
        float: {
          // Amplitude is in world units at z ≈ -400..-600, where perspective
          // shrinks it substantially on screen. The first pass used ~26-48 and
          // measured only 7-9px of travel over 7.5s — real motion, but well
          // below the threshold where anyone notices. These values put it in
          // the tens of pixels, which reads as drifting without distracting.
          ampX: (95 + Math.random() * 70) * place.depth,
          ampY: (70 + Math.random() * 55) * place.depth,
          // A full cycle previously took ~114s, so any given glance caught a
          // sliver of the arc. ~25-45s per cycle keeps it calm but legible.
          speedX: 0.15 + Math.random() * 0.1,
          speedY: 0.11 + Math.random() * 0.08,
          phaseX: Math.random() * Math.PI * 2,
          phaseY: Math.random() * Math.PI * 2,
          tiltAmp: 0.07 + Math.random() * 0.05,
          tiltSpeed: 0.12 + Math.random() * 0.08,
          tiltPhase: Math.random() * Math.PI * 2,
          baseRotX: group.rotation.x,
          baseRotZ: group.rotation.z,
        },
      });
    });

    /* ---- Scattered background stars -------------------------------------- */

    // Fills the gaps so the constellations sit in a sky rather than a void.
    const fieldSpecs = [
      { count: Math.round(700 * density), spread: 2000, size: 2.0, depth: 1, alpha: 0.5 },
      { count: Math.round(500 * density), spread: 1300, size: 1.3, depth: 0.45, alpha: 0.32 },
    ];

    for (const spec of fieldSpecs) {
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
        color: themeColor,
        size: spec.size,
        transparent: true,
        opacity: themeOpacity * spec.alpha,
        sizeAttenuation: true,
        depthWrite: false,
      });
      material.userData.alphaScale = spec.alpha;

      const points = new THREE.Points(geometry, material);
      scene.add(points);
      starMaterials.push(material);
      disposables.push(geometry, material);
      drifting.push({
        object: points,
        depth: spec.depth,
        spin: 0.0011 * spec.depth,
      });
    }

    /* ---- Theme, motion, lifecycle ---------------------------------------- */

    const applyTheme = () => {
      const { color, opacity } = readTheme();
      for (const mat of starMaterials) {
        mat.color.copy(color);
        const scale = (mat.userData.alphaScale as number | undefined) ?? 1;
        mat.opacity = opacity * scale;
        mat.needsUpdate = true;
      }
      for (const mat of lineMaterials) {
        mat.color.copy(color);
        mat.opacity = opacity * 0.14;
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

    // Elapsed *animating* time. THREE.Clock keeps counting while the loop is
    // paused offscreen or in a hidden tab, which would teleport every figure on
    // resume; accumulating per frame instead means a pause truly freezes them.
    let elapsed = 0;
    let lastFrame = 0;

    const renderFrame = () => {
      const now = performance.now();
      // Clamp the step so a long pause or a stalled frame can't jump the drift.
      const delta = lastFrame ? Math.min((now - lastFrame) / 1000, 0.05) : 0;
      lastFrame = now;
      elapsed += delta;
      const t = elapsed;
      // Ease toward the scroll position so the parallax feels weighted.
      scrollCurrent += (scrollTarget - scrollCurrent) * 0.06;

      for (const item of drifting) {
        item.object.rotation.y += item.spin;
        const baseX = item.object.userData.baseX as number;
        const baseY = item.object.userData.baseY as number;
        const scrollShift = scrollCurrent * 0.12 * item.depth;

        if (item.float) {
          const f = item.float;
          item.object.position.x = baseX + Math.sin(t * f.speedX + f.phaseX) * f.ampX;
          item.object.position.y =
            baseY + Math.cos(t * f.speedY + f.phaseY) * f.ampY + scrollShift;
          // A shallow roll and pitch, so the figure breathes without tipping
          // out of the tangent plane that makes it recognisable.
          item.object.rotation.z = f.baseRotZ + Math.sin(t * f.tiltSpeed + f.tiltPhase) * f.tiltAmp;
          item.object.rotation.x = f.baseRotX + Math.cos(t * f.tiltSpeed * 0.7 + f.tiltPhase) * f.tiltAmp * 0.5;
        } else {
          item.object.position.y = baseY + scrollShift;
        }
      }
      renderer.render(scene, camera);
    };

    for (const item of drifting) {
      item.object.userData.baseX = item.object.position.x;
      item.object.userData.baseY = item.object.position.y;
    }

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      renderFrame();
    };

    const start = () => {
      if (running || reduceMotion) return;
      running = true;
      lastFrame = 0;
      animate();
    };

    const stop = () => {
      if (!running) return;
      running = false;
      cancelAnimationFrame(animationFrameId);
    };

    if (reduceMotion) {
      // Static single frame: the constellations without the motion.
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

    const themeObserver = new MutationObserver(applyTheme);
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });

    const handleResize = () => {
      const { width, height } = measure();
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
      if (reduceMotion) renderer.render(scene, camera);
    };
    window.addEventListener('resize', handleResize);

    // The footer variant is absolutely positioned inside a block that has no
    // height until layout runs, so the first measure can be wrong. Re-measure
    // once the element's box is known.
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    return () => {
      stop();
      observer.disconnect();
      themeObserver.disconnect();
      resizeObserver.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', onScroll);
      for (const item of disposables) item.dispose();
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
