import { create } from "zustand"
import { useShallow } from "zustand/react/shallow"

import {
  APPLIANCE_MAP,
  CIRCUIT_COLORS,
  dayaLevel,
  migrateState,
  syncCustomAppliances,
} from "./catalog"
import {
  analyze,
  appliance,
  circuitIdOf,
  circuitOf,
  deviceWatt,
  fmt,
  isPowered,
  settle,
  type Analysis,
} from "./engine"
import { PRESETS, buildPreset, newDevice } from "./presets"
import type {
  Appliance,
  Circuit,
  LogEntry,
  Room,
  RoomKind,
  SimState,
} from "./types"

export type SettingsPatch = Partial<
  Pick<
    SimState,
    | "dayaVA"
    | "subsidi"
    | "billing"
    | "ppj"
    | "grounding"
    | "elcb"
    | "onboarded"
  >
>

export type Action =
  | { type: "load"; state: SimState }
  | {
      type: "open-doc"
      state: SimState
      docId: string | null
      docName: string
      text: string
    }
  | { type: "set-doc"; docId: string | null; docName: string }
  | { type: "undo"; state: SimState; text: string }
  | { type: "preset"; id: string }
  | { type: "settings"; patch: SettingsPatch }
  | { type: "toggle-device"; id: string }
  | { type: "device-mode"; id: string; mode: number }
  | { type: "device-hours"; id: string; index: number; hours: number }
  | { type: "device-circuit"; id: string; circuitId: string | null }
  | {
      type: "add-device"
      roomId: string
      applianceId: string
      /** MCB tujuan; kosong = otomatis (ikut ruangan / grup lampu) */
      circuitId?: string
    }
  | { type: "save-custom-appliance"; appliance: Appliance }
  | { type: "remove-custom-appliance"; id: string }
  | { type: "remove-device"; id: string }
  | { type: "add-room"; kind: RoomKind; name: string }
  | { type: "update-room"; id: string; patch: Partial<Room> }
  | { type: "remove-room"; id: string }
  | { type: "add-circuit" }
  | {
      type: "assign-room-circuit"
      roomId: string
      /** isi untuk membuat MCB baru; kosongkan untuk memakai MCB yang ada */
      create?: { name: string; mcbAmp: number; cable: number }
      circuitId?: string
      deviceIds: string[]
      /** stopkontak lain (dan perangkat baru) di ruangan ini ikut MCB ini */
      roomDefault: boolean
    }
  | { type: "update-circuit"; id: string; patch: Partial<Circuit> }
  | { type: "remove-circuit"; id: string }
  | {
      type: "detach-room-circuit"
      roomId: string
      circuitId: string
      /** nasib perangkat yang sekarang lewat MCB ini */
      devices: "move" | "delete"
      /** MCB tujuan (wajib kalau memindah perangkat / MCB utama ruangan) */
      targetId?: string
      /** hapus juga MCB-nya dari box kalau tidak dipakai ruangan lain */
      removeFromBox: boolean
    }
  | { type: "toggle-main" }
  | { type: "toggle-circuit"; id: string }
  | { type: "all-off" }
  | { type: "dismiss-trip" }
  | { type: "clear-flicker" }

function log(s: SimState, tone: LogEntry["tone"], text: string): SimState {
  const seq = s.seq + 1
  return {
    ...s,
    seq,
    log: [{ id: seq, time: Date.now(), tone, text }, ...s.log].slice(0, 40),
  }
}

function afterSettle(prev: SimState, next: SimState): SimState {
  let s = next
  if (next.trip && next.trip !== prev.trip) {
    const t = next.trip
    const where =
      t.scope === "main"
        ? "MCB PLN (meteran)"
        : `MCB ${next.circuits.find((c) => c.id === t.circuitId)?.name}`
    s = log(
      s,
      "danger",
      `${where} turun — ${t.reason === "surge" ? "lonjakan arus" : "beban berlebih"} ${fmt(t.loadVA)} VA`
    )
  }
  if (next.flicker && next.flicker !== prev.flicker) {
    const d = next.devices.find((x) => x.id === next.flicker!.deviceId)
    if (d)
      s = log(
        s,
        "warn",
        `Lampu berkedip saat ${appliance(d).short} mulai menyala`
      )
  }
  return s
}

function reducer(s: SimState, a: Action): SimState {
  switch (a.type) {
    case "load":
      return a.state
    case "undo":
      return log(
        {
          ...a.state,
          log: s.log,
          seq: Math.max(s.seq, a.state.seq),
          trip: null,
          flicker: null,
        },
        "ok",
        a.text
      )
    case "preset": {
      const p = buildPreset(a.id)
      return {
        ...p,
        onboarded: true,
        seq: Math.max(p.seq, s.seq) + 1,
        docId: null,
        docName: PRESETS.find((x) => x.id === a.id)?.name ?? "Rumah baru",
      }
    }
    case "open-doc":
      return log(
        {
          ...a.state,
          onboarded: true,
          docId: a.docId,
          docName: a.docName,
          trip: null,
          flicker: null,
          seq: Math.max(a.state.seq, s.seq),
        },
        "info",
        a.text
      )
    case "set-doc":
      return { ...s, docId: a.docId, docName: a.docName }
    case "settings": {
      let next = { ...s, ...a.patch }
      if (a.patch.dayaVA && a.patch.dayaVA !== s.dayaVA) {
        next = log(
          next,
          "info",
          `Daya PLN diubah ke ${fmt(a.patch.dayaVA)} VA (MCB ${dayaLevel(a.patch.dayaVA).mcb} A)`
        )
        if (a.patch.dayaVA > 900) next.subsidi = false
      }
      if (a.patch.grounding !== undefined && a.patch.grounding !== s.grounding)
        next = log(
          next,
          a.patch.grounding ? "ok" : "warn",
          a.patch.grounding ? "Arde (grounding) dipasang" : "Arde dilepas"
        )
      if (a.patch.elcb !== undefined && a.patch.elcb !== s.elcb)
        next = log(
          next,
          a.patch.elcb ? "ok" : "warn",
          a.patch.elcb ? "ELCB dipasang di box MCB" : "ELCB dilepas"
        )
      return afterSettle(s, settle(next, { kind: "change" }))
    }
    case "toggle-device": {
      const d = s.devices.find((x) => x.id === a.id)
      if (!d) return s
      const on = !d.on
      let next: SimState = {
        ...s,
        flicker: null,
        devices: s.devices.map((x) => (x.id === a.id ? { ...x, on } : x)),
      }
      const name = appliance(d).short
      const room = s.rooms.find((r) => r.id === d.roomId)?.name
      if (on && !isPowered(s, d)) {
        const c = circuitOf(s, d)
        next = log(
          next,
          "warn",
          `${name} (${room}) dinyalakan, tapi tidak ada listrik — ${!s.mainOn ? "MCB PLN" : `MCB ${c?.name}`} sedang turun`
        )
        return next
      }
      next = log(
        next,
        on ? "on" : "off",
        `${name} (${room}) ${on ? "dinyalakan" : "dimatikan"} ${on ? "+" : "−"}${fmt(deviceWatt(d))} W`
      )
      return on
        ? afterSettle(next, settle(next, { kind: "device-on", deviceId: d.id }))
        : next
    }
    case "device-mode": {
      const next = {
        ...s,
        devices: s.devices.map((x) =>
          x.id === a.id ? { ...x, mode: a.mode } : x
        ),
      }
      return afterSettle(s, settle(next, { kind: "change" }))
    }
    case "device-hours":
      return {
        ...s,
        devices: s.devices.map((x) => {
          if (x.id !== a.id) return x
          const hours = [...x.hours]
          hours[a.index] = a.hours
          return { ...x, hours }
        }),
      }
    case "device-circuit": {
      const next = {
        ...s,
        devices: s.devices.map((x) =>
          x.id === a.id ? { ...x, circuitId: a.circuitId } : x
        ),
      }
      return afterSettle(s, settle(next, { kind: "change" }))
    }
    case "add-device": {
      const seq = s.seq + 1
      let dev = newDevice(`d${seq}`, a.applianceId, a.roomId)
      // hanya simpan MCB khusus kalau berbeda dari jalur otomatisnya
      if (a.circuitId && circuitIdOf(s, dev) !== a.circuitId)
        dev = { ...dev, circuitId: a.circuitId }
      const room = s.rooms.find((r) => r.id === a.roomId)
      const via = s.circuits.find((c) => c.id === circuitIdOf(s, dev))
      return log(
        { ...s, seq, devices: [...s.devices, dev] },
        "info",
        `${APPLIANCE_MAP[a.applianceId].short} dipasang di ${room?.name} lewat ${via?.name.startsWith("MCB") ? "" : "MCB "}${via?.name} (${via?.mcbAmp} A)`
      )
    }
    case "save-custom-appliance": {
      const list = s.customAppliances ?? []
      const exists = list.some((x) => x.id === a.appliance.id)
      const customAppliances = exists
        ? list.map((x) => (x.id === a.appliance.id ? a.appliance : x))
        : [...list, a.appliance]
      syncCustomAppliances(customAppliances)
      const next = log(
        { ...s, customAppliances },
        "info",
        exists
          ? `Perangkat buatanmu "${a.appliance.name}" diperbarui`
          : `Perangkat baru "${a.appliance.name}" (${fmt(a.appliance.modes[0].watt)} W) dibuat`
      )
      return afterSettle(s, settle(next, { kind: "change" }))
    }
    case "remove-custom-appliance": {
      const ap = s.customAppliances?.find((x) => x.id === a.id)
      if (!ap) return s
      const used = s.devices.filter((d) => d.applianceId === a.id).length
      const customAppliances = (s.customAppliances ?? []).filter(
        (x) => x.id !== a.id
      )
      const next = log(
        {
          ...s,
          customAppliances,
          devices: s.devices.filter((d) => d.applianceId !== a.id),
        },
        "info",
        `Perangkat buatanmu "${ap.name}" dihapus${used ? ` (${used} terpasang ikut dilepas)` : ""}`
      )
      syncCustomAppliances(customAppliances)
      return next
    }
    case "remove-device": {
      const d = s.devices.find((x) => x.id === a.id)
      if (!d) return s
      return log(
        { ...s, devices: s.devices.filter((x) => x.id !== a.id) },
        "info",
        `${appliance(d).short} dilepas`
      )
    }
    case "add-room": {
      const seq = s.seq + 1
      const room: Room = {
        id: `r${seq}`,
        name: a.name,
        kind: a.kind,
        circuitId: (s.circuits.find((c) => !c.forLights) ?? s.circuits[0]).id,
        sockets: a.kind === "mandi" ? 0 : 2,
      }
      const d = newDevice(`d${seq + 1}`, "led9", room.id)
      return log(
        {
          ...s,
          seq: seq + 1,
          rooms: [...s.rooms, room],
          devices: [...s.devices, d],
        },
        "info",
        `Ruangan "${a.name}" ditambahkan`
      )
    }
    case "update-room": {
      const next = {
        ...s,
        rooms: s.rooms.map((r) => (r.id === a.id ? { ...r, ...a.patch } : r)),
      }
      return afterSettle(s, settle(next, { kind: "change" }))
    }
    case "remove-room":
      if (s.rooms.length <= 1) return s
      return log(
        {
          ...s,
          rooms: s.rooms.filter((r) => r.id !== a.id),
          devices: s.devices.filter((d) => d.roomId !== a.id),
        },
        "info",
        `Ruangan "${s.rooms.find((r) => r.id === a.id)?.name}" dihapus`
      )
    case "add-circuit": {
      const seq = s.seq + 1
      const c: Circuit = {
        id: `c${seq}`,
        name: `Grup ${s.circuits.length + 1}`,
        mcbAmp: 10,
        cable: 2.5,
        on: true,
        color: CIRCUIT_COLORS[s.circuits.length % CIRCUIT_COLORS.length],
      }
      return log(
        { ...s, seq, circuits: [...s.circuits, c] },
        "info",
        `${c.name} ditambahkan ke box MCB`
      )
    }
    case "assign-room-circuit": {
      const room = s.rooms.find((r) => r.id === a.roomId)
      if (!room) return s
      let next = s
      let target = s.circuits.find((c) => c.id === a.circuitId)
      if (a.create) {
        const seq = next.seq + 1
        target = {
          id: `c${seq}`,
          name: a.create.name,
          mcbAmp: a.create.mcbAmp,
          cable: a.create.cable,
          on: true,
          color: CIRCUIT_COLORS[s.circuits.length % CIRCUIT_COLORS.length],
        }
        next = { ...next, seq, circuits: [...next.circuits, target] }
      }
      if (!target) return s
      const t = target
      const ids = new Set(a.deviceIds)
      next = {
        ...next,
        devices: next.devices.map((d) =>
          ids.has(d.id) ? { ...d, circuitId: t.id } : d
        ),
        rooms: next.rooms.map((r) => {
          if (r.id !== room.id) return r
          if (a.roomDefault) return { ...r, circuitId: t.id }
          const extra = r.extraCircuitIds ?? []
          return extra.includes(t.id) || r.circuitId === t.id
            ? r
            : { ...r, extraCircuitIds: [...extra, t.id] }
        }),
      }
      const names = next.devices
        .filter((d) => ids.has(d.id))
        .map((d) => appliance(d).short)
      next = log(
        next,
        "info",
        `${a.create ? "MCB baru" : "MCB"} ${t.name} (${t.mcbAmp} A) dipasang untuk ${room.name}${
          names.length ? `: ${names.join(", ")}` : ""
        }${a.roomDefault ? " + stopkontak ruangan" : ""}`
      )
      return afterSettle(s, settle(next, { kind: "change" }))
    }
    case "update-circuit": {
      let next: SimState = {
        ...s,
        circuits: s.circuits.map((c) =>
          c.id === a.id
            ? { ...c, ...a.patch }
            : a.patch.forLights
              ? { ...c, forLights: false }
              : c
        ),
      }
      if (a.patch.forLights !== undefined) {
        const name = s.circuits.find((c) => c.id === a.id)?.name
        next = log(
          next,
          "info",
          a.patch.forLights
            ? `${name} dijadikan jalur khusus lampu — semua lampu pindah ke sini`
            : `${name} bukan lagi jalur khusus lampu — lampu kembali ke jalur ruangannya`
        )
      }
      return afterSettle(s, settle(next, { kind: "change" }))
    }
    case "detach-room-circuit": {
      const room = s.rooms.find((r) => r.id === a.roomId)
      const c = s.circuits.find((x) => x.id === a.circuitId)
      if (!room || !c) return s
      const target = s.circuits.find((x) => x.id === a.targetId)
      const isMain = room.circuitId === c.id
      if ((a.devices === "move" || isMain) && !target) return s
      const affected = s.devices.filter(
        (d) => d.roomId === room.id && circuitIdOf(s, d) === c.id
      )
      const ids = new Set(affected.map((d) => d.id))

      let next: SimState = {
        ...s,
        rooms: s.rooms.map((r) =>
          r.id !== room.id
            ? r
            : {
                ...r,
                circuitId: isMain ? target!.id : r.circuitId,
                extraCircuitIds: r.extraCircuitIds?.filter((id) => id !== c.id),
              }
        ),
      }
      if (a.devices === "delete") {
        next = { ...next, devices: next.devices.filter((d) => !ids.has(d.id)) }
      } else {
        next = {
          ...next,
          devices: next.devices.map((d) => {
            if (!ids.has(d.id)) return d
            // simpan sebagai jalur khusus hanya kalau beda dari jalur otomatisnya
            const auto = circuitIdOf(next, { ...d, circuitId: null })
            return { ...d, circuitId: auto === target!.id ? null : target!.id }
          }),
        }
      }

      const stillUsed =
        next.rooms.some(
          (r) => r.circuitId === c.id || r.extraCircuitIds?.includes(c.id)
        ) || next.devices.some((d) => circuitIdOf(next, d) === c.id)
      const dropFromBox =
        a.removeFromBox && !stillUsed && next.circuits.length > 1
      if (dropFromBox) {
        next = {
          ...next,
          circuits: next.circuits.filter((x) => x.id !== c.id),
          devices: next.devices.map((d) =>
            d.circuitId === c.id ? { ...d, circuitId: null } : d
          ),
        }
      }

      const what =
        affected.length === 0
          ? ""
          : a.devices === "delete"
            ? ` — ${affected.length} perangkat ikut dilepas`
            : ` — ${affected.length} perangkat pindah ke ${target!.name}`
      next = log(
        next,
        "info",
        `${c.name} dilepas dari ${room.name}${what}${dropFromBox ? " (MCB dihapus dari box)" : ""}`
      )
      return afterSettle(s, settle(next, { kind: "change" }))
    }
    case "remove-circuit": {
      if (s.circuits.length <= 1) return s
      const fallback = (
        s.circuits.find((c) => c.id !== a.id && !c.forLights) ??
        s.circuits.find((c) => c.id !== a.id)!
      ).id
      const next = log(
        {
          ...s,
          circuits: s.circuits.filter((c) => c.id !== a.id),
          rooms: s.rooms.map((r) => ({
            ...r,
            circuitId: r.circuitId === a.id ? fallback : r.circuitId,
            extraCircuitIds: r.extraCircuitIds?.filter((id) => id !== a.id),
          })),
          devices: s.devices.map((d) =>
            d.circuitId === a.id ? { ...d, circuitId: null } : d
          ),
        },
        "info",
        `${s.circuits.find((c) => c.id === a.id)?.name} dihapus dari box MCB`
      )
      return afterSettle(s, settle(next, { kind: "change" }))
    }
    case "toggle-main": {
      if (s.mainOn) {
        return log(
          { ...s, mainOn: false, trip: null },
          "off",
          "MCB PLN dimatikan manual"
        )
      }
      const next = log(
        { ...s, mainOn: true, trip: null, flicker: null },
        "ok",
        "MCB PLN dinaikkan"
      )
      return afterSettle(next, settle(next, { kind: "reset-main" }))
    }
    case "toggle-circuit": {
      const c = s.circuits.find((x) => x.id === a.id)
      if (!c) return s
      const next = log(
        {
          ...s,
          trip: null,
          circuits: s.circuits.map((x) =>
            x.id === a.id ? { ...x, on: !x.on } : x
          ),
        },
        c.on ? "off" : "ok",
        `MCB ${c.name} ${c.on ? "diturunkan" : "dinaikkan"}`
      )
      return c.on
        ? next
        : afterSettle(
            next,
            settle(next, { kind: "reset-circuit", circuitId: a.id })
          )
    }
    case "all-off":
      return log(
        { ...s, devices: s.devices.map((d) => ({ ...d, on: false })) },
        "off",
        "Semua perangkat dimatikan"
      )
    case "dismiss-trip":
      return { ...s, trip: null }
    case "clear-flicker":
      return { ...s, flicker: null }
  }
}

const STORAGE_KEY = "simulator-listrik:v1"

interface SimStore {
  state: SimState
  analysis: Analysis
  ready: boolean
  dispatch: (a: Action) => void
  /** Muat rumah terakhir dari localStorage (sekali, di sisi browser). */
  hydrate: () => void
}

const initial = buildPreset("kecil")

export const useSimStore = create<SimStore>()((set, get) => ({
  state: initial,
  analysis: analyze(initial),
  ready: false,
  dispatch: (a) => {
    const prev = get().state
    const next = reducer(prev, a)
    if (next === prev) return
    syncCustomAppliances(next.customAppliances)
    set({ state: next, analysis: analyze(next) })
    if (get().ready) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      } catch {
        // penyimpanan penuh / diblokir — abaikan
      }
    }
  },
  hydrate: () => {
    if (get().ready) return
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const saved = migrateState(JSON.parse(raw) as SimState)
        syncCustomAppliances(saved.customAppliances)
        const valid =
          saved?.version === 1 &&
          saved.devices.every((d) => APPLIANCE_MAP[d.applianceId])
        if (valid) {
          const state = { ...saved, trip: null, flicker: null }
          set({ state, analysis: analyze(state) })
        }
      }
    } catch {
      // penyimpanan tidak tersedia — mulai dari contoh bawaan
    }
    set({ ready: true })
  },
}))

/** Hook praktis: state, hasil analisis, dan dispatch. */
export function useSim() {
  return useSimStore(
    useShallow((s) => ({
      state: s.state,
      analysis: s.analysis,
      dispatch: s.dispatch,
      ready: s.ready,
    }))
  )
}
