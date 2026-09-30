import * as React from "react"
import { ArrowRightLeftIcon, Trash2Icon } from "lucide-react"

import { ApplianceArt } from "~/components/art/appliance-art"
import { Button } from "~/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog"
import { VOLT } from "~/lib/sim/catalog"
import {
  appliance,
  circuitIdOf,
  fmt,
  maxVA,
  deviceName,
} from "~/lib/sim/engine"
import { useSim } from "~/lib/sim/store"
import { cn } from "~/lib/utils"
import { CircuitTag } from "./house-view"
import { useUi } from "./ui-store"

/**
 * "Lepas MCB dari ruangan" — perangkat di MCB itu bisa dipindah ke MCB lain
 * (dipilih) atau ikut dilepas. Bisa dibatalkan lewat tombol Batalkan.
 */
export function RoomMcbRemoveDialog() {
  const { state, dispatch } = useSim()
  const { detach, openDetach, pushUndo, focusCircuitId, setFocusCircuit } =
    useUi()
  const room = state.rooms.find((r) => r.id === detach?.roomId)
  const circuit = state.circuits.find((c) => c.id === detach?.circuitId)

  const [mode, setMode] = React.useState<"move" | "delete">("move")
  const [targetId, setTargetId] = React.useState<string | null>(null)
  const [removeFromBox, setRemoveFromBox] = React.useState(true)
  const headRef = React.useRef<HTMLDivElement>(null)

  const affected =
    room && circuit
      ? state.devices.filter(
          (d) => d.roomId === room.id && circuitIdOf(state, d) === circuit.id
        )
      : []
  const others = state.circuits.filter((c) => c.id !== circuit?.id)
  // MCB yang sudah ada di ruangan ini disarankan lebih dulu
  const inRoom = (id: string) =>
    !!room &&
    (room.circuitId === id ||
      room.extraCircuitIds?.includes(id) ||
      state.devices.some(
        (d) => d.roomId === room.id && circuitIdOf(state, d) === id
      ))
  const sortedTargets = [...others].sort(
    (a, b) => Number(inRoom(b.id)) - Number(inRoom(a.id))
  )

  React.useEffect(() => {
    if (!detach) return
    setMode("move")
    setRemoveFromBox(true)
    const plugs = sortedTargets.filter((c) => !c.forLights)
    setTargetId((plugs[0] ?? sortedTargets[0])?.id ?? null)
  }, [detach?.roomId, detach?.circuitId]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!room || !circuit) return <Dialog open={false} />

  const isMain = room.circuitId === circuit.id
  const hasDevices = affected.length > 0
  const needTarget = (hasDevices && mode === "move") || isMain
  const target = state.circuits.find((c) => c.id === targetId)
  const usedElsewhere =
    state.rooms.some(
      (r) =>
        r.id !== room.id &&
        (r.circuitId === circuit.id || r.extraCircuitIds?.includes(circuit.id))
    ) ||
    state.devices.some(
      (d) => d.roomId !== room.id && circuitIdOf(state, d) === circuit.id
    )
  const canDropFromBox = !usedElsewhere && state.circuits.length > 1
  const blocked = needTarget && !target
  const movedA = affected.reduce((s, d) => s + maxVA(d), 0) / VOLT

  const submit = () => {
    if (blocked) return
    pushUndo(`${circuit.name} dilepas dari ${room.name}`, state)
    if (focusCircuitId === circuit.id) setFocusCircuit(null)
    dispatch({
      type: "detach-room-circuit",
      roomId: room.id,
      circuitId: circuit.id,
      devices: hasDevices ? mode : "move",
      targetId: target?.id,
      removeFromBox: canDropFromBox && removeFromBox,
    })
    openDetach(null)
  }

  return (
    <Dialog open onOpenChange={(o) => !o && openDetach(null)}>
      <DialogContent
        className="max-h-[92svh] gap-0 overflow-y-auto p-0 sm:max-w-lg"
        initialFocus={headRef}
      >
        <DialogHeader
          ref={headRef}
          tabIndex={-1}
          className="border-b p-5 outline-none"
        >
          <DialogTitle className="font-heading text-lg font-semibold">
            Lepas MCB dari {room.name}
          </DialogTitle>
          <DialogDescription className="flex flex-wrap items-center gap-1.5">
            <CircuitTag circuit={circuit} />
            {hasDevices
              ? `mengaliri ${affected.length} perangkat di ruangan ini.`
              : "belum mengaliri perangkat apa pun di ruangan ini."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 p-5">
          {hasDevices && (
            <section>
              <p className="mb-2 text-sm font-semibold">
                Perangkatnya mau diapakan?
              </p>
              <ul className="mb-3 flex flex-wrap gap-1.5">
                {affected.map((d) => (
                  <li
                    key={d.id}
                    className="flex items-center gap-1 rounded-full bg-muted py-0.5 pr-2.5 pl-0.5 text-xs"
                  >
                    <ApplianceArt
                      kind={appliance(d).art}
                      mode={d.mode}
                      className="size-6"
                    />
                    {deviceName(d)}
                  </li>
                ))}
              </ul>
              <div className="grid gap-2 sm:grid-cols-2">
                <Choice
                  active={mode === "move"}
                  onClick={() => setMode("move")}
                  icon={<ArrowRightLeftIcon className="size-4" />}
                  title="Pindahkan ke MCB lain"
                  text="Perangkat tetap terpasang, hanya jalurnya yang ganti."
                />
                <Choice
                  active={mode === "delete"}
                  onClick={() => setMode("delete")}
                  icon={<Trash2Icon className="size-4" />}
                  title="Lepas perangkatnya juga"
                  text={`${affected.length} perangkat ikut dicopot dari ${room.name}.`}
                  danger
                />
              </div>
            </section>
          )}

          {needTarget && (
            <section>
              <p className="mb-2 text-sm font-semibold">
                {hasDevices && mode === "move"
                  ? "Pindahkan ke MCB mana?"
                  : "MCB mana yang jadi MCB utama stopkontak ruangan ini?"}
              </p>
              {sortedTargets.length === 0 ? (
                <p className="rounded-xl bg-warn-soft p-3 text-xs">
                  Tidak ada MCB lain. Tambah MCB dulu lewat tombol “Tambah MCB
                  di ruangan ini”.
                </p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {sortedTargets.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setTargetId(c.id)}
                      aria-pressed={targetId === c.id}
                      className={cn(
                        "rounded-full ring-offset-1 transition",
                        targetId === c.id
                          ? "ring-2 ring-primary"
                          : "hover:brightness-95",
                        !inRoom(c.id) && targetId !== c.id && "opacity-60"
                      )}
                      title={
                        inRoom(c.id)
                          ? "Sudah ada di ruangan ini"
                          : "Belum dipakai di ruangan ini"
                      }
                    >
                      <CircuitTag circuit={c} className="py-1 pr-2.5" />
                    </button>
                  ))}
                </div>
              )}
              {isMain && (
                <p className="mt-2 text-[11px] text-muted-foreground">
                  Ini MCB utama stopkontak {room.name}, jadi perlu penggantinya.
                  Perangkat baru nanti otomatis lewat MCB pengganti.
                </p>
              )}
              {target && hasDevices && mode === "move" && (
                <p
                  className={cn(
                    "mt-2 text-[11px]",
                    movedA > target.mcbAmp
                      ? "font-medium text-warn-ink"
                      : "text-muted-foreground"
                  )}
                >
                  Beban yang pindah maks. ± {fmt(movedA, 1)} A ke {target.name}{" "}
                  ({target.mcbAmp} A)
                  {movedA > target.mcbAmp &&
                    " — bisa membuat MCB itu turun kalau semua menyala."}
                </p>
              )}
            </section>
          )}

          {canDropFromBox ? (
            <label className="flex cursor-pointer items-start gap-2 rounded-xl bg-muted/60 p-3 text-xs">
              <input
                type="checkbox"
                checked={removeFromBox}
                onChange={(e) => setRemoveFromBox(e.target.checked)}
                className="mt-0.5 size-4 accent-[var(--primary)]"
              />
              <span>
                <span className="font-medium">
                  Hapus juga {circuit.name} dari box MCB
                </span>
                <span className="block text-muted-foreground">
                  MCB ini tidak dipakai ruangan lain.
                </span>
              </span>
            </label>
          ) : (
            usedElsewhere && (
              <p className="rounded-xl bg-muted/60 p-3 text-xs text-muted-foreground">
                {circuit.name} tetap ada di box MCB karena masih dipakai ruangan
                lain.
              </p>
            )
          )}
        </div>

        <DialogFooter className="m-0 rounded-none">
          <Button variant="ghost" onClick={() => openDetach(null)}>
            Batal
          </Button>
          <Button
            variant={
              hasDevices && mode === "delete" ? "destructive" : "default"
            }
            onClick={submit}
            disabled={blocked}
          >
            <Trash2Icon />
            {hasDevices && mode === "delete"
              ? `Lepas MCB & ${affected.length} perangkat`
              : "Lepas MCB"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function Choice({
  active,
  onClick,
  icon,
  title,
  text,
  danger,
}: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  title: string
  text: string
  danger?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "flex gap-2.5 rounded-xl p-3 text-left ring-1 transition",
        active
          ? danger
            ? "bg-danger-soft ring-2 ring-destructive"
            : "bg-primary/8 ring-2 ring-primary"
          : "ring-border hover:bg-muted"
      )}
    >
      <span
        className={cn(
          "grid size-7 shrink-0 place-items-center rounded-lg",
          danger
            ? "bg-destructive/15 text-destructive"
            : "bg-primary/15 text-primary"
        )}
      >
        {icon}
      </span>
      <span>
        <span className="block text-sm font-semibold">{title}</span>
        <span className="block text-xs text-muted-foreground">{text}</span>
      </span>
    </button>
  )
}
