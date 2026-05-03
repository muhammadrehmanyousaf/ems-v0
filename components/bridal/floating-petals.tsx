"use client"

import { cn } from "@/lib/utils"

// Floating rose petals over a hero / auth background. Pure CSS animation,
// no JS, no DOM events — drops in behind content as `pointer-events-none`.
// Per brief: 3–5 petals, 12s loop, gentle drift.
const petalPaths = [
  // small soft petal
  "M 12 0 C 18 6, 24 14, 12 24 C 0 14, 6 6, 12 0 Z",
  // longer petal
  "M 14 0 C 22 8, 28 18, 14 28 C 0 18, 6 8, 14 0 Z",
  // round petal
  "M 16 0 C 22 6, 24 14, 16 22 C 8 14, 10 6, 16 0 Z",
]

const PETALS = [
  { left: "8%",  delay: "0s",   dur: "16s", scale: 1,    hue: "#F2B5C0", path: 0, drift: "8s" },
  { left: "22%", delay: "3s",   dur: "18s", scale: 0.85, hue: "#E8917A", path: 1, drift: "9s" },
  { left: "44%", delay: "6s",   dur: "14s", scale: 1.1,  hue: "#F2B5C0", path: 2, drift: "10s" },
  { left: "66%", delay: "1.5s", dur: "20s", scale: 0.9,  hue: "#E8C99A", path: 0, drift: "7s" },
  { left: "82%", delay: "9s",   dur: "17s", scale: 1.05, hue: "#F2B5C0", path: 1, drift: "11s" },
] as const

export function FloatingPetals({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden",
        className
      )}
    >
      {PETALS.map((p, i) => (
        <span
          key={i}
          className="absolute -top-10 will-change-transform animate-petal-fall"
          style={{
            left: p.left,
            animationDelay: p.delay,
            animationDuration: p.dur,
          }}
        >
          <span
            className="block animate-petal-drift"
            style={{
              animationDuration: p.drift,
              animationDelay: p.delay,
            }}
          >
            <svg
              width={28 * p.scale}
              height={28 * p.scale}
              viewBox="0 0 28 28"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              style={{ filter: "drop-shadow(0 4px 6px rgba(176,125,84,0.18))" }}
            >
              <path
                d={petalPaths[p.path]}
                fill={p.hue}
                fillOpacity="0.85"
                stroke={p.hue}
                strokeOpacity="0.6"
                strokeWidth="0.5"
              />
            </svg>
          </span>
        </span>
      ))}
    </div>
  )
}
