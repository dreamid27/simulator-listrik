import { EyeIcon, ZapOffIcon } from "lucide-react"

import { ApplianceArt } from "~/components/art/appliance-art"
import { CableArt, KwhMeterArt, McbArt } from "~/components/art/gear-art"
import { Button } from "~/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog"
import { cableSpec, dayaLevel } from "~/lib/sim/catalog"
import {
  appliance,
  circuitIdOf,
  fmt,
  fmtMm,
  deviceName,
} from "~/lib/sim/engine"
import { useSim } from "~/lib/sim/store"
import { cn } from "~/lib/utils"
import { useUi } from "./ui-store"

/**
 * Peta jalur listrik (diagram satu garis versi awam):
 * Meteran PLN → tiap MCB grup → kabel → ruangan & perangkat.
 */
export function CircuitMapDialog() {
  const { state, analysis, dispatch } = useSim()
  const { mapOpen, setMapOpen, setFocusCircuit, openDevice } = useUi()
  const pln = dayaLevel(state.dayaVA)

  return (
    <Dialog open={mapOpen} onOpenChange={setMapOpen}>
      <DialogContent className="max-h-[92svh] gap-0 overflow-y-auto p-0 sm:max-w-5xl">
        <DialogHeader className="border-b p-5">
          <DialogTitle className="font-heading text-lg font-semibold">
            Peta jalur listrik rumahmu
          </DialogTitle>
          <DialogDescription>
            Listrik mengalir dari atas ke bawah. Setiap warna adalah satu jalur
            MCB — kalau MCB-nya turun, semua yang ada di bawahnya ikut padam.
          </DialogDescription>
        </DialogHeader>

        <div className="p-5">
          {/* sumber */}
          <div className="flex justify-center">
            <div
              className={cn(
                "flex items-center gap-3 rounded-2xl p-3 pr-5 ring-1",
                state.mainOn
                  ? "bg-card ring-foreground/10"
                  : "bg-danger-soft ring-destructive/40"
              )}
            >
              <KwhMeterArt
                powered={state.mainOn}
                display=""
                mcbOn={state.mainOn}
                className="h-16 w-11"
              />
              <div className="leading-tight">
                <p className="text-sm font-semibold">Meteran & MCB PLN</p>
                <p className="text-xs text-muted-foreground">
                  {fmt(state.dayaVA)} VA · MCB {pln.mcb} A
                </p>
                <p
                  className={cn(
                    "text-xs font-medium",
                    state.mainOn ? "text-safe" : "text-destructive"
                  )}
                >
                  {state.mainOn
                    ? `Terpakai ${fmt(analysis.totalVA)} VA`
                    : "Turun — semua padam"}
                </p>
              </div>
            </div>
          </div>

          {/* batang utama & cabang */}
          <div aria-hidden className="mx-auto h-6 w-1 rounded-full bg-energy" />
          <div
            className="grid gap-4 border-t-4 border-energy pt-0"
            style={{
              gridTemplateColumns: `repeat(auto-fit, minmax(min(100%, 220px), 1fr))`,
            }}
          >
            {analysis.circuits.map((cl) => {
              const c = cl.circuit
              const live = c.on && state.mainOn
              const rooms = state.rooms.filter(
                (r) => r.circuitId === c.id || r.extraCircuitIds?.includes(c.id)
              )
              const extra = state.devices.filter(
                (d) =>
                  circuitIdOf(state, d) === c.id &&
                  state.rooms.find((r) => r.id === d.roomId)?.circuitId !== c.id
              )
              const cab = cableSpec(c.cable)
              return (
                <section key={c.id} className="flex flex-col items-center">
                  <div
                    aria-hidden
                    className="h-5 w-1 rounded-b-full"
                    style={{ background: live ? c.color : "var(--border)" }}
                  />
                  <div
                    className="w-full rounded-2xl bg-card ring-2"
                    style={{
                      ["--tw-ring-color" as string]: live
                        ? c.color
                        : "var(--destructive)",
                    }}
                  >
                    <header
                      className="flex items-center gap-3 rounded-t-2xl p-3"
                      style={{
                        background: `color-mix(in oklch, ${c.color} 12%, white)`,
                      }}
                    >
                      <button
                        type="button"
                        onClick={() =>
                          dispatch({ type: "toggle-circuit", id: c.id })
                        }
                        className="shrink-0 rounded-md transition hover:scale-105"
                        aria-label={`${c.on ? "Turunkan" : "Naikkan"} MCB ${c.name}`}
                      >
                        <McbArt
                          amp={c.mcbAmp}
                          on={c.on}
                          color={c.color}
                          className="h-14 w-7"
                        />
                      </button>
                      <div className="min-w-0 flex-1 leading-tight">
                        <p className="truncate text-sm font-semibold">
                          {c.name}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          MCB {c.mcbAmp} A · {fmt(cl.amp, 1)} A terpakai
                        </p>
                        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${Math.min(cl.pct * 100, 100)}%`,
                              background: c.color,
                            }}
                          />
                        </div>
                      </div>
                    </header>
                    <div
                      className={cn(
                        "flex items-center gap-2 border-y border-dashed px-3 py-1.5 text-[11px]",
                        c.mcbAmp > cab.maxMcb
                          ? "bg-danger-soft font-medium text-destructive"
                          : "text-muted-foreground"
                      )}
                    >
                      <CableArt
                        mm2={c.cable}
                        className="h-5 w-8 shrink-0"
                        hot={cl.amp > cab.maxMcb}
                      />
                      Kabel {fmtMm(c.cable)} mm² (aman ± {cab.maxMcb} A)
                      {c.mcbAmp > cab.maxMcb &&
                        ` — terlalu kecil untuk MCB ${c.mcbAmp} A!`}
                    </div>
                    {!live && (
                      <p className="flex items-center gap-1.5 bg-danger-soft px-3 py-1.5 text-[11px] font-medium text-destructive">
                        <ZapOffIcon className="size-3.5" /> Tidak ada listrik di
                        jalur ini
                      </p>
                    )}
                    <ul className="flex flex-col gap-2 p-3">
                      {rooms.map((r) => {
                        const ds = state.devices.filter(
                          (d) =>
                            d.roomId === r.id && circuitIdOf(state, d) === c.id
                        )
                        const moved = state.devices.filter(
                          (d) =>
                            d.roomId === r.id && circuitIdOf(state, d) !== c.id
                        )
                        return (
                          <li key={r.id} className="relative pl-4">
                            <span
                              aria-hidden
                              className="absolute top-0 bottom-0 left-0 w-0.5 rounded-full"
                              style={{
                                background: live ? c.color : "var(--border)",
                              }}
                            />
                            <p className="text-xs font-semibold">{r.name}</p>
                            <DeviceRow
                              ids={ds.map((d) => d.id)}
                              live={live}
                              onPick={(id) => {
                                setMapOpen(false)
                                openDevice(id)
                              }}
                            />
                            {moved.length > 0 && (
                              <p className="mt-0.5 text-[10.5px] text-muted-foreground">
                                {moved
                                  .map(
                                    (d) =>
                                      `${deviceName(d)} → ${state.circuits.find((x) => x.id === circuitIdOf(state, d))?.name}`
                                  )
                                  .join(", ")}
                              </p>
                            )}
                          </li>
                        )
                      })}
                      {extra.length > 0 && (
                        <li className="relative pl-4">
                          <span
                            aria-hidden
                            className="absolute top-0 bottom-0 left-0 w-0.5 rounded-full"
                            style={{
                              background: live ? c.color : "var(--border)",
                            }}
                          />
                          <p className="text-xs font-semibold">
                            {c.forLights
                              ? "💡 Lampu di semua ruangan"
                              : "Jalur khusus"}
                          </p>
                          <DeviceRow
                            ids={extra.map((d) => d.id)}
                            live={live}
                            showRoom
                            onPick={(id) => {
                              setMapOpen(false)
                              openDevice(id)
                            }}
                          />
                        </li>
                      )}
                      {rooms.length === 0 && extra.length === 0 && (
                        <li className="text-xs text-muted-foreground">
                          Belum mengaliri apa pun.
                        </li>
                      )}
                    </ul>
                    <div className="px-3 pb-3">
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full"
                        onClick={() => {
                          setFocusCircuit(c.id)
                          setMapOpen(false)
                        }}
                      >
                        <EyeIcon />
                        Sorot di denah rumah
                      </Button>
                    </div>
                  </div>
                </section>
              )
            })}
          </div>
          <p className="mt-5 text-center text-xs text-muted-foreground">
            Ketuk tuas MCB di peta untuk mencoba mematikan satu jalur. Pindahkan
            ruangan ke jalur lain lewat ikon ⚙ di tiap ruangan, atau pindahkan
            satu perangkat lewat detailnya.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function DeviceRow({
  ids,
  live,
  showRoom,
  onPick,
}: {
  ids: string[]
  live: boolean
  showRoom?: boolean
  onPick: (id: string) => void
}) {
  const { state, analysis } = useSim()
  if (ids.length === 0)
    return (
      <p className="text-[11px] text-muted-foreground">Tidak ada perangkat</p>
    )
  return (
    <div className="mt-1 flex flex-wrap gap-1">
      {ids.map((id) => {
        const d = state.devices.find((x) => x.id === id)!
        const a = appliance(d)
        const on = analysis.runningIds.has(id)
        const room = state.rooms.find((r) => r.id === d.roomId)
        return (
          <button
            key={id}
            type="button"
            onClick={() => onPick(id)}
            title={`${deviceName(d)}${showRoom ? ` (${room?.name})` : ""}`}
            className={cn(
              "flex items-center gap-1 rounded-full py-0.5 pr-2 pl-0.5 text-[10.5px] ring-1 transition hover:bg-muted",
              on ? "bg-energy-soft ring-energy/60" : "bg-card ring-border",
              !live && "opacity-60"
            )}
          >
            <ApplianceArt
              kind={a.art}
              on={on}
              mode={d.mode}
              className="size-5"
            />
            {deviceName(d)}
            {showRoom && (
              <span className="text-muted-foreground">· {room?.name}</span>
            )}
          </button>
        )
      })}
    </div>
  )
}
