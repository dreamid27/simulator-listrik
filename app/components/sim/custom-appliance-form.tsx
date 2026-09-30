import * as React from "react"
import { ArrowLeftIcon, PlusIcon, SaveIcon, Trash2Icon } from "lucide-react"

import { ApplianceArt } from "~/components/art/appliance-art"
import { Button } from "~/components/ui/button"
import { Input } from "~/components/ui/input"
import { VOLT } from "~/lib/sim/catalog"
import { fmt } from "~/lib/sim/engine"
import type { Appliance, ArtKind, Category, RoomKind } from "~/lib/sim/types"
import { cn } from "~/lib/utils"

const ART_CHOICES: { kind: ArtKind; label: string }[] = [
  { kind: "gadget", label: "Umum" },
  { kind: "multi", label: "Terminal" },
  { kind: "bulb", label: "Lampu" },
  { kind: "tube", label: "Neon" },
  { kind: "fan", label: "Kipas" },
  { kind: "exhaust", label: "Exhaust" },
  { kind: "ac", label: "AC" },
  { kind: "fridge", label: "Kulkas" },
  { kind: "fridge2", label: "Kulkas 2P" },
  { kind: "dispenser", label: "Dispenser" },
  { kind: "ricecooker", label: "Penanak" },
  { kind: "induction", label: "Kompor" },
  { kind: "microwave", label: "Microwave" },
  { kind: "oven", label: "Oven" },
  { kind: "blender", label: "Blender" },
  { kind: "kettle", label: "Teko" },
  { kind: "washer", label: "Mesin cuci" },
  { kind: "iron", label: "Setrika" },
  { kind: "pump", label: "Pompa" },
  { kind: "heater", label: "Pemanas" },
  { kind: "vacuum", label: "Vacuum" },
  { kind: "hairdryer", label: "Hair dryer" },
  { kind: "tv", label: "TV" },
  { kind: "laptop", label: "Laptop" },
  { kind: "pc", label: "Komputer" },
  { kind: "router", label: "Router" },
  { kind: "phone", label: "HP" },
  { kind: "speaker", label: "Speaker" },
  { kind: "cctv", label: "CCTV" },
  { kind: "dvr", label: "Perekam" },
  { kind: "evcharger", label: "Motor listrik" },
  { kind: "aquarium", label: "Akuarium" },
]

type Kind = "elektronik" | "motor" | "pemanas" | "lampu"

const KINDS: {
  id: Kind
  label: string
  hint: string
  pf: number
  surge: number
  duty: number
  category: Category
}[] = [
  {
    id: "elektronik",
    label: "Elektronik",
    hint: "TV, printer, konsol game, charger…",
    pf: 0.9,
    surge: 1,
    duty: 1,
    category: "hiburan",
  },
  {
    id: "motor",
    label: "Bermotor",
    hint: "Pompa, kompresor, mesin jahit… (lonjakan saat mulai)",
    pf: 0.8,
    surge: 3,
    duty: 1,
    category: "rumah-tangga",
  },
  {
    id: "pemanas",
    label: "Pemanas",
    hint: "Penghangat, solder, pemanggang…",
    pf: 1,
    surge: 1,
    duty: 0.8,
    category: "dapur",
  },
  {
    id: "lampu",
    label: "Lampu",
    hint: "Menyala lewat saklar, ikut grup lampu",
    pf: 0.9,
    surge: 1,
    duty: 1,
    category: "lampu",
  },
]

const ALL_ROOMS: RoomKind[] = [
  "teras",
  "tamu",
  "kamar",
  "dapur",
  "mandi",
  "cuci",
]
const WATT_CHIPS = [10, 50, 100, 300, 600, 1000]
const HOUR_CHIPS = [1, 4, 8, 24]

function kindOf(a: Appliance): Kind {
  if (a.plug === "saklar") return "lampu"
  if (a.surge > 1.5) return "motor"
  if (a.pf >= 1) return "pemanas"
  return "elektronik"
}

/** Form membuat / mengubah perangkat buatan sendiri. */
export function CustomApplianceForm({
  editing,
  prefillName,
  usedCount,
  targetName,
  onCancel,
  onSave,
  onDelete,
}: {
  editing?: Appliance
  prefillName?: string
  usedCount: number
  targetName?: string
  onCancel: () => void
  onSave: (a: Appliance, addNow: boolean) => void
  onDelete: (id: string) => void
}) {
  const [name, setName] = React.useState(editing?.name ?? prefillName ?? "")
  const [art, setArt] = React.useState<ArtKind>(editing?.art ?? "gadget")
  const [watt, setWatt] = React.useState(String(editing?.modes[0].watt ?? ""))
  const [kind, setKind] = React.useState<Kind>(
    editing ? kindOf(editing) : "elektronik"
  )
  const [hours, setHours] = React.useState(String(editing?.hours[0] ?? 4))
  const [confirmDelete, setConfirmDelete] = React.useState(false)

  const w = Number(watt.replace(",", "."))
  const h = Number(hours.replace(",", "."))
  const validW = Number.isFinite(w) && w > 0 && w <= 10000
  const validH = Number.isFinite(h) && h >= 0 && h <= 24
  const valid = name.trim().length > 0 && validW && validH
  const k = KINDS.find((x) => x.id === kind)!

  const build = (): Appliance => ({
    id: editing?.id ?? `custom-${Date.now().toString(36)}`,
    name: name.trim(),
    short: name.trim(),
    art,
    category: k.category,
    modes: [{ label: "Menyala", watt: w }],
    pf: k.pf,
    surge: k.surge,
    duty: k.duty,
    hours: [h],
    plug: kind === "lampu" ? "saklar" : "stopkontak",
    rooms: ALL_ROOMS,
    description: `Perangkat buatanmu (${k.label.toLowerCase()}, ${fmt(w)} W).`,
    custom: true,
  })

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex-1 overflow-y-auto p-5">
        <button
          type="button"
          onClick={onCancel}
          className="mb-3 inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeftIcon className="size-3.5" /> Kembali ke daftar
        </button>
        <div className="grid gap-5 md:grid-cols-[180px_1fr]">
          {/* pratinjau */}
          <div className="flex flex-col items-center gap-2 rounded-2xl bg-energy-soft p-4 text-center md:self-start">
            <ApplianceArt kind={art} on className="size-24" />
            <p className="w-full truncate text-sm font-semibold">
              {name.trim() || "Nama perangkat"}
            </p>
            <p className="text-xs text-muted-foreground tabular-nums">
              {validW ? `${fmt(w)} W · ± ${fmt(w / k.pf / VOLT, 2)} A` : "— W"}
            </p>
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
              Buatanmu
            </span>
          </div>

          <div className="flex flex-col gap-4">
            <label className="flex flex-col gap-1.5 text-xs font-medium">
              Nama perangkat
              <Input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="mis. Mesin jahit, Printer, Kulkas es krim"
                className="h-10"
                maxLength={40}
              />
            </label>

            <div>
              <p className="mb-1.5 text-xs font-medium">Daya (watt)</p>
              <div className="flex flex-wrap items-center gap-1.5">
                <Input
                  inputMode="decimal"
                  value={watt}
                  onChange={(e) => setWatt(e.target.value)}
                  placeholder="mis. 120"
                  className={cn(
                    "h-9 w-28",
                    watt && !validW && "border-destructive"
                  )}
                  aria-label="Daya dalam watt"
                />
                <span className="text-xs text-muted-foreground">W</span>
                {WATT_CHIPS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setWatt(String(c))}
                    className={cn(
                      "rounded-full px-2.5 py-1 text-xs ring-1 transition",
                      w === c
                        ? "bg-primary text-primary-foreground ring-primary"
                        : "ring-border hover:bg-muted"
                    )}
                  >
                    {fmt(c)}
                  </button>
                ))}
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Lihat stiker/label di belakang alat, biasanya tertulis “Power”
                atau “W”.
              </p>
            </div>

            <div>
              <p className="mb-1.5 text-xs font-medium">Jenis</p>
              <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
                {KINDS.map((x) => (
                  <button
                    key={x.id}
                    type="button"
                    onClick={() => setKind(x.id)}
                    aria-pressed={kind === x.id}
                    className={cn(
                      "rounded-xl p-2 text-left ring-1 transition",
                      kind === x.id
                        ? "bg-primary/8 ring-2 ring-primary"
                        : "ring-border hover:bg-muted"
                    )}
                  >
                    <span className="block text-xs font-semibold">
                      {x.label}
                    </span>
                    <span className="block text-[10.5px] leading-snug text-muted-foreground">
                      {x.hint}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-1.5 text-xs font-medium">
                Dipakai berapa jam sehari?
              </p>
              <div className="flex flex-wrap items-center gap-1.5">
                <Input
                  inputMode="decimal"
                  value={hours}
                  onChange={(e) => setHours(e.target.value)}
                  className={cn(
                    "h-9 w-20",
                    hours && !validH && "border-destructive"
                  )}
                  aria-label="Jam per hari"
                />
                <span className="text-xs text-muted-foreground">jam</span>
                {HOUR_CHIPS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setHours(String(c))}
                    className={cn(
                      "rounded-full px-2.5 py-1 text-xs ring-1 transition",
                      h === c
                        ? "bg-primary text-primary-foreground ring-primary"
                        : "ring-border hover:bg-muted"
                    )}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-1.5 text-xs font-medium">Ilustrasi</p>
              <div className="grid grid-cols-5 gap-1.5 sm:grid-cols-8">
                {ART_CHOICES.map((c) => (
                  <button
                    key={c.kind}
                    type="button"
                    onClick={() => setArt(c.kind)}
                    aria-pressed={art === c.kind}
                    title={c.label}
                    className={cn(
                      "flex flex-col items-center gap-0.5 rounded-xl p-1.5 ring-1 transition",
                      art === c.kind
                        ? "bg-primary/8 ring-2 ring-primary"
                        : "ring-border hover:bg-muted"
                    )}
                  >
                    <ApplianceArt kind={c.kind} className="size-8" />
                    <span className="w-full truncate text-center text-[9.5px] text-muted-foreground">
                      {c.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t bg-muted/50 p-4">
        {editing &&
          (confirmDelete ? (
            <span className="flex items-center gap-1.5 text-xs">
              Hapus{usedCount ? ` & lepas ${usedCount} terpasang` : ""}?
              <Button
                size="sm"
                variant="destructive"
                onClick={() => onDelete(editing.id)}
              >
                Hapus
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setConfirmDelete(false)}
              >
                Batal
              </Button>
            </span>
          ) : (
            <Button
              variant="destructive"
              onClick={() => setConfirmDelete(true)}
            >
              <Trash2Icon />
              Hapus perangkat ini
            </Button>
          ))}
        <div className="ml-auto flex gap-2">
          <Button variant="ghost" onClick={onCancel}>
            Batal
          </Button>
          {editing ? (
            <Button disabled={!valid} onClick={() => onSave(build(), false)}>
              <SaveIcon />
              Simpan perubahan
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                disabled={!valid}
                onClick={() => onSave(build(), false)}
              >
                Simpan ke daftar saja
              </Button>
              <Button disabled={!valid} onClick={() => onSave(build(), true)}>
                <PlusIcon />
                Simpan & pasang{targetName ? ` di ${targetName}` : ""}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
