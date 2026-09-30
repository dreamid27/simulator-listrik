import * as React from "react"
import { cn } from "~/lib/utils"
import type { ArtKind } from "~/lib/sim/types"

/*
 * Ilustrasi perangkat — digambar tangan di grid 64×64.
 * Gaya: garis tinta ungu gelap, isian dua tone lilac, aksen kuning energi saat menyala.
 */

const INK = "var(--ink)"
const BODY = "var(--art-body)"
const SOFT = "var(--art-soft)"
const MID = "var(--art-mid)"
const ACC = "var(--art-accent)"
const GLASS = "var(--art-glass)"
const EN = "var(--energy)"
const ENS = "var(--energy-soft)"
const COLD = "var(--cold)"
const HEAT = "var(--heat)"
const SAFE = "var(--safe)"

const line = { stroke: INK, strokeWidth: 2 } as const
const thin = { stroke: INK, strokeWidth: 1.5 } as const

type P = { on: boolean; mode: number; uid: string }

function Shadow({ w = 20 }: { w?: number }) {
  return <ellipse cx="32" cy="60" rx={w} ry="2.2" fill={INK} opacity="0.08" />
}

function Steam({
  x,
  y,
  on,
  color = MID,
}: {
  x: number
  y: number
  on: boolean
  color?: string
}) {
  if (!on) return null
  return (
    <g stroke={color} strokeWidth="2" fill="none">
      <path className="anim-rise" d={`M${x - 5} ${y}c-2-3 2-4 0-7`} />
      <path className="anim-rise delay-1" d={`M${x} ${y - 1}c-2-3 2-4 0-7`} />
      <path className="anim-rise delay-2" d={`M${x + 5} ${y}c-2-3 2-4 0-7`} />
    </g>
  )
}

function Bolt({
  x,
  y,
  s = 1,
  fill = EN,
}: {
  x: number
  y: number
  s?: number
  fill?: string
}) {
  return (
    <path
      transform={`translate(${x} ${y}) scale(${s})`}
      d="M1.5 -5 L-3 1 H0 L-1.5 5 L3 -1 H0 Z"
      fill={fill}
      stroke={INK}
      strokeWidth={1.2 / s}
      strokeLinejoin="round"
    />
  )
}

function Glow({
  uid,
  cx,
  cy,
  r,
  on,
}: {
  uid: string
  cx: number
  cy: number
  r: number
  on: boolean
}) {
  if (!on) return null
  return (
    <>
      <defs>
        <radialGradient id={`g-${uid}`}>
          <stop offset="0%" stopColor={EN} stopOpacity="0.85" />
          <stop offset="100%" stopColor={EN} stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle
        className="anim-glow"
        cx={cx}
        cy={cy}
        r={r}
        fill={`url(#g-${uid})`}
      />
    </>
  )
}

const ART: Record<ArtKind, (p: P) => React.ReactNode> = {
  exhaust: ({ on }) => (
    <>
      {/* bingkai kotak di dinding */}
      <rect x="8" y="8" width="44" height="44" rx="6" fill={BODY} {...line} />
      <rect x="12" y="12" width="36" height="36" rx="4" fill={SOFT} {...thin} />
      <circle cx="30" cy="30" r="15" fill={GLASS} {...line} />
      <g className={on ? "anim-spin" : undefined}>
        {[0, 90, 180, 270].map((r) => (
          <path
            key={r}
            transform={`rotate(${r} 30 30)`}
            d="M30 30c-1-4-5-8-2-12 4-1 6 3 5 7-.5 2-1.5 4-3 5Z"
            fill={ACC}
            stroke={INK}
            strokeWidth="1.2"
          />
        ))}
      </g>
      <circle
        cx="30"
        cy="30"
        r="3.5"
        fill={MID}
        stroke={INK}
        strokeWidth="1.2"
      />
      {/* kisi-kisi pelindung */}
      <g stroke={INK} strokeWidth="1" opacity="0.35">
        <path d="M16 24h28M16 30h28M16 36h28" />
      </g>
      <circle cx="46" cy="14" r="1.6" fill={on ? SAFE : MID} />
      {on && (
        <g stroke={MID} strokeWidth="2.2" fill="none">
          <path className="anim-flow" d="M54 20c4 1 6 4 6 8" />
          <path className="anim-flow" d="M55 30h7" />
          <path className="anim-flow" d="M54 40c4-1 6-4 6-8" />
        </g>
      )}
      <Shadow w={16} />
    </>
  ),
  cctv: ({ on }) => (
    <>
      <rect x="6" y="6" width="14" height="18" rx="3" fill={MID} {...line} />
      <path d="M13 24v6l8 4" fill="none" stroke={INK} strokeWidth="3" />
      <g transform="rotate(18 38 34)">
        <rect
          x="14"
          y="26"
          width="38"
          height="16"
          rx="6"
          fill={BODY}
          {...line}
        />
        <path d="M14 30h30" stroke={SOFT} strokeWidth="2" />
        <rect
          x="46"
          y="24"
          width="10"
          height="20"
          rx="4"
          fill={ACC}
          {...line}
        />
        <circle
          cx="51"
          cy="34"
          r="4.5"
          fill={GLASS}
          stroke={INK}
          strokeWidth="1.5"
        />
        <circle cx="50" cy="33" r="1.4" fill="white" opacity="0.8" />
        <circle
          cx="21"
          cy="36"
          r="1.8"
          fill={on ? HEAT : MID}
          className={on ? "anim-pulse" : undefined}
        />
      </g>
      {on && (
        <path
          d="M58 44l4 6h-12Z"
          fill={EN}
          opacity="0.35"
          className="anim-pulse"
        />
      )}
      <text x="24" y="58" fontSize="6" fontWeight="700" fill={on ? HEAT : MID}>
        {on ? "● REC" : ""}
      </text>
    </>
  ),
  dvr: ({ on }) => (
    <>
      <Shadow w={26} />
      <path d="M8 26l6-8h36l6 8Z" fill={SOFT} {...line} />
      <rect x="6" y="26" width="52" height="20" rx="3" fill={GLASS} {...line} />
      {[0, 1, 2, 3].map((i) => (
        <circle
          key={i}
          cx={14 + i * 6}
          cy="36"
          r="1.8"
          fill={on ? (i === 3 ? HEAT : SAFE) : MID}
          className={on && i === 3 ? "anim-pulse" : undefined}
        />
      ))}
      <rect
        x="38"
        y="32"
        width="14"
        height="8"
        rx="1.5"
        fill={on ? "oklch(0.9 0.09 145)" : SOFT}
        {...thin}
      />
      {on && (
        <text
          x="45"
          y="38.2"
          fontSize="4.5"
          fontWeight="700"
          textAnchor="middle"
          fill={INK}
        >
          4CH
        </text>
      )}
      <path d="M12 46v4M52 46v4" {...line} />
      {on && (
        <g stroke={ACC} strokeWidth="1.8" fill="none">
          <path className="anim-pulse" d="M26 14c4-3 8-3 12 0" />
          <path className="anim-pulse delay-1" d="M22 9c6-5 14-5 20 0" />
        </g>
      )}
    </>
  ),
  multi: ({ on }) => (
    <>
      <Shadow w={26} />
      {on && (
        <g>
          <path
            d="M16 20v-6M32 20v-9M48 20v-6"
            stroke={EN}
            strokeWidth="2.5"
            className="anim-pulse"
          />
        </g>
      )}
      <rect x="4" y="34" width="56" height="16" rx="5" fill={BODY} {...line} />
      {[14, 32, 50].map((x) => (
        <g key={x}>
          <circle cx={x} cy="42" r="5.5" fill={SOFT} {...thin} />
          <rect
            x={x - 4}
            y="22"
            width="8"
            height="12"
            rx="2.5"
            fill={on ? ACC : MID}
            {...line}
          />
          <path d={`M${x} 22v-4`} stroke={INK} strokeWidth="2" />
        </g>
      ))}
      <rect
        x="54"
        y="38"
        width="4"
        height="8"
        rx="1.5"
        fill={on ? HEAT : MID}
      />
      <path
        d="M4 44c-3 0-3 10 5 12h10"
        fill="none"
        stroke={INK}
        strokeWidth="2.5"
      />
    </>
  ),
  gadget: ({ on, uid }) => (
    <>
      <Glow uid={uid} cx={32} cy={32} r={24} on={on} />
      <Shadow w={20} />
      <rect
        x="12"
        y="12"
        width="40"
        height="40"
        rx="10"
        fill={BODY}
        {...line}
      />
      <rect x="12" y="12" width="40" height="10" rx="5" fill={SOFT} />
      <path d="M12 22h40" {...thin} />
      <circle cx="32" cy="36" r="10" fill={on ? ENS : SOFT} {...line} />
      <path
        d="M32 29v7"
        stroke={on ? "var(--energy-deep)" : INK}
        strokeWidth="2.5"
      />
      <path
        d="M27 31.5a7 7 0 1 0 10 0"
        fill="none"
        stroke={on ? "var(--energy-deep)" : INK}
        strokeWidth="2.2"
      />
      <circle cx="44" cy="17" r="1.8" fill={on ? SAFE : MID} />
    </>
  ),
  bulb: ({ on, uid }) => (
    <>
      <Glow uid={uid} cx={32} cy={24} r={28} on={on} />
      {on && (
        <g stroke={EN} strokeWidth="2.5">
          <path d="M8 24H4M60 24h-4M14 8l-3-3M50 8l3-3M12 40l-3 3M52 40l3 3" />
        </g>
      )}
      <path
        d="M32 8c-9.4 0-17 7.2-17 16.2 0 5.8 3.1 9.6 6.1 12.6 2 2 3 4.1 3 6.4V45h15.8v-1.8c0-2.3 1-4.4 3-6.4 3-3 6.1-6.8 6.1-12.6C49 15.2 41.4 8 32 8Z"
        fill={on ? ENS : BODY}
        {...line}
      />
      <path
        d="M22 20c1.4-3.6 4.6-6 8-6.6"
        stroke={on ? "white" : SOFT}
        strokeWidth="2.5"
      />
      <path
        d="M27 38V31l5-4 5 4v7"
        stroke={on ? "var(--energy-deep)" : MID}
        strokeWidth="2"
      />
      <rect
        x="23.5"
        y="45"
        width="17"
        height="5"
        rx="1.5"
        fill={MID}
        {...line}
      />
      <rect
        x="25"
        y="50"
        width="14"
        height="4.5"
        rx="1.5"
        fill={SOFT}
        {...line}
      />
      <path d="M28.5 54.5h7l-1 3.5h-5z" fill={INK} />
    </>
  ),
  tube: ({ on, uid }) => (
    <>
      <Glow uid={uid} cx={32} cy={36} r={30} on={on} />
      <rect x="8" y="16" width="48" height="9" rx="3" fill={SOFT} {...line} />
      <path d="M16 25v5M48 25v5" {...line} />
      <rect
        x="5"
        y="30"
        width="54"
        height="11"
        rx="5.5"
        fill={on ? ENS : BODY}
        {...line}
      />
      <path d="M13 34h36" stroke={on ? "white" : SOFT} strokeWidth="2.5" />
      <rect x="5" y="30" width="7" height="11" rx="3" fill={MID} {...line} />
      <rect x="52" y="30" width="7" height="11" rx="3" fill={MID} {...line} />
      {on && (
        <path d="M18 48l-2 5M32 48v6M46 48l2 5" stroke={EN} strokeWidth="2.5" />
      )}
    </>
  ),
  fan: ({ on, mode }) => (
    <>
      <Shadow w={14} />
      <path d="M32 44v12" stroke={INK} strokeWidth="5" />
      <path d="M32 44v12" stroke={MID} strokeWidth="2.5" />
      <ellipse cx="32" cy="57" rx="13" ry="3.5" fill={MID} {...line} />
      <circle cx="32" cy="25" r="20" fill={SOFT} {...line} />
      <g
        className={
          on ? (mode === 0 ? "anim-spin-slow" : "anim-spin") : undefined
        }
        style={on && mode === 2 ? { animationDuration: "0.3s" } : undefined}
      >
        {[0, 120, 240].map((r) => (
          <path
            key={r}
            transform={`rotate(${r} 32 25)`}
            d="M32 25c-1-5-5.5-11-1-15 4.5-2 7.5 3 5 8-1 2.5-2.5 5-4 7Z"
            fill={ACC}
            stroke={INK}
            strokeWidth="1.5"
          />
        ))}
      </g>
      <g stroke={INK} strokeWidth="1" opacity="0.35">
        <circle cx="32" cy="25" r="14" />
        <path d="M32 5v40M12 25h40M18 11l28 28M46 11L18 39" />
      </g>
      <circle cx="32" cy="25" r="4.5" fill="var(--primary)" {...thin} />
      <circle cx="30.8" cy="23.8" r="1.2" fill="white" />
    </>
  ),
  ac: ({ on }) => (
    <>
      <rect x="4" y="14" width="56" height="24" rx="7" fill={BODY} {...line} />
      <path d="M10 30h44" stroke={SOFT} strokeWidth="2" />
      <rect x="10" y="32" width="44" height="4" rx="2" fill={MID} {...thin} />
      <rect
        x="44"
        y="19"
        width="10"
        height="5"
        rx="2"
        fill={on ? GLASS : SOFT}
        {...thin}
      />
      {on && (
        <text
          x="49"
          y="23"
          fontSize="4.2"
          fontWeight="700"
          textAnchor="middle"
          fill={COLD}
        >
          25°
        </text>
      )}
      <circle cx="12" cy="21" r="1.6" fill={on ? SAFE : MID} />
      {on && (
        <g stroke={COLD} strokeWidth="2.2">
          <path className="anim-flow" d="M14 43c3 4 0 7 3 11" />
          <path className="anim-flow" d="M25 43c3 4 0 7 3 11" />
          <path className="anim-flow" d="M36 43c3 4 0 7 3 11" />
          <path className="anim-flow" d="M47 43c3 4 0 7 3 11" />
        </g>
      )}
    </>
  ),
  fridge: ({ on }) => (
    <>
      <Shadow w={16} />
      <rect x="16" y="5" width="32" height="52" rx="5" fill={BODY} {...line} />
      <path d="M16 21h32" {...line} />
      <rect
        x="20"
        y="9"
        width="14"
        height="8"
        rx="2"
        fill={on ? "oklch(0.93 0.04 230)" : SOFT}
        {...thin}
      />
      <rect
        x="40"
        y="25"
        width="3.5"
        height="14"
        rx="1.75"
        fill={MID}
        {...thin}
      />
      <path d="M19 57v2M45 57v2" {...line} />
      {on && (
        <g stroke={COLD} strokeWidth="1.8" className="anim-pulse">
          <path d="M27 9.5v7M23.5 13h7M24.5 10.5l5 5M29.5 10.5l-5 5" />
        </g>
      )}
      <circle cx="44" cy="10" r="1.4" fill={on ? SAFE : MID} />
    </>
  ),
  fridge2: ({ on }) => (
    <>
      <Shadow w={18} />
      <rect x="14" y="4" width="36" height="54" rx="5" fill={BODY} {...line} />
      <path d="M14 22h36" {...line} />
      <rect
        x="42"
        y="9"
        width="3.5"
        height="9"
        rx="1.75"
        fill={MID}
        {...thin}
      />
      <rect
        x="42"
        y="27"
        width="3.5"
        height="16"
        rx="1.75"
        fill={MID}
        {...thin}
      />
      <rect
        x="19"
        y="28"
        width="12"
        height="7"
        rx="2"
        fill={on ? GLASS : SOFT}
        {...thin}
      />
      {on && (
        <text
          x="25"
          y="33.3"
          fontSize="4.5"
          fontWeight="700"
          textAnchor="middle"
          fill={COLD}
        >
          3°
        </text>
      )}
      <path d="M17 58v2M47 58v2" {...line} />
      {on && (
        <g stroke={COLD} strokeWidth="1.8" className="anim-pulse">
          <path d="M26 9v8M22 13h8M23 10l6 6M29 10l-6 6" />
        </g>
      )}
    </>
  ),
  dispenser: ({ on }) => (
    <>
      <Shadow w={14} />
      <path
        d="M24 4h16v4c4 1 6 3 6 7v9c0 3-2 5-5 5H23c-3 0-5-2-5-5v-9c0-4 2-6 6-7Z"
        fill="oklch(0.9 0.06 230)"
        {...line}
      />
      <path
        d="M22 16h20M22 21h20"
        stroke="white"
        strokeWidth="1.5"
        opacity="0.8"
      />
      <rect x="18" y="29" width="28" height="29" rx="4" fill={BODY} {...line} />
      <rect x="22" y="34" width="20" height="10" rx="2" fill={SOFT} {...thin} />
      <rect
        x="25"
        y="36"
        width="4"
        height="6"
        rx="1"
        fill={on ? HEAT : MID}
        {...thin}
      />
      <rect x="35" y="36" width="4" height="6" rx="1" fill={COLD} {...thin} />
      <rect x="22" y="50" width="20" height="3" rx="1.5" fill={MID} {...thin} />
      <circle
        cx="42"
        cy="32.5"
        r="1.3"
        fill={on ? HEAT : MID}
        className={on ? "anim-pulse" : undefined}
      />
      <Steam x={27} y={30} on={on} color="oklch(0.8 0.08 30)" />
    </>
  ),
  ricecooker: ({ on, mode }) => (
    <>
      <Shadow w={20} />
      <Steam x={32} y={14} on={on && mode === 0} />
      <path d="M13 26c0-8 8.5-12 19-12s19 4 19 12Z" fill={ACC} {...line} />
      <path d="M27 14.5c0-2.5 2-3.5 5-3.5s5 1 5 3.5" fill={MID} {...line} />
      <path
        d="M11 26h42v20c0 6-4 10-10 10H21c-6 0-10-4-10-10Z"
        fill={BODY}
        {...line}
      />
      <path d="M11 31h42" stroke={SOFT} strokeWidth="3" />
      <rect x="24" y="37" width="16" height="11" rx="3" fill={SOFT} {...thin} />
      <circle
        cx="29"
        cy="42.5"
        r="2"
        fill={on && mode === 0 ? HEAT : MID}
        className={on && mode === 0 ? "anim-pulse" : undefined}
      />
      <circle
        cx="35"
        cy="42.5"
        r="2"
        fill={on && mode === 1 ? EN : MID}
        className={on && mode === 1 ? "anim-pulse" : undefined}
      />
      <path d="M8 29h3M53 29h3" {...line} />
    </>
  ),
  induction: ({ on, mode }) => (
    <>
      <Steam x={32} y={16} on={on && mode > 0} />
      <path
        d="M18 18h28v12c0 2-2 4-4 4H22c-2 0-4-2-4-4Z"
        fill={MID}
        {...line}
      />
      <path d="M18 22h-6M46 22h6" stroke={INK} strokeWidth="3" />
      <rect x="6" y="34" width="52" height="7" rx="3" fill={GLASS} {...line} />
      {on && (
        <ellipse
          cx="32"
          cy="37.5"
          rx={10 + mode * 3}
          ry="2"
          fill="none"
          stroke={HEAT}
          strokeWidth="1.8"
          className="anim-pulse"
        />
      )}
      <path d="M8 41h48v9c0 3-2 5-5 5H13c-3 0-5-2-5-5Z" fill={BODY} {...line} />
      <rect
        x="22"
        y="45"
        width="20"
        height="5"
        rx="2.5"
        fill={SOFT}
        {...thin}
      />
      {[0, 1, 2].map((i) => (
        <circle
          key={i}
          cx={27 + i * 5}
          cy="47.5"
          r="1.3"
          fill={on && i <= mode ? HEAT : MID}
        />
      ))}
    </>
  ),
  microwave: ({ on, uid }) => (
    <>
      <Shadow w={24} />
      <rect x="5" y="13" width="54" height="40" rx="5" fill={BODY} {...line} />
      <rect
        x="10"
        y="18"
        width="32"
        height="30"
        rx="3"
        fill={on ? ENS : GLASS}
        {...line}
      />
      {on && (
        <>
          <Glow uid={uid} cx={26} cy={33} r={14} on />
          <ellipse
            cx="26"
            cy="42"
            rx="11"
            ry="2.5"
            fill="none"
            stroke="var(--energy-deep)"
            strokeWidth="1.5"
            className="anim-flow-slow"
          />
          <rect
            x="21"
            y="35"
            width="10"
            height="6"
            rx="2"
            fill={ACC}
            {...thin}
          />
        </>
      )}
      {!on && (
        <path
          d="M14 22l6 0M14 26l3 0"
          stroke="white"
          strokeWidth="1.5"
          opacity="0.4"
        />
      )}
      <rect
        x="46"
        y="18"
        width="8"
        height="5"
        rx="1.5"
        fill={on ? GLASS : SOFT}
        {...thin}
      />
      {on && (
        <text
          x="50"
          y="22"
          fontSize="3.8"
          fontWeight="700"
          textAnchor="middle"
          fill={EN}
        >
          1:30
        </text>
      )}
      <circle cx="50" cy="30" r="2.6" fill={MID} {...thin} />
      <circle cx="50" cy="38" r="2.6" fill={MID} {...thin} />
      <path d="M17 53v3M47 53v3" {...line} />
    </>
  ),
  oven: ({ on }) => (
    <>
      <Shadow w={22} />
      <rect x="7" y="10" width="50" height="44" rx="5" fill={BODY} {...line} />
      <path d="M7 19h50" {...line} />
      {[16, 26, 38, 48].map((x, i) => (
        <circle
          key={x}
          cx={x}
          cy="14.5"
          r="2"
          fill={i === 3 && on ? HEAT : MID}
          {...thin}
        />
      ))}
      <rect x="13" y="24" width="38" height="4" rx="2" fill={MID} {...thin} />
      <rect
        x="13"
        y="31"
        width="38"
        height="18"
        rx="3"
        fill={on ? "oklch(0.88 0.1 55)" : GLASS}
        {...line}
      />
      {on && (
        <g stroke={HEAT} strokeWidth="1.8" className="anim-pulse">
          <path d="M16 35c3 2 5-2 8 0s5-2 8 0 5-2 8 0 5-2 8 0" />
          <path d="M16 45c3 2 5-2 8 0s5-2 8 0 5-2 8 0 5-2 8 0" />
        </g>
      )}
      <path d="M12 54v3M52 54v3" {...line} />
    </>
  ),
  blender: ({ on }) => (
    <>
      <Shadow w={14} />
      <g className={on ? "anim-shake" : undefined}>
        <path d="M22 8h22l-4 34H26Z" fill="oklch(0.95 0.02 230)" {...line} />
        <path
          d="M24.5 22h17l-2.3 20H26.8Z"
          fill="oklch(0.72 0.17 30)"
          opacity={on ? 1 : 0.85}
        />
        {on && (
          <path
            d="M28 30c3-3 6 3 9 0"
            stroke="white"
            strokeWidth="1.5"
            className="anim-pulse"
          />
        )}
        <rect x="20" y="4" width="26" height="5" rx="2" fill={ACC} {...line} />
        <path
          d="M44 14h5c1.5 0 2.5 1 2.5 2.5v12c0 1.5-1 2.5-2.5 2.5h-6"
          fill="none"
          {...line}
        />
        <g className={on ? "anim-spin" : undefined}>
          <path d="M28 38h10M33 35v6" {...thin} />
        </g>
      </g>
      <path d="M20 42h26l3 14H17Z" fill={BODY} {...line} />
      <circle cx="33" cy="50" r="3" fill={on ? EN : MID} {...thin} />
    </>
  ),
  kettle: ({ on }) => (
    <>
      <Shadow w={18} />
      <Steam x={18} y={16} on={on} />
      <path d="M22 16h22l5 32H17Z" fill={BODY} {...line} />
      <path d="M17 22l-6-5v-3" fill="none" {...line} />
      <path
        d="M44 20h6c2 0 3 1 3 3v14c0 2-1 3-3 3h-3"
        fill="none"
        stroke={INK}
        strokeWidth="3"
      />
      <rect x="24" y="11" width="18" height="5" rx="2" fill={ACC} {...line} />
      <rect
        x="29"
        y="26"
        width="8"
        height="14"
        rx="3"
        fill={on ? "oklch(0.85 0.08 230)" : SOFT}
        {...thin}
      />
      {on && (
        <path
          d="M30 36c2-2 4 2 6 0"
          stroke={COLD}
          strokeWidth="1.5"
          className="anim-pulse"
        />
      )}
      <path d="M14 48h38v4c0 2-1 3-3 3H17c-2 0-3-1-3-3Z" fill={MID} {...line} />
      <circle cx="45" cy="51.5" r="1.4" fill={on ? COLD : SOFT} />
    </>
  ),
  washer: ({ on, mode }) => (
    <>
      <Shadow w={22} />
      <rect x="9" y="6" width="46" height="51" rx="6" fill={BODY} {...line} />
      <path d="M9 17h46" {...line} />
      <circle cx="17" cy="11.5" r="2.5" fill={MID} {...thin} />
      <circle cx="25" cy="11.5" r="2.5" fill={MID} {...thin} />
      <rect
        x="36"
        y="9.5"
        width="14"
        height="4"
        rx="2"
        fill={on ? GLASS : SOFT}
        {...thin}
      />
      {on && (
        <rect
          x="37.5"
          y="10.8"
          width="6"
          height="1.6"
          rx="0.8"
          fill={SAFE}
          className="anim-pulse"
        />
      )}
      <circle cx="32" cy="37" r="15" fill={MID} {...line} />
      <circle
        cx="32"
        cy="37"
        r="11"
        fill={on ? "oklch(0.86 0.08 230)" : GLASS}
        {...thin}
      />
      {on && (
        <g
          className="anim-spin"
          style={{ animationDuration: mode === 1 ? "0.35s" : "1.2s" }}
        >
          <path
            d="M22 38c4 3 8-3 12 0s6 1 8-1"
            stroke="white"
            strokeWidth="1.8"
          />
          <circle cx="27" cy="32" r="1.8" fill="white" />
          <circle cx="36" cy="43" r="1.4" fill="white" />
        </g>
      )}
      <path
        d="M26 30c2-2 5-2.6 8-2"
        stroke="white"
        strokeWidth="1.5"
        opacity="0.6"
      />
    </>
  ),
  iron: ({ on }) => (
    <>
      <Shadow w={22} />
      {on && (
        <g stroke={MID} strokeWidth="2">
          <path className="anim-rise" d="M16 50c-2-3 2-4 0-7" />
          <path className="anim-rise delay-1" d="M24 50c-2-3 2-4 0-7" />
        </g>
      )}
      <path d="M8 52c2-10 10-18 24-18h24v18Z" fill={BODY} {...line} />
      <path d="M8 52h48" stroke={INK} strokeWidth="3" />
      <path d="M9.5 48h45.5" stroke={on ? HEAT : MID} strokeWidth="2" />
      <path
        d="M26 34c0-6 4-12 12-12h14c2 0 4 2 4 4v8"
        fill="none"
        stroke={INK}
        strokeWidth="3.5"
      />
      <path
        d="M26 34c0-6 4-12 12-12h14c2 0 4 2 4 4v8"
        fill="none"
        stroke={ACC}
        strokeWidth="1.5"
      />
      <circle cx="43" cy="42" r="4" fill={SOFT} {...thin} />
      <path d="M43 42l2-2" {...thin} />
      <circle
        cx="33"
        cy="42"
        r="1.6"
        fill={on ? HEAT : MID}
        className={on ? "anim-pulse" : undefined}
      />
      <path d="M56 30c4 0 6-2 6-6" stroke={INK} strokeWidth="1.8" />
    </>
  ),
  pump: ({ on }) => (
    <>
      <Shadow w={24} />
      <rect x="40" y="4" width="6" height="22" rx="1" fill={SOFT} {...line} />
      {on && (
        <g fill={COLD}>
          <circle className="anim-rise" cx="43" cy="16" r="1.6" />
          <circle className="anim-rise delay-2" cx="43" cy="10" r="1.6" />
        </g>
      )}
      <rect x="8" y="27" width="24" height="20" rx="5" fill={ACC} {...line} />
      <g stroke={INK} strokeWidth="1.2" opacity="0.5">
        <path d="M12 31v12M16 31v12M20 31v12M24 31v12M28 31v12" />
      </g>
      <circle cx="43" cy="37" r="12" fill={BODY} {...line} />
      <circle cx="43" cy="37" r="5" fill={SOFT} {...thin} />
      {on && (
        <g className="anim-spin">
          <path d="M43 33v8M39 37h8" stroke={ACC} strokeWidth="1.8" />
        </g>
      )}
      <rect x="32" y="33" width="4" height="8" fill={MID} {...thin} />
      <path d="M55 37h5" stroke={INK} strokeWidth="5" />
      <path d="M55 37h5" stroke={SOFT} strokeWidth="2" />
      <rect x="6" y="49" width="46" height="6" rx="2" fill={MID} {...line} />
      <circle cx="12" cy="23" r="2" fill={on ? SAFE : MID} {...thin} />
    </>
  ),
  heater: ({ on }) => (
    <>
      <rect x="16" y="4" width="32" height="46" rx="12" fill={BODY} {...line} />
      <path d="M22 12c2-3 6-4 9-4" stroke={SOFT} strokeWidth="2.5" />
      <rect
        x="25"
        y="20"
        width="14"
        height="8"
        rx="2.5"
        fill={on ? GLASS : SOFT}
        {...thin}
      />
      {on && (
        <text
          x="32"
          y="26"
          fontSize="5"
          fontWeight="700"
          textAnchor="middle"
          fill={HEAT}
        >
          45°
        </text>
      )}
      {on && (
        <g stroke={HEAT} strokeWidth="1.8" className="anim-pulse">
          <path d="M24 36c2-2 4 2 6 0s4 2 6 0 4 2 6 0" />
        </g>
      )}
      <path d="M24 50v8" stroke={COLD} strokeWidth="4" />
      <path d="M40 50v8" stroke={HEAT} strokeWidth="4" />
      <path d="M22 58h4M38 58h4" {...line} />
    </>
  ),
  vacuum: ({ on }) => (
    <>
      <Shadow w={24} />
      <path d="M14 8c-3 0-5 2-5 5v8" fill="none" stroke={INK} strokeWidth="4" />
      <path d="M9 21v24" stroke={INK} strokeWidth="3" />
      <path d="M3 45h14l-1 5H4Z" fill={MID} {...line} />
      <path
        d="M14 8c10 0 12 10 18 20s10 12 14 14"
        fill="none"
        stroke={INK}
        strokeWidth="4"
      />
      <path
        d="M14 8c10 0 12 10 18 20s10 12 14 14"
        fill="none"
        stroke={MID}
        strokeWidth="1.8"
      />
      <path
        d="M32 44c0-8 6-12 13-12h4c6 0 10 4 10 10v4c0 4-3 7-7 7H38c-4 0-6-3-6-7Z"
        fill={ACC}
        {...line}
      />
      <circle cx="40" cy="52" r="5" fill={BODY} {...line} />
      <circle cx="54" cy="52" r="4" fill={BODY} {...line} />
      <circle cx="50" cy="40" r="2" fill={on ? SAFE : MID} />
      {on && (
        <g fill={INK} opacity="0.4">
          <circle className="anim-rise" cx="18" cy="54" r="1.2" />
          <circle className="anim-rise delay-1" cx="22" cy="56" r="1" />
          <circle className="anim-rise delay-2" cx="14" cy="56" r="1" />
        </g>
      )}
    </>
  ),
  hairdryer: ({ on, mode }) => (
    <>
      <path
        d="M26 34l-4 22c0 2 2 3 4 3h4c2 0 3-1 3-3l-1-20"
        fill={MID}
        {...line}
      />
      <circle cx="26" cy="24" r="14" fill={ACC} {...line} />
      <circle cx="26" cy="24" r="6" fill={BODY} {...thin} />
      <path d="M38 17h10c2 0 3 1 3 3v8c0 2-1 3-3 3H38" fill={BODY} {...line} />
      <path d="M51 18v12" stroke={INK} strokeWidth="3" />
      {on && (
        <g stroke={mode === 1 ? HEAT : EN} strokeWidth="2">
          <path className="anim-flow" d="M54 19h8" />
          <path className="anim-flow" d="M54 24h9" />
          <path className="anim-flow" d="M54 29h8" />
        </g>
      )}
      <rect
        x="25"
        y="42"
        width="5"
        height="3"
        rx="1"
        fill={on ? EN : SOFT}
        {...thin}
      />
    </>
  ),
  tv: ({ on, uid }) => (
    <>
      <Shadow w={16} />
      <defs>
        <linearGradient id={`tv-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="oklch(0.82 0.1 300)" />
          <stop offset="100%" stopColor="oklch(0.9 0.1 70)" />
        </linearGradient>
      </defs>
      <rect x="4" y="8" width="56" height="36" rx="3" fill={INK} />
      <rect
        x="7"
        y="11"
        width="50"
        height="30"
        rx="1.5"
        fill={on ? `url(#tv-${uid})` : GLASS}
      />
      {on ? (
        <g>
          <circle cx="44" cy="20" r="4.5" fill={EN} className="anim-pulse" />
          <path
            d="M7 36l12-10 9 7 8-5 21 13H7Z"
            fill="var(--primary)"
            opacity="0.75"
          />
          <path d="M7 41l16-9 12 6 10-4 12 7H7Z" fill={INK} opacity="0.35" />
        </g>
      ) : (
        <path
          d="M12 16l10 0M12 20l5 0"
          stroke="white"
          strokeWidth="1.5"
          opacity="0.25"
        />
      )}
      <path d="M26 44l-3 10M38 44l3 10" {...line} />
      <path d="M19 55h26" stroke={INK} strokeWidth="3" />
      <circle cx="54" cy="42.5" r="0.9" fill={on ? SAFE : HEAT} />
    </>
  ),
  laptop: ({ on }) => (
    <>
      <Shadow w={24} />
      <rect x="12" y="10" width="40" height="30" rx="3" fill={INK} />
      <rect
        x="15"
        y="13"
        width="34"
        height="24"
        rx="1.5"
        fill={on ? "oklch(0.95 0.03 300)" : GLASS}
      />
      {on && (
        <g>
          <rect x="18" y="16" width="12" height="3" rx="1.5" fill={ACC} />
          <rect x="18" y="22" width="26" height="2" rx="1" fill={MID} />
          <rect x="18" y="26" width="20" height="2" rx="1" fill={MID} />
          <rect x="18" y="30" width="23" height="2" rx="1" fill={MID} />
          <rect
            x="42"
            y="16"
            width="4"
            height="4"
            rx="1"
            fill={EN}
            className="anim-pulse"
          />
        </g>
      )}
      <path d="M6 42h52l-3 8H9Z" fill={BODY} {...line} />
      <path d="M26 45h12" stroke={MID} strokeWidth="2" />
    </>
  ),
  pc: ({ on, mode }) => (
    <>
      <Shadow w={26} />
      <rect x="4" y="10" width="38" height="28" rx="3" fill={INK} />
      <rect
        x="7"
        y="13"
        width="32"
        height="22"
        rx="1.5"
        fill={
          on
            ? mode === 1
              ? "oklch(0.35 0.12 300)"
              : "oklch(0.95 0.03 300)"
            : GLASS
        }
      />
      {on && mode === 0 && (
        <g>
          <rect x="10" y="16" width="10" height="3" rx="1.5" fill={ACC} />
          <rect x="10" y="22" width="24" height="2" rx="1" fill={MID} />
          <rect x="10" y="26" width="18" height="2" rx="1" fill={MID} />
        </g>
      )}
      {on && mode === 1 && (
        <g>
          <path
            d="M14 30l6-8 5 5 4-3 6 6"
            stroke={EN}
            strokeWidth="2"
            fill="none"
          />
          <circle
            cx="31"
            cy="18"
            r="2.5"
            fill="oklch(0.75 0.18 340)"
            className="anim-pulse"
          />
        </g>
      )}
      <path d="M20 38l-2 10h10l-2-10" fill={MID} {...line} />
      <path d="M14 48h18" stroke={INK} strokeWidth="3" />
      <rect x="45" y="12" width="15" height="42" rx="3" fill={BODY} {...line} />
      <path d="M49 18h7M49 22h7" stroke={MID} strokeWidth="2" />
      <circle
        cx="52.5"
        cy="46"
        r="2.3"
        fill={on ? (mode === 1 ? "oklch(0.75 0.18 340)" : SAFE) : MID}
        {...thin}
        className={on ? "anim-pulse" : undefined}
      />
    </>
  ),
  router: ({ on }) => (
    <>
      <Shadow w={22} />
      {on && (
        <g stroke={ACC} strokeWidth="2.5" fill="none">
          <path className="anim-pulse" d="M24 14c5-4 11-4 16 0" />
          <path className="anim-pulse delay-1" d="M18 9c8-7 20-7 28 0" />
        </g>
      )}
      <path d="M14 26V14M50 26V14" stroke={INK} strokeWidth="3" />
      <path d="M14 26V14M50 26V14" stroke={MID} strokeWidth="1.2" />
      <rect x="8" y="26" width="48" height="16" rx="5" fill={BODY} {...line} />
      {[16, 23, 30, 37].map((x, i) => (
        <circle
          key={x}
          cx={x}
          cy="34"
          r="1.8"
          fill={on ? (i === 3 ? EN : SAFE) : MID}
          className={on && i >= 2 ? "anim-pulse" : undefined}
        />
      ))}
      <path d="M13 42v4M51 42v4" {...line} />
    </>
  ),
  phone: ({ on }) => (
    <>
      <rect x="20" y="4" width="24" height="44" rx="5" fill={INK} />
      <rect
        x="22.5"
        y="8"
        width="19"
        height="35"
        rx="2"
        fill={on ? "oklch(0.95 0.03 300)" : GLASS}
      />
      {on && (
        <g>
          <rect
            x="27"
            y="17"
            width="10"
            height="17"
            rx="2"
            fill="none"
            {...thin}
          />
          <rect x="30" y="15.5" width="4" height="1.6" rx="0.6" fill={INK} />
          <rect
            x="28.5"
            y="24"
            width="7"
            height="8.5"
            rx="1"
            fill={SAFE}
            className="anim-pulse"
          />
          <Bolt x={32} y={25.5} s={0.9} />
        </g>
      )}
      <path
        d="M32 48v6c0 3-2 4-5 4h-9"
        fill="none"
        stroke={INK}
        strokeWidth="2.5"
      />
      <rect x="8" y="54" width="10" height="8" rx="2" fill={BODY} {...line} />
    </>
  ),
  speaker: ({ on }) => (
    <>
      <Shadow w={14} />
      <rect x="17" y="4" width="30" height="54" rx="4" fill={GLASS} {...line} />
      <circle cx="32" cy="15" r="5" fill={INK} stroke={MID} strokeWidth="1.5" />
      <g className={on ? "anim-glow" : undefined}>
        <circle
          cx="32"
          cy="38"
          r="11"
          fill={INK}
          stroke={MID}
          strokeWidth="1.5"
        />
        <circle cx="32" cy="38" r="4" fill={ACC} />
      </g>
      {on && (
        <g stroke={ACC} strokeWidth="2.2" fill="none">
          <path className="anim-pulse" d="M52 30c3 5 3 11 0 16" />
          <path className="anim-pulse delay-1" d="M57 25c5 8 5 18 0 26" />
          <path className="anim-pulse" d="M12 30c-3 5-3 11 0 16" />
          <path className="anim-pulse delay-1" d="M7 25c-5 8-5 18 0 26" />
        </g>
      )}
    </>
  ),
  evcharger: ({ on }) => (
    <>
      <Shadow w={26} />
      <circle cx="14" cy="47" r="8" fill={BODY} stroke={INK} strokeWidth="3" />
      <circle cx="48" cy="47" r="8" fill={BODY} stroke={INK} strokeWidth="3" />
      <circle cx="14" cy="47" r="2" fill={INK} />
      <circle cx="48" cy="47" r="2" fill={INK} />
      <path
        d="M8 38c2-6 8-8 14-8h8l4 10h14c2-5 5-8 9-8"
        fill="none"
        stroke={INK}
        strokeWidth="2"
      />
      <path
        d="M20 30h16c3 0 5 2 6 5l2 5H22c-4 0-6-2-6-4 0-3 2-6 4-6Z"
        fill={ACC}
        {...line}
      />
      <rect x="20" y="26" width="16" height="4" rx="2" fill={INK} />
      <path d="M44 40l6-24h5" fill="none" stroke={INK} strokeWidth="2.5" />
      <rect x="23" y="33" width="12" height="4" rx="1" fill={BODY} {...thin} />
      <rect
        x="23.8"
        y="33.8"
        width={on ? 7 : 3}
        height="2.4"
        rx="0.6"
        fill={on ? SAFE : HEAT}
        className={on ? "anim-pulse" : undefined}
      />
      {on && (
        <g>
          <path
            d="M6 30c-2-4 0-10 4-12h6"
            fill="none"
            stroke={INK}
            strokeWidth="1.8"
            className="anim-flow-slow"
          />
          <Bolt x={10} y={12} s={1.3} />
        </g>
      )}
    </>
  ),
  aquarium: ({ on }) => (
    <>
      <Shadow w={24} />
      <rect
        x="6"
        y="14"
        width="52"
        height="38"
        rx="3"
        fill="oklch(0.93 0.05 220)"
        {...line}
      />
      <path d="M6 20h52" stroke="white" strokeWidth="1.5" />
      <path
        d="M12 52c0-8 3-14 1-20M18 52c0-6-2-10 1-15"
        stroke={SAFE}
        strokeWidth="2.5"
      />
      <g className="anim-bob">
        <path d="M30 34c4-5 11-5 14 0-3 5-10 5-14 0Z" fill={EN} {...thin} />
        <path d="M44 34l5-4v8Z" fill={EN} {...thin} />
        <circle cx="34" cy="33" r="1" fill={INK} />
      </g>
      {on && (
        <g fill="white" stroke={COLD} strokeWidth="1">
          <circle className="anim-rise" cx="50" cy="44" r="1.8" />
          <circle className="anim-rise delay-1" cx="52" cy="38" r="1.3" />
          <circle className="anim-rise delay-2" cx="49" cy="32" r="1.5" />
        </g>
      )}
      <rect x="4" y="52" width="56" height="5" rx="1.5" fill={MID} {...line} />
    </>
  ),
}

export function ApplianceArt({
  kind,
  on = false,
  mode = 0,
  className,
  title,
}: {
  kind: ArtKind
  on?: boolean
  mode?: number
  className?: string
  title?: string
}) {
  const uid = React.useId().replace(/:/g, "")
  const Draw = ART[kind]
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("overflow-visible", className)}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
    >
      {title && <title>{title}</title>}
      <Draw on={on} mode={mode} uid={uid} />
    </svg>
  )
}
