"use client";

import { useId } from "react";

/**
 * AEO Pilot logomark — a single source of truth used everywhere.
 *
 * Concept: a gradient tile containing an upward navigation chevron (the "A"
 * and the "pilot" ascent — steering your brand up into AI answers) topped with
 * an AI "answer" sparkle. Brand gradient: indigo → sky.
 */
export function LogoMark({
  size = 32,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  const gid = useId();
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      role="img"
      aria-label="AEO Pilot"
      className={className}
    >
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop stopColor="#6366f1" />
          <stop offset="1" stopColor="#38bdf8" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="10" fill={`url(#${gid})`} />
      {/* upward chevron "A" / pilot ascent */}
      <path
        d="M11 29 L20 12 L29 29"
        stroke="#fff"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M15.7 23.5 H24.3" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" />
      {/* AI answer sparkle */}
      <path
        d="M30 5.8 Q30 9 33.2 9 Q30 9 30 12.2 Q30 9 26.8 9 Q30 9 30 5.8 Z"
        fill="#fff"
      />
    </svg>
  );
}

/** Logomark + wordmark lockup. Sub-label optional (e.g. tagline). */
export function Logo({
  size = 32,
  className = "",
  subLabel,
}: {
  size?: number;
  className?: string;
  subLabel?: string;
}) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <LogoMark size={size} />
      <span className="leading-tight">
        <span className="block text-base font-semibold tracking-tight text-white">
          AEO Pilot
        </span>
        {subLabel && <span className="block text-[10px] text-white/40">{subLabel}</span>}
      </span>
    </span>
  );
}
