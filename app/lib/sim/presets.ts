import { APPLIANCE_MAP, CIRCUIT_COLORS } from "./catalog"
import type { Circuit, Device, Room, RoomKind, SimState } from "./types"

export interface Preset {
  id: string
  name: string
  blurb: string
  dayaVA: number
}

export const PRESETS: Preset[] = [
  {
    id: "kecil",
    name: "Rumah Tipe 36",
    blurb: "2 kamar, 900 VA. Rumah sederhana yang paling umum.",
    dayaVA: 900,
  },
  {
    id: "keluarga",
    name: "Rumah Keluarga",
    blurb: "3 kamar, 2.200 VA, ada AC, mesin cuci, dan water heater.",
    dayaVA: 2200,
  },
  {
    id: "kosong",
    name: "Mulai dari Kosong",
    blurb: "Hanya lampu di tiap ruangan. Isi sendiri perangkatnya.",
    dayaVA: 1300,
  },
]

type RoomSpec = {
  name: string
  kind: RoomKind
  circuit: number
  sockets: number
  devices: (
    string | [string, { on?: boolean; mode?: number; circuit?: number }]
  )[]
}

function build(
  presetId: string,
  dayaVA: number,
  circuits: Omit<Circuit, "id" | "color" | "on">[],
  rooms: RoomSpec[],
  extra: Partial<SimState>
): SimState {
  let seq = 0
  const cs: Circuit[] = circuits.map((c, i) => ({
    ...c,
    id: `c${++seq}`,
    on: true,
    color: CIRCUIT_COLORS[i % CIRCUIT_COLORS.length],
  }))
  const rs: Room[] = []
  const ds: Device[] = []
  for (const r of rooms) {
    const room: Room = {
      id: `r${++seq}`,
      name: r.name,
      kind: r.kind,
      circuitId: cs[r.circuit].id,
      sockets: r.sockets,
    }
    rs.push(room)
    for (const spec of r.devices) {
      const [aid, opt] = typeof spec === "string" ? [spec, {}] : spec
      ds.push(
        newDevice(`d${++seq}`, aid, room.id, {
          on: opt.on ?? false,
          mode: opt.mode ?? 0,
          circuitId: opt.circuit !== undefined ? cs[opt.circuit].id : null,
        })
      )
    }
  }
  return {
    version: 1,
    dayaVA,
    subsidi: false,
    billing: "prabayar",
    ppj: 0,
    grounding: true,
    elcb: false,
    mainOn: true,
    rooms: rs,
    devices: ds,
    circuits: cs,
    trip: null,
    flicker: null,
    log: [
      {
        id: ++seq,
        time: Date.now(),
        tone: "info",
        text: `Memuat contoh "${PRESETS.find((p) => p.id === presetId)?.name}"`,
      },
    ],
    seq,
    onboarded: false,
    ...extra,
  }
}

export function newDevice(
  id: string,
  applianceId: string,
  roomId: string,
  opt: Partial<Device> = {}
): Device {
  const a = APPLIANCE_MAP[applianceId]
  return {
    id,
    applianceId,
    roomId,
    on: false,
    mode: 0,
    hours: [...a.hours],
    circuitId: null,
    ...opt,
  }
}

const ON = { on: true }

/** Rumah benar-benar kosong: belum ada ruangan, hanya box MCB standar. */
export function buildBlank(dayaVA: number, name = "Rumah baru"): SimState {
  const s = build(
    "kosong",
    dayaVA,
    [
      { name: "Grup Stopkontak", mcbAmp: 10, cable: 2.5 },
      { name: "Grup Lampu", mcbAmp: 6, cable: 1.5, forLights: true },
    ],
    [],
    {}
  )
  return {
    ...s,
    onboarded: true,
    docId: null,
    docName: name,
    log: [],
  }
}

export function buildPreset(id: string): SimState {
  if (id === "keluarga") {
    return build(
      id,
      2200,
      [
        { name: "Stopkontak Ruang", mcbAmp: 10, cable: 2.5 },
        { name: "Stopkontak Dapur & Cuci", mcbAmp: 16, cable: 2.5 },
        { name: "Grup AC", mcbAmp: 10, cable: 2.5 },
        { name: "Grup Lampu", mcbAmp: 6, cable: 1.5, forLights: true },
      ],
      [
        {
          name: "Teras",
          kind: "teras",
          circuit: 0,
          sockets: 2,
          devices: [["led9", ON], "motorlistrik"],
        },
        {
          name: "Ruang Keluarga",
          kind: "tamu",
          circuit: 0,
          sockets: 6,
          devices: [
            ["led18", ON],
            ["tv50", ON],
            ["router", ON],
            "speaker",
            "akuarium",
          ],
        },
        {
          name: "Kamar Utama",
          kind: "kamar",
          circuit: 0,
          sockets: 4,
          devices: [
            ["led9", ON],
            ["ac1", { on: true, circuit: 2 }],
            "charger",
            "setrika",
          ],
        },
        {
          name: "Kamar Anak",
          kind: "kamar",
          circuit: 0,
          sockets: 4,
          devices: ["led9", ["kipas", { mode: 1 }], "laptop", "pc"],
        },
        {
          name: "Dapur",
          kind: "dapur",
          circuit: 1,
          sockets: 6,
          devices: [
            ["led18", ON],
            ["kulkas2", ON],
            ["ricecooker", { on: true, mode: 1 }],
            "dispenser",
            "blender",
            "microwave",
          ],
        },
        {
          name: "Kamar Mandi",
          kind: "mandi",
          circuit: 1,
          sockets: 1,
          devices: ["led9", "waterheater"],
        },
        {
          name: "Area Cuci",
          kind: "cuci",
          circuit: 1,
          sockets: 3,
          devices: ["led9", "mesincuci", "pompa"],
        },
      ],
      { elcb: true }
    )
  }
  if (id === "kosong") {
    return build(
      id,
      1300,
      [
        { name: "Grup Stopkontak", mcbAmp: 10, cable: 2.5 },
        { name: "Grup Lampu", mcbAmp: 6, cable: 1.5, forLights: true },
      ],
      [
        {
          name: "Teras",
          kind: "teras",
          circuit: 0,
          sockets: 1,
          devices: ["led9"],
        },
        {
          name: "Ruang Tamu",
          kind: "tamu",
          circuit: 0,
          sockets: 3,
          devices: ["led18"],
        },
        {
          name: "Kamar Tidur",
          kind: "kamar",
          circuit: 0,
          sockets: 2,
          devices: ["led9"],
        },
        {
          name: "Dapur",
          kind: "dapur",
          circuit: 0,
          sockets: 3,
          devices: ["led9"],
        },
        {
          name: "Kamar Mandi",
          kind: "mandi",
          circuit: 0,
          sockets: 0,
          devices: ["led9"],
        },
      ],
      {}
    )
  }
  return build(
    "kecil",
    900,
    [
      { name: "Stopkontak Depan", mcbAmp: 10, cable: 2.5 },
      { name: "Stopkontak Belakang", mcbAmp: 10, cable: 2.5 },
      { name: "Grup Lampu", mcbAmp: 6, cable: 1.5, forLights: true },
    ],
    [
      {
        name: "Teras",
        kind: "teras",
        circuit: 0,
        sockets: 1,
        devices: [["led9", ON]],
      },
      {
        name: "Ruang Tamu",
        kind: "tamu",
        circuit: 0,
        sockets: 3,
        devices: [
          ["led18", ON],
          ["tv32", ON],
          ["kipas", { on: true, mode: 1 }],
          ["router", ON],
        ],
      },
      {
        name: "Kamar 1",
        kind: "kamar",
        circuit: 0,
        sockets: 2,
        devices: [["led9", ON], "charger", "setrika"],
      },
      {
        name: "Kamar 2",
        kind: "kamar",
        circuit: 0,
        sockets: 2,
        devices: ["led9", ["kipas", { mode: 1 }]],
      },
      {
        name: "Dapur",
        kind: "dapur",
        circuit: 1,
        sockets: 3,
        devices: [
          ["led9", ON],
          ["kulkas1", ON],
          ["ricecooker", { on: true, mode: 1 }],
          "ketel",
        ],
      },
      {
        name: "Kamar Mandi",
        kind: "mandi",
        circuit: 1,
        sockets: 0,
        devices: ["led9"],
      },
      {
        name: "Area Cuci",
        kind: "cuci",
        circuit: 1,
        sockets: 2,
        devices: ["led9", "mesincuci", "pompa"],
      },
    ],
    { grounding: false }
  )
}
