import * as React from "react"
import { Trash2Icon, Undo2Icon, XIcon } from "lucide-react"

import { Button } from "~/components/ui/button"
import { useSim } from "~/lib/sim/store"
import { useUi } from "./ui-store"

const TIMEOUT = 10000

/** Pesan “sudah dihapus” dengan tombol Batalkan, muncul di bawah layar. */
export function UndoSnackbar() {
  const { dispatch } = useSim()
  const { undo, clearUndo, editMode, setEditMode } = useUi()

  React.useEffect(() => {
    if (!undo) return
    const t = setTimeout(clearUndo, TIMEOUT)
    return () => clearTimeout(t)
  }, [undo, clearUndo])

  React.useEffect(() => {
    if (!editMode) return
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setEditMode(false)
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [editMode, setEditMode])

  if (!undo) return null
  return (
    <div className="pointer-events-none fixed inset-x-3 bottom-24 z-50 flex justify-center lg:bottom-6">
      <div
        key={undo.id}
        role="status"
        className="anim-pop pointer-events-auto relative flex w-full max-w-md items-center gap-3 overflow-hidden rounded-2xl bg-foreground py-2 pr-2 pl-4 text-sm text-background shadow-xl"
      >
        <Trash2Icon className="size-4 shrink-0 opacity-70" />
        <span className="min-w-0 flex-1 leading-snug">{undo.text}</span>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => {
            dispatch({
              type: "undo",
              state: undo.snapshot,
              text: `Dibatalkan: ${undo.text}`,
            })
            clearUndo()
          }}
        >
          <Undo2Icon />
          Batalkan
        </Button>
        <button
          type="button"
          onClick={clearUndo}
          className="grid size-7 shrink-0 place-items-center rounded-lg opacity-70 hover:bg-white/10 hover:opacity-100"
          aria-label="Tutup"
        >
          <XIcon className="size-4" />
        </button>
        <span
          aria-hidden
          className="absolute bottom-0 left-0 h-0.5 bg-energy"
          style={{
            animation: `undo-bar ${TIMEOUT}ms linear forwards`,
            width: "100%",
          }}
        />
      </div>
    </div>
  )
}
