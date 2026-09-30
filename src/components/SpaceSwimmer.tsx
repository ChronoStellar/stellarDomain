"use client";

import { useEffect, useRef, useState, useCallback } from 'react';
import { withBasePath } from '@/lib/basePath';

const getRandomInt = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const BB_QUOTES = [
  "Hey! I'm swimming here! 🫧",
  "0G is no excuse for poking!",
  "BB to ground control: visitor detected in Sector Lab! 📡",
  "Warning: cosmic tickle shields offline! ⚡",
  "Bloop bloop... looking for space snacks 🍙",
  "✨ *streamlined cat-astronaut glide* ✨",
  "Don't tap the glass, you'll scare the space duck! 🦆",
  "Systems nominal! Proceed with research!",
  "0% gravity, 100% aerodynamic.",
  "Need a rubber duck to debug your code? Check behind me!",
  "Brrr... deep space is cold, keep swimming! 🚀",
];

/**
 * Ambient space swimmers in the background of The Lab:
 * 1. BB: The custom swimming astronaut (2-frame animated swim stroke & glide)
 *    - Easter egg: Click BB rapidly in quick succession to hear her talk!
 * 2. Background retro pixel swimmers & rubber ducky floating in the deep starfield
 *
 * Spawn height is randomized on page load and dynamically re-randomized each time
 * an astronaut completes a lap off-screen.
 * Strictly in the background (z-index: 1, behind all cards and text), with gentle ambient opacity.
 */
export default function SpaceSwimmer() {
  const customLaneRef = useRef<HTMLDivElement>(null);
  const primaryLaneRef = useRef<HTMLDivElement>(null);
  const secondaryLaneRef = useRef<HTMLDivElement>(null);

  const [speech, setSpeech] = useState<string | null>(null);
  const [isPoked, setIsPoked] = useState(false);
  const clickCountRef = useRef(0);
  const lastClickTimeRef = useRef(0);
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pokeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  // Rapid click / poke handler for BB
  const handleBbClick = useCallback(
    (e: React.MouseEvent | React.KeyboardEvent) => {
      e.stopPropagation();
      const now = Date.now();
      const timeSinceLast = now - lastClickTimeRef.current;
      lastClickTimeRef.current = now;

      if (resetTimerRef.current) {
        clearTimeout(resetTimerRef.current);
      }

      // Count clicks that happen within 550ms of each other
      if (timeSinceLast < 550) {
        clickCountRef.current += 1;
      } else {
        clickCountRef.current = 1;
      }

      // Reset counter after 750ms of idle
      resetTimerRef.current = setTimeout(() => {
        clickCountRef.current = 0;
      }, 750);

      // Visual poke feedback on every click
      setIsPoked(true);
      if (pokeTimerRef.current) clearTimeout(pokeTimerRef.current);
      pokeTimerRef.current = setTimeout(() => {
        setIsPoked(false);
      }, 260);

      // Trigger speech on 3 quick clicks (or immediately if already speaking)
      if (clickCountRef.current >= 3 || speech !== null) {
        setSpeech((prev) => {
          const pool = BB_QUOTES.filter((q) => q !== prev);
          return pool[Math.floor(Math.random() * pool.length)] || BB_QUOTES[0];
        });

        if (dismissTimerRef.current) {
          clearTimeout(dismissTimerRef.current);
        }
        dismissTimerRef.current = setTimeout(() => {
          setSpeech(null);
          clickCountRef.current = 0;
        }, 4200);
      }
    },
    [speech]
  );

  // Clean up all timers on unmount
  useEffect(() => {
    return () => {
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
      if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
      if (pokeTimerRef.current) clearTimeout(pokeTimerRef.current);
    };
  }, []);

  return (
    <div className="space-swimmer-bg">
      {/* BB: Custom Pixelated Astronaut Swimmer */}
      <div
        ref={customLaneRef}
        className={`custom-astro-lane ${speech ? 'is-speaking' : ''}`}
        aria-label="BB the astronaut swimming in space"
        onAnimationIteration={onCustomLap}
      >
        {/* Retro Pixel Speech Bubble (renders upright above BB) */}
        {speech && (
          <div className="bb-speech-bubble" role="status" aria-live="polite">
            <span className="bb-speech-author">BB:</span>
            <span className="bb-speech-text">{speech}</span>
            <div className="bb-speech-arrow" aria-hidden="true" />
          </div>
        )}

        <button
          type="button"
          className={`custom-astro-swimmer custom-astro-btn ${isPoked ? 'bb-poked' : ''}`}
          onClick={handleBbClick}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              handleBbClick(e);
            }
          }}
          title="Click BB repeatedly in quick succession!"
          aria-label="BB the astronaut swimmer. Click rapidly to talk."
        >
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
        </button>
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
