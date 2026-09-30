import * as React from "react"
import {
  InfoIcon,
  LightbulbIcon,
  PlugIcon,
  PlusIcon,
  Settings2Icon,
  Trash2Icon,
  XIcon,
  ZapOffIcon,
} from "lucide-react"

import { ApplianceArt } from "~/components/art/appliance-art"
import {
  KwhMeterArt,
  PanelBoxArt,
  PoleArt,
  RoomBackdrop,
  SocketArt,
  Volti,
} from "~/components/art/gear-art"
import { useSim } from "~/lib/sim/store"
import {
  appliance,
  circuitIdOf,
  deviceVA,
  deviceWatt,
  fmt,
  isPowered,
  deviceName,
} from "~/lib/sim/engine"
import type { Circuit, Device, Room, RoomKind } from "~/lib/sim/types"
import { cn } from "~/lib/utils"
import { CircuitWires } from "./circuit-wires"
import { McbBox } from "./mcb-box"
import { useActiveCircuit, useQuickRemove, useUi } from "./ui-store"

const WALL: Record<RoomKind, string> = {
  teras: "oklch(0.95 0.03 140)",
  tamu: "oklch(0.95 0.035 300)",
  kamar: "oklch(0.95 0.035 260)",
  dapur: "oklch(0.96 0.04 80)",
  mandi: "oklch(0.95 0.035 210)",
  cuci: "oklch(0.95 0.025 180)",
}

export function HouseView() {
  const { state, dispatch } = useSim()
  const { setAddRoomOpen, editMode } = useUi()
  const flickering = state.flicker?.id
  const houseRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (!flickering) return
    const t = setTimeout(() => dispatch({ type: "clear-flicker" }), 6000)
    return () => clearTimeout(t)
  }, [flickering, dispatch])

  return (
    <div
      ref={houseRef}
      className="relative overflow-hidden rounded-3xl bg-linear-to-b from-[oklch(0.9_0.06_290)] via-[oklch(0.95_0.03_300)] to-[oklch(0.97_0.015_300)] p-3 ring-1 ring-foreground/5 sm:p-5"
    >
      {/* bintang malam */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-32 opacity-60"
      >
        {[8, 22, 47, 71, 88, 93].map((x, i) => (
          <span
            key={x}
            className="anim-pulse absolute size-1 rounded-full bg-white"
            style={{
              left: `${x}%`,
              top: `${10 + ((i * 37) % 60)}%`,
              animationDelay: `${i * 0.4}s`,
            }}
          />
        ))}
      </div>
      <PowerStrip />
      <McbBox />
      {/* atap */}
      <div className="relative mx-auto mt-3 max-w-full">
        <svg
          viewBox="0 0 400 40"
          preserveAspectRatio="none"
          data-roof
          className="block h-10 w-full sm:h-14"
          aria-hidden
        >
          <path d="M8 40 L60 4 H340 L392 40 Z" fill="var(--primary)" />
          <path
            d="M8 40 L60 4 H340 L392 40"
            fill="none"
            stroke="var(--ink)"
            strokeWidth="2.5"
            vectorEffect="non-scaling-stroke"
            strokeLinejoin="round"
          />
          <path
            d="M40 30 H360"
            stroke="white"
            strokeOpacity="0.18"
            strokeWidth="3"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
        <div
          data-room-grid
          className={cn(
            "grid grid-cols-1 gap-x-4 gap-y-3 rounded-b-2xl border-2 border-t-0 border-ink/80 bg-ink/80 py-2.5 pr-2.5 pl-4 min-[520px]:grid-cols-2 xl:grid-cols-3",
            flickering && "anim-flicker"
          )}
        >
          {state.rooms.map((room) => (
            <RoomCell key={room.id} room={room} />
          ))}
          {state.rooms.length === 0 && (
            <div className="flex min-h-44 items-center gap-3 rounded-xl bg-white/90 p-4 min-[520px]:col-span-2 xl:col-span-2">
              <Volti mood="cheer" className="h-20 w-16 shrink-0" />
              <div>
                <p className="font-heading text-base font-semibold">
                  Rumahnya masih kosong
                </p>
                <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
                  Mulai dengan <b>Tambah ruangan</b> — tiap ruangan otomatis
                  dapat satu lampu. Lalu pasang perangkat, atur grup MCB, dan
                  simpan lewat tombol <b>Rumah saya</b> di atas.
                </p>
              </div>
            </div>
          )}
          {!editMode && (
            <button
              type="button"
              onClick={() => setAddRoomOpen(true)}
              className="group flex min-h-28 flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-white/25 text-sm font-medium text-white/70 transition hover:border-white/60 hover:bg-white/5 hover:text-white"
            >
              <span className="grid size-9 place-items-center rounded-full bg-white/10 transition group-hover:bg-white/20">
                <PlusIcon className="size-5" />
              </span>
              Tambah ruangan
            </button>
          )}
        </div>
        <div
          aria-hidden
          className="mx-[-12px] h-3 rounded-full bg-[oklch(0.72_0.1_145)] ring-2 ring-ink/80 sm:mx-[-20px]"
        />
      </div>
      <CircuitWires containerRef={houseRef} />
    </div>
  )
}

/** Garis jalur listrik: tiang PLN → meteran → box MCB → rumah */
function PowerStrip() {
  const { state, analysis } = useSim()
  const live = state.mainOn
  const anyCircuitOn = state.circuits.some((c) => c.on)
  const steps = [
    {
      label: "Tiang PLN",
      sub: "220 V",
      art: <PoleArt live className="h-12 w-4" />,
      ok: true,
    },
    {
      label: "Meteran",
      sub: live
        ? `${fmt(analysis.totalVA)} / ${fmt(state.dayaVA)} VA`
        : "MCB PLN turun",
      art: (
        <KwhMeterArt
          powered={live}
          display=""
          mcbOn={live}
          className="h-12 w-9"
        />
      ),
      ok: live,
    },
    {
      label: "Box MCB",
      sub: `${state.circuits.filter((c) => c.on).length}/${state.circuits.length} grup nyala`,
      art: <PanelBoxArt className="h-9 w-11" />,
      ok: live && anyCircuitOn,
    },
  ]
  return (
    <div className="relative flex items-stretch gap-1 rounded-2xl bg-white/70 p-2 ring-1 ring-foreground/5 backdrop-blur-sm sm:gap-2 sm:p-2.5">
      {steps.map((s, i) => (
        <React.Fragment key={s.label}>
          <div
            className="flex min-w-0 items-center gap-2 sm:flex-1"
            title={`${s.label}: ${s.sub}`}
          >
            <div
              className={cn(
                "grid h-12 w-10 shrink-0 place-items-center rounded-lg",
                !s.ok && "bg-danger-soft"
              )}
            >
              {s.art}
            </div>
            <div className="hidden min-w-0 leading-tight sm:block">
              <p className="truncate text-xs font-semibold">{s.label}</p>
              <p
                className={cn(
                  "truncate text-[11px]",
                  s.ok
                    ? "text-muted-foreground"
                    : "font-medium text-destructive"
                )}
              >
                {s.sub}
              </p>
            </div>
          </div>
          {i < steps.length && (
            <svg
              className="min-w-4 flex-1 self-center sm:w-10 sm:flex-none"
              height="10"
              viewBox="0 0 40 10"
              preserveAspectRatio="none"
              aria-hidden
            >
              <path
                d="M2 5H38"
                stroke="var(--ink)"
                strokeOpacity="0.15"
                strokeWidth="4"
                strokeLinecap="round"
              />
              <path
                d="M2 5H38"
                stroke={s.ok ? "var(--energy)" : "var(--destructive)"}
                strokeWidth="2.5"
                strokeLinecap="round"
                className={s.ok ? "anim-flow" : undefined}
                strokeDasharray={s.ok ? undefined : "2 5"}
              />
            </svg>
          )}
        </React.Fragment>
      ))}
      <div className="flex shrink-0 items-center gap-2 pr-1">
        <span className="text-xs font-semibold">Rumah</span>
      </div>
    </div>
  )
}

/** Label jalur: warna + rating MCB, dipakai di ruangan dan legenda. */
export function CircuitTag({
  circuit,
  className,
  compact,
  icon,
}: {
  circuit: Circuit
  className?: string
  compact?: boolean
  icon?: "plug" | "lamp"
}) {
  return (
    <span
      className={cn(
        "inline-flex min-w-0 items-center gap-1 rounded-full py-0.5 pr-2 pl-0.5 text-[10.5px] font-semibold",
        className
      )}
      style={{
        background: `color-mix(in oklch, ${circuit.color} 16%, white)`,
        color: `color-mix(in oklch, ${circuit.color} 70%, black)`,
      }}
    >
      <span
        className="rounded-full px-1.5 py-px text-[9.5px] font-bold text-white"
        style={{ background: circuit.color }}
      >
        {circuit.mcbAmp}A
      </span>
      {icon === "plug" && (
        <PlugIcon className="size-3 shrink-0" aria-label="stopkontak" />
      )}
      {icon === "lamp" && (
        <LightbulbIcon className="size-3 shrink-0" aria-label="lampu" />
      )}
      {!compact && <span className="truncate">{circuit.name}</span>}
      {compact && icon === "lamp" && <span>Lampu</span>}
    </span>
  )
}

function RoomCell({ room }: { room: Room }) {
  const { state, analysis } = useSim()
  const {
    openCatalog,
    openRoom,
    openRoomMcb,
    openDetach,
    setFocusCircuit,
    focusCircuitId,
    editMode,
  } = useUi()
  const remove = useQuickRemove()
  const active = useActiveCircuit()
  const devices = state.devices.filter((d) => d.roomId === room.id)
  const circuit = state.circuits.find((c) => c.id === room.circuitId)
  const powered = state.mainOn && !!circuit?.on
  const lamps = devices.filter((d) => appliance(d).category === "lampu")
  const lit = lamps.some((d) => analysis.runningIds.has(d.id))
  const plugged = devices.filter(
    (d) => appliance(d).plug === "stopkontak"
  ).length
  const roomWatt = devices
    .filter((d) => analysis.runningIds.has(d.id))
    .reduce((s, d) => s + deviceWatt(d), 0)
  // urutan grup: grup ruangan dulu, lalu grup lain sesuai urutan di box MCB
  const groups = state.circuits
    .map((c) => ({
      circuit: c,
      devices: devices.filter((d) => circuitIdOf(state, d) === c.id),
    }))
    .filter(
      (g) =>
        g.devices.length > 0 ||
        g.circuit.id === room.circuitId ||
        room.extraCircuitIds?.includes(g.circuit.id)
    )
    .sort(
      (x, y) =>
        Number(y.circuit.id === room.circuitId) -
        Number(x.circuit.id === room.circuitId)
    )
  const roomMatch = !!active && room.circuitId === active
  const deviceMatch =
    !!active && devices.some((d) => circuitIdOf(state, d) === active)
  const dimmed = !!active && !roomMatch && !deviceMatch

  return (
    <section
      aria-label={room.name}
      data-room-id={room.id}
      className={cn(
        "relative flex min-h-44 flex-col overflow-hidden rounded-xl transition duration-300",
        dimmed && "opacity-35 saturate-50",
        editMode && "ring-2 ring-destructive/40 ring-inset"
      )}
      style={{
        background: WALL[room.kind],
        boxShadow:
          roomMatch && circuit
            ? `0 0 0 3px ${circuit.color}, 0 0 24px 2px ${circuit.color}`
            : undefined,
      }}
    >
      <RoomBackdrop
        kind={room.kind}
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[70%] w-full"
      />
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-0 transition-opacity duration-500",
          lit ? "opacity-100" : "opacity-0"
        )}
        style={{
          background:
            "radial-gradient(120% 70% at 50% 0%, color-mix(in oklch, var(--energy) 45%, transparent), transparent 70%)",
        }}
      />
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-0 bg-night transition-opacity duration-500",
          !state.mainOn
            ? "opacity-70"
            : lit
              ? "opacity-0"
              : !powered
                ? "opacity-55"
                : "opacity-25"
        )}
      />

      <header className="relative z-10 flex items-center gap-1.5 px-2.5 pt-3">
        <h3
          className={cn(
            "min-w-0 truncate font-heading text-sm font-semibold",
            !state.mainOn && "text-white"
          )}
        >
          {room.name}
        </h3>
        <span
          className={cn(
            "ml-auto shrink-0 text-[11px] tabular-nums",
            powered ? "text-foreground/60" : "text-white/70"
          )}
        >
          {roomWatt > 0 ? `${fmt(roomWatt)} W` : ""}
        </span>
        {editMode ? (
          <button
            type="button"
            onClick={() => remove.room(room.id)}
            disabled={state.rooms.length <= 1}
            className="grid size-7 shrink-0 place-items-center rounded-lg bg-destructive text-white shadow-sm transition hover:brightness-110 disabled:opacity-40"
            aria-label={`Hapus ruangan ${room.name}`}
          >
            <Trash2Icon className="size-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => openRoom(room.id)}
            className={cn(
              "grid size-7 shrink-0 place-items-center rounded-lg transition",
              powered
                ? "text-foreground/60 hover:bg-white/70 hover:text-foreground"
                : "text-white/70 hover:bg-white/10"
            )}
            aria-label={`Atur ${room.name}`}
          >
            <Settings2Icon className="size-4" />
          </button>
        )}
      </header>

      {!state.mainOn && (
        <div className="relative z-10 mx-2.5 mt-1 flex items-center gap-1.5 rounded-lg bg-destructive px-2 py-1 text-[11px] font-medium text-white">
          <ZapOffIcon className="size-3.5 shrink-0" />
          <span className="truncate">Padam — MCB PLN turun</span>
        </div>
      )}

      {/* perangkat dikelompokkan per MCB yang mengalirinya */}
      <div className="relative z-10 flex flex-col gap-1.5 px-2 pt-1.5 pb-1">
        {groups.map(({ circuit: c, devices: ds }) => {
          const live = state.mainOn && c.on
          const kind =
            ds.length > 0 && ds.every((d) => appliance(d).plug === "saklar")
              ? "lamp"
              : "plug"
          const groupDim = !!active && active !== c.id
          return (
            <div
              key={c.id}
              data-group={`${room.id}:${c.id}`}
              className={cn(
                "rounded-lg p-1 transition duration-300",
                groupDim && "opacity-40"
              )}
              style={{
                background: `color-mix(in oklch, ${live ? c.color : "var(--destructive)"} 9%, transparent)`,
              }}
            >
              <div data-group-head className="mb-1 flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() =>
                    setFocusCircuit(focusCircuitId === c.id ? null : c.id)
                  }
                  className="min-w-0 rounded-full transition hover:brightness-95"
                  title={`Perangkat di bawah ini lewat ${c.name} — ketuk untuk menyorot`}
                >
                  <CircuitTag circuit={c} icon={kind} className="max-w-full" />
                </button>
                {!live && state.mainOn && (
                  <span className="truncate text-[10.5px] font-semibold text-destructive">
                    Padam — MCB turun
                  </span>
                )}
                <button
                  type="button"
                  onClick={() =>
                    openDetach({ roomId: room.id, circuitId: c.id })
                  }
                  className={cn(
                    "ml-auto grid size-6 shrink-0 place-items-center rounded-md transition",
                    editMode
                      ? "bg-destructive text-white shadow-sm"
                      : "text-foreground/40 hover:bg-white/70 hover:text-destructive"
                  )}
                  aria-label={`Lepas ${c.name} dari ${room.name}`}
                  title={`Lepas ${c.name} dari ${room.name}`}
                >
                  <Trash2Icon className="size-3.5" />
                </button>
              </div>
              <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-4 xl:grid-cols-3 2xl:grid-cols-4">
                {ds.map((d) => (
                  <DeviceTile key={d.id} device={d} />
                ))}
                {!editMode && (
                  <button
                    type="button"
                    onClick={() => openCatalog(room.id, c.id)}
                    title={`Tambah perangkat lewat ${c.name} (${c.mcbAmp} A)`}
                    className={cn(
                      "flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed text-[11px] font-medium transition",
                      powered || lit
                        ? "border-foreground/15 text-foreground/50 hover:border-primary/50 hover:bg-white/60 hover:text-primary"
                        : "border-white/20 text-white/60 hover:bg-white/10"
                    )}
                  >
                    <PlusIcon className="size-5" />
                    Tambah
                  </button>
                )}
              </div>
            </div>
          )
        })}
        {!editMode && (
          <button
            type="button"
            onClick={() => openRoomMcb(room.id)}
            className={cn(
              "flex items-center justify-center gap-1.5 rounded-lg border-2 border-dashed py-1.5 text-[11px] font-semibold transition",
              state.mainOn
                ? "border-foreground/15 text-foreground/55 hover:border-primary/50 hover:bg-white/60 hover:text-primary"
                : "border-white/20 text-white/60 hover:bg-white/10"
            )}
            title="Pisahkan perangkat di ruangan ini ke MCB lain"
          >
            <PlusIcon className="size-3.5" />
            Tambah MCB di ruangan ini
          </button>
        )}
      </div>

      <footer className="relative z-10 mt-auto flex items-center gap-1.5 px-2.5 pb-2">
        <button
          type="button"
          onClick={() => openRoom(room.id)}
          className={cn(
            "flex items-center gap-1 rounded-md px-1 py-0.5 text-[11px] tabular-nums transition hover:bg-white/60",
            plugged > room.sockets
              ? "font-semibold text-warn-ink"
              : powered
                ? "text-foreground/60"
                : "text-white/70"
          )}
          title="Lubang stopkontak terpakai / tersedia"
        >
          <SocketArt className="size-4" ground={state.grounding} />
          {plugged}/{room.sockets} stopkontak
          {plugged > room.sockets && " — pakai colokan T"}
        </button>
      </footer>
    </section>
  )
}

function DeviceTile({ device }: { device: Device }) {
  const { state, analysis, dispatch } = useSim()
  const { openDevice, editMode } = useUi()
  const remove = useQuickRemove()
  const a = appliance(device)
  const running = analysis.runningIds.has(device.id)
  const waiting = device.on && !running
  const powered = isPowered(state, device)
  const surging = state.flicker?.deviceId === device.id
  // nama lengkap untuk label aksesibilitas (nama sendiri kalau ada)
  const d_name = device.label?.trim() || a.name

  return (
    <div
      className={cn(
        "group/tile relative transition duration-300",
        editMode && "anim-pop"
      )}
    >
      <button
        type="button"
        onClick={() =>
          editMode
            ? remove.device(device.id)
            : dispatch({ type: "toggle-device", id: device.id })
        }
        aria-pressed={editMode ? undefined : device.on}
        aria-label={
          editMode
            ? `Lepas ${d_name}`
            : `${d_name}: ${running ? "menyala" : waiting ? "saklar nyala tapi tidak ada listrik" : "mati"}. Ketuk untuk ${device.on ? "mematikan" : "menyalakan"}`
        }
        className={cn(
          "flex aspect-square w-full flex-col items-center justify-between rounded-xl p-1.5 pb-1 text-center shadow-xs ring-1 transition duration-200 active:scale-95",
          editMode
            ? "bg-white/90 ring-2 ring-destructive/50 hover:bg-danger-soft"
            : running
              ? "bg-energy-soft shadow-[0_0_0_3px_color-mix(in_oklch,var(--energy)_30%,transparent),0_6px_18px_-6px_color-mix(in_oklch,var(--energy)_80%,transparent)] ring-energy"
              : waiting
                ? "bg-white/40 ring-destructive/50"
                : powered
                  ? "bg-white/85 ring-foreground/10 hover:bg-white hover:ring-primary/40"
                  : "bg-white/15 ring-white/15",
          surging && "anim-shake"
        )}
      >
        <ApplianceArt
          kind={a.art}
          on={running && !editMode}
          mode={device.mode}
          className={cn(
            "size-[62%] transition",
            !running && !powered && !editMode && "opacity-60 grayscale"
          )}
        />
        <span className="w-full truncate text-[10.5px] leading-tight font-semibold">
          {deviceName(device)}
        </span>
        <span
          className={cn(
            "w-full truncate text-[10px] leading-tight tabular-nums",
            editMode
              ? "font-semibold text-destructive"
              : running
                ? "font-semibold text-energy-deep"
                : "text-muted-foreground",
            !powered && !editMode && "text-white/70"
          )}
        >
          {editMode
            ? "× Lepas"
            : waiting
              ? "tak ada listrik"
              : a.modes.length > 1 && a.modes[device.mode].label.length <= 6
                ? `${a.modes[device.mode].label} · ${fmt(deviceWatt(device))}W`
                : `${fmt(deviceWatt(device))} W`}
        </span>
      </button>
      {editMode ? (
        <button
          type="button"
          onClick={() => remove.device(device.id)}
          className="absolute -top-1.5 -right-1.5 grid size-6 place-items-center rounded-full bg-destructive text-white shadow-md ring-2 ring-white transition hover:scale-110"
          aria-label={`Lepas ${d_name}`}
          tabIndex={-1}
        >
          <XIcon className="size-3.5" />
        </button>
      ) : (
        <button
          type="button"
          onClick={() => openDevice(device.id)}
          className="absolute -top-1 -right-1 grid size-6 place-items-center rounded-full bg-white text-primary shadow-sm ring-1 ring-foreground/10 transition hover:scale-110 hover:bg-primary hover:text-primary-foreground"
          aria-label={`Detail ${d_name}`}
        >
          <InfoIcon className="size-3.5" />
        </button>
      )}
      <span className="sr-only">{fmt(deviceVA(device))} VA</span>
    </div>
  )
}
