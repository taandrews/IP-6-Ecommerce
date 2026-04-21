"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

/**
 * A stylized, not-chemically-literal diagram of IP6: central inositol ring
 * with six phosphate groups arranged around it. Each phosphate is hoverable;
 * hovering reveals a small readout about that group's role. The aim is
 * evocative, not textbook-accurate.
 */

const PHOSPHATES = [
  { id: 1, angle: 0, label: "P₁", note: "Chelates divalent cations" },
  { id: 2, angle: 60, label: "P₂", note: "Hydrogen-bond donor" },
  { id: 3, angle: 120, label: "P₃", note: "Primary storage phosphate" },
  { id: 4, angle: 180, label: "P₄", note: "Stabilizes ring geometry" },
  { id: 5, angle: 240, label: "P₅", note: "Iron-binding pocket" },
  { id: 6, angle: 300, label: "P₆", note: "Zinc-binding pocket" },
];

const RADIUS = 130;
const CENTER = 220;

export function IP6Molecule() {
  const [active, setActive] = useState<number | null>(null);

  return (
    <div className="relative w-full max-w-md mx-auto" data-cursor="Hover">
      <svg viewBox="0 0 440 440" className="w-full h-auto" aria-label="IP6 molecular diagram, stylized">
        {/* Background ring */}
        <circle cx={CENTER} cy={CENTER} r={RADIUS + 50} fill="none" stroke="rgb(27 67 50 / 0.08)" strokeDasharray="2 6" />

        {/* Bonds */}
        {PHOSPHATES.map((p) => {
          const rad = (p.angle * Math.PI) / 180;
          const x = CENTER + Math.cos(rad) * RADIUS;
          const y = CENTER + Math.sin(rad) * RADIUS;
          const activeBond = active === p.id;
          return (
            <line
              key={`bond-${p.id}`}
              x1={CENTER}
              y1={CENTER}
              x2={x}
              y2={y}
              stroke={activeBond ? "rgb(201 168 76)" : "rgb(27 67 50 / 0.4)"}
              strokeWidth={activeBond ? 2.5 : 1.5}
              className="transition-all duration-300"
            />
          );
        })}

        {/* Inositol ring (central) */}
        <g>
          <circle cx={CENTER} cy={CENTER} r={50} fill="rgb(27 67 50)" />
          <circle cx={CENTER} cy={CENTER} r={50} fill="none" stroke="rgb(201 168 76 / 0.4)" strokeWidth="1.5" />
          <text
            x={CENTER}
            y={CENTER - 2}
            textAnchor="middle"
            dominantBaseline="central"
            fill="rgb(248 244 238)"
            style={{ fontFamily: "var(--font-display)", fontSize: "22px", fontStyle: "italic", fontVariationSettings: '"opsz" 72, "SOFT" 90' }}
          >
            C₆H₆
          </text>
          <text
            x={CENTER}
            y={CENTER + 18}
            textAnchor="middle"
            fill="rgb(201 168 76)"
            style={{ fontFamily: "var(--font-body)", fontSize: "9px", letterSpacing: "0.3em", textTransform: "uppercase" }}
          >
            Inositol
          </text>
        </g>

        {/* Phosphate nodes */}
        {PHOSPHATES.map((p) => {
          const rad = (p.angle * Math.PI) / 180;
          const x = CENTER + Math.cos(rad) * RADIUS;
          const y = CENTER + Math.sin(rad) * RADIUS;
          const isActive = active === p.id;
          return (
            <g
              key={p.id}
              transform={`translate(${x} ${y})`}
              onMouseEnter={() => setActive(p.id)}
              onMouseLeave={() => setActive(null)}
              className="cursor-pointer"
            >
              <circle
                r={isActive ? 34 : 28}
                fill={isActive ? "rgb(201 168 76)" : "rgb(248 244 238)"}
                stroke={isActive ? "rgb(27 67 50)" : "rgb(201 168 76 / 0.6)"}
                strokeWidth={1.5}
                className="transition-all duration-300"
              />
              <text
                x={0}
                y={2}
                textAnchor="middle"
                dominantBaseline="central"
                fill={isActive ? "rgb(27 67 50)" : "rgb(27 67 50 / 0.85)"}
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "16px",
                  fontStyle: "italic",
                  fontVariationSettings: '"opsz" 48, "SOFT" 90',
                }}
              >
                {p.label}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Readout below */}
      <div className={cn("mt-6 min-h-[72px] text-center transition-opacity duration-300", active ? "opacity-100" : "opacity-40")}>
        {active ? (
          <>
            <p className="eyebrow mb-2">{PHOSPHATES.find((p) => p.id === active)?.label}</p>
            <p className="text-ink/80 text-sm leading-relaxed max-w-sm mx-auto">
              {PHOSPHATES.find((p) => p.id === active)?.note}
            </p>
          </>
        ) : (
          <p className="text-ink/55 text-sm italic" style={{ fontFamily: "var(--font-display)" }}>
            Hover a phosphate.
          </p>
        )}
      </div>
    </div>
  );
}
