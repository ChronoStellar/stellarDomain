"use client";

import { useEffect, useRef, useCallback } from 'react';
import { withBasePath } from '@/lib/basePath';

const getRandomInt = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

/**
 * Ambient space swimmers in the background of The Lab:
 * 1. The custom hand-drawn swimming astronaut (2-frame animated swim stroke & glide)
 * 2. Background retro pixel swimmers & rubber ducky floating in the deep starfield
 *
 * Spawn height is randomized on page load and dynamically re-randomized each time
 * an astronaut completes a lap off-screen.
 * Strictly in the background (z-index: 0, behind all cards and text), with gentle ambient opacity.
 */
export default function SpaceSwimmer() {
  const customLaneRef = useRef<HTMLDivElement>(null);
  const primaryLaneRef = useRef<HTMLDivElement>(null);
  const secondaryLaneRef = useRef<HTMLDivElement>(null);

  // Randomize initial heights on mount directly on DOM to prevent React re-renders
  useEffect(() => {
    if (customLaneRef.current) {
      customLaneRef.current.style.setProperty('--spawn-y', `${getRandomInt(8, 46)}vh`);
    }
    if (primaryLaneRef.current) {
      primaryLaneRef.current.style.setProperty('--spawn-y', `${getRandomInt(14, 58)}vh`);
    }
    if (secondaryLaneRef.current) {
      secondaryLaneRef.current.style.setProperty('--spawn-y', `${getRandomInt(30, 74)}vh`);
    }
  }, []);

  // Re-randomize spawn height whenever a swimmer finishes a full lap off-screen
  const onCustomLap = useCallback(() => {
    if (customLaneRef.current) {
      customLaneRef.current.style.setProperty('--spawn-y', `${getRandomInt(8, 48)}vh`);
    }
  }, []);

  const onPrimaryLap = useCallback(() => {
    if (primaryLaneRef.current) {
      primaryLaneRef.current.style.setProperty('--spawn-y', `${getRandomInt(14, 60)}vh`);
    }
  }, []);

  const onSecondaryLap = useCallback(() => {
    if (secondaryLaneRef.current) {
      secondaryLaneRef.current.style.setProperty('--spawn-y', `${getRandomInt(28, 76)}vh`);
    }
  }, []);

  return (
    <div className="space-swimmer-bg" aria-hidden="true">
      {/* BB: Custom Illustrated Astronaut Swimmer */}
      <div
        ref={customLaneRef}
        className="custom-astro-lane"
        aria-label="BB the astronaut swimming in space"
        onAnimationIteration={onCustomLap}
      >
        <div className="custom-astro-swimmer">
          {/* Frame 1: Swimming stroke & kick */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={withBasePath('/lab/astro-swim-1.webp')}
            alt="BB swimming stroke"
            className="custom-astro-frame frame-stroke"
            decoding="async"
          />
          {/* Frame 2: Streamlined glide */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={withBasePath('/lab/astro-swim-2.webp')}
            alt="BB streamlined glide"
            className="custom-astro-frame frame-glide"
            decoding="async"
          />
        </div>
      </div>

      {/* Retro Pixel Swimmer 1: 8-bit Astronaut with snorkel and pool floaties */}
      <div
        ref={primaryLaneRef}
        className="pixel-astronaut-lane lane-primary"
        onAnimationIteration={onPrimaryLap}
      >
        <div className="pixel-swimmer swimmer-breaststroke">
          <svg
            className="pixel-astro-svg"
            viewBox="0 0 24 20"
            shapeRendering="crispEdges"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Snorkel */}
            <rect x="7" y="0" width="2" height="1" fill="#ef4444" />
            <rect x="7" y="1" width="2" height="1" fill="#ffffff" />
            <rect x="7" y="2" width="2" height="1" fill="#ef4444" />
            <rect x="8" y="2" width="2" height="1" fill="#ef4444" />

            {/* Snorkel Pixel Bubbles */}
            <g className="pixel-bubble-stream">
              <rect x="5" y="0" width="1" height="1" fill="#7dd3fc" />
              <rect x="3" y="-2" width="1" height="1" fill="#bae6fd" />
            </g>

            {/* Backpack */}
            <rect x="4" y="6" width="3" height="7" fill="#64748b" />
            <rect x="3" y="7" width="1" height="5" fill="#475569" />

            {/* Helmet */}
            <rect x="8" y="3" width="7" height="1" fill="#f1f5f9" />
            <rect x="7" y="4" width="9" height="4" fill="#f1f5f9" />
            <rect x="10" y="4" width="5" height="3" fill="#f59e0b" />
            <rect x="11" y="4" width="2" height="1" fill="#fef08a" />
            <rect x="8" y="7" width="7" height="1" fill="#94a3b8" />

            {/* Torso */}
            <rect x="7" y="8" width="7" height="5" fill="#f8fafc" />
            <rect x="9" y="9" width="1" height="1" fill="#0284c7" />
            <rect x="11" y="9" width="1" height="1" fill="#22c55e" />
            <rect x="10" y="11" width="2" height="1" fill="#64748b" />

            {/* Left Arm & Floatie */}
            <g className="pixel-arm-top">
              <rect x="8" y="6" width="3" height="2" fill="#f97316" />
              <rect x="9" y="6" width="1" height="2" fill="#fdba74" />
              <rect x="11" y="6" width="4" height="2" fill="#f8fafc" />
              <rect x="15" y="6" width="2" height="2" fill="#475569" />
            </g>

            {/* Right Arm & Floatie */}
            <g className="pixel-arm-bottom">
              <rect x="8" y="12" width="3" height="2" fill="#f97316" />
              <rect x="9" y="12" width="1" height="2" fill="#fdba74" />
              <rect x="11" y="12" width="4" height="2" fill="#f8fafc" />
              <rect x="15" y="12" width="2" height="2" fill="#475569" />
            </g>

            {/* Legs */}
            <g className="pixel-legs">
              <rect x="5" y="12" width="3" height="3" fill="#e2e8f0" />
              <rect x="3" y="13" width="2" height="2" fill="#f8fafc" />
              <rect x="1" y="14" width="2" height="2" fill="#334155" />
              <rect x="4" y="15" width="2" height="2" fill="#e2e8f0" />
              <rect x="2" y="17" width="2" height="2" fill="#475569" />
            </g>
          </svg>
        </div>
      </div>

      {/* Distant Floater: Tiny astronaut & rubber ducky peacefully floating in zero-G */}
      <div
        ref={secondaryLaneRef}
        className="pixel-astronaut-lane lane-secondary"
        onAnimationIteration={onSecondaryLap}
      >
        <div className="pixel-swimmer floater-companion">
          <svg
            className="pixel-astro-svg-small"
            viewBox="0 0 28 16"
            shapeRendering="crispEdges"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Tiny Space Rubber Ducky */}
            <g className="pixel-ducky-companion">
              <rect x="2" y="5" width="4" height="4" fill="#38bdf8" fillOpacity="0.4" />
              <rect x="3" y="4" width="2" height="1" fill="#bae6fd" fillOpacity="0.6" />
              <rect x="3" y="6" width="3" height="2" fill="#facc15" />
              <rect x="1" y="8" width="4" height="2" fill="#eab308" />
              <rect x="6" y="6" width="1" height="1" fill="#f97316" />
            </g>

            {/* Distant Swimmer */}
            <g transform="translate(10, 0)">
              <rect x="6" y="2" width="5" height="4" fill="#f1f5f9" />
              <rect x="8" y="3" width="3" height="2" fill="#38bdf8" />
              <rect x="3" y="4" width="2" height="4" fill="#64748b" />
              <rect x="5" y="6" width="5" height="4" fill="#f8fafc" />
              <rect x="6" y="5" width="2" height="1" fill="#f97316" />
              <rect x="6" y="10" width="2" height="1" fill="#f97316" />
              <rect x="10" y="5" width="2" height="1" fill="#475569" />
              <rect x="10" y="9" width="2" height="1" fill="#475569" />
              <rect x="2" y="8" width="2" height="2" fill="#334155" />
              <rect x="1" y="10" width="2" height="2" fill="#475569" />
            </g>
          </svg>
        </div>
      </div>
    </div>
  );
}
