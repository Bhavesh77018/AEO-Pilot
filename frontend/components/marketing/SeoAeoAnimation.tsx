"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Animated SVG: SEO fades out/cuts and AEO slides in with a smooth transition
 */
export function SeoAeoAnimation() {
  const ref = useRef<HTMLDivElement | null>(null);
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setAnimate(true);
          obs.disconnect();
        }
      },
      { threshold: 0.3 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className="flex items-center justify-center w-full h-40 relative overflow-hidden"
    >
      <svg
        viewBox="0 0 800 200"
        className="w-full h-full max-w-2xl"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id="seoGradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ef4444" />
            <stop offset="100%" stopColor="#f97316" />
          </linearGradient>
          <linearGradient id="aeoGradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#38bdf8" />
          </linearGradient>

          {/* Mask for SEO text cutting effect */}
          <mask id="seoMask">
            <rect width="800" height="200" fill="white" />
            <rect
              x="0"
              y="0"
              width={animate ? 0 : 250}
              height="200"
              fill="black"
              style={{
                transition: "width 1.2s cubic-bezier(0.4, 0, 0.2, 1) 0.3s",
              }}
            />
          </mask>
        </defs>

        {/* SEO Text - fades and cuts from right */}
        <g mask="url(#seoMask)" opacity={animate ? 0.3 : 1}>
          <text
            x="80"
            y="120"
            fontSize="80"
            fontWeight="900"
            fill="url(#seoGradient)"
            fontFamily="system-ui, -apple-system, sans-serif"
            letterSpacing="-2"
          >
            SEO
          </text>
          <line
            x1="260"
            y1="60"
            x2="260"
            y2="140"
            stroke="url(#seoGradient)"
            strokeWidth="4"
            strokeLinecap="round"
          />
        </g>

        {/* AEO Text - slides in from right */}
        <g
          style={{
            transform: animate ? "translateX(0)" : "translateX(300px)",
            transition: "transform 1.2s cubic-bezier(0.4, 0, 0.2, 1) 0.4s",
            transformOrigin: "center",
          }}
        >
          <text
            x="360"
            y="120"
            fontSize="80"
            fontWeight="900"
            fill="url(#aeoGradient)"
            fontFamily="system-ui, -apple-system, sans-serif"
            letterSpacing="-2"
          >
            AEO
          </text>

          {/* Animated sparkles around AEO */}
          {[0, 1, 2, 3].map((i) => {
            const angles = [45, 135, 225, 315];
            const angle = (angles[i] * Math.PI) / 180;
            const baseX = 520;
            const baseY = 80;
            const radius = 60;
            return (
              <circle
                key={`sparkle-${i}`}
                cx={baseX + Math.cos(angle) * radius}
                cy={baseY + Math.sin(angle) * radius}
                r="3"
                fill="url(#aeoGradient)"
                opacity={animate ? 1 : 0}
                style={{
                  transition: `opacity 0.6s ease-out ${0.8 + i * 0.1}s`,
                }}
              />
            );
          })}
        </g>

        {/* Subtext: Google vs AI Engines */}
        <text
          x="400"
          y="180"
          fontSize="16"
          fill="rgba(255,255,255,0.5)"
          textAnchor="middle"
          fontFamily="system-ui, -apple-system, sans-serif"
          opacity={animate ? 1 : 0}
          style={{
            transition: "opacity 0.8s ease-out 1.5s",
          }}
        >
          Google Search → ChatGPT, Gemini, Claude &amp; Perplexity
        </text>
      </svg>
    </div>
  );
}
