import * as React from "react"
import {
  ChevronDownIcon,
  CircleCheckIcon,
  InfoIcon,
  OctagonAlertIcon,
  PowerIcon,
  TriangleAlertIcon,
} from "lucide-react"

import { ApplianceArt } from "~/components/art/appliance-art"
import { KwhMeterArt, Volti } from "~/components/art/gear-art"
import { Button } from "~/components/ui/button"
import { dayaLevel } from "~/lib/sim/catalog"
import {
  appliance,
  amps,
  deviceVA,
  fmt,
  type Warning,
  deviceName,
} from "~/lib/sim/engine"
import { useSim } from "~/lib/sim/store"
import { cn } from "~/lib/utils"
import { Term } from "./term"
import { useUi } from "./ui-store"

export function Panel({
  title,
  action,
  children,
  className,
  id,
}: {
  title: React.ReactNode
  action?: React.ReactNode
  children: React.ReactNode
  className?: string
  id?: string
}) {
  return (
    <section
      id={id}
      className={cn(
        "rounded-2xl bg-card p-4 ring-1 ring-foreground/8",
        className
      )}
    >
      <header className="mb-3 flex items-center gap-2">
        <h2 className="font-heading text-[15px] font-semibold">{title}</h2>
        <div className="ml-auto">{action}</div>
      </header>
      {children}
    </section>
  )
}

export function loadTone(pct: number) {
  if (pct > 1)
    return {
      color: "var(--destructive)",
      label: "Berlebih",
      cls: "text-destructive",
    }
  if (pct >= 0.8)
    return { color: "var(--warn)", label: "Hampir penuh", cls: "text-warn" }
  if (pct >= 0.5)
    return {
      color: "var(--energy-deep)",
      label: "Sedang",
      cls: "text-energy-deep",
    }
  return { color: "var(--safe)", label: "Longgar", cls: "text-safe" }
}

/** Setengah lingkaran pengukur beban. */
export function LoadGauge({
  pct,
  className,
}: {
  pct: number
  className?: string
}) {
  const p = Math.min(Math.max(pct, 0), 1.2)
  const angle = -90 + (p / 1.2) * 180
  const arc = (from: number, to: number) => {
    const a0 = Math.PI * (1 - from / 1.2)
    const a1 = Math.PI * (1 - to / 1.2)
    const r = 40
    const x0 = 50 + r * Math.cos(a0)
    const y0 = 50 - r * Math.sin(a0)
    const x1 = 50 + r * Math.cos(a1)
    const y1 = 50 - r * Math.sin(a1)
    return `M${x0} ${y0} A${r} ${r} 0 0 1 ${x1} ${y1}`
  }
  return (
    <svg viewBox="0 0 100 58" className={className} aria-hidden>
      <path
        d={arc(0, 0.8)}
        stroke="var(--safe)"
        strokeWidth="9"
        fill="none"
        opacity="0.9"
      />
      <path d={arc(0.8, 1)} stroke="var(--warn)" strokeWidth="9" fill="none" />
      <path
        d={arc(1, 1.2)}
        stroke="var(--destructive)"
        strokeWidth="9"
        fill="none"
      />
      <path
        d={arc(0, 1.2)}
        stroke="var(--ink)"
        strokeOpacity="0.08"
        strokeWidth="13"
        fill="none"
      />
      <g
        style={{
          transform: `rotate(${angle}deg)`,
          transformOrigin: "50px 50px",
          transition: "transform 0.6s cubic-bezier(.3,1.3,.5,1)",
        }}
      >
        <path d="M50 50 L48 48 L50 16 L52 48 Z" fill="var(--ink)" />
      </g>
      <circle cx="50" cy="50" r="5" fill="var(--ink)" />
      <circle cx="50" cy="50" r="2" fill="var(--energy)" />
    </svg>
  )
}

export function MeterPanel() {
  const { state, analysis, dispatch } = useSim()
  const { setSettingsOpen } = useUi()
  const lvl = dayaLevel(state.dayaVA)
  const tone = loadTone(analysis.pct)
  const remaining = Math.max(state.dayaVA - analysis.totalVA, 0)

  return (
    <Panel
      title="Meteran & Daya PLN"
      action={
        <Button
          variant="outline"
          size="sm"
          onClick={() => setSettingsOpen(true)}
        >
          {fmt(state.dayaVA)} VA
          <ChevronDownIcon />
        </Button>
      }
    >
      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={() => dispatch({ type: "toggle-main" })}
          className={cn(
            "shrink-0 rounded-2xl transition hover:scale-[1.03]",
            !state.mainOn && "anim-alarm"
          )}
          aria-label={state.mainOn ? "Turunkan MCB PLN" : "Naikkan MCB PLN"}
        >
          <KwhMeterArt
            powered={state.mainOn}
            display={`${fmt(analysis.totalW)}W`}
            sub={`${fmt(amps(analysis.totalVA), 1)} A`}
            mcbOn={state.mainOn}
            alarm={analysis.pct >= 0.8}
            className="h-36 w-24"
          />
        </button>
        <div className="min-w-0 flex-1">
          <LoadGauge
            pct={state.mainOn ? analysis.pct : 0}
            className="mx-auto w-full max-w-44"
          />
          <div className="-mt-1 text-center">
            <p className="text-2xl font-semibold tracking-tight tabular-nums">
              {fmt(analysis.totalVA)}
              <span className="text-sm font-normal text-muted-foreground">
                {" "}
                / {fmt(state.dayaVA)} VA
              </span>
            </p>
            <p
              className={cn(
                "text-xs font-medium",
                state.mainOn ? tone.cls : "text-destructive"
              )}
            >
              {state.mainOn
                ? `${Math.round(analysis.pct * 100)}% terpakai · ${tone.label}`
                : "Listrik padam"}
            </p>
          </div>
        </div>
      </div>
      <dl className="mt-3 grid grid-cols-3 gap-1.5 text-center">
        <Stat
          label={<Term k="watt">Tenaga</Term>}
          value={`${fmt(analysis.totalW)} W`}
        />
        <Stat
          label={<Term k="ampere">Arus</Term>}
          value={`${fmt(amps(analysis.totalVA), 1)} A`}
        />
        <Stat label="Sisa daya" value={`${fmt(remaining)} VA`} />
      </dl>
      {state.mainOn ? (
        <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
          Daya {fmt(state.dayaVA)} <Term k="va">VA</Term> artinya{" "}
          <Term k="mcbpln">MCB PLN</Term> {lvl.mcb} A. Ketuk meteran untuk
          mematikan listrik seluruh rumah.
        </p>
      ) : (
        <Button
          className="mt-3 h-10 w-full text-sm"
          onClick={() => dispatch({ type: "toggle-main" })}
        >
          <PowerIcon />
          Naikkan MCB PLN
        </Button>
      )}
    </Panel>
  )
}

function Stat({ label, value }: { label: React.ReactNode; value: string }) {
  return (
    <div className="rounded-xl bg-muted/60 px-1.5 py-2">
      <dt className="text-[11px] text-muted-foreground">{label}</dt>
      <dd className="text-sm font-semibold tabular-nums">{value}</dd>
    </div>
  )
}

export function TopConsumers() {
  const { state, analysis } = useSim()
  const { openDevice } = useUi()
  const running = state.devices
    .filter((d) => analysis.runningIds.has(d.id))
    .map((d) => ({ d, va: deviceVA(d) }))
    .sort((a, b) => b.va - a.va)
  const top = running.slice(0, 5)
  const max = Math.max(state.dayaVA, 1)
  return (
    <Panel title="Siapa yang paling makan daya?">
      {top.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Belum ada perangkat yang menyala.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {top.map(({ d, va }) => {
            const a = appliance(d)
            const room = state.rooms.find((r) => r.id === d.roomId)
            return (
              <li key={d.id}>
                <button
                  type="button"
                  onClick={() => openDevice(d.id)}
                  className="flex w-full items-center gap-2.5 rounded-lg text-left hover:bg-muted/60"
                >
                  <ApplianceArt
                    kind={a.art}
                    on
                    mode={d.mode}
                    className="size-8 shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-2 text-xs">
                      <span className="truncate font-medium">
                        {deviceName(d)}
                      </span>
                      <span className="truncate text-muted-foreground">
                        {room?.name}
                      </span>
                      <span className="ml-auto shrink-0 font-semibold tabular-nums">
                        {fmt(va)} VA
                      </span>
                    </div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary transition-all duration-500"
                        style={{ width: `${Math.min((va / max) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                </button>
              </li>
            )
          })}
          {running.length > 5 && (
            <li className="text-xs text-muted-foreground">
              +{running.length - 5} perangkat lain yang lebih kecil
            </li>
          )}
        </ul>
      )}
    </Panel>
  )
}

const LEVEL = {
  danger: {
    icon: OctagonAlertIcon,
    cls: "text-destructive",
    bg: "bg-danger-soft",
    label: "Bahaya",
  },
  caution: {
    icon: TriangleAlertIcon,
    cls: "text-warn",
    bg: "bg-warn-soft",
    label: "Perhatian",
  },
  info: {
    icon: InfoIcon,
    cls: "text-primary",
    bg: "bg-art-soft/60",
    label: "Info",
  },
} as const

export function SafetyPanel() {
  const { analysis } = useSim()
  const w = analysis.warnings
  const danger = w.filter((x) => x.level === "danger").length
  const caution = w.filter((x) => x.level === "caution").length
  return (
    <Panel
      id="cek-keamanan"
      title="Cek Keamanan"
      action={
        w.length > 0 && (
          <span className="flex gap-1 text-[11px] font-medium">
            {danger > 0 && (
              <span className="rounded-full bg-danger-soft px-2 py-0.5 text-destructive">
                {danger} bahaya
              </span>
            )}
            {caution > 0 && (
              <span className="rounded-full bg-warn-soft px-2 py-0.5 text-warn">
                {caution} perhatian
              </span>
            )}
          </span>
        )
      }
    >
      {w.length === 0 ? (
        <div className="flex items-center gap-3 rounded-xl bg-safe-soft p-3">
          <Volti mood="cheer" className="h-14 w-12 shrink-0" />
          <div>
            <p className="flex items-center gap-1.5 text-sm font-semibold text-safe">
              <CircleCheckIcon className="size-4" /> Instalasi aman
            </p>
            <p className="text-xs text-muted-foreground">
              Kabel, MCB, arde, dan beban dalam batas wajar.
            </p>
          </div>
        </div>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {w.map((x) => (
            <WarningItem key={x.id} w={x} />
          ))}
        </ul>
      )}
    </Panel>
  )
}

function WarningItem({ w }: { w: Warning }) {
  const [open, setOpen] = React.useState(
    w.level === "danger" && w.id.startsWith("hot")
  )
  const L = LEVEL[w.level]
  return (
    <li className={cn("rounded-xl", L.bg)}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-start gap-2 p-2.5 text-left"
      >
        <L.icon className={cn("mt-0.5 size-4 shrink-0", L.cls)} />
        <span className="flex-1 text-[13px] leading-snug font-medium">
          {w.title}
        </span>
        <ChevronDownIcon
          className={cn(
            "mt-0.5 size-4 shrink-0 text-muted-foreground transition",
            open && "rotate-180"
          )}
        />
      </button>
      {open && (
        <div className="space-y-2 px-2.5 pb-3 pl-8.5 text-xs leading-relaxed">
          <p className="text-foreground/80">
            <span className="font-semibold">Kenapa? </span>
            {w.detail}
          </p>
          <p className="text-foreground/80">
            <span className="font-semibold">Solusinya: </span>
            {w.fix}
          </p>
        </div>
      )}
    </li>
  )
}

const TONE_DOT = {
  info: "bg-muted-foreground/50",
  on: "bg-energy",
  off: "bg-foreground/25",
  warn: "bg-warn",
  danger: "bg-destructive",
  ok: "bg-safe",
} as const

export function EventLog() {
  const { state } = useSim()
  const [all, setAll] = React.useState(false)
  const items = all ? state.log : state.log.slice(0, 6)
  return (
    <Panel title="Riwayat kejadian">
      <ol className="relative flex flex-col gap-2 before:absolute before:top-1 before:bottom-1 before:left-[3px] before:w-px before:bg-border">
        {items.map((e) => (
          <li key={e.id} className="relative flex gap-2.5 pl-0 text-xs">
            <span
              className={cn(
                "relative mt-1 size-[7px] shrink-0 rounded-full ring-2 ring-card",
                TONE_DOT[e.tone]
              )}
            />
            <span
              className={cn(
                "flex-1 leading-snug",
                e.tone === "danger" && "font-medium text-destructive"
              )}
            >
              {e.text}
            </span>
            <time
              className="shrink-0 text-[10px] text-muted-foreground tabular-nums"
              suppressHydrationWarning
            >
              {new Date(e.time).toLocaleTimeString("id-ID", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </time>
          </li>
        ))}
      </ol>
      {state.log.length > 6 && (
        <Button
          variant="ghost"
          size="sm"
          className="mt-2 w-full"
          onClick={() => setAll((v) => !v)}
        >
          {all
            ? "Tampilkan lebih sedikit"
            : `Lihat semua (${state.log.length})`}
        </Button>
      )}
    </Panel>
  )
}
