import * as React from "react"

import { useSim } from "~/lib/sim/store"
import { useActiveCircuit } from "./ui-store"

interface Wire {
  circuitId: string
  color: string
  live: boolean
  d: string
  end: { x: number; y: number }
}

/** Jarak antar-lajur kabel di plafon dan di dalam dinding (px). */
const LANE_GAP = 7
const RISER_GAP = 3.4

/**
 * Kabel dari tiap MCB di box ke kelompok perangkatnya di tiap ruangan.
 *
 * Rutenya dibuat supaya kabel tidak saling menumpuk:
 * - tiap grup punya lajur mendatar sendiri di plafon (atap),
 * - tiap grup punya "riser" (jalur turun) sendiri di dalam dinding kiri tiap kolom,
 * - kabel masuk ke ruangan tepat di kelompok perangkat MCB tersebut.
 */
export function CircuitWires({
  containerRef,
}: {
  containerRef: React.RefObject<HTMLDivElement | null>
}) {
  const { state } = useSim()
  const active = useActiveCircuit()
  const [wires, setWires] = React.useState<Wire[]>([])
  const [size, setSize] = React.useState({ w: 0, h: 0 })

  const measure = React.useCallback(() => {
    const root = containerRef.current
    if (!root) return
    const box = root.getBoundingClientRect()
    const rel = (el: Element) => {
      const r = el.getBoundingClientRect()
      return {
        x: r.left - box.left,
        y: r.top - box.top,
        w: r.width,
        h: r.height,
      }
    }
    const grid = root.querySelector("[data-room-grid]")
    if (!grid) return
    const g = rel(grid)
    const roofEl = root.querySelector("[data-roof]")
    const roof = roofEl ? rel(roofEl) : { x: 0, y: g.y - 40, w: 0, h: 40 }
    const C = state.circuits.length
    const laneBase = roof.y + roof.h - 8

    const out: Wire[] = []
    state.circuits.forEach((c, i) => {
      const card = root.querySelector(`[data-mcb-id="${c.id}"]`)
      if (!card) return
      const k = rel(card)
      const offset = (i - (C - 1) / 2) * RISER_GAP
      const lane = Math.max(laneBase - i * LANE_GAP, roof.y + 8)
      // keluar dari strip warna kiri kartu MCB, turun lewat celah antar kartu
      const sx = k.x + 3
      const sy = k.y + k.h / 2
      const cx = k.x - 4 + offset / 2

      root.querySelectorAll(`[data-group$=":${c.id}"]`).forEach((groupEl) => {
        const roomEl = groupEl.closest("[data-room-id]")
        if (!roomEl) return
        const r = rel(roomEl)
        const grp = rel(groupEl)
        const head = groupEl.querySelector("[data-group-head]")
        const hy = head ? rel(head).y + rel(head).h / 2 : grp.y + 10
        // riser di dalam dinding kiri kolom ruangan ini
        const rx = r.x - 8 + offset
        const ex = grp.x + 1.5
        const d = `M${sx} ${sy} H${cx} V${lane} H${rx} V${hy} H${ex}`
        out.push({
          circuitId: c.id,
          color: c.color,
          live: c.on && state.mainOn,
          d,
          end: { x: ex, y: hy },
        })
      })
    })
    setWires(out)
    setSize({ w: box.width, h: box.height })
  }, [containerRef, state])

  React.useLayoutEffect(() => {
    measure()
  }, [measure])

  React.useEffect(() => {
    const root = containerRef.current
    if (!root) return
    let raf = 0
    const ro = new ResizeObserver(() => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(measure)
    })
    ro.observe(root)
    root
      .querySelectorAll(
        "[data-room-grid], [data-room-id], section[aria-label='Box MCB']"
      )
      .forEach((el) => ro.observe(el))
    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
    }
  }, [containerRef, measure])

  if (!size.w) return null
  // kabel yang disorot digambar paling akhir (paling atas)
  const ordered = [...wires].sort(
    (a, b) => Number(a.circuitId === active) - Number(b.circuitId === active)
  )

  return (
    <svg
      aria-hidden
      className="pointer-events-none absolute inset-0 z-20 overflow-visible"
      width={size.w}
      height={size.h}
      viewBox={`0 0 ${size.w} ${size.h}`}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {ordered.map((w, i) => {
        const focused = active === w.circuitId
        const faded = !!active && !focused
        const width = focused ? 3 : 2
        const color = w.live ? w.color : "oklch(0.75 0.01 290)"
        return (
          <g
            key={`${w.circuitId}-${i}`}
            style={{ opacity: faded ? 0.12 : 1, transition: "opacity 0.3s" }}
          >
            <path
              d={w.d}
              stroke="white"
              strokeOpacity="0.55"
              strokeWidth={width + 1.4}
            />
            <path
              d={w.d}
              stroke={color}
              strokeWidth={width}
              strokeDasharray={w.live ? undefined : "4 5"}
            />
            {w.live && (
              <path
                d={w.d}
                stroke="white"
                strokeOpacity="0.9"
                strokeWidth={width * 0.5}
                strokeDasharray="1.5 11"
                className="anim-flow-slow"
              />
            )}
            <circle
              cx={w.end.x}
              cy={w.end.y}
              r={focused ? 4 : 3.2}
              fill={color}
              stroke="white"
              strokeWidth="1.5"
            />
          </g>
        )
      })}
    </svg>
  )
}
