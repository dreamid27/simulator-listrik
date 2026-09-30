import * as React from "react"
import {
  CheckIcon,
  CopyPlusIcon,
  DownloadIcon,
  FilePlus2Icon,
  FolderOpenIcon,
  HouseIcon,
  PencilIcon,
  SaveIcon,
  Trash2Icon,
  UploadIcon,
} from "lucide-react"

import { ApplianceArt } from "~/components/art/appliance-art"
import { Button } from "~/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog"
import { Input } from "~/components/ui/input"
import { DAYA_LEVELS } from "~/lib/sim/catalog"
import { fmt } from "~/lib/sim/engine"
import { PRESETS, buildBlank } from "~/lib/sim/presets"
import {
  fromFile,
  newSaveId,
  signature,
  toFile,
  useSavedHouses,
  type SavedHouse,
} from "~/lib/sim/saves"
import { useSim } from "~/lib/sim/store"
import type { SimState } from "~/lib/sim/types"
import { cn } from "~/lib/utils"
import { useUi } from "./ui-store"

const DEFAULT_NAME = "Rumah saya"

/** Status dokumen rumah yang sedang dibuka + aksi simpan. */
export function useHouseDoc() {
  const { state, dispatch } = useSim()
  const saves = useSavedHouses()
  const saved = saves.get(state.docId)
  const name = state.docName?.trim() || DEFAULT_NAME
  const dirty = !saved || signature(saved.state) !== signature(state)

  const save = React.useCallback(
    (opts?: { asNew?: boolean; name?: string }) => {
      const finalName = (opts?.name ?? name).trim() || DEFAULT_NAME
      const id = !opts?.asNew && saved ? saved.id : newSaveId()
      const snapshot: SimState = {
        ...state,
        docId: id,
        docName: finalName,
        trip: null,
        flicker: null,
      }
      saves.upsert({
        id,
        name: finalName,
        savedAt: Date.now(),
        state: snapshot,
      })
      dispatch({ type: "set-doc", docId: id, docName: finalName })
      return id
    },
    [state, name, saved, saves, dispatch]
  )

  return { name, saved, dirty, save, saves }
}

/** Tombol di header: nama rumah + status simpan. */
export function HouseMenuButton() {
  const { setHousesOpen } = useUi()
  const { name, dirty, saved } = useHouseDoc()
  const [flash, setFlash] = React.useState(false)

  React.useEffect(() => {
    if (!saved?.savedAt || Date.now() - saved.savedAt > 1500) return
    setFlash(true)
    const t = setTimeout(() => setFlash(false), 1800)
    return () => clearTimeout(t)
  }, [saved?.savedAt])

  return (
    <Button
      variant="outline"
      onClick={() => setHousesOpen(true)}
      className="relative max-w-56 shrink-0"
      title={
        dirty
          ? `${name} — ada perubahan yang belum disimpan`
          : `${name} — tersimpan`
      }
    >
      {flash ? <CheckIcon className="text-safe" /> : <FolderOpenIcon />}
      <span className="hidden truncate md:inline">
        {flash ? "Tersimpan" : name}
      </span>
      {dirty && !flash && (
        <span
          className="absolute -top-1 -right-1 size-2.5 rounded-full bg-warn ring-2 ring-background"
          aria-label="Belum disimpan"
        />
      )}
    </Button>
  )
}

/** Ctrl/⌘ + S untuk menyimpan cepat. */
export function useSaveShortcut() {
  const { save } = useHouseDoc()
  const saveRef = React.useRef(save)
  saveRef.current = save
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault()
        saveRef.current()
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])
}

type Pending = { label: string; run: () => void }

export function HousesDialog() {
  const { state, dispatch } = useSim()
  const { housesOpen, setHousesOpen, setFocusCircuit, setEditMode, clearUndo } =
    useUi()
  const { name, saved, dirty, save, saves } = useHouseDoc()
  const [draftName, setDraftName] = React.useState(name)
  const [pending, setPending] = React.useState<Pending | null>(null)
  const [blankDaya, setBlankDaya] = React.useState(1300)
  const [blankName, setBlankName] = React.useState("")
  const [renaming, setRenaming] = React.useState<string | null>(null)
  const [renameText, setRenameText] = React.useState("")
  const [confirmDelete, setConfirmDelete] = React.useState<string | null>(null)
  const [fileError, setFileError] = React.useState<string | null>(null)
  const fileRef = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    if (housesOpen) {
      setDraftName(name)
      setPending(null)
      setFileError(null)
      setConfirmDelete(null)
      setRenaming(null)
      setBlankName("")
    }
  }, [housesOpen]) // eslint-disable-line react-hooks/exhaustive-deps

  const hasContent = state.rooms.length > 0 || state.devices.length > 0
  const commitName = () => {
    const n = draftName.trim() || DEFAULT_NAME
    if (n === name) return
    dispatch({ type: "set-doc", docId: state.docId ?? null, docName: n })
    if (saved) saves.rename(saved.id, n)
  }

  /** Jalankan aksi yang mengganti rumah — tanya dulu kalau ada perubahan belum disimpan. */
  const guard = (label: string, run: () => void) => {
    const go = () => {
      run()
      setFocusCircuit(null)
      setEditMode(false)
      clearUndo()
      setPending(null)
      setHousesOpen(false)
    }
    if (dirty && hasContent) setPending({ label, run: go })
    else go()
  }

  const openSaved = (h: SavedHouse) =>
    guard(`membuka "${h.name}"`, () =>
      dispatch({
        type: "open-doc",
        state: h.state,
        docId: h.id,
        docName: h.name,
        text: `Membuka rumah "${h.name}"`,
      })
    )

  const download = () => {
    const blob = new Blob([toFile(state, name)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${
      name
        .replace(/[^\p{L}\p{N}]+/gu, "-")
        .replace(/^-|-$/g, "")
        .toLowerCase() || "rumah"
    }.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const onFile = async (file: File | undefined) => {
    if (!file) return
    setFileError(null)
    try {
      const { name: n, state: st } = fromFile(await file.text())
      guard(`membuka file "${file.name}"`, () =>
        dispatch({
          type: "open-doc",
          state: st,
          docId: null,
          docName: n,
          text: `Membuka file "${file.name}"`,
        })
      )
    } catch (e) {
      setFileError(e instanceof Error ? e.message : "File tidak bisa dibaca.")
    } finally {
      if (fileRef.current) fileRef.current.value = ""
    }
  }

  return (
    <Dialog open={housesOpen} onOpenChange={setHousesOpen}>
      <DialogContent className="max-h-[92svh] gap-0 overflow-y-auto p-0 sm:max-w-2xl">
        <DialogHeader className="border-b p-5">
          <DialogTitle className="font-heading text-lg font-semibold">
            Rumah saya
          </DialogTitle>
          <DialogDescription>
            Simpan rancangan rumahmu, buka lagi kapan saja, atau mulai rumah
            baru dari nol.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-6 p-5">
          {pending && (
            <div className="flex flex-col gap-3 rounded-2xl bg-warn-soft p-4 ring-1 ring-warn/30">
              <p className="text-sm leading-relaxed">
                <b>{name}</b> punya perubahan yang belum disimpan. Simpan dulu
                sebelum {pending.label}?
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={() => {
                    save({ name: draftName })
                    pending.run()
                  }}
                >
                  <SaveIcon />
                  Simpan, lalu lanjut
                </Button>
                <Button variant="outline" onClick={pending.run}>
                  Lanjut tanpa menyimpan
                </Button>
                <Button variant="ghost" onClick={() => setPending(null)}>
                  Batal
                </Button>
              </div>
            </div>
          )}

          {/* rumah yang sedang dibuka */}
          <section className="rounded-2xl bg-art-soft/60 p-4">
            <p className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              Sedang dibuka
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <Input
                value={draftName}
                onChange={(e) => setDraftName(e.target.value)}
                onBlur={commitName}
                onKeyDown={(e) =>
                  e.key === "Enter" && (e.currentTarget.blur(), commitName())
                }
                className="h-10 min-w-0 flex-1 bg-card text-base font-medium"
                aria-label="Nama rumah"
              />
              <Button
                className="h-10"
                onClick={() => save({ name: draftName })}
                disabled={!dirty && !!saved}
              >
                <SaveIcon />
                {saved ? "Simpan" : "Simpan rumah"}
              </Button>
              {saved && (
                <Button
                  className="h-10"
                  variant="outline"
                  onClick={() =>
                    save({
                      asNew: true,
                      name: `${draftName.trim() || name} (salinan)`,
                    })
                  }
                >
                  <CopyPlusIcon />
                  Simpan sebagai baru
                </Button>
              )}
            </div>
            <p
              className={cn("mt-2 text-xs", dirty ? "text-warn" : "text-safe")}
            >
              {!saved
                ? "Belum pernah disimpan. Tetap aman di browser ini, tapi simpan supaya bisa dibuka lagi dari daftar."
                : dirty
                  ? `Ada perubahan sejak disimpan ${when(saved.savedAt)}.`
                  : `✓ Tersimpan ${when(saved.savedAt)}.`}{" "}
              <span className="text-muted-foreground">Pintasan: Ctrl + S</span>
            </p>
          </section>

          {/* buat baru */}
          <section>
            <h3 className="mb-2 font-heading text-base font-semibold">
              Buat rumah baru
            </h3>
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="flex flex-col gap-2.5 rounded-2xl p-4 ring-2 ring-primary/40 sm:row-span-3">
                <div className="flex items-center gap-2">
                  <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground">
                    <FilePlus2Icon className="size-5" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold">Dari nol</p>
                    <p className="text-xs text-muted-foreground">
                      Rumah kosong + box MCB standar (lampu & stopkontak)
                    </p>
                  </div>
                </div>
                <Input
                  value={blankName}
                  onChange={(e) => setBlankName(e.target.value)}
                  placeholder="Nama, mis. Rumah Bekasi"
                  className="h-9"
                  aria-label="Nama rumah baru"
                />
                <div>
                  <p className="mb-1 text-xs font-medium">Daya PLN</p>
                  <div className="grid grid-cols-4 gap-1">
                    {DAYA_LEVELS.map((l) => (
                      <button
                        key={l.va}
                        type="button"
                        onClick={() => setBlankDaya(l.va)}
                        className={cn(
                          "rounded-lg py-1.5 text-xs font-semibold tabular-nums ring-1 transition",
                          blankDaya === l.va
                            ? "bg-primary text-primary-foreground ring-primary"
                            : "ring-border hover:bg-muted"
                        )}
                      >
                        {fmt(l.va)}
                      </button>
                    ))}
                  </div>
                </div>
                <Button
                  className="mt-auto"
                  onClick={() =>
                    guard("membuat rumah baru", () =>
                      dispatch({
                        type: "open-doc",
                        state: buildBlank(
                          blankDaya,
                          blankName.trim() || "Rumah baru"
                        ),
                        docId: null,
                        docName: blankName.trim() || "Rumah baru",
                        text: `Rumah baru "${blankName.trim() || "Rumah baru"}" dibuat`,
                      })
                    )
                  }
                >
                  <FilePlus2Icon />
                  Buat rumah kosong
                </Button>
              </div>
              {PRESETS.filter((p) => p.id !== "kosong").map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() =>
                    guard(`memakai contoh "${p.name}"`, () =>
                      dispatch({ type: "preset", id: p.id })
                    )
                  }
                  className="flex items-center gap-3 rounded-2xl p-3 text-left ring-1 ring-border transition hover:bg-muted"
                >
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-art-soft">
                    <ApplianceArt
                      kind={p.id === "keluarga" ? "ac" : "fan"}
                      className="size-7"
                    />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold">
                      Contoh: {p.name}
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      {p.blurb}
                    </span>
                  </span>
                </button>
              ))}
              <button
                type="button"
                onClick={() =>
                  guard('memakai contoh "Hanya lampu"', () =>
                    dispatch({ type: "preset", id: "kosong" })
                  )
                }
                className="flex items-center gap-3 rounded-2xl p-3 text-left ring-1 ring-border transition hover:bg-muted"
              >
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-art-soft">
                  <ApplianceArt kind="bulb" className="size-7" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold">
                    Contoh: 5 ruangan, hanya lampu
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    Denah jadi, tinggal isi perangkatnya. 1.300 VA.
                  </span>
                </span>
              </button>
            </div>
          </section>

          {/* tersimpan */}
          <section>
            <h3 className="mb-2 font-heading text-base font-semibold">
              Tersimpan{" "}
              <span className="font-sans text-sm font-normal text-muted-foreground">
                ({saves.list.length})
              </span>
            </h3>
            {saves.list.length === 0 ? (
              <p className="rounded-2xl bg-muted/60 p-4 text-sm text-muted-foreground">
                Belum ada rumah tersimpan. Tekan <b>Simpan rumah</b> di atas
                untuk menyimpan yang sedang dibuka.
              </p>
            ) : (
              <ul className="flex flex-col gap-2">
                {saves.list.map((h) => {
                  const current = h.id === state.docId
                  return (
                    <li
                      key={h.id}
                      className={cn(
                        "flex flex-wrap items-center gap-3 rounded-2xl p-3 ring-1",
                        current
                          ? "bg-art-soft/60 ring-primary/40"
                          : "ring-border"
                      )}
                    >
                      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                        <HouseIcon className="size-5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        {renaming === h.id ? (
                          <form
                            onSubmit={(e) => {
                              e.preventDefault()
                              const n = renameText.trim()
                              if (n) {
                                saves.rename(h.id, n)
                                if (current)
                                  dispatch({
                                    type: "set-doc",
                                    docId: h.id,
                                    docName: n,
                                  })
                                if (current) setDraftName(n)
                              }
                              setRenaming(null)
                            }}
                            className="flex gap-1.5"
                          >
                            <Input
                              autoFocus
                              value={renameText}
                              onChange={(e) => setRenameText(e.target.value)}
                              className="h-8"
                              aria-label="Nama baru"
                            />
                            <Button size="sm" type="submit">
                              OK
                            </Button>
                          </form>
                        ) : (
                          <p className="truncate text-sm font-semibold">
                            {h.name}
                            {current && (
                              <span className="ml-2 rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground">
                                sedang dibuka
                              </span>
                            )}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {fmt(h.state.dayaVA)} VA · {h.state.rooms.length}{" "}
                          ruangan · {h.state.devices.length} perangkat ·{" "}
                          {h.state.circuits.length} grup MCB · {when(h.savedAt)}
                        </p>
                      </div>
                      {confirmDelete === h.id ? (
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs">Hapus permanen?</span>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              saves.remove(h.id)
                              if (current)
                                dispatch({
                                  type: "set-doc",
                                  docId: null,
                                  docName: h.name,
                                })
                              setConfirmDelete(null)
                            }}
                          >
                            Hapus
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setConfirmDelete(null)}
                          >
                            Batal
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          {!current && (
                            <Button size="sm" onClick={() => openSaved(h)}>
                              <FolderOpenIcon />
                              Buka
                            </Button>
                          )}
                          <Button
                            size="icon-sm"
                            variant="ghost"
                            aria-label={`Ganti nama ${h.name}`}
                            onClick={() => {
                              setRenaming(h.id)
                              setRenameText(h.name)
                            }}
                          >
                            <PencilIcon />
                          </Button>
                          <Button
                            size="icon-sm"
                            variant="ghost"
                            aria-label={`Hapus ${h.name}`}
                            onClick={() => setConfirmDelete(h.id)}
                          >
                            <Trash2Icon />
                          </Button>
                        </div>
                      )}
                    </li>
                  )
                })}
              </ul>
            )}
            <p className="mt-2 text-[11px] text-muted-foreground">
              Tersimpan di browser ini saja. Untuk pindah perangkat atau
              berbagi, unduh sebagai file.
            </p>
          </section>

          {/* file */}
          <section className="flex flex-wrap items-center gap-2 border-t pt-4">
            <p className="mr-auto text-sm font-medium">File rumah (.json)</p>
            <Button variant="outline" onClick={download}>
              <DownloadIcon />
              Unduh file
            </Button>
            <Button variant="outline" onClick={() => fileRef.current?.click()}>
              <UploadIcon />
              Buka file
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(e) => onFile(e.target.files?.[0])}
            />
            {fileError && (
              <p className="w-full text-xs text-destructive">{fileError}</p>
            )}
          </section>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function when(t: number) {
  const d = new Date(t)
  const today = new Date()
  const time = d.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  })
  if (d.toDateString() === today.toDateString()) return `hari ini ${time}`
  return `${d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })} ${time}`
}
