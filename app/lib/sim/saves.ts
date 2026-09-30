import * as React from "react"
import { create } from "zustand"

import { APPLIANCE_MAP, migrateState } from "./catalog"
import type { SimState } from "./types"

export interface SavedHouse {
  id: string
  name: string
  savedAt: number
  state: SimState
}

const KEY = "simulator-listrik:saves:v1"

function readStorage(): SavedHouse[] {
  try {
    const raw = localStorage.getItem(KEY)
    return raw
      ? (JSON.parse(raw) as SavedHouse[])
          .map((h) => ({ ...h, state: migrateState(h.state) }))
          .filter((s) => isValidState(s.state))
      : []
  } catch {
    return []
  }
}

interface SavesStore {
  list: SavedHouse[]
  loaded: boolean
  load: () => void
  upsert: (house: SavedHouse) => void
  rename: (id: string, name: string) => void
  remove: (id: string) => void
}

function persist(list: SavedHouse[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list))
  } catch {
    // penyimpanan penuh / diblokir — daftar tetap ada selama sesi ini
  }
}

export const useSavesStore = create<SavesStore>()((set, get) => ({
  list: [],
  loaded: false,
  load: () => {
    if (get().loaded) return
    set({ list: readStorage(), loaded: true })
    // sinkron antar-tab
    window.addEventListener("storage", (e) => {
      if (e.key === KEY) set({ list: readStorage() })
    })
  },
  upsert: (house) => {
    const list = [house, ...get().list.filter((s) => s.id !== house.id)]
    persist(list)
    set({ list })
  },
  rename: (id, name) => {
    const list = get().list.map((s) =>
      s.id === id ? { ...s, name, state: { ...s.state, docName: name } } : s
    )
    persist(list)
    set({ list })
  },
  remove: (id) => {
    const list = get().list.filter((s) => s.id !== id)
    persist(list)
    set({ list })
  },
}))

/** Daftar rumah tersimpan (terurut dari yang terbaru) + aksi. */
export function useSavedHouses() {
  const store = useSavesStore()
  const load = store.load
  React.useEffect(load, [load])
  const list = React.useMemo(
    () => [...store.list].sort((a, b) => b.savedAt - a.savedAt),
    [store.list]
  )
  return {
    list,
    get: (id: string | null | undefined) => store.list.find((s) => s.id === id),
    upsert: store.upsert,
    rename: store.rename,
    remove: store.remove,
  }
}

export function newSaveId() {
  return `h${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
}

/** Bagian rumah yang dianggap "desain" — nyala/mati perangkat tidak dihitung. */
export function signature(s: SimState) {
  return JSON.stringify({
    dayaVA: s.dayaVA,
    subsidi: s.subsidi,
    billing: s.billing,
    ppj: s.ppj,
    grounding: s.grounding,
    elcb: s.elcb,
    rooms: s.rooms,
    devices: s.devices.map(({ on: _on, ...d }) => d),
    circuits: s.circuits.map(({ on: _on, ...c }) => c),
  })
}

export function isValidState(s: unknown): s is SimState {
  const x = s as SimState
  return (
    !!x &&
    x.version === 1 &&
    Array.isArray(x.rooms) &&
    Array.isArray(x.devices) &&
    Array.isArray(x.circuits) &&
    x.circuits.length > 0 &&
    x.devices.every(
      (d) =>
        APPLIANCE_MAP[d.applianceId] ||
        x.customAppliances?.some((c) => c.id === d.applianceId)
    )
  )
}

/** Isi file .json yang bisa diunduh / dibuka lagi. */
export function toFile(state: SimState, name: string) {
  return JSON.stringify(
    { app: "simulator-listrik", version: 1, name, savedAt: Date.now(), state },
    null,
    2
  )
}

export function fromFile(text: string): { name: string; state: SimState } {
  const data = JSON.parse(text)
  const state = migrateState(data?.state ?? data)
  if (!isValidState(state))
    throw new Error("File bukan rumah dari Simulasi Listrik Rumah.")
  return { name: data?.name ?? state.docName ?? "Rumah dari file", state }
}
