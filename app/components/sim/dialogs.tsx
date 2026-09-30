import * as React from "react"
import {
  ArrowRightIcon,
  FolderOpenIcon,
  LightbulbIcon,
  CheckIcon,
  MinusIcon,
  PencilIcon,
  PlusIcon,
  PowerIcon,
  SearchIcon,
  Trash2Icon,
  ZapIcon,
} from "lucide-react"

import { ApplianceArt } from "~/components/art/appliance-art"
import {
  CableArt,
  ElcbArt,
  GroundArt,
  McbArt,
  RoomBackdrop,
  Volti,
} from "~/components/art/gear-art"
import { Button } from "~/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog"
import { Input } from "~/components/ui/input"
import { Switch } from "~/components/ui/switch"
import {
  APPLIANCES,
  CABLES,
  CATEGORIES,
  DAYA_LEVELS,
  MCB_OPTIONS,
  ROOM_KINDS,
  VOLT,
  cableSpec,
  dayaLevel,
  tarifPerKwh,
} from "~/lib/sim/catalog"
import {
  appliance,
  circuitIdOf,
  fmt,
  fmtMm,
  deviceName,
} from "~/lib/sim/engine"
import { PRESETS } from "~/lib/sim/presets"
import { useSim } from "~/lib/sim/store"
import type { Category, Circuit, Room, RoomKind } from "~/lib/sim/types"
import type { SettingsPatch } from "~/lib/sim/store"
import { cn } from "~/lib/utils"
import { ChoiceChip } from "./device-sheet"
import { CustomApplianceForm } from "./custom-appliance-form"
import { CircuitTag } from "./house-view"
import { Term } from "./term"
import { useQuickRemove, useUi } from "./ui-store"

// ————————————————————————————————— Trip
export function TripDialog() {
  const { state, dispatch } = useSim()
  const t = state.trip
  const [last, setLast] = React.useState(t)
  React.useEffect(() => {
    if (t) setLast(t)
  }, [t])
  const topRef = React.useRef<HTMLDivElement>(null)
  const trip = t ?? last
  if (!trip) return null

  const circuit = state.circuits.find((c) => c.id === trip.circuitId)
  const isMain = trip.scope === "main"
  const trigger = state.devices.find((d) => d.id === trip.triggerDeviceId)
  const triggerA = trigger && appliance(trigger)
  const stillOn = trip.contributors
    .map((c) => ({ ...c, d: state.devices.find((x) => x.id === c.deviceId) }))
    .filter((c) => c.d)
  const heavyOn = stillOn.filter((c) => c.d!.on).slice(0, 3)
  const nextLevel = DAYA_LEVELS.find((l) => l.va >= trip.loadVA * 1.1)
  const over = trip.loadVA - trip.limitVA
  const maxBar = Math.max(trip.loadVA, trip.limitVA) * 1.05
  const cableMax = circuit ? cableSpec(circuit.cable).maxMcb : 0
  const betterMcb = circuit
    ? MCB_OPTIONS.filter(
        (m) => m > circuit.mcbAmp && m <= cableMax && m * VOLT >= trip.loadVA
      )[0]
    : undefined
  const reset = () =>
    dispatch(
      isMain
        ? { type: "toggle-main" }
        : { type: "toggle-circuit", id: trip.circuitId! }
    )
  const where = isMain ? "MCB PLN" : `MCB ${circuit?.name}`

  return (
    <Dialog
      open={!!t}
      onOpenChange={(o) => !o && dispatch({ type: "dismiss-trip" })}
    >
      <DialogContent
        className="max-h-[92svh] gap-0 overflow-y-auto p-0 sm:max-w-lg [&>[data-slot=dialog-close]]:text-white [&>[data-slot=dialog-close]]:hover:bg-white/15"
        initialFocus={topRef}
      >
        <div
          ref={topRef}
          tabIndex={-1}
          className="relative flex items-end gap-4 overflow-hidden bg-linear-to-b from-night to-[oklch(0.35_0.08_290)] px-5 pt-6 pb-4 text-white outline-none"
        >
          <Volti mood="shock" className="anim-pop h-24 w-20 shrink-0" />
          <div className="pb-1">
            <p className="text-xs font-medium tracking-wide text-energy uppercase">
              {trip.retrip ? "Turun lagi!" : "Njeglek!"}
            </p>
            <DialogTitle className="mt-1 font-heading text-xl leading-tight font-semibold text-white">
              {where} turun,{" "}
              {isMain ? "seluruh rumah padam" : `${circuit?.name} padam`}
            </DialogTitle>
          </div>
          <McbArt
            amp={isMain ? dayaLevel(state.dayaVA).mcb : (circuit?.mcbAmp ?? 0)}
            on={false}
            tripped
            color={circuit?.color}
            className="ml-auto h-20 w-10 shrink-0"
          />
        </div>

        <div className="flex flex-col gap-4 p-5">
          <DialogDescription className="text-[14px] leading-relaxed text-foreground">
            {trip.reason === "surge" ? (
              trigger && triggerA ? (
                <>
                  Saat <b>{triggerA.name}</b> mulai menyala, motornya menarik{" "}
                  <Term k="surge">lonjakan arus</Term> ±{" "}
                  {fmt(triggerA.surge, 1)}× lipat sesaat. Totalnya sempat
                  mencapai <b>{fmt(trip.loadVA)} VA</b>, jauh di atas batas{" "}
                  {fmt(trip.limitVA)} VA — MCB langsung memutus listrik.
                </>
              ) : (
                <>
                  Saat MCB dinaikkan, semua perangkat bermotor (kulkas, pompa,
                  AC…) mulai berputar <b>bersamaan</b>. Lonjakan arusnya
                  menumpuk sampai <b>{fmt(trip.loadVA)} VA</b>, jauh di atas
                  batas {fmt(trip.limitVA)} VA.
                </>
              )
            ) : (
              <>
                Perangkat yang menyala butuh <b>{fmt(trip.loadVA)} VA</b>,
                padahal{" "}
                {isMain
                  ? "daya rumahmu"
                  : `MCB ${circuit?.mcbAmp} A hanya kuat`}{" "}
                <b>{fmt(trip.limitVA)} VA</b>
                {!isMain && (
                  <>
                    {" "}
                    ({circuit?.mcbAmp} A × {VOLT} V)
                  </>
                )}
                . Kelebihan {fmt(over)} VA
                {triggerA && (
                  <>
                    {" "}
                    muncul saat <b>{triggerA.name}</b> dinyalakan
                  </>
                )}
                . MCB turun untuk melindungi kabel dari panas berlebih.
              </>
            )}
          </DialogDescription>

          {/* bar beban vs batas */}
          <div>
            <div className="relative h-7 overflow-hidden rounded-lg bg-muted">
              <div className="absolute inset-0 flex">
                {stillOn.slice(0, 6).map((c, i) => (
                  <div
                    key={c.deviceId}
                    className="h-full border-r-2 border-card"
                    style={{
                      width: `${(c.va / maxBar) * 100}%`,
                      minWidth: 3,
                      background: `color-mix(in oklch, var(--primary) ${90 - i * 12}%, white)`,
                    }}
                    title={deviceName(c.d!)}
                  />
                ))}
              </div>
              <div
                className="absolute inset-y-0 border-l-2 border-dashed border-destructive"
                style={{ left: `${(trip.limitVA / maxBar) * 100}%` }}
              />
            </div>
            <div className="relative mt-1 h-4 text-[11px] text-muted-foreground">
              <span
                className="absolute -translate-x-1/2 font-medium whitespace-nowrap text-destructive"
                style={{
                  left: `${Math.min((trip.limitVA / maxBar) * 100, 88)}%`,
                }}
              >
                batas {fmt(trip.limitVA)} VA
              </span>
            </div>
          </div>

          <ul className="flex flex-col gap-1.5">
            {stillOn.slice(0, 4).map((c) => {
              const a = appliance(c.d!)
              return (
                <li
                  key={c.deviceId}
                  className="flex items-center gap-2.5 text-sm"
                >
                  <ApplianceArt
                    kind={a.art}
                    on={false}
                    mode={c.d!.mode}
                    className="size-7 shrink-0"
                  />
                  <span className="flex-1 truncate">
                    {c.d!.label ? deviceName(c.d!) : a.name}
                    {c.deviceId === trip.triggerDeviceId && (
                      <span className="ml-1.5 rounded-full bg-danger-soft px-1.5 py-0.5 text-[10px] font-semibold text-destructive">
                        pemicu
                      </span>
                    )}
                  </span>
                  <span className="text-muted-foreground tabular-nums">
                    {fmt(c.va)} VA
                  </span>
                </li>
              )
            })}
          </ul>

          <div className="rounded-2xl bg-art-soft/60 p-4">
            <p className="mb-2.5 font-heading text-sm font-semibold">
              Cara menyalakan lagi
            </p>
            <ol className="flex flex-col gap-3 text-[13px]">
              <li className="flex gap-2.5">
                <Step n={1} />
                <div className="flex-1">
                  <p>
                    {trip.reason === "surge" && !trigger
                      ? "Matikan dulu perangkat bermotor"
                      : "Matikan perangkat berdaya besar"}{" "}
                    supaya beban turun.
                  </p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {heavyOn.map((c) => (
                      <Button
                        key={c.deviceId}
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          dispatch({ type: "toggle-device", id: c.deviceId })
                        }
                      >
                        <PowerIcon />
                        Matikan {deviceName(c.d!)}
                      </Button>
                    ))}
                    {heavyOn.length === 0 && (
                      <span className="flex items-center gap-1 text-xs font-medium text-safe-ink">
                        <CheckIcon className="size-3.5" /> Sudah dimatikan
                      </span>
                    )}
                  </div>
                </div>
              </li>
              <li className="flex gap-2.5">
                <Step n={2} />
                <div className="flex-1">
                  <p>Naikkan kembali tuas {where}.</p>
                  <Button size="sm" className="mt-1.5" onClick={reset}>
                    <ZapIcon />
                    Naikkan {where}
                  </Button>
                </div>
              </li>
              <li className="flex gap-2.5">
                <Step n={3} />
                <p className="flex-1">
                  Nyalakan perangkat <b>satu per satu</b>, jangan bersamaan —
                  terutama yang bermotor.
                </p>
              </li>
            </ol>
          </div>

          <div className="text-[13px] leading-relaxed text-muted-foreground">
            <p className="mb-1.5 font-semibold text-foreground">
              Kalau sering terjadi:
            </p>
            <ul className="list-disc space-y-1 pl-5">
              {isMain && nextLevel && nextLevel.va > state.dayaVA && (
                <li>
                  Pertimbangkan tambah daya ke{" "}
                  <b className="text-foreground">{fmt(nextLevel.va)} VA</b>{" "}
                  (bisa diajukan lewat aplikasi PLN Mobile).{" "}
                  <button
                    type="button"
                    className="font-medium text-primary underline underline-offset-2"
                    onClick={() =>
                      dispatch({
                        type: "settings",
                        patch: { dayaVA: nextLevel.va },
                      })
                    }
                  >
                    Coba di simulator
                  </button>
                </li>
              )}
              {!isMain && betterMcb && (
                <li>
                  Kabelnya ({fmtMm(circuit!.cable)} mm²) masih kuat untuk MCB{" "}
                  {betterMcb} A.{" "}
                  <button
                    type="button"
                    className="font-medium text-primary underline underline-offset-2"
                    onClick={() =>
                      dispatch({
                        type: "update-circuit",
                        id: circuit!.id,
                        patch: { mcbAmp: betterMcb },
                      })
                    }
                  >
                    Ganti MCB ke {betterMcb} A
                  </button>
                </li>
              )}
              {!isMain && (
                <li>
                  Pindahkan sebagian perangkat ke grup MCB lain agar bebannya
                  terbagi.
                </li>
              )}
              <li>
                Gunakan perangkat berdaya besar secara bergantian, misalnya
                jangan setrika sambil memasak nasi.
              </li>
              {!isMain && !betterMcb && (
                <li>
                  Jangan asal memperbesar MCB tanpa mengganti kabel — kabel bisa
                  terbakar.
                </li>
              )}
            </ul>
          </div>
        </div>
        <DialogFooter className="m-0 rounded-none">
          <Button
            variant="outline"
            onClick={() => dispatch({ type: "dismiss-trip" })}
          >
            Tutup, biarkan padam
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function Step({ n }: { n: number }) {
  return (
    <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
      {n}
    </span>
  )
}

// ————————————————————————————————— Catalog
export function CatalogDialog() {
  const { state, analysis, dispatch } = useSim()
  const { catalogRoomId, catalogCircuitId, openCatalog } = useUi()
  const room = state.rooms.find((r) => r.id === catalogRoomId)
  const [q, setQ] = React.useState("")
  const [target, setTarget] = React.useState<string | null>(null)
  const [view, setView] = React.useState<
    { kind: "list" } | { kind: "custom"; editId?: string; prefill?: string }
  >({ kind: "list" })
  const [cat, setCat] = React.useState<Category | "semua" | "cocok">("cocok")
  const headRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (catalogRoomId) {
      setQ("")
      setCat("cocok")
      setTarget(catalogCircuitId)
      setView({ kind: "list" })
    }
  }, [catalogRoomId, catalogCircuitId])

  // MCB yang sudah dipakai di ruangan ini tampil lebih dulu
  const roomCircuitIds = room
    ? state.circuits
        .filter(
          (c) =>
            c.id === room.circuitId ||
            room.extraCircuitIds?.includes(c.id) ||
            state.devices.some(
              (d) => d.roomId === room.id && circuitIdOf(state, d) === c.id
            )
        )
        .map((c) => c.id)
    : []
  const targetId = target ?? room?.circuitId ?? state.circuits[0]?.id
  const targetCircuit = state.circuits.find((c) => c.id === targetId)
  const targetLoad = analysis.circuits.find((x) => x.circuit.id === targetId)
  const targetLeftA = targetCircuit
    ? targetCircuit.mcbAmp - (targetLoad?.amp ?? 0)
    : 0

  const customList = (state.customAppliances ?? []).map((a) => ({
    ...a,
    custom: true as const,
  }))
  const list = [...customList, ...APPLIANCES].filter((a) => {
    if (q)
      return (
        a.name.toLowerCase().includes(q.toLowerCase()) ||
        a.short.toLowerCase().includes(q.toLowerCase())
      )
    if (cat === "cocok") return room ? a.rooms.includes(room.kind) : true
    if (cat === "semua") return true
    return a.category === cat
  })
  const remaining = state.dayaVA - analysis.totalVA

  return (
    <Dialog open={!!room} onOpenChange={(o) => !o && openCatalog(null)}>
      <DialogContent
        className="flex max-h-[90svh] flex-col gap-0 overflow-hidden p-0 sm:max-w-3xl"
        initialFocus={headRef}
      >
        <DialogHeader
          ref={headRef}
          tabIndex={-1}
          className="border-b p-5 pb-4 outline-none"
        >
          <DialogTitle className="font-heading text-lg font-semibold">
            Pasang perangkat di {room?.name}
          </DialogTitle>
          <DialogDescription>
            Pilih perangkat yang ada di rumahmu. Sisa daya rumah{" "}
            <b className="text-foreground">{fmt(Math.max(remaining, 0))} VA</b>.
          </DialogDescription>
          <div className="mt-2 rounded-xl bg-art-soft/60 p-2.5">
            <p className="mb-1.5 text-xs font-medium">Pasang lewat MCB:</p>
            <div className="flex flex-wrap gap-1.5">
              {[
                ...roomCircuitIds,
                ...state.circuits
                  .map((c) => c.id)
                  .filter((id) => !roomCircuitIds.includes(id)),
              ].map((id) => {
                const c = state.circuits.find((x) => x.id === id)!
                const inRoom = roomCircuitIds.includes(id)
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setTarget(id)}
                    aria-pressed={targetId === id}
                    className={cn(
                      "rounded-full ring-offset-1 transition",
                      targetId === id
                        ? "ring-2 ring-primary"
                        : "hover:brightness-95",
                      !inRoom && targetId !== id && "opacity-60"
                    )}
                    title={
                      inRoom
                        ? "Sudah ada di ruangan ini"
                        : "Belum dipakai di ruangan ini"
                    }
                  >
                    <CircuitTag circuit={c} className="py-1 pr-2.5" />
                  </button>
                )
              })}
            </div>
            {targetCircuit && (
              <p className="mt-1.5 text-[11px] text-muted-foreground">
                Sisa kapasitas {targetCircuit.name}:{" "}
                <b
                  className={cn(
                    targetLeftA < 2 ? "text-warn-ink" : "text-foreground"
                  )}
                >
                  {fmt(Math.max(targetLeftA, 0), 1)} A
                </b>{" "}
                dari {targetCircuit.mcbAmp} A (±{" "}
                {fmt(Math.max(targetLeftA, 0) * VOLT)} VA).
                {targetCircuit.forLights &&
                  " Ini jalur khusus lampu — alat colok sebaiknya lewat MCB stopkontak."}
              </p>
            )}
          </div>
          {view.kind === "list" && (
            <>
              <div className="relative mt-2">
                <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Cari: kulkas, AC, pompa…"
                  className="h-10 pl-9"
                />
              </div>
              {!q && (
                <div className="-mx-5 mt-2 flex [scrollbar-width:none] gap-1.5 overflow-x-auto px-5 pb-1">
                  <ChoiceChip
                    active={cat === "cocok"}
                    onClick={() => setCat("cocok")}
                    className="shrink-0"
                  >
                    Cocok untuk{" "}
                    {room
                      ? ROOM_KINDS.find((k) => k.kind === room.kind)?.label
                      : ""}
                  </ChoiceChip>
                  {CATEGORIES.map((c) => (
                    <ChoiceChip
                      key={c.id}
                      active={cat === c.id}
                      onClick={() => setCat(c.id)}
                      className="shrink-0"
                    >
                      {c.label}
                    </ChoiceChip>
                  ))}
                  <ChoiceChip
                    active={cat === "semua"}
                    onClick={() => setCat("semua")}
                    className="shrink-0"
                  >
                    Semua
                  </ChoiceChip>
                </div>
              )}
            </>
          )}
        </DialogHeader>
        {view.kind === "custom" ? (
          <CustomApplianceForm
            key={view.editId ?? "new"}
            editing={customList.find((x) => x.id === view.editId)}
            prefillName={view.prefill}
            usedCount={
              state.devices.filter((d) => d.applianceId === view.editId).length
            }
            targetName={room?.name}
            onCancel={() => setView({ kind: "list" })}
            onSave={(ap, addNow) => {
              dispatch({ type: "save-custom-appliance", appliance: ap })
              if (addNow && room)
                dispatch({
                  type: "add-device",
                  roomId: room.id,
                  applianceId: ap.id,
                  circuitId: targetId,
                })
              setView({ kind: "list" })
              setQ("")
            }}
            onDelete={(id) => {
              dispatch({ type: "remove-custom-appliance", id })
              setView({ kind: "list" })
            }}
          />
        ) : (
          <>
            <div className="grid min-h-0 flex-1 grid-cols-2 content-start gap-2.5 overflow-y-auto p-5 sm:grid-cols-3 md:grid-cols-4">
              {!q && (
                <button
                  type="button"
                  onClick={() => setView({ kind: "custom" })}
                  className="flex min-h-40 flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-primary/30 p-3 text-center text-primary transition hover:border-primary hover:bg-primary/5"
                >
                  <span className="grid size-12 place-items-center rounded-2xl bg-primary/10">
                    <PlusIcon className="size-6" />
                  </span>
                  <span className="text-[13px] leading-tight font-semibold">
                    Buat perangkat sendiri
                  </span>
                  <span className="text-[11px] leading-snug text-muted-foreground">
                    Belum ada di daftar? Isi nama, watt & ilustrasinya.
                  </span>
                </button>
              )}
              {list.map((a) => {
                const maxW = Math.max(...a.modes.map((m) => m.watt))
                const minW = Math.min(...a.modes.map((m) => m.watt))
                const va = maxW / a.pf
                const risky = va > remaining
                const tripsCircuit = va / VOLT > targetLeftA
                // jumlah perangkat ini di ruangan & MCB tujuan (termasuk yang sudah ada)
                const installed = room
                  ? state.devices.filter(
                      (d) =>
                        d.roomId === room.id &&
                        d.applianceId === a.id &&
                        circuitIdOf(state, d) === targetId
                    )
                  : []
                const n = installed.length
                const add = () => {
                  if (!room) return
                  dispatch({
                    type: "add-device",
                    roomId: room.id,
                    applianceId: a.id,
                    circuitId: targetId,
                  })
                }
                const subtract = () => {
                  // lepas yang paling baru dipasang dulu
                  const last = [...installed].sort(
                    (x, y) => Number(y.id.slice(1)) - Number(x.id.slice(1))
                  )[0]
                  if (last) dispatch({ type: "remove-device", id: last.id })
                }
                return (
                  <div
                    key={a.id}
                    className={cn(
                      "group relative flex flex-col rounded-2xl ring-1 transition hover:-translate-y-0.5 hover:shadow-md",
                      n
                        ? "bg-safe-soft ring-safe/50"
                        : "bg-card ring-foreground/10 hover:ring-primary/40"
                    )}
                  >
                    {a.custom && (
                      <button
                        type="button"
                        onClick={() =>
                          setView({ kind: "custom", editId: a.id })
                        }
                        className="absolute top-2 left-2 z-10 grid size-6 place-items-center rounded-md bg-card/90 text-muted-foreground ring-1 ring-border transition hover:text-primary"
                        aria-label={`Ubah ${a.name}`}
                        title="Ubah perangkat buatanmu"
                      >
                        <PencilIcon className="size-3.5" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={add}
                      className="flex flex-1 flex-col items-center gap-1 p-3 pt-4 text-center outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                      aria-label={`Tambah ${a.name}`}
                    >
                      {n > 0 && (
                        <span
                          key={n}
                          className="anim-pop absolute top-2 right-2 flex items-center gap-0.5 rounded-full bg-safe px-1.5 py-0.5 text-[10px] font-semibold text-white"
                        >
                          <CheckIcon className="size-3" />
                          {n}
                        </span>
                      )}
                      <ApplianceArt
                        kind={a.art}
                        on={false}
                        className="size-14 transition group-hover:scale-110"
                      />
                      <span className="mt-1 text-[13px] leading-tight font-semibold">
                        {a.name}
                      </span>
                      {a.custom && (
                        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                          Buatanmu
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground tabular-nums">
                        {minW === maxW
                          ? `${fmt(maxW)} W`
                          : `${fmt(minW)}–${fmt(maxW)} W`}
                      </span>
                      {risky ? (
                        <span className="mt-0.5 rounded-full bg-warn-soft px-2 py-0.5 text-[10px] font-medium text-warn-ink">
                          Melebihi sisa daya rumah
                        </span>
                      ) : (
                        tripsCircuit &&
                        targetCircuit && (
                          <span className="mt-0.5 rounded-full bg-warn-soft px-2 py-0.5 text-[10px] font-medium text-warn-ink">
                            Bisa bikin MCB {targetCircuit.mcbAmp} A turun
                          </span>
                        )
                      )}
                    </button>
                    {n > 0 && (
                      <div className="flex items-center justify-between gap-1 rounded-b-2xl border-t border-safe/30 bg-white/60 p-1.5">
                        <button
                          type="button"
                          onClick={subtract}
                          className="grid size-8 place-items-center rounded-lg bg-card text-foreground ring-1 ring-border transition hover:bg-danger-soft hover:text-destructive"
                          aria-label={`Kurangi ${a.name}`}
                        >
                          <MinusIcon className="size-4" />
                        </button>
                        <span className="text-center text-xs leading-tight">
                          <b className="block text-sm tabular-nums">{n}</b>
                          terpasang
                        </span>
                        <button
                          type="button"
                          onClick={add}
                          className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground transition hover:bg-primary/85"
                          aria-label={`Tambah satu lagi ${a.name}`}
                        >
                          <PlusIcon className="size-4" />
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}
              {list.length === 0 && (
                <div className="col-span-full flex flex-col items-center gap-2 py-10 text-center text-sm text-muted-foreground">
                  <Volti mood="think" className="h-16 w-14" />
                  Perangkat “{q}” belum ada di katalog.
                  <Button
                    className="mt-1"
                    onClick={() =>
                      setView({ kind: "custom", prefill: q.trim() })
                    }
                  >
                    <PlusIcon />
                    Buat “{q.trim()}” sendiri
                  </Button>
                </div>
              )}
            </div>
            <DialogFooter className="m-0 items-center rounded-none sm:justify-between">
              <p className="text-xs text-muted-foreground">
                Perangkat baru dipasang dalam keadaan mati, lewat MCB{" "}
                <b>{targetCircuit?.name}</b>. Tekan <b>−</b> untuk mengurangi.
              </p>
              <Button onClick={() => openCatalog(null)}>Selesai</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

// ————————————————————————————————— Room
export function RoomDialog() {
  const { state, dispatch } = useSim()
  const { roomId, openRoom, openRoomMcb } = useUi()
  const remove = useQuickRemove()
  const room = state.rooms.find((r) => r.id === roomId)
  const [name, setName] = React.useState("")
  React.useEffect(() => {
    if (room) setName(room.name)
  }, [roomId]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!room) return <Dialog open={false} />
  const plugged = state.devices.filter(
    (d) => d.roomId === room.id && appliance(d).plug === "stopkontak"
  ).length
  const update = (patch: Partial<Room>) =>
    dispatch({ type: "update-room", id: room.id, patch })

  return (
    <Dialog open onOpenChange={(o) => !o && openRoom(null)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading text-lg font-semibold">
            Atur ruangan
          </DialogTitle>
          <DialogDescription>
            Ubah nama, jalur MCB, dan jumlah stopkontak.
          </DialogDescription>
        </DialogHeader>
        <label className="flex flex-col gap-1.5 text-xs font-medium">
          Nama ruangan
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => name.trim() && update({ name: name.trim() })}
            className="h-9"
          />
        </label>
        <div>
          <div className="mb-1.5 flex items-center justify-between gap-2">
            <p className="text-xs font-medium">
              Stopkontak ruangan ini lewat <Term k="grup">grup MCB</Term>
            </p>
            <Button
              size="xs"
              variant="outline"
              onClick={() => {
                openRoom(null)
                openRoomMcb(room.id)
              }}
            >
              <PlusIcon />
              Tambah MCB
            </Button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {state.circuits.map((c) => (
              <ChoiceChip
                key={c.id}
                active={room.circuitId === c.id}
                onClick={() => update({ circuitId: c.id })}
              >
                <span
                  className="size-2 rounded-full"
                  style={{ background: c.color }}
                />
                {c.name} · {c.mcbAmp} A
              </ChoiceChip>
            ))}
          </div>
        </div>
        <div>
          <p className="mb-1.5 text-xs font-medium">
            Lubang stopkontak di dinding
          </p>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              onClick={() => update({ sockets: Math.max(0, room.sockets - 1) })}
              aria-label="Kurangi"
            >
              <MinusIcon />
            </Button>
            <span className="w-8 text-center text-lg font-semibold tabular-nums">
              {room.sockets}
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => update({ sockets: room.sockets + 1 })}
              aria-label="Tambah"
            >
              <PlusIcon />
            </Button>
            <span
              className={cn(
                "text-xs",
                plugged > room.sockets
                  ? "font-medium text-warn-ink"
                  : "text-muted-foreground"
              )}
            >
              {plugged} perangkat butuh colokan
            </span>
          </div>
          <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground">
            Stopkontak dobel = 2 lubang. Kalau kurang, orang biasanya pakai
            colokan T — boleh untuk alat kecil, tapi berbahaya untuk alat
            berdaya besar.
          </p>
        </div>
        <DialogFooter className="sm:justify-between">
          <Button
            variant="destructive"
            disabled={state.rooms.length <= 1}
            onClick={() => {
              remove.room(room.id)
              openRoom(null)
            }}
          >
            <Trash2Icon />
            Hapus ruangan
          </Button>
          <Button
            onClick={() => {
              if (name.trim()) update({ name: name.trim() })
              openRoom(null)
            }}
          >
            Selesai
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function AddRoomDialog() {
  const { state, dispatch } = useSim()
  const { addRoomOpen, setAddRoomOpen } = useUi()
  const [kind, setKind] = React.useState<RoomKind>("kamar")
  const [name, setName] = React.useState("")
  const label = ROOM_KINDS.find((k) => k.kind === kind)!.label
  const count = state.rooms.filter((r) => r.kind === kind).length
  const suggested = count ? `${label} ${count + 1}` : label

  return (
    <Dialog open={addRoomOpen} onOpenChange={setAddRoomOpen}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-heading text-lg font-semibold">
            Tambah ruangan
          </DialogTitle>
          <DialogDescription>
            Ruangan baru otomatis diberi satu lampu LED.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-3 gap-2">
          {ROOM_KINDS.map((k) => (
            <button
              key={k.kind}
              type="button"
              onClick={() => {
                setKind(k.kind)
                setName("")
              }}
              className={cn(
                "flex flex-col items-center gap-1 overflow-hidden rounded-xl p-1.5 pb-2 text-xs font-medium ring-1 transition",
                kind === k.kind
                  ? "bg-art-soft ring-2 ring-primary"
                  : "ring-border hover:bg-muted"
              )}
            >
              <RoomBackdrop
                kind={k.kind}
                className="h-12 w-full rounded-lg bg-white/70"
              />
              {k.label}
            </button>
          ))}
        </div>
        <label className="flex flex-col gap-1.5 text-xs font-medium">
          Nama
          <Input
            value={name}
            placeholder={suggested}
            onChange={(e) => setName(e.target.value)}
            className="h-9"
          />
        </label>
        <DialogFooter>
          <Button
            onClick={() => {
              dispatch({
                type: "add-room",
                kind,
                name: name.trim() || suggested,
              })
              setAddRoomOpen(false)
              setName("")
            }}
          >
            <PlusIcon />
            Tambah {name.trim() || suggested}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ————————————————————————————————— Circuit
export function CircuitDialog() {
  const { state, dispatch } = useSim()
  const { circuitId, openCircuit } = useUi()
  const remove = useQuickRemove()
  const c = state.circuits.find((x) => x.id === circuitId)
  const [name, setName] = React.useState("")
  React.useEffect(() => {
    if (c) setName(c.name)
  }, [circuitId]) // eslint-disable-line react-hooks/exhaustive-deps
  if (!c) return <Dialog open={false} />
  const cab = cableSpec(c.cable)
  const unsafe = c.mcbAmp > cab.maxMcb
  const upd = (patch: Partial<Circuit>) =>
    dispatch({ type: "update-circuit", id: c.id, patch })

  return (
    <Dialog open onOpenChange={(o) => !o && openCircuit(null)}>
      <DialogContent className="max-h-[92svh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-heading text-lg font-semibold">
            Atur {c.name}
          </DialogTitle>
          <DialogDescription>
            Satu <Term k="grup">grup</Term> = satu MCB di box + kabel yang
            menuju ruangan-ruangannya.
          </DialogDescription>
        </DialogHeader>
        <label className="flex flex-col gap-1.5 text-xs font-medium">
          Nama grup
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => name.trim() && upd({ name: name.trim() })}
            className="h-9"
          />
        </label>

        <div>
          <p className="mb-1.5 text-xs font-medium">
            Rating <Term k="mcb">MCB</Term>
          </p>
          <div className="grid grid-cols-4 gap-1.5">
            {MCB_OPTIONS.map((a) => (
              <button
                key={a}
                type="button"
                onClick={() => upd({ mcbAmp: a })}
                className={cn(
                  "flex flex-col items-center rounded-xl py-1.5 ring-1 transition",
                  c.mcbAmp === a
                    ? "bg-primary text-primary-foreground ring-primary"
                    : "ring-border hover:bg-muted",
                  a > cab.maxMcb && c.mcbAmp !== a && "text-muted-foreground/60"
                )}
              >
                <span className="text-sm font-semibold">{a} A</span>
                <span
                  className={cn(
                    "text-[10px]",
                    c.mcbAmp === a
                      ? "text-primary-foreground/80"
                      : "text-muted-foreground"
                  )}
                >
                  ≈ {fmt(a * VOLT)} VA
                </span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-1.5 text-xs font-medium">
            Ukuran <Term k="nym">kabel</Term>
          </p>
          <div className="grid grid-cols-2 gap-1.5">
            {CABLES.map((k) => (
              <button
                key={k.mm2}
                type="button"
                onClick={() => upd({ cable: k.mm2 })}
                className={cn(
                  "flex items-center gap-2 rounded-xl p-2 text-left ring-1 transition",
                  c.cable === k.mm2
                    ? "bg-art-soft ring-2 ring-primary"
                    : "ring-border hover:bg-muted"
                )}
              >
                <CableArt mm2={k.mm2} className="h-7 w-10 shrink-0" />
                <span className="leading-tight">
                  <span className="block text-xs font-semibold">
                    {fmtMm(k.mm2)} mm²
                  </span>
                  <span className="block text-[10px] text-muted-foreground">
                    MCB maks. {k.maxMcb} A
                  </span>
                </span>
              </button>
            ))}
          </div>
          <div
            className={cn(
              "mt-2 rounded-xl p-3 text-xs leading-relaxed",
              unsafe ? "bg-danger-soft" : "bg-safe-soft"
            )}
          >
            {unsafe ? (
              <>
                <b className="text-destructive">Tidak aman.</b> Kabel{" "}
                {fmtMm(c.cable)} mm² bisa panas sebelum MCB {c.mcbAmp} A sempat
                turun. Pilih MCB ≤ {cab.maxMcb} A atau kabel lebih besar.
              </>
            ) : (
              <>
                <b className="text-safe-ink">Pas.</b> MCB {c.mcbAmp} A akan
                turun sebelum kabel {fmtMm(c.cable)} mm² kepanasan. Aturannya:{" "}
                <i>MCB melindungi kabel</i>, jadi MCB tidak boleh lebih besar
                dari kemampuan kabel.
              </>
            )}
          </div>
        </div>

        <label className="flex items-center gap-3 rounded-xl bg-energy-soft p-3 text-xs">
          <LightbulbIcon className="size-5 shrink-0 text-energy-deep" />
          <span className="flex-1">
            <span className="block font-medium">Khusus lampu</span>
            <span className="text-muted-foreground">
              Semua lampu di rumah lewat grup ini. Umumnya di Indonesia: kabel
              NYM 1,5 mm² dengan MCB 6–10 A, terpisah dari stopkontak (2,5 mm²).
            </span>
          </span>
          <Switch
            checked={!!c.forLights}
            onCheckedChange={(v) => upd({ forLights: v })}
          />
        </label>

        <div>
          <p className="mb-1.5 text-xs font-medium">
            {c.forLights
              ? "Stopkontak ruangan di grup ini"
              : "Ruangan di grup ini"}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {state.rooms.map((r) => (
              <ChoiceChip
                key={r.id}
                active={r.circuitId === c.id}
                onClick={() =>
                  dispatch({
                    type: "update-room",
                    id: r.id,
                    patch: { circuitId: c.id },
                  })
                }
              >
                {r.name}
              </ChoiceChip>
            ))}
          </div>
          <p className="mt-1.5 text-[11px] text-muted-foreground">
            Ketuk ruangan untuk memindahkannya ke grup ini.
          </p>
        </div>

        <DialogFooter className="sm:justify-between">
          <Button
            variant="destructive"
            disabled={state.circuits.length <= 1}
            onClick={() => {
              remove.circuit(c.id)
              openCircuit(null)
            }}
          >
            <Trash2Icon />
            Hapus grup
          </Button>
          <Button
            onClick={() => {
              if (name.trim()) upd({ name: name.trim() })
              openCircuit(null)
            }}
          >
            Selesai
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ————————————————————————————————— Settings
export function SettingsDialog() {
  const { state, dispatch } = useSim()
  const { settingsOpen, setSettingsOpen, setHousesOpen } = useUi()
  const set = (patch: SettingsPatch) => dispatch({ type: "settings", patch })

  return (
    <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
      <DialogContent className="max-h-[92svh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="font-heading text-lg font-semibold">
            Pengaturan rumah
          </DialogTitle>
          <DialogDescription>
            Sesuaikan dengan kondisi rumahmu. Daya tertera di meteran atau struk
            token.
          </DialogDescription>
        </DialogHeader>

        <section>
          <p className="mb-1.5 text-xs font-medium">Daya listrik PLN</p>
          <div className="grid grid-cols-4 gap-1.5">
            {DAYA_LEVELS.map((l) => (
              <button
                key={l.va}
                type="button"
                onClick={() => set({ dayaVA: l.va })}
                className={cn(
                  "flex flex-col items-center rounded-xl py-2 ring-1 transition",
                  state.dayaVA === l.va
                    ? "bg-primary text-primary-foreground ring-primary"
                    : "ring-border hover:bg-muted"
                )}
              >
                <span className="text-sm font-semibold tabular-nums">
                  {fmt(l.va)}
                </span>
                <span
                  className={cn(
                    "text-[10px]",
                    state.dayaVA === l.va
                      ? "text-primary-foreground/80"
                      : "text-muted-foreground"
                  )}
                >
                  VA · MCB {l.mcb} A
                </span>
              </button>
            ))}
          </div>
          {state.dayaVA === 900 && (
            <label className="mt-2 flex items-center justify-between gap-3 rounded-xl bg-muted/60 p-3 text-xs">
              <span>
                <span className="block font-medium">
                  Pelanggan subsidi (900 VA)
                </span>
                <span className="text-muted-foreground">
                  Tarif Rp605/kWh. Kalau tidak, tarif Rp1.352/kWh (rumah tangga
                  mampu).
                </span>
              </span>
              <Switch
                checked={state.subsidi}
                onCheckedChange={(v) => set({ subsidi: v })}
              />
            </label>
          )}
          <p className="mt-1.5 text-[11px] text-muted-foreground">
            Tarif saat ini: Rp{fmt(tarifPerKwh(state.dayaVA, state.subsidi), 2)}
            /kWh ({dayaLevel(state.dayaVA).golongan}).
          </p>
        </section>

        <section>
          <p className="mb-1.5 text-xs font-medium">Jenis meteran</p>
          <div className="flex gap-1.5">
            <ChoiceChip
              active={state.billing === "prabayar"}
              onClick={() => set({ billing: "prabayar" })}
            >
              Prabayar (token)
            </ChoiceChip>
            <ChoiceChip
              active={state.billing === "pascabayar"}
              onClick={() => set({ billing: "pascabayar" })}
            >
              Pascabayar (tagihan bulanan)
            </ChoiceChip>
          </div>
        </section>

        <section className="flex flex-col gap-2">
          <p className="text-xs font-medium">Pengaman</p>
          <label className="flex items-center gap-3 rounded-xl bg-muted/60 p-3 text-xs">
            <GroundArt className="size-10 shrink-0" />
            <span className="flex-1">
              <span className="block font-medium">
                <Term k="arde">Arde (grounding)</Term>
              </span>
              <span className="text-muted-foreground">
                Batang tembaga ditanam ke tanah + stopkontak berkaki arde.
              </span>
            </span>
            <Switch
              checked={state.grounding}
              onCheckedChange={(v) => set({ grounding: v })}
            />
          </label>
          <label className="flex items-center gap-3 rounded-xl bg-muted/60 p-3 text-xs">
            <ElcbArt className="h-10 w-8 shrink-0" />
            <span className="flex-1">
              <span className="block font-medium">
                <Term k="elcb">ELCB / RCBO</Term>
              </span>
              <span className="text-muted-foreground">
                Pengaman kesetrum di box MCB, penting untuk kamar mandi & area
                cuci.
              </span>
            </span>
            <Switch
              checked={state.elcb}
              onCheckedChange={(v) => set({ elcb: v })}
            />
          </label>
        </section>

        <section className="flex items-center gap-3 rounded-xl bg-muted/60 p-3 text-xs">
          <FolderOpenIcon className="size-5 shrink-0 text-primary" />
          <span className="flex-1">
            <span className="block font-medium">
              Simpan, buka, atau buat rumah baru
            </span>
            <span className="text-muted-foreground">
              Kelola rancangan rumah, contoh rumah, dan file di menu Rumah saya.
            </span>
          </span>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setSettingsOpen(false)
              setHousesOpen(true)
            }}
          >
            Rumah saya
          </Button>
        </section>

        <DialogFooter className="sm:justify-between">
          <Button
            variant="outline"
            onClick={() => {
              dispatch({ type: "all-off" })
              setSettingsOpen(false)
            }}
          >
            <PowerIcon />
            Matikan semua perangkat
          </Button>
          <Button onClick={() => setSettingsOpen(false)}>Selesai</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ————————————————————————————————— Onboarding
export function OnboardingDialog() {
  const { state, dispatch, ready } = useSim()
  const [step, setStep] = React.useState(0)
  const nextRef = React.useRef<HTMLButtonElement>(null)
  const [preset, setPreset] = React.useState("kecil")
  const open = ready && !state.onboarded

  const finish = () => dispatch({ type: "preset", id: preset })

  return (
    <Dialog
      open={open}
      onOpenChange={(o) =>
        !o && dispatch({ type: "settings", patch: { onboarded: true } })
      }
    >
      <DialogContent
        className="gap-0 overflow-hidden p-0 sm:max-w-lg"
        showCloseButton={false}
        initialFocus={nextRef}
      >
        <div className="flex gap-1 px-5 pt-5">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className={cn(
                "h-1 flex-1 rounded-full transition",
                i <= step ? "bg-primary" : "bg-muted"
              )}
            />
          ))}
        </div>
        {step === 0 && (
          <div className="flex flex-col items-center gap-3 p-6 text-center">
            <Volti mood="cheer" className="anim-bob h-28 w-24" />
            <DialogTitle className="font-heading text-2xl font-semibold">
              Halo! Aku Volti.
            </DialogTitle>
            <DialogDescription className="max-w-sm text-[14px] leading-relaxed">
              Di sini kamu bisa “memasang” listrik di rumah tanpa takut
              kesetrum. Nyalakan perangkat, lihat kapan MCB{" "}
              <Term k="njeglek">njeglek</Term>, dan hitung berapa daya serta
              biaya yang kamu butuhkan.
            </DialogDescription>
          </div>
        )}
        {step === 1 && (
          <div className="flex flex-col gap-3 p-6">
            <DialogTitle className="font-heading text-xl font-semibold">
              Mulai dari rumah seperti apa?
            </DialogTitle>
            <DialogDescription>
              Nanti tetap bisa diubah: tambah ruangan, perangkat, dan ganti
              daya.
            </DialogDescription>
            <div className="flex flex-col gap-2">
              {PRESETS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPreset(p.id)}
                  className={cn(
                    "flex items-center gap-3 rounded-2xl p-3 text-left ring-1 transition",
                    preset === p.id
                      ? "bg-art-soft ring-2 ring-primary"
                      : "ring-border hover:bg-muted"
                  )}
                >
                  <div className="grid size-12 shrink-0 place-items-center rounded-xl bg-card ring-1 ring-foreground/10">
                    <ApplianceArt
                      kind={
                        p.id === "keluarga"
                          ? "ac"
                          : p.id === "kecil"
                            ? "fan"
                            : "bulb"
                      }
                      className="size-9"
                    />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{p.blurb}</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold tabular-nums">
                    {fmt(p.dayaVA)} VA
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
        {step === 2 && (
          <div className="flex flex-col gap-3 p-6">
            <DialogTitle className="font-heading text-xl font-semibold">
              Cara main
            </DialogTitle>
            <ul className="flex flex-col gap-3">
              <HowTo
                art={<ApplianceArt kind="bulb" on className="size-10" />}
                title="Ketuk perangkat untuk menyalakan / mematikan"
              >
                Perangkat yang menyala bercahaya kuning. Beban langsung
                terhitung di meteran.
              </HowTo>
              <HowTo
                art={
                  <span className="grid size-10 place-items-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                    i
                  </span>
                }
                title="Ketuk ikon (i) untuk tahu “kenapa”"
              >
                Lihat jalur listrik dari tiang PLN sampai perangkat, dayanya,
                dan biayanya per bulan.
              </HowTo>
              <HowTo
                art={
                  <McbArt amp={10} on={false} tripped className="h-11 w-6" />
                }
                title="Kalau njeglek, jangan panik"
              >
                Volti akan menjelaskan penyebabnya dan cara menyalakan lagi.
              </HowTo>
            </ul>
          </div>
        )}
        <DialogFooter className="m-0 rounded-none sm:justify-between">
          <Button
            variant="ghost"
            onClick={() =>
              step === 0
                ? dispatch({ type: "settings", patch: { onboarded: true } })
                : setStep(step - 1)
            }
          >
            {step === 0 ? "Lewati" : "Kembali"}
          </Button>
          <Button
            ref={nextRef}
            onClick={() => (step < 2 ? setStep(step + 1) : finish())}
          >
            {step < 2 ? "Lanjut" : "Mulai simulasi"}
            <ArrowRightIcon />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function HowTo({
  art,
  title,
  children,
}: {
  art: React.ReactNode
  title: string
  children: React.ReactNode
}) {
  return (
    <li className="flex items-center gap-3">
      <div className="grid size-12 shrink-0 place-items-center rounded-xl bg-art-soft/60">
        {art}
      </div>
      <div>
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-xs leading-relaxed text-muted-foreground">
          {children}
        </p>
      </div>
    </li>
  )
}
