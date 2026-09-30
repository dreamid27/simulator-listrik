import { create } from "zustand"

import { appliance } from "~/lib/sim/engine"
import { useSimStore } from "~/lib/sim/store"
import type { SimState } from "~/lib/sim/types"

export type Tab = "rumah" | "biaya" | "belajar"

export interface UndoEntry {
  id: number
  text: string
  snapshot: SimState
}

interface UiStore {
  tab: Tab
  setTab: (t: Tab) => void
  deviceId: string | null
  openDevice: (id: string | null) => void
  catalogRoomId: string | null
  /** MCB tujuan saat menambah perangkat (null = MCB utama ruangan) */
  catalogCircuitId: string | null
  openCatalog: (roomId: string | null, circuitId?: string | null) => void
  roomId: string | null
  openRoom: (id: string | null) => void
  /** MCB yang mau dilepas dari satu ruangan */
  detach: { roomId: string; circuitId: string } | null
  openDetach: (v: { roomId: string; circuitId: string } | null) => void
  /** ruangan yang sedang dibukakan jendela "Tambah MCB" */
  roomMcbId: string | null
  openRoomMcb: (id: string | null) => void
  circuitId: string | null
  openCircuit: (id: string | null) => void
  settingsOpen: boolean
  setSettingsOpen: (v: boolean) => void
  addRoomOpen: boolean
  setAddRoomOpen: (v: boolean) => void
  /** Grup MCB yang sedang disorot di denah rumah (dipilih) */
  focusCircuitId: string | null
  setFocusCircuit: (id: string | null) => void
  /** Sorotan sementara saat kursor di atas kartu MCB */
  hoverCircuitId: string | null
  setHoverCircuit: (id: string | null) => void
  mapOpen: boolean
  setMapOpen: (v: boolean) => void
  housesOpen: boolean
  setHousesOpen: (v: boolean) => void
  editMode: boolean
  setEditMode: (v: boolean) => void
  undo: UndoEntry | null
  pushUndo: (text: string, snapshot: SimState) => void
  clearUndo: () => void
}

export const useUiStore = create<UiStore>()((set) => ({
  tab: "rumah",
  setTab: (tab) => set({ tab }),
  deviceId: null,
  openDevice: (deviceId) => set({ deviceId }),
  catalogRoomId: null,
  catalogCircuitId: null,
  openCatalog: (catalogRoomId, circuitId = null) =>
    set({ catalogRoomId, catalogCircuitId: circuitId }),
  roomId: null,
  openRoom: (roomId) => set({ roomId }),
  detach: null,
  openDetach: (detach) => set({ detach }),
  roomMcbId: null,
  openRoomMcb: (roomMcbId) => set({ roomMcbId }),
  circuitId: null,
  openCircuit: (circuitId) => set({ circuitId }),
  settingsOpen: false,
  setSettingsOpen: (settingsOpen) => set({ settingsOpen }),
  addRoomOpen: false,
  setAddRoomOpen: (addRoomOpen) => set({ addRoomOpen }),
  focusCircuitId: null,
  setFocusCircuit: (focusCircuitId) => set({ focusCircuitId }),
  hoverCircuitId: null,
  setHoverCircuit: (hoverCircuitId) => set({ hoverCircuitId }),
  mapOpen: false,
  setMapOpen: (mapOpen) => set({ mapOpen }),
  housesOpen: false,
  setHousesOpen: (housesOpen) => set({ housesOpen }),
  editMode: false,
  setEditMode: (editMode) => set({ editMode }),
  undo: null,
  pushUndo: (text, snapshot) =>
    set({ undo: { id: Date.now(), text, snapshot } }),
  clearUndo: () => set({ undo: null }),
}))

/** Seluruh UI store (dipakai komponen yang butuh banyak nilai sekaligus). */
export const useUi = () => useUiStore()

/** Grup yang sedang disorot: hover menang atas pilihan tetap. */
export function useActiveCircuit() {
  return useUiStore((s) => s.hoverCircuitId ?? s.focusCircuitId)
}

/** Aksi hapus cepat yang bisa dibatalkan (membaca state terbaru saat dipanggil). */
export const quickRemove = {
  device(id: string) {
    const { state, dispatch } = useSimStore.getState()
    const d = state.devices.find((x) => x.id === id)
    if (!d) return
    const room = state.rooms.find((r) => r.id === d.roomId)
    useUiStore
      .getState()
      .pushUndo(`${appliance(d).short} dilepas dari ${room?.name}`, state)
    dispatch({ type: "remove-device", id })
  },
  room(id: string) {
    const { state, dispatch } = useSimStore.getState()
    const r = state.rooms.find((x) => x.id === id)
    if (!r || state.rooms.length <= 1) return
    const n = state.devices.filter((d) => d.roomId === id).length
    useUiStore
      .getState()
      .pushUndo(`Ruangan ${r.name} dihapus (beserta ${n} perangkat)`, state)
    dispatch({ type: "remove-room", id })
  },
  circuit(id: string) {
    const { state, dispatch } = useSimStore.getState()
    const c = state.circuits.find((x) => x.id === id)
    if (!c || state.circuits.length <= 1) return
    const fallback = state.circuits.find((x) => x.id !== id)!
    const ui = useUiStore.getState()
    ui.pushUndo(
      `${c.name} dihapus — ruangannya pindah ke ${fallback.name}`,
      state
    )
    if (ui.focusCircuitId === id) ui.setFocusCircuit(null)
    dispatch({ type: "remove-circuit", id })
  },
}

/** Tetap disediakan agar pemanggil lama tidak perlu diubah. */
export const useQuickRemove = () => quickRemove
