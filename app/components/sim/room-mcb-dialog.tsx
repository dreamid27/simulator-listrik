import * as React from "react"
import { CheckIcon, PlusIcon, SparklesIcon } from "lucide-react"

import { ApplianceArt } from "~/components/art/appliance-art"
import { CableArt, McbArt } from "~/components/art/gear-art"
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
import { CABLES, MCB_OPTIONS, VOLT, cableSpec } from "~/lib/sim/catalog"
import {
  appliance,
  circuitIdOf,
  deviceWatt,
  fmt,
  fmtMm,
  maxVA,
  deviceName,
} from "~/lib/sim/engine"
import { useSim, useSimStore } from "~/lib/sim/store"
import { cn } from "~/lib/utils"
import { CircuitTag } from "./house-view"
import { Term } from "./term"
import { useUi } from "./ui-store"

const NEW = "__new__"

/** Perangkat yang sebaiknya punya MCB sendiri. */
function isHeavy(applianceWatt: number, art: string) {
  return applianceWatt >= 600 || ["ac", "heater", "induction"].includes(art)
}

/**
 * "Tambah MCB di ruangan ini" — satu langkah untuk memasang MCB baru
 * (atau memakai MCB yang ada) dan memindahkan perangkat ruangan ke sana.
 */
export function RoomMcbDialog() {
  const { state, dispatch } = useSim()
  const { roomMcbId, openRoomMcb, setFocusCircuit } = useUi()
  const room = state.rooms.find((r) => r.id === roomMcbId)
  const devices = room ? state.devices.filter((d) => d.roomId === room.id) : []

  const [target, setTarget] = React.useState<string>(NEW)
  const [picked, setPicked] = React.useState<Set<string>>(new Set())
  const [roomDefault, setRoomDefault] = React.useState(false)
  const [name, setName] = React.useState("")
  const [nameTouched, setNameTouched] = React.useState(false)
  const [amp, setAmp] = React.useState<number | null>(null)
  const headRef = React.useRef<HTMLDivElement>(null)

  // atur ulang setiap kali jendela dibuka
  React.useEffect(() => {
    if (!room) return
    setTarget(NEW)
    setRoomDefault(false)
    setNameTouched(false)
    setAmp(null)
    // langkah 2 opsional: tidak ada perangkat yang dicentang otomatis
    setPicked(new Set())
  }, [roomMcbId]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!room) return <Dialog open={false} />

  const pickedDevices = devices.filter((d) => picked.has(d.id))
  const onlyLamps =
    pickedDevices.length > 0 &&
    pickedDevices.every((d) => appliance(d).plug === "saklar") &&
    !roomDefault
  const loadA = pickedDevices.reduce((sum, d) => sum + maxVA(d), 0) / VOLT
  const suggestedAmp =
    MCB_OPTIONS.find((m) => m >= Math.max(loadA * 1.25, onlyLamps ? 6 : 10)) ??
    MCB_OPTIONS[MCB_OPTIONS.length - 1]
  const mcbAmp = amp ?? suggestedAmp
  const cable =
    CABLES.find((c) => c.maxMcb >= mcbAmp && (onlyLamps || c.mm2 >= 2.5)) ??
    CABLES[CABLES.length - 1]
  const autoName =
    pickedDevices.length === 1
      ? `MCB ${appliance(pickedDevices[0]).short}`
      : `Grup ${room.name}`
  const finalName = (nameTouched ? name : autoName).trim() || autoName
  const existing = state.circuits.find((c) => c.id === target)
  const nothingMoved = pickedDevices.length === 0 && !roomDefault

  const toggle = (id: string) =>
    setPicked((p) => {
      const n = new Set(p)
      if (n.has(id)) n.delete(id)
      else n.add(id)
      return n
    })

  const submit = () => {
    const before = new Set(state.circuits.map((c) => c.id))
    dispatch({
      type: "assign-room-circuit",
      roomId: room.id,
      create:
        target === NEW
          ? { name: finalName, mcbAmp, cable: cable.mm2 }
          : undefined,
      circuitId: target === NEW ? undefined : target,
      deviceIds: [...picked],
      roomDefault,
    })
    openRoomMcb(null)
    // sorot MCB-nya supaya langsung terlihat kabel & kelompoknya
    if (target !== NEW) setFocusCircuit(target)
    else
      requestAnimationFrame(() => {
        const created = useSimStore
          .getState()
          .state.circuits.map((c) => c.id)
          .find((id) => !before.has(id))
        if (created) setFocusCircuit(created)
      })
  }

  return (
    <Dialog open onOpenChange={(o) => !o && openRoomMcb(null)}>
      <DialogContent
        className="max-h-[92svh] gap-0 overflow-y-auto p-0 sm:max-w-xl"
        initialFocus={headRef}
      >
        <DialogHeader
          ref={headRef}
          tabIndex={-1}
          className="border-b p-5 outline-none"
        >
          <DialogTitle className="font-heading text-lg font-semibold">
            Tambah MCB di {room.name}
          </DialogTitle>
          <DialogDescription>
            Pisahkan perangkat ke <Term k="mcb">MCB</Term> sendiri. Kalau satu
            MCB turun (njeglek), perangkat di MCB lain tetap menyala.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-5 p-5">
          {/* 1. pilih MCB */}
          <section>
            <Step n={1} title="Pakai MCB yang mana?" />
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => setTarget(NEW)}
                aria-pressed={target === NEW}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ring-1 transition",
                  target === NEW
                    ? "bg-primary text-primary-foreground ring-primary"
                    : "ring-border hover:bg-muted"
                )}
              >
                <PlusIcon className="size-3.5" />
                MCB baru
              </button>
              {state.circuits.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setTarget(c.id)}
                  aria-pressed={target === c.id}
                  className={cn(
                    "rounded-full ring-1 transition",
                    target === c.id
                      ? "ring-2 ring-primary"
                      : "ring-transparent hover:brightness-95"
                  )}
                >
                  <CircuitTag circuit={c} className="py-1 pr-2.5" />
                </button>
              ))}
            </div>

            {target === NEW && (
              <div className="mt-3 flex flex-col gap-3 rounded-2xl bg-art-soft/60 p-3">
                <div className="flex items-center gap-3">
                  <McbArt
                    amp={mcbAmp}
                    on
                    color="var(--art-accent)"
                    className="h-14 w-7 shrink-0"
                  />
                  <label className="flex flex-1 flex-col gap-1 text-xs font-medium">
                    Nama MCB
                    <Input
                      value={nameTouched ? name : autoName}
                      onChange={(e) => {
                        setNameTouched(true)
                        setName(e.target.value)
                      }}
                      className="h-9 bg-card"
                    />
                  </label>
                </div>
                <div>
                  <p className="mb-1 flex items-center gap-1.5 text-xs font-medium">
                    Ukuran MCB
                    {amp === null && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-energy-soft px-1.5 py-0.5 text-[10px] text-energy-deep">
                        <SparklesIcon className="size-3" /> disarankan dari
                        beban
                      </span>
                    )}
                  </p>
                  <div className="grid grid-cols-4 gap-1">
                    {MCB_OPTIONS.filter((m) => m >= 4).map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setAmp(m)}
                        className={cn(
                          "rounded-lg py-1.5 text-xs font-semibold ring-1 transition",
                          mcbAmp === m
                            ? "bg-primary text-primary-foreground ring-primary"
                            : "bg-card ring-border hover:bg-muted"
                        )}
                      >
                        {m} A
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2 rounded-xl bg-card px-3 py-2 text-xs">
                  <CableArt mm2={cable.mm2} className="h-6 w-9 shrink-0" />
                  <span>
                    Kabel otomatis: <b>{cable.label}</b>
                    <span className="text-muted-foreground">
                      {" "}
                      — aman untuk MCB sampai {cable.maxMcb} A
                      {onlyLamps
                        ? " (jalur lampu)"
                        : " (jalur stopkontak minimal 2,5 mm²)"}
                    </span>
                  </span>
                </div>
              </div>
            )}
            {existing && (
              <p className="mt-2 text-xs text-muted-foreground">
                {existing.name}: MCB {existing.mcbAmp} A, kabel{" "}
                {fmtMm(existing.cable)} mm² (aman ±{" "}
                {cableSpec(existing.cable).maxMcb} A).
              </p>
            )}
          </section>

          {/* 2. pilih perangkat */}
          <section>
            <Step n={2} title="Pindahkan perangkat ke MCB ini" optional />
            {devices.length === 0 ? (
              <p className="rounded-xl bg-muted/60 p-3 text-xs text-muted-foreground">
                Ruangan ini belum punya perangkat. Centang pilihan di bawah
                supaya perangkat baru nanti langsung ikut MCB ini.
              </p>
            ) : (
              <ul className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
                {devices.map((d) => {
                  const a = appliance(d)
                  const on = picked.has(d.id)
                  const cur = state.circuits.find(
                    (c) => c.id === circuitIdOf(state, d)
                  )
                  const heavy = isHeavy(
                    Math.max(...a.modes.map((m) => m.watt)),
                    a.art
                  )
                  return (
                    <li key={d.id}>
                      <button
                        type="button"
                        onClick={() => toggle(d.id)}
                        aria-pressed={on}
                        className={cn(
                          "relative flex w-full items-center gap-2 rounded-xl p-2 text-left ring-1 transition",
                          on
                            ? "bg-primary/8 ring-2 ring-primary"
                            : "ring-border hover:bg-muted"
                        )}
                      >
                        <span
                          className={cn(
                            "absolute top-1.5 right-1.5 grid size-4 place-items-center rounded-full ring-1",
                            on
                              ? "bg-primary text-primary-foreground ring-primary"
                              : "bg-card ring-border"
                          )}
                        >
                          {on && <CheckIcon className="size-3" />}
                        </span>
                        <ApplianceArt
                          kind={a.art}
                          mode={d.mode}
                          className="size-8 shrink-0"
                        />
                        <span className="min-w-0 pr-4">
                          <span className="block truncate text-xs font-semibold">
                            {deviceName(d)}
                          </span>
                          <span className="block text-[10.5px] text-muted-foreground tabular-nums">
                            {fmt(deviceWatt(d))} W · kini {cur?.mcbAmp}A
                          </span>
                          {heavy && (
                            <span className="mt-0.5 inline-block rounded-full bg-energy-soft px-1.5 text-[9.5px] font-semibold text-energy-deep">
                              disarankan MCB sendiri
                            </span>
                          )}
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
            <label className="mt-2 flex cursor-pointer items-start gap-2 rounded-xl bg-muted/60 p-3 text-xs">
              <input
                type="checkbox"
                checked={roomDefault}
                onChange={(e) => setRoomDefault(e.target.checked)}
                className="mt-0.5 size-4 accent-[var(--primary)]"
              />
              <span>
                <span className="font-medium">
                  Jadikan MCB utama stopkontak {room.name}
                </span>
                <span className="block text-muted-foreground">
                  Perangkat lain yang tidak dipindah khusus, dan perangkat baru
                  yang dipasang nanti, ikut MCB ini.
                </span>
              </span>
            </label>
          </section>

          {nothingMoved ? (
            <p className="rounded-xl bg-safe-soft p-3 text-xs leading-relaxed">
              <b>Hasilnya:</b>{" "}
              {target === NEW ? (
                <>
                  MCB baru{" "}
                  <b>
                    {finalName} ({mcbAmp} A)
                  </b>{" "}
                  dipasang untuk {room.name}, masih kosong.
                </>
              ) : (
                <>
                  <b>{existing?.name}</b> ditambahkan ke {room.name}, masih
                  kosong.
                </>
              )}{" "}
              Isi nanti lewat tombol <b>+ Tambah</b> di kelompok MCB-nya.
            </p>
          ) : (
            <p className="rounded-xl bg-safe-soft p-3 text-xs leading-relaxed">
              <b>Hasilnya:</b>{" "}
              {pickedDevices.length > 0 && (
                <>
                  {pickedDevices.map((d) => deviceName(d)).join(", ")} (±{" "}
                  {fmt(loadA, 1)} A){" "}
                </>
              )}
              {roomDefault && <>+ stopkontak {room.name} </>}
              akan lewat{" "}
              <b>
                {target === NEW
                  ? `${finalName} (MCB ${mcbAmp} A baru)`
                  : existing?.name}
              </b>
              . Kabelnya langsung terlihat di denah.
            </p>
          )}
        </div>

        <DialogFooter className="m-0 rounded-none">
          <Button variant="ghost" onClick={() => openRoomMcb(null)}>
            Batal
          </Button>
          <Button onClick={submit}>
            <PlusIcon />
            {target === NEW
              ? "Pasang MCB"
              : nothingMoved
                ? "Tambahkan ke ruangan"
                : "Pindahkan ke MCB ini"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function Step({
  n,
  title,
  optional,
}: {
  n: number
  title: string
  optional?: boolean
}) {
  return (
    <p className="mb-2 flex items-center gap-2 text-sm font-semibold">
      <span className="grid size-5 place-items-center rounded-full bg-primary text-[11px] text-primary-foreground">
        {n}
      </span>
      {title}
      {optional && (
        <span className="rounded-full bg-muted px-2 py-0.5 text-[10.5px] font-medium text-muted-foreground">
          opsional
        </span>
      )}
    </p>
  )
}
