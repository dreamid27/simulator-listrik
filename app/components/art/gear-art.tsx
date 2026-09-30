import * as React from "react"
import { cn } from "~/lib/utils"
import type { RoomKind } from "~/lib/sim/types"

const INK = "var(--ink)"
const BODY = "var(--art-body)"
const SOFT = "var(--art-soft)"
const MID = "var(--art-mid)"
const ACC = "var(--art-accent)"
const GLASS = "var(--art-glass)"
const EN = "var(--energy)"
const SAFE = "var(--safe)"
const DANGER = "var(--destructive)"

const line = { stroke: INK, strokeWidth: 2 } as const
const thin = { stroke: INK, strokeWidth: 1.5 } as const

function Svg({
  vb,
  className,
  children,
  label,
}: {
  vb: string
  className?: string
  children: React.ReactNode
  label?: string
}) {
  return (
    <svg
      viewBox={vb}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("overflow-visible", className)}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      {children}
    </svg>
  )
}

/** Meteran listrik prabayar dengan LCD, keypad, dan MCB PLN di bawahnya. */
export function KwhMeterArt({
  powered,
  display,
  sub,
  mcbOn,
  alarm,
  className,
}: {
  powered: boolean
  display: string
  sub?: string
  mcbOn: boolean
  alarm?: boolean
  className?: string
}) {
  return (
    <Svg
      vb="0 0 120 170"
      className={className}
      label="Meteran listrik (kWh meter)"
    >
      <rect
        x="4"
        y="4"
        width="112"
        height="162"
        rx="14"
        fill={BODY}
        {...line}
      />
      <rect x="4" y="4" width="112" height="20" rx="10" fill={SOFT} />
      <path d="M4 24h112" {...thin} />
      <text
        x="16"
        y="18"
        fontSize="8"
        fontWeight="700"
        fill={INK}
        letterSpacing="1"
      >
        kWh METER
      </text>
      <circle
        cx="98"
        cy="14"
        r="3.5"
        fill={powered ? (alarm ? DANGER : SAFE) : MID}
        className={powered ? "anim-pulse" : undefined}
      />
      {/* LCD */}
      <rect
        x="14"
        y="32"
        width="92"
        height="36"
        rx="5"
        fill={powered ? "oklch(0.9 0.09 145)" : GLASS}
        {...line}
      />
      {powered && (
        <>
          <text
            x="100"
            y="56"
            fontSize="16"
            fontWeight="700"
            textAnchor="end"
            fill="oklch(0.28 0.06 150)"
            fontFamily="ui-monospace, monospace"
          >
            {display}
          </text>
          <text
            x="20"
            y="44"
            fontSize="6.5"
            fontWeight="600"
            fill="oklch(0.35 0.06 150)"
          >
            {sub}
          </text>
        </>
      )}
      {/* keypad */}
      {Array.from({ length: 12 }, (_, i) => {
        const col = i % 4
        const row = Math.floor(i / 4)
        return (
          <rect
            key={i}
            x={16 + col * 23}
            y={76 + row * 12}
            width="19"
            height="8"
            rx="3"
            fill={i === 11 ? ACC : i === 3 ? DANGER : SOFT}
            {...thin}
          />
        )
      })}
      {/* MCB PLN */}
      <rect
        x="36"
        y="118"
        width="48"
        height="40"
        rx="5"
        fill={SOFT}
        {...line}
      />
      <text
        x="60"
        y="128"
        fontSize="6"
        fontWeight="700"
        textAnchor="middle"
        fill={INK}
      >
        MCB PLN
      </text>
      <rect x="52" y="131" width="16" height="23" rx="3" fill={GLASS} />
      <g
        style={{
          transform: `translateY(${mcbOn ? 0 : 10}px)`,
          transition: "transform 0.25s cubic-bezier(.3,1.4,.5,1)",
        }}
      >
        <rect
          x="54"
          y="133"
          width="12"
          height="9"
          rx="2"
          fill={mcbOn ? "var(--primary)" : DANGER}
          stroke="white"
          strokeWidth="1"
        />
      </g>
    </Svg>
  )
}

/** Satu modul MCB. Tuasnya naik = ON, turun = OFF. */
export function McbArt({
  amp,
  on,
  color,
  tripped,
  className,
}: {
  amp: number
  on: boolean
  color?: string
  tripped?: boolean
  className?: string
}) {
  return (
    <Svg vb="0 0 36 76" className={className}>
      <rect x="2" y="2" width="32" height="72" rx="5" fill={BODY} {...line} />
      <rect x="2" y="2" width="32" height="10" rx="4" fill={color ?? MID} />
      <path d="M2 12h32" {...thin} />
      <text
        x="18"
        y="22"
        fontSize="7.5"
        fontWeight="800"
        textAnchor="middle"
        fill={INK}
      >
        C{amp}
      </text>
      <rect x="10" y="27" width="16" height="32" rx="4" fill={GLASS} />
      <text
        x="18"
        y="31.5"
        fontSize="4"
        textAnchor="middle"
        fill="white"
        opacity="0.8"
      >
        ON
      </text>
      <text
        x="18"
        y="58"
        fontSize="4"
        textAnchor="middle"
        fill="white"
        opacity="0.8"
      >
        OFF
      </text>
      <g
        style={{
          transform: `translateY(${on ? 0 : 14}px)`,
          transition: "transform 0.25s cubic-bezier(.3,1.4,.5,1)",
        }}
      >
        <rect
          x="11.5"
          y="31"
          width="13"
          height="13"
          rx="2.5"
          fill={on ? "var(--primary)" : DANGER}
          stroke="white"
          strokeWidth="1.2"
        />
        <path
          d="M14.5 35.5h7M14.5 39.5h7"
          stroke="white"
          strokeWidth="1"
          opacity="0.6"
        />
      </g>
      <circle
        cx="18"
        cy="67"
        r="3"
        fill={tripped ? DANGER : on ? SAFE : MID}
        className={tripped ? "anim-pulse" : undefined}
      />
    </Svg>
  )
}

export function ElcbArt({
  className,
  on = true,
}: {
  className?: string
  on?: boolean
}) {
  return (
    <Svg vb="0 0 56 76" className={className}>
      <rect x="2" y="2" width="52" height="72" rx="5" fill={BODY} {...line} />
      <rect
        x="2"
        y="2"
        width="52"
        height="10"
        rx="4"
        fill="oklch(0.68 0.13 190)"
      />
      <text
        x="28"
        y="22"
        fontSize="7"
        fontWeight="800"
        textAnchor="middle"
        fill={INK}
      >
        30 mA
      </text>
      <rect x="8" y="28" width="16" height="30" rx="4" fill={GLASS} />
      <rect
        x="9.5"
        y={on ? 31 : 43}
        width="13"
        height="12"
        rx="2.5"
        fill="var(--primary)"
        stroke="white"
        strokeWidth="1.2"
      />
      <circle cx="40" cy="38" r="7" fill="oklch(0.85 0.13 85)" {...thin} />
      <text
        x="40"
        y="41"
        fontSize="7"
        fontWeight="800"
        textAnchor="middle"
        fill={INK}
      >
        T
      </text>
      <text x="40" y="56" fontSize="4.5" textAnchor="middle" fill={INK}>
        TEST
      </text>
    </Svg>
  )
}

/** Stopkontak dinding model Indonesia (dua lubang bulat, klip arde atas-bawah). */
export function SocketArt({
  ground = true,
  className,
  plugged,
}: {
  ground?: boolean
  className?: string
  plugged?: boolean
}) {
  return (
    <Svg vb="0 0 64 64" className={className}>
      <rect x="6" y="6" width="52" height="52" rx="10" fill={BODY} {...line} />
      <circle cx="32" cy="32" r="18" fill={SOFT} {...line} />
      {ground && (
        <>
          <rect
            x="28"
            y="14.5"
            width="8"
            height="4"
            rx="1"
            fill="oklch(0.78 0.1 85)"
            {...thin}
          />
          <rect
            x="28"
            y="45.5"
            width="8"
            height="4"
            rx="1"
            fill="oklch(0.78 0.1 85)"
            {...thin}
          />
        </>
      )}
      <circle cx="24" cy="32" r="3.2" fill={INK} />
      <circle cx="40" cy="32" r="3.2" fill={INK} />
      {plugged && <circle cx="32" cy="32" r="14" fill={ACC} opacity="0.35" />}
    </Svg>
  )
}

export function SwitchArt({
  on,
  className,
}: {
  on?: boolean
  className?: string
}) {
  return (
    <Svg vb="0 0 64 64" className={className}>
      <rect x="10" y="6" width="44" height="52" rx="8" fill={BODY} {...line} />
      <rect x="20" y="14" width="24" height="36" rx="5" fill={SOFT} {...line} />
      <path
        d={on ? "M21 32h22l-2-16H23Z" : "M21 32h22l-2 16H23Z"}
        fill={MID}
        {...thin}
      />
      <circle cx="32" cy={on ? 24 : 40} r="1.6" fill={on ? EN : INK} />
    </Svg>
  )
}

/** Colokan T / terminal bertumpuk. */
export function TerminalArt({
  className,
  warn,
}: {
  className?: string
  warn?: boolean
}) {
  return (
    <Svg vb="0 0 64 64" className={className}>
      <rect x="4" y="22" width="56" height="20" rx="6" fill={BODY} {...line} />
      {[16, 32, 48].map((x) => (
        <g key={x}>
          <circle cx={x} cy="32" r="6" fill={SOFT} {...thin} />
          <circle cx={x - 2.2} cy="32" r="1.2" fill={INK} />
          <circle cx={x + 2.2} cy="32" r="1.2" fill={INK} />
        </g>
      ))}
      <path
        d="M4 32c-3 0-3 10 4 16h8"
        fill="none"
        stroke={INK}
        strokeWidth="2.5"
      />
      {warn && (
        <g className="anim-pulse" stroke="var(--heat)" strokeWidth="2">
          <path d="M16 18c-2-3 2-4 0-7M32 18c-2-3 2-4 0-7M48 18c-2-3 2-4 0-7" />
        </g>
      )}
    </Svg>
  )
}

/** Potongan kabel NYM: fasa (coklat), netral (biru), arde (hijau-kuning). */
export function CableArt({
  className,
  mm2 = 2.5,
  hot,
}: {
  className?: string
  mm2?: number
  hot?: boolean
}) {
  const r = 4 + Math.min(mm2, 6) * 0.6
  return (
    <Svg vb="0 0 96 64" className={className}>
      <path d="M4 32h40" stroke={INK} strokeWidth={r * 2 + 10} />
      <path
        d="M4 32h40"
        stroke={hot ? "oklch(0.8 0.12 40)" : "oklch(0.96 0.005 300)"}
        strokeWidth={r * 2 + 6}
      />
      <path d="M44 32h8" stroke={INK} strokeWidth={r * 2 + 4} />
      <path d="M44 32h8" stroke={SOFT} strokeWidth={r * 2 + 1} />
      <path
        d={`M52 32 Q68 ${32 - r * 2.2} 88 ${32 - r * 2.8}`}
        stroke={INK}
        strokeWidth={r + 2.5}
      />
      <path
        d={`M52 32 Q68 ${32 - r * 2.2} 88 ${32 - r * 2.8}`}
        stroke="oklch(0.45 0.08 50)"
        strokeWidth={r}
      />
      <path d="M52 32H90" stroke={INK} strokeWidth={r + 2.5} />
      <path d="M52 32H90" stroke="oklch(0.6 0.14 245)" strokeWidth={r} />
      <path
        d={`M52 32 Q68 ${32 + r * 2.2} 88 ${32 + r * 2.8}`}
        stroke={INK}
        strokeWidth={r + 2.5}
      />
      <path
        d={`M52 32 Q68 ${32 + r * 2.2} 88 ${32 + r * 2.8}`}
        stroke="oklch(0.75 0.16 130)"
        strokeWidth={r}
      />
      <path
        d={`M56 ${32 + r * 1.2} l6 ${r * 0.6}M66 ${32 + r * 1.8} l6 ${r * 0.4}`}
        stroke="oklch(0.88 0.16 95)"
        strokeWidth={r * 0.6}
      />
      {hot && (
        <g className="anim-pulse" stroke="var(--heat)" strokeWidth="2">
          <path d="M12 16c-2-3 2-4 0-7M24 16c-2-3 2-4 0-7M36 16c-2-3 2-4 0-7" />
        </g>
      )}
    </Svg>
  )
}

export function GroundArt({ className }: { className?: string }) {
  return (
    <Svg vb="0 0 64 64" className={className}>
      <path d="M2 30h60v32H2Z" fill="oklch(0.86 0.05 70)" />
      <path d="M2 30h60" stroke="oklch(0.55 0.1 140)" strokeWidth="4" />
      <g fill="oklch(0.75 0.06 60)">
        <circle cx="12" cy="42" r="2" />
        <circle cx="50" cy="50" r="2.5" />
        <circle cx="20" cy="56" r="1.5" />
        <circle cx="44" cy="38" r="1.5" />
      </g>
      <rect
        x="29"
        y="18"
        width="6"
        height="42"
        rx="2"
        fill="oklch(0.72 0.09 55)"
        {...line}
      />
      <rect x="26" y="22" width="12" height="6" rx="2" fill={MID} {...thin} />
      <path d="M26 25c-10 0-14-6-16-18" stroke={INK} strokeWidth="4.5" />
      <path
        d="M26 25c-10 0-14-6-16-18"
        stroke="oklch(0.75 0.16 130)"
        strokeWidth="2.5"
      />
      <path
        d="M22 24l2-3M17 21l3-2M13 15l3-1"
        stroke="oklch(0.88 0.16 95)"
        strokeWidth="1.8"
      />
    </Svg>
  )
}

export function PanelBoxArt({ className }: { className?: string }) {
  return (
    <Svg vb="0 0 96 80" className={className}>
      <rect x="4" y="4" width="88" height="72" rx="8" fill={SOFT} {...line} />
      <rect x="12" y="14" width="72" height="52" rx="4" fill={BODY} {...thin} />
      {[0, 1, 2, 3].map((i) => (
        <g key={i} transform={`translate(${18 + i * 16} 22)`}>
          <rect width="12" height="36" rx="3" fill={BODY} {...thin} />
          <rect
            y="0"
            width="12"
            height="5"
            rx="2"
            fill={
              [
                "var(--art-accent)",
                "oklch(0.68 0.13 190)",
                "oklch(0.75 0.15 70)",
                "oklch(0.65 0.18 10)",
              ][i]
            }
          />
          <rect x="3" y="12" width="6" height="12" rx="1.5" fill={GLASS} />
          <rect
            x="3.5"
            y="12.5"
            width="5"
            height="5.5"
            rx="1"
            fill="var(--primary)"
          />
        </g>
      ))}
    </Svg>
  )
}

/** Tiang listrik PLN dengan kabel. */
export function PoleArt({
  className,
  live,
}: {
  className?: string
  live?: boolean
}) {
  return (
    <Svg vb="0 0 60 200" className={className}>
      <path d="M30 20v178" stroke={INK} strokeWidth="8" />
      <path d="M30 20v178" stroke="oklch(0.78 0.02 290)" strokeWidth="5" />
      <path d="M8 32h44" stroke={INK} strokeWidth="5" />
      <path d="M8 32h44" stroke="oklch(0.7 0.02 290)" strokeWidth="2.5" />
      {[12, 30, 48].map((x) => (
        <g key={x}>
          <rect
            x={x - 3}
            y="24"
            width="6"
            height="8"
            rx="2"
            fill={BODY}
            {...thin}
          />
        </g>
      ))}
      <rect x="20" y="48" width="20" height="26" rx="4" fill={MID} {...line} />
      <path d="M26 58h8M26 64h8" stroke={INK} strokeWidth="1.2" />
      {live && (
        <circle cx="30" cy="10" r="4" fill={EN} className="anim-pulse" />
      )}
      <path d="M23 194h14" stroke={INK} strokeWidth="3" />
    </Svg>
  )
}

export function BrandMark({ className }: { className?: string }) {
  return (
    <Svg vb="0 0 40 40" className={className}>
      <path
        d="M6 18L20 6l14 12v15a3 3 0 0 1-3 3H9a3 3 0 0 1-3-3Z"
        fill="var(--primary)"
        stroke={INK}
        strokeWidth="2"
      />
      <path
        d="M22 13l-7 11h5l-2 8 7-11h-5Z"
        fill={EN}
        stroke={INK}
        strokeWidth="1.6"
      />
    </Svg>
  )
}

export type Mood = "happy" | "worried" | "shock" | "think" | "cheer"

/** Maskot "Volti" — steker kecil yang menemani pengguna. */
export function Volti({
  mood = "happy",
  className,
}: {
  mood?: Mood
  className?: string
}) {
  const body = mood === "shock" ? "oklch(0.72 0.17 35)" : "var(--primary)"
  return (
    <Svg vb="0 0 80 96" className={className}>
      <ellipse cx="40" cy="92" rx="20" ry="3" fill={INK} opacity="0.1" />
      <rect
        x="27"
        y="4"
        width="6"
        height="18"
        rx="3"
        fill="oklch(0.85 0.03 290)"
        {...line}
      />
      <rect
        x="47"
        y="4"
        width="6"
        height="18"
        rx="3"
        fill="oklch(0.85 0.03 290)"
        {...line}
      />
      <path
        d="M14 36c0-12 10-18 26-18s26 6 26 18v20c0 14-10 24-26 24S14 70 14 56Z"
        fill={body}
        {...line}
      />
      <path
        d="M22 30c3-4 8-6 14-6"
        stroke="white"
        strokeWidth="3"
        opacity="0.35"
      />
      {/* wajah */}
      <g fill="white">
        {mood === "happy" || mood === "cheer" ? (
          <>
            <path
              d="M26 46c2-4 7-4 9 0"
              stroke="white"
              strokeWidth="3"
              fill="none"
            />
            <path
              d="M45 46c2-4 7-4 9 0"
              stroke="white"
              strokeWidth="3"
              fill="none"
            />
          </>
        ) : mood === "shock" ? (
          <>
            <circle cx="30" cy="45" r="5" />
            <circle cx="50" cy="45" r="5" />
            <circle cx="30" cy="45" r="2" fill={INK} />
            <circle cx="50" cy="45" r="2" fill={INK} />
          </>
        ) : (
          <>
            <ellipse cx="30" cy="45" rx="4" ry="4.5" />
            <ellipse cx="50" cy="45" rx="4" ry="4.5" />
            <circle
              cx={mood === "think" ? 31.5 : 30}
              cy={mood === "think" ? 43.5 : 46}
              r="2"
              fill={INK}
            />
            <circle
              cx={mood === "think" ? 51.5 : 50}
              cy={mood === "think" ? 43.5 : 46}
              r="2"
              fill={INK}
            />
          </>
        )}
      </g>
      <circle cx="22" cy="55" r="3.5" fill="oklch(0.8 0.12 10)" opacity="0.6" />
      <circle cx="58" cy="55" r="3.5" fill="oklch(0.8 0.12 10)" opacity="0.6" />
      {mood === "happy" && (
        <path
          d="M34 56c3 4 9 4 12 0"
          stroke="white"
          strokeWidth="3"
          fill="none"
        />
      )}
      {mood === "cheer" && (
        <path d="M33 55h14c0 6-3 9-7 9s-7-3-7-9Z" fill="white" />
      )}
      {mood === "worried" && (
        <path
          d="M34 60c3-3 9-3 12 0"
          stroke="white"
          strokeWidth="3"
          fill="none"
        />
      )}
      {mood === "shock" && (
        <ellipse cx="40" cy="60" rx="4" ry="5" fill="white" />
      )}
      {mood === "think" && (
        <path d="M35 59h10" stroke="white" strokeWidth="3" />
      )}
      {mood === "worried" && (
        <path
          d="M62 30c2 3 2 6 0 8-2-2-2-5 0-8Z"
          fill="oklch(0.8 0.08 230)"
          {...thin}
        />
      )}
      {mood === "shock" && (
        <g stroke={EN} strokeWidth="3">
          <path d="M6 24l6 4M4 40h7M72 24l-6 4M76 40h-7" />
        </g>
      )}
      {mood === "cheer" && (
        <g fill={EN} stroke={INK} strokeWidth="1.2">
          <path d="M8 20l2 4 4 1-3 3 1 4-4-2-4 2 1-4-3-3 4-1Z" />
          <path d="M70 12l1.5 3 3 .6-2.2 2 .6 3-2.9-1.5-2.8 1.5.5-3-2.2-2 3.1-.6Z" />
        </g>
      )}
      {/* kabel ekor */}
      <path d="M40 80c0 6 4 8 10 8h14" stroke={INK} strokeWidth="4" />
    </Svg>
  )
}

/** Latar perabot tiap ruangan (siluet lembut). */
export function RoomBackdrop({
  kind,
  className,
}: {
  kind: RoomKind
  className?: string
}) {
  const f = "var(--ink)"
  const o = 0.07
  const o2 = 0.12
  return (
    <svg
      viewBox="0 0 240 120"
      preserveAspectRatio="xMidYMax meet"
      className={className}
      aria-hidden
    >
      {kind === "tamu" && (
        <g fill={f}>
          <rect x="150" y="18" width="46" height="32" rx="3" opacity={o} />
          <path
            d="M160 42l10-10 8 6 6-4 10 8"
            stroke={f}
            strokeWidth="2"
            fill="none"
            opacity={o2}
          />
          <path
            d="M20 80c0-8 4-12 12-12h86c8 0 12 4 12 12v10H20Z"
            opacity={o2}
          />
          <rect x="14" y="84" width="122" height="24" rx="8" opacity={o2} />
          <rect x="22" y="108" width="6" height="8" opacity={o2} />
          <rect x="122" y="108" width="6" height="8" opacity={o2} />
          <rect x="170" y="96" width="50" height="6" rx="3" opacity={o2} />
          <rect x="176" y="102" width="4" height="14" opacity={o} />
          <rect x="210" y="102" width="4" height="14" opacity={o} />
        </g>
      )}
      {kind === "kamar" && (
        <g fill={f}>
          <rect x="146" y="14" width="56" height="44" rx="4" opacity={o} />
          <path d="M146 14h28v44h-28Z" opacity={o} />
          <rect x="16" y="66" width="10" height="50" rx="3" opacity={o2} />
          <rect x="16" y="88" width="130" height="20" rx="4" opacity={o2} />
          <rect x="30" y="80" width="30" height="10" rx="5" opacity={o2} />
          <rect x="140" y="108" width="6" height="8" opacity={o2} />
          <rect x="190" y="84" width="34" height="32" rx="3" opacity={o} />
        </g>
      )}
      {kind === "dapur" && (
        <g fill={f}>
          <rect x="14" y="14" width="120" height="30" rx="3" opacity={o} />
          <rect x="10" y="76" width="220" height="40" rx="3" opacity={o2} />
          <rect x="10" y="72" width="220" height="6" rx="2" opacity={o2} />
          <rect x="150" y="62" width="40" height="10" rx="2" opacity={o2} />
          <circle cx="160" cy="60" r="0" />
          <path
            d="M40 100h20M100 100h20"
            stroke={f}
            strokeWidth="3"
            opacity={o2}
          />
        </g>
      )}
      {kind === "mandi" && (
        <g fill={f}>
          <g opacity={o}>
            {Array.from({ length: 6 }, (_, i) => (
              <rect
                key={i}
                x={10 + i * 18}
                y="54"
                width="16"
                height="16"
                rx="1"
              />
            ))}
          </g>
          <rect x="10" y="72" width="110" height="44" rx="4" opacity={o2} />
          <rect
            x="16"
            y="76"
            width="98"
            height="10"
            rx="2"
            fill="var(--cold)"
            opacity="0.35"
          />
          <path d="M140 96h24l-3 10h-18Z" opacity={o2} />
          <rect x="161" y="98" width="16" height="3" rx="1.5" opacity={o2} />
          <path
            d="M210 20v30M200 50h20"
            stroke={f}
            strokeWidth="4"
            opacity={o2}
          />
        </g>
      )}
      {kind === "teras" && (
        <g fill={f}>
          <rect x="150" y="10" width="56" height="106" rx="3" opacity={o} />
          <circle cx="196" cy="66" r="3" opacity={o2} />
          <path d="M28 116l-6-26h32l-6 26Z" opacity={o2} />
          <path
            d="M38 90c-6-14-18-18-22-34 10 4 18 12 22 24 2-14 10-26 22-30-6 14-10 26-14 40"
            opacity={o2}
          />
          <rect x="80" y="84" width="40" height="6" rx="3" opacity={o2} />
          <rect x="86" y="90" width="4" height="26" opacity={o2} />
          <rect x="110" y="90" width="4" height="26" opacity={o2} />
          <rect x="84" y="60" width="4" height="26" opacity={o2} />
        </g>
      )}
      {kind === "cuci" && (
        <g fill={f}>
          <path d="M10 22h220" stroke={f} strokeWidth="2" opacity={o2} />
          <path d="M30 22h24v22l-4-2-4 3-4-3-4 3-4-3-4 2Z" opacity={o2} />
          <path d="M70 22h30v14h-8v14H78V36h-8Z" opacity={o2} />
          <path d="M120 22h22v26h-22Z" opacity={o} />
          <path d="M170 96h40l-4 20h-32Z" opacity={o2} />
          <path
            d="M170 96c6-8 34-8 40 0"
            stroke={f}
            strokeWidth="2"
            fill="none"
            opacity={o2}
          />
        </g>
      )}
    </svg>
  )
}
