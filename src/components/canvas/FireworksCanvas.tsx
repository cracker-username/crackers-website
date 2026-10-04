"use client";

import React, { useEffect, useRef, useState } from "react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  alpha: number;
  color: string;
  size: number;
  decay: number;
}

const BRAND_COLORS = [
  "#FF2E93", // Magenta
  "#FF7A18", // Fire Orange
  "#FFC83D", // Gold
  "#22D3EE", // Cyan
  "#8B5CF6", // Violet
  "#A3E635", // Lime
];

export function FireworksCanvas({ className = "" }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    // Check reduced motion preference
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);

    const handleMotionChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };
    mediaQuery.addEventListener("change", handleMotionChange);

    return () => {
      mediaQuery.removeEventListener("change", handleMotionChange);
    };
  }, []);

  useEffect(() => {
    if (prefersReducedMotion) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let isVisible = true;
    let isTabActive = true;
    let animationFrameId: number;
    let particles: Particle[] = [];
    const maxParticles = 60; // Strictly capped particle count

    // Cap devicePixelRatio at 2
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    };

    resize();
    window.addEventListener("resize", resize);

    // Launch a firework burst
    const launchBurst = () => {
      if (particles.length > maxParticles) return;

      const rect = canvas.getBoundingClientRect();
      const x = Math.random() * rect.width * 0.8 + rect.width * 0.1;
      const y = Math.random() * rect.height * 0.5 + rect.height * 0.1;
      const color = BRAND_COLORS[Math.floor(Math.random() * BRAND_COLORS.length)]!;
      const count = 18; // Particles per burst

      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count;
        const speed = Math.random() * 2.5 + 1.5;
        particles.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          alpha: 1,
          color,
          size: Math.random() * 2 + 1.5,
          decay: Math.random() * 0.015 + 0.015,
        });
      }
    };

    let lastBurstTime = Date.now();

    // Animation Loop
    const loop = () => {
      if (!isVisible || !isTabActive) {
        return; // Paused when off-screen or tab hidden
      }

      const rect = canvas.getBoundingClientRect();
      ctx.clearRect(0, 0, rect.width, rect.height);

      // Periodically launch bursts every 1.2 to 2.5 seconds
      const now = Date.now();
      if (now - lastBurstTime > 1600) {
        launchBurst();
        lastBurstTime = now;
      }

      // Update & Draw particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i]!;
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.04; // Gentle gravity
        p.alpha -= p.decay;

        if (p.alpha <= 0) {
          particles.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      animationFrameId = requestAnimationFrame(loop);
    };

    // IntersectionObserver to pause when off-screen
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry) {
          isVisible = entry.isIntersecting;
          if (isVisible && isTabActive) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = requestAnimationFrame(loop);
          }
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(canvas);

    // Tab visibility listener
    const handleVisibilityChange = () => {
      isTabActive = document.visibilityState === "visible";
      if (isTabActive && isVisible) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = requestAnimationFrame(loop);
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Initial burst
    launchBurst();
    animationFrameId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animationFrameId);
      observer.disconnect();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("resize", resize);
    };
  }, [prefersReducedMotion]);

  if (prefersReducedMotion) {
    // Static accessible representation under reduced motion
    return (
      <div
        className={`absolute inset-0 pointer-events-none opacity-40 bg-gradient-to-b from-accent-violet/20 via-transparent to-transparent ${className}`}
        aria-hidden="true"
      />
    );
  }

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 w-full h-full pointer-events-none ${className}`}
      aria-hidden="true"
    />
  );
}
