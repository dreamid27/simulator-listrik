import {
  LightbulbIcon,
  PencilIcon,
  PlusIcon,
  ShieldCheckIcon,
  Trash2Icon,
  WaypointsIcon,
  XIcon,
} from "lucide-react"

import { McbArt } from "~/components/art/gear-art"
import { Button } from "~/components/ui/button"
import { cableSpec } from "~/lib/sim/catalog"
import { appliance, circuitIdOf, fmt, fmtMm } from "~/lib/sim/engine"
import { useSim } from "~/lib/sim/store"
import { cn } from "~/lib/utils"
import { loadTone } from "./control-panel"
import { Term } from "./term"
import { useQuickRemove, useUi } from "./ui-store"

/**
 * Box MCB rumah — satu-satunya tempat mengelola grup MCB:
 * naik/turunkan tuas, lihat beban, sorot jalur di denah, atur, tambah, hapus.
 */
export function McbBox() {
  const { state, analysis, dispatch } = useSim()
  const {
    focusCircuitId,
    setFocusCircuit,
    setHoverCircuit,
    setMapOpen,
    openCircuit,
    editMode,
    setEditMode,
  } = useUi()
  const remove = useQuickRemove()
  const focused = state.circuits.find((c) => c.id === focusCircuitId)
  const onCircuit = (id: string | undefined) =>
    state.devices.filter(
      (d) =>
        circuitIdOf(state, d) === id &&
        state.rooms.find((r) => r.id === d.roomId)?.circuitId !== id
    )
  const focusRooms = state.rooms.filter((r) => r.circuitId === focusCircuitId)
  const focusExtra = onCircuit(focusCircuitId ?? undefined)

  return (
    <section
      aria-label="Box MCB"
      className="relative mt-2 rounded-2xl bg-white/80 p-2.5 ring-1 ring-foreground/5 backdrop-blur-sm"
    >
      <header className="flex flex-wrap items-center gap-1.5 px-0.5 pb-2">
        <h2 className="font-heading text-sm font-semibold">Box MCB</h2>
        <span className="text-[11px] text-muted-foreground">
          (<Term k="grup">grup</Term> dalam rumah)
        </span>
        {state.elcb && (
          <span
            className="inline-flex items-center gap-1 rounded-full bg-safe-soft px-2 py-0.5 text-[10.5px] font-medium text-safe-ink"
            title="ELCB/RCBO 30 mA terpasang di box MCB"
          >
            <ShieldCheckIcon className="size-3" />
            <Term k="elcb">ELCB</Term> 30 mA
          </span>
        )}
        <div className="ml-auto flex flex-wrap gap-1.5">
          <Button
            size="sm"
            variant="outline"
            onClick={() => dispatch({ type: "add-circuit" })}
          >
            <PlusIcon />
            Grup
          </Button>
          <Button size="sm" variant="outline" onClick={() => setMapOpen(true)}>
            <WaypointsIcon />
            Peta jalur
          </Button>
          <Button
            size="sm"
            variant={editMode ? "destructive" : "outline"}
            onClick={() => setEditMode(!editMode)}
            aria-pressed={editMode}
          >
            {editMode ? <XIcon /> : <Trash2Icon />}
            {editMode ? "Selesai hapus" : "Hapus"}
          </Button>
        </div>
      </header>

      {focused ? (
        <div
          className="mb-2 flex items-start gap-2 rounded-xl px-3 py-2 text-xs leading-relaxed"
          style={{
            background: `color-mix(in oklch, ${focused.color} 12%, white)`,
          }}
        >
          <p className="flex-1">
            <b>{focused.name}</b> (MCB {focused.mcbAmp} A, kabel{" "}
            {fmtMm(focused.cable)} mm², aman sampai ±{" "}
            {cableSpec(focused.cable).maxMcb} A) mengaliri{" "}
            {focused.forLights ? (
              <b>semua lampu di rumah ({focusExtra.length} titik)</b>
            ) : focusRooms.length ? (
              <b>stopkontak di {focusRooms.map((r) => r.name).join(", ")}</b>
            ) : (
              "belum ada ruangan"
            )}
            {!focused.forLights && focusExtra.length > 0 && (
              <>
                {" "}
                + jalur khusus{" "}
                <b>{focusExtra.map((d) => appliance(d).short).join(", ")}</b>
              </>
            )}
            . Kalau MCB ini turun, hanya yang disorot yang padam.
          </p>
          <button
            type="button"
            onClick={() => setFocusCircuit(null)}
            className="grid size-6 shrink-0 place-items-center rounded-md hover:bg-white/70"
            aria-label="Berhenti menyorot"
          >
            <XIcon className="size-3.5" />
          </button>
        </div>
      ) : editMode ? (
        <p className="mb-2 rounded-xl bg-danger-soft px-3 py-2 text-xs leading-relaxed">
          <b>Mode hapus.</b> Ketuk perangkat untuk melepasnya, atau ikon tempat
          sampah untuk menghapus ruangan/grup. Salah hapus? Tekan{" "}
          <b>Batalkan</b> di bawah.
        </p>
      ) : (
        <p className="mb-2 px-1 text-[11px] text-muted-foreground">
          Ketuk <b>tuas</b> untuk menaikkan/menurunkan MCB · ketuk <b>kartu</b>{" "}
          untuk menyorot ruangan yang dialirinya · ✎ untuk mengatur.
        </p>
      )}
      <ul className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,210px),1fr))] gap-2 rounded-xl bg-art-soft/70 p-2 ring-1 ring-ink/10">
        {analysis.circuits.map((cl) => {
          const c = cl.circuit
          const active = focusCircuitId === c.id
          const live = c.on && state.mainOn
          const tripped = !c.on && state.trip?.circuitId === c.id
          const cab = cableSpec(c.cable)
          const unsafe = c.mcbAmp > cab.maxMcb
          const tone = loadTone(cl.pct)
          const rooms = state.rooms.filter(
            (r) => r.circuitId === c.id || r.extraCircuitIds?.includes(c.id)
          )
          const extra = onCircuit(c.id)
          const serves = c.forLights
            ? `Semua lampu (${extra.length} titik)`
            : [
                ...rooms.map((r) => r.name),
                ...extra.map((d) => appliance(d).short),
              ].join(", ") || "Belum ada ruangan"
          return (
            <li
              key={c.id}
              data-mcb-id={c.id}
              onMouseEnter={() => setHoverCircuit(c.id)}
              onMouseLeave={() => setHoverCircuit(null)}
              className={cn(
                "relative flex items-stretch gap-2 overflow-hidden rounded-lg bg-card p-2 pl-3 shadow-xs ring-1 ring-foreground/5 transition",
                active && "shadow-md ring-2"
              )}
              style={
                active ? { ["--tw-ring-color" as string]: c.color } : undefined
              }
            >
              <span
                aria-hidden
                className="absolute inset-y-0 left-0 w-1.5"
                style={{ background: c.color }}
              />
              <button
                type="button"
                onClick={() => dispatch({ type: "toggle-circuit", id: c.id })}
                className={cn(
                  "shrink-0 self-center rounded-md transition hover:scale-105",
                  tripped && "anim-alarm"
                )}
                aria-label={`${c.on ? "Turunkan" : "Naikkan"} MCB ${c.name}`}
                title={
                  c.on
                    ? "Ketuk untuk menurunkan tuas"
                    : "Ketuk untuk menaikkan tuas"
                }
              >
                <McbArt
                  amp={c.mcbAmp}
                  on={c.on}
                  color={c.color}
                  tripped={tripped}
                  className="h-14 w-7"
                />
              </button>

              {/* area utama: ketuk untuk menyorot di denah */}
              <button
                type="button"
                aria-pressed={active}
                onClick={() => setFocusCircuit(active ? null : c.id)}
                onFocus={() => setHoverCircuit(c.id)}
                onBlur={() => setHoverCircuit(null)}
                className="min-w-0 flex-1 rounded-md text-left outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                title={
                  active
                    ? "Berhenti menyorot"
                    : "Sorot jalur ini di denah rumah"
                }
              >
                <span
                  className={cn(
                    "flex items-center gap-1 text-[13px] font-semibold",
                    editMode ? "pr-13" : "pr-6"
                  )}
                >
                  {c.forLights && (
                    <LightbulbIcon className="size-3.5 shrink-0 text-energy-deep" />
                  )}
                  <span className="truncate">{c.name}</span>
                </span>
                <span
                  className={cn(
                    "block text-[10.5px] text-muted-foreground",
                    unsafe && "font-medium text-destructive"
                  )}
                >
                  MCB {c.mcbAmp} A · kabel {fmtMm(c.cable)} mm²
                  {unsafe && " ⚠ kabel terlalu kecil"}
                </span>
                <span className="mt-1 flex items-center gap-1.5">
                  <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                    <span
                      className="block h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(cl.pct * 100, 100)}%`,
                        background: tone.color,
                      }}
                    />
                  </span>
                  <span
                    className={cn(
                      "shrink-0 text-[10.5px] tabular-nums",
                      live
                        ? "text-muted-foreground"
                        : "font-semibold text-destructive"
                    )}
                  >
                    {live ? `${fmt(cl.amp, 1)}/${c.mcbAmp} A` : "OFF"}
                  </span>
                </span>
                <span className="mt-0.5 block truncate text-[10.5px] text-muted-foreground">
                  {serves}
                </span>
              </button>

              <div className="absolute top-1.5 right-1.5 flex gap-0.5">
                <button
                  type="button"
                  onClick={() => openCircuit(c.id)}
                  className="grid size-6 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                  aria-label={`Atur ${c.name}`}
                  title="Atur MCB, kabel, dan ruangan"
                >
                  <PencilIcon className="size-3.5" />
                </button>
                {editMode && (
                  <button
                    type="button"
                    onClick={() => remove.circuit(c.id)}
                    disabled={state.circuits.length <= 1}
                    className="grid size-6 place-items-center rounded-md bg-destructive text-white disabled:opacity-40"
                    aria-label={`Hapus ${c.name}`}
                  >
                    <Trash2Icon className="size-3.5" />
                  </button>
                )}
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
