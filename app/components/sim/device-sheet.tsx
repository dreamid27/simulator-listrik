import * as React from "react"
import {
  CheckIcon,
  PowerIcon,
  Trash2Icon,
  TriangleAlertIcon,
  XIcon,
  LightbulbIcon,
} from "lucide-react"

import { ApplianceArt } from "~/components/art/appliance-art"
import {
  CableArt,
  KwhMeterArt,
  McbArt,
  PoleArt,
  SocketArt,
  SwitchArt,
} from "~/components/art/gear-art"
import { Button } from "~/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
} from "~/components/ui/sheet"
import { Slider } from "~/components/ui/slider"
import { cableSpec, tarifPerKwh, VOLT } from "~/lib/sim/catalog"
import {
  amps,
  analyze,
  appliance,
  circuitIdOf,
  circuitOf,
  dailyWh,
  deviceVA,
  deviceWatt,
  fmt,
  fmtMm,
  monthlyKwh,
  rupiah,
} from "~/lib/sim/engine"
import { useSim } from "~/lib/sim/store"
import type { Device, SimState } from "~/lib/sim/types"
import { cn } from "~/lib/utils"
import { Term } from "./term"
import { useQuickRemove, useUi } from "./ui-store"

type Node = {
  key: string
  art: React.ReactNode
  title: string
  status: "ok" | "warn" | "broken" | "idle"
  note: string
  action?: { label: string; run: () => void }
}

export function usePowerPath(
  s: SimState,
  d: Device,
  dispatch: ReturnType<typeof useSim>["dispatch"]
): Node[] {
  const a = appliance(d)
  const c = circuitOf(s, d)
  const room = s.rooms.find((r) => r.id === d.roomId)
  const cab = cableSpec(c?.cable ?? 2.5)
  const cl = analyze(s).circuits.find((x) => x.circuit.id === c?.id)
  const hot = !!cl && cl.amp > cab.maxMcb
  const plugged = s.devices.filter(
    (x) => x.roomId === d.roomId && appliance(x).plug === "stopkontak"
  ).length
  const nodes: Node[] = [
    {
      key: "pln",
      art: <PoleArt live className="h-10 w-3" />,
      title: "Jaringan PLN",
      status: "ok",
      note: "Listrik 220 V datang dari tiang lewat kabel ke rumah.",
    },
    {
      key: "main",
      art: (
        <KwhMeterArt
          powered={s.mainOn}
          display=""
          mcbOn={s.mainOn}
          className="h-10 w-7"
        />
      ),
      title: "Meteran & MCB PLN",
      status: s.mainOn ? "ok" : "broken",
      note: s.mainOn
        ? `Tuas naik. Batas total rumah ${fmt(s.dayaVA)} VA.`
        : "Tuas MCB PLN turun, jadi seluruh rumah tidak dapat listrik.",
      action: s.mainOn
        ? undefined
        : {
            label: "Naikkan MCB PLN",
            run: () => dispatch({ type: "toggle-main" }),
          },
    },
    {
      key: "circuit",
      art: (
        <McbArt
          amp={c?.mcbAmp ?? 0}
          on={!!c?.on}
          color={c?.color}
          className="h-10 w-5"
        />
      ),
      title: `MCB ${c?.name ?? "?"} (${c?.mcbAmp} A)`,
      status: c?.on ? "ok" : "broken",
      note: c?.on
        ? `Tuas naik. Grup ini boleh dialiri sampai ${c.mcbAmp} A.`
        : "Tuas MCB grup ini turun, jadi semua perangkat di jalur ini padam.",
      action: c?.on
        ? undefined
        : {
            label: `Naikkan MCB ${c?.name}`,
            run: () => c && dispatch({ type: "toggle-circuit", id: c.id }),
          },
    },
    {
      key: "cable",
      art: <CableArt mm2={c?.cable} hot={hot} className="h-8 w-10" />,
      title: `Kabel NYM ${fmtMm(c?.cable ?? 0)} mm²`,
      status: hot ? "warn" : "ok",
      note: hot
        ? `Kepanasan! Arus ${fmt(cl!.amp, 1)} A melebihi kemampuan kabel (± ${cab.maxMcb} A).`
        : `Menyalurkan listrik ke ${room?.name}. Aman sampai ± ${cab.maxMcb} A.`,
    },
    a.plug === "saklar"
      ? {
          key: "plug",
          art: <SwitchArt on={d.on} className="size-9" />,
          title: `Saklar lampu di ${room?.name}`,
          status: d.on ? "ok" : "idle",
          note: d.on
            ? "Saklar ditekan ke posisi nyala."
            : "Saklar masih di posisi mati.",
          action: d.on
            ? undefined
            : {
                label: "Tekan saklar",
                run: () => dispatch({ type: "toggle-device", id: d.id }),
              },
        }
      : {
          key: "plug",
          art: <SocketArt ground={s.grounding} plugged className="size-9" />,
          title: `Stopkontak di ${room?.name}`,
          status: plugged > (room?.sockets ?? 0) ? "warn" : "ok",
          note:
            plugged > (room?.sockets ?? 0)
              ? "Tercolok lewat colokan T/terminal karena lubang stopkontak kurang."
              : "Steker tercolok ke stopkontak dinding.",
        },
  ]
  if (a.plug === "stopkontak") {
    nodes.push({
      key: "button",
      art: (
        <span
          className={cn(
            "grid size-9 place-items-center rounded-full ring-2",
            d.on ? "bg-energy-soft ring-energy" : "bg-muted ring-border"
          )}
        >
          <PowerIcon
            className={cn(
              "size-4",
              d.on ? "text-energy-deep" : "text-muted-foreground"
            )}
          />
        </span>
      ),
      title: "Tombol power perangkat",
      status: d.on ? "ok" : "idle",
      note: d.on ? "Tombolnya dinyalakan." : "Tombolnya masih mati.",
      action: d.on
        ? undefined
        : {
            label: `Nyalakan ${a.short}`,
            run: () => dispatch({ type: "toggle-device", id: d.id }),
          },
    })
  }
  return nodes
}

export function PowerPath({ device }: { device: Device }) {
  const { state, dispatch, analysis } = useSim()
  const nodes = usePowerPath(state, device, dispatch)
  const running = analysis.runningIds.has(device.id)
  const firstBreak = nodes.findIndex(
    (n) => n.status === "broken" || n.status === "idle"
  )
  const a = appliance(device)

  const summary = running
    ? `${a.short} menyala karena listrik mengalir tanpa putus dari tiang PLN sampai ke perangkat.`
    : firstBreak >= 0
      ? `${a.short} mati karena aliran terputus di: ${nodes[firstBreak].title}.`
      : `${a.short} mati.`

  return (
    <div>
      <div
        className={cn(
          "mb-3 flex gap-2 rounded-xl p-3 text-[13px] leading-relaxed",
          running
            ? "bg-safe-soft text-foreground"
            : "bg-danger-soft text-foreground"
        )}
      >
        {running ? (
          <CheckIcon className="mt-0.5 size-4 shrink-0 text-safe" />
        ) : (
          <XIcon className="mt-0.5 size-4 shrink-0 text-destructive" />
        )}
        <p>{summary}</p>
      </div>
      <ol className="relative">
        {nodes.map((n, i) => {
          const cut = firstBreak >= 0 && i >= firstBreak
          const lineOk = !cut && n.status !== "broken" && n.status !== "idle"
          return (
            <li key={n.key} className="relative flex gap-3 pb-3 last:pb-0">
              {i < nodes.length - 1 && (
                <svg
                  className="absolute top-11 bottom-0 left-[21px] w-1 overflow-visible"
                  preserveAspectRatio="none"
                  aria-hidden
                >
                  <line
                    x1="1"
                    y1="0"
                    x2="1"
                    y2="100%"
                    stroke={lineOk ? "var(--energy)" : "var(--border)"}
                    strokeWidth="3"
                    className={lineOk ? "anim-flow" : undefined}
                    strokeDasharray={lineOk ? undefined : "3 4"}
                  />
                </svg>
              )}
              <div
                className={cn(
                  "relative grid size-11 shrink-0 place-items-center rounded-xl ring-1",
                  n.status === "broken"
                    ? "bg-danger-soft ring-destructive/40"
                    : n.status === "warn"
                      ? "bg-warn-soft ring-warn/40"
                      : n.status === "idle"
                        ? "bg-muted ring-border"
                        : "bg-card ring-foreground/10",
                  cut && i > firstBreak && "opacity-50"
                )}
              >
                {n.art}
              </div>
              <div
                className={cn(
                  "min-w-0 flex-1 pt-0.5",
                  cut && i > firstBreak && "opacity-50"
                )}
              >
                <p className="flex items-center gap-1.5 text-[13px] font-semibold">
                  {n.title}
                  {n.status === "ok" && (
                    <CheckIcon className="size-3.5 text-safe" />
                  )}
                  {n.status === "warn" && (
                    <TriangleAlertIcon className="size-3.5 text-warn" />
                  )}
                  {(n.status === "broken" || n.status === "idle") && (
                    <XIcon className="size-3.5 text-destructive" />
                  )}
                </p>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  {n.note}
                </p>
                {n.action && i === firstBreak && (
                  <Button size="sm" className="mt-1.5" onClick={n.action.run}>
                    {n.action.label}
                  </Button>
                )}
              </div>
            </li>
          )
        })}
        <li className="relative mt-1 flex items-center gap-3">
          <div
            className={cn(
              "grid size-11 shrink-0 place-items-center rounded-xl ring-1",
              running ? "bg-energy-soft ring-energy" : "bg-muted ring-border"
            )}
          >
            <ApplianceArt
              kind={a.art}
              on={running}
              mode={device.mode}
              className="size-8"
            />
          </div>
          <p className="text-[13px] font-semibold">
            {running ? `${a.short} bekerja` : `${a.short} tidak bekerja`}
          </p>
        </li>
      </ol>
    </div>
  )
}

export function DeviceSheet() {
  const { state, dispatch, analysis } = useSim()
  const { deviceId, openDevice } = useUi()
  const device = state.devices.find((d) => d.id === deviceId)
  const [last, setLast] = React.useState<Device | undefined>(device)
  React.useEffect(() => {
    if (device) setLast(device)
  }, [device])
  const d = device ?? last
  const topRef = React.useRef<HTMLDivElement>(null)

  return (
    <Sheet open={!!device} onOpenChange={(o) => !o && openDevice(null)}>
      <SheetContent
        className="w-full gap-0 overflow-y-auto p-0 sm:max-w-md [&>*]:shrink-0"
        initialFocus={topRef}
      >
        <div ref={topRef} tabIndex={-1} className="outline-none" />
        {d && (
          <DeviceBody
            d={d}
            running={analysis.runningIds.has(d.id)}
            dispatch={dispatch}
            state={state}
            onClose={() => openDevice(null)}
          />
        )}
      </SheetContent>
    </Sheet>
  )
}

function DeviceBody({
  d,
  running,
  dispatch,
  state,
  onClose,
}: {
  d: Device
  running: boolean
  dispatch: ReturnType<typeof useSim>["dispatch"]
  state: SimState
  onClose: () => void
}) {
  const a = appliance(d)
  const room = state.rooms.find((r) => r.id === d.roomId)
  const autoCircuit = state.circuits.find(
    (c) => c.id === circuitIdOf(state, { ...d, circuitId: null })
  )
  const w = deviceWatt(d)
  const va = deviceVA(d)
  const kwh = monthlyKwh(d)
  const tarif = tarifPerKwh(state.dayaVA, state.subsidi)

  return (
    <>
      <div className="relative overflow-hidden bg-linear-to-b from-art-soft to-card px-5 pt-8 pb-4">
        <div
          aria-hidden
          className={cn(
            "absolute inset-0 transition-opacity duration-500",
            running ? "opacity-100" : "opacity-0"
          )}
          style={{
            background:
              "radial-gradient(60% 60% at 50% 40%, color-mix(in oklch, var(--energy) 40%, transparent), transparent)",
          }}
        />
        <ApplianceArt
          kind={a.art}
          on={running}
          mode={d.mode}
          className="relative mx-auto size-32"
          title={a.name}
        />
        <SheetTitle className="relative mt-3 text-center font-heading text-xl font-semibold">
          {d.label?.trim() || a.name}
        </SheetTitle>
        {(d.label || a.custom) && (
          <p className="relative text-center text-[11px] font-medium text-primary">
            {a.custom ? "Perangkat buatanmu" : a.name}
          </p>
        )}
        <SheetDescription className="relative text-center text-xs">
          di {room?.name} ·{" "}
          {running
            ? "sedang menyala"
            : d.on
              ? "saklar nyala, tapi tidak ada listrik"
              : "mati"}
        </SheetDescription>
        <div className="relative mt-3 flex justify-center gap-2">
          <Button
            size="lg"
            variant={d.on ? "outline" : "default"}
            className="h-10 min-w-36 rounded-full text-sm"
            onClick={() => dispatch({ type: "toggle-device", id: d.id })}
          >
            <PowerIcon />
            {d.on ? "Matikan" : "Nyalakan"}
          </Button>
          <RemoveButton id={d.id} roomName={room?.name} onDone={onClose} />
        </div>
      </div>

      <div className="flex flex-col gap-5 p-5">
        <p className="text-[13px] leading-relaxed text-muted-foreground">
          {a.description}
        </p>

        {a.custom && (
          <p className="rounded-xl bg-primary/5 p-3 text-xs leading-relaxed text-muted-foreground">
            Ini perangkat buatanmu. Untuk mengubah nama, watt, atau
            ilustrasinya, buka <b className="text-foreground">+ Tambah</b> di
            ruangan lalu ketuk ikon ✎ pada kartunya.
          </p>
        )}

        {a.modes.length > 1 && (
          <section>
            <h4 className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              Mode
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {a.modes.map((m, i) => (
                <button
                  key={m.label}
                  type="button"
                  onClick={() =>
                    dispatch({ type: "device-mode", id: d.id, mode: i })
                  }
                  className={cn(
                    "rounded-full px-3 py-1.5 text-xs font-medium ring-1 transition",
                    d.mode === i
                      ? "bg-primary text-primary-foreground ring-primary"
                      : "bg-card ring-border hover:bg-muted"
                  )}
                >
                  {m.label} · {fmt(m.watt)} W
                </button>
              ))}
            </div>
          </section>
        )}

        <section>
          <h4 className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            Butuh listrik berapa?
          </h4>
          <div className="grid grid-cols-3 gap-2">
            <Fact label={<Term k="watt">Tenaga</Term>} value={`${fmt(w)} W`} />
            <Fact
              label={<Term k="va">Jatah daya</Term>}
              value={`${fmt(va)} VA`}
            />
            <Fact
              label={<Term k="ampere">Arus</Term>}
              value={`${fmt(amps(va), 2)} A`}
            />
          </div>
          <div className="mt-2 rounded-xl bg-muted/60 p-3 text-xs leading-relaxed text-muted-foreground">
            <p>
              <span className="font-medium text-foreground">Cara hitung:</span>{" "}
              {fmt(w)} W ÷ <Term k="pf">faktor daya</Term> {fmt(a.pf, 2)} ={" "}
              <b className="text-foreground">{fmt(va)} VA</b>, lalu {fmt(va)} VA
              ÷ {VOLT} V ={" "}
              <b className="text-foreground">{fmt(amps(va), 2)} A</b>.
            </p>
            <p
              className={cn(
                "mt-1",
                va > state.dayaVA && "font-medium text-destructive"
              )}
            >
              Ini {fmt((va / state.dayaVA) * 100)}% dari daya rumahmu (
              {fmt(state.dayaVA)} VA).
              {va > state.dayaVA &&
                " Perangkat ini saja sudah melebihi daya — pasti njeglek kalau dinyalakan."}
            </p>
            {a.surge > 1.1 && (
              <p className="mt-1.5 text-foreground/80">
                ⚡ <Term k="surge">Lonjakan saat mulai</Term>: ±{" "}
                {fmt(a.surge, 1)}× → sesaat {fmt(va * a.surge)} VA.
              </p>
            )}
          </div>
        </section>

        <section>
          <h4 className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            Kenapa {running ? "menyala" : "mati"}?
          </h4>
          <PowerPath device={d} />
        </section>

        <section>
          <h4 className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            Pemakaian sehari-hari
          </h4>
          <div className="flex flex-col gap-3">
            {a.modes.map((m, i) => (
              <HoursSlider
                key={m.label}
                label={a.modes.length > 1 ? m.label : "Lama menyala"}
                value={d.hours[i] ?? 0}
                onChange={(h) =>
                  dispatch({
                    type: "device-hours",
                    id: d.id,
                    index: i,
                    hours: h,
                  })
                }
              />
            ))}
          </div>
          <div className="mt-3 flex items-center justify-between rounded-xl bg-art-soft/60 px-3 py-2.5 text-sm">
            <span className="text-muted-foreground">
              ≈ {fmt(dailyWh(d) / 1000, 2)} <Term k="kwh">kWh</Term>/hari ·{" "}
              {fmt(kwh, 1)} kWh/bulan
            </span>
            <span className="font-semibold tabular-nums">
              {rupiah(kwh * tarif)}/bln
            </span>
          </div>
          {a.duty < 1 && (
            <p className="mt-1.5 text-[11px] text-muted-foreground">
              Sudah memperhitungkan mesin yang bekerja hidup-mati otomatis (±{" "}
              {fmt(a.duty * 100)}% waktu).
            </p>
          )}
        </section>

        <section>
          <h4 className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            Jalur MCB
          </h4>
          <div className="flex flex-wrap gap-1.5">
            <ChoiceChip
              active={!d.circuitId}
              onClick={() =>
                dispatch({ type: "device-circuit", id: d.id, circuitId: null })
              }
            >
              Otomatis ({autoCircuit?.name})
            </ChoiceChip>
            {state.circuits.map((c) => (
              <ChoiceChip
                key={c.id}
                active={d.circuitId === c.id}
                onClick={() =>
                  dispatch({
                    type: "device-circuit",
                    id: d.id,
                    circuitId: c.id,
                  })
                }
              >
                <span
                  className="size-2 rounded-full"
                  style={{ background: c.color }}
                />
                {c.name}
              </ChoiceChip>
            ))}
          </div>
          <p className="mt-1.5 text-[11px] text-muted-foreground">
            {a.plug === "saklar"
              ? "Lampu otomatis ikut grup khusus lampu (kalau ada), selain itu ikut grup ruangannya."
              : "Perangkat besar (AC, water heater, kompor induksi) sebaiknya punya grup MCB sendiri."}
          </p>
        </section>

        {a.tip && (
          <div className="flex gap-2.5 rounded-xl bg-energy-soft p-3 text-[13px] leading-relaxed">
            <LightbulbIcon className="mt-0.5 size-4 shrink-0 text-energy-deep" />
            <p>{a.tip}</p>
          </div>
        )}
      </div>
    </>
  )
}

function Fact({ label, value }: { label: React.ReactNode; value: string }) {
  return (
    <div className="rounded-xl bg-card px-2 py-2 text-center ring-1 ring-foreground/8">
      <div className="text-[11px] text-muted-foreground">{label}</div>
      <div className="text-sm font-semibold tabular-nums">{value}</div>
    </div>
  )
}

export function HoursSlider({
  label,
  value,
  onChange,
}: {
  label: string
  value: number
  onChange: (v: number) => void
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between text-xs">
        <span className="font-medium">{label}</span>
        <span className="text-muted-foreground tabular-nums">
          {value < 1 && value > 0
            ? `${fmt(value * 60)} menit`
            : `${fmt(value, 1)} jam`}
          /hari
        </span>
      </div>
      <Slider
        min={0}
        max={24}
        step={0.25}
        value={[value]}
        onValueChange={(v) => onChange(Array.isArray(v) ? v[0] : (v as number))}
        aria-label={label}
      />
    </div>
  )
}

export function ChoiceChip({
  active,
  onClick,
  children,
  className,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
  className?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ring-1 transition",
        active
          ? "bg-primary text-primary-foreground ring-primary"
          : "bg-card ring-border hover:bg-muted",
        className
      )}
    >
      {children}
    </button>
  )
}

function RemoveButton({
  id,
  roomName,
  onDone,
}: {
  id: string
  roomName?: string
  onDone: () => void
}) {
  const remove = useQuickRemove()
  return (
    <Button
      size="lg"
      variant="destructive"
      className="h-10 rounded-full text-sm"
      title={`Lepas dari ${roomName} (bisa dibatalkan)`}
      onClick={() => {
        remove.device(id)
        onDone()
      }}
    >
      <Trash2Icon />
      Lepas
    </Button>
  )
}
