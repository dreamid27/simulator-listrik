export type ArtKind =
  | "bulb"
  | "tube"
  | "fan"
  | "ac"
  | "fridge"
  | "fridge2"
  | "dispenser"
  | "ricecooker"
  | "induction"
  | "microwave"
  | "oven"
  | "blender"
  | "kettle"
  | "washer"
  | "iron"
  | "pump"
  | "heater"
  | "vacuum"
  | "hairdryer"
  | "tv"
  | "laptop"
  | "pc"
  | "router"
  | "phone"
  | "speaker"
  | "evcharger"
  | "aquarium"
  | "cctv"
  | "dvr"
  | "multi"
  | "gadget"
  | "exhaust"

export type Category =
  "lampu" | "pendingin" | "dapur" | "rumah-tangga" | "hiburan"

export type RoomKind = "teras" | "tamu" | "kamar" | "dapur" | "mandi" | "cuci"

export interface ApplianceMode {
  label: string
  watt: number
}

export interface Appliance {
  id: string
  name: string
  short: string
  art: ArtKind
  category: Category
  modes: ApplianceMode[]
  /** Faktor daya (cos φ). VA = Watt ÷ pf */
  pf: number
  /** Lonjakan arus saat mulai menyala (kali lipat dari daya normal) */
  surge: number
  /** Proporsi waktu mesin benar-benar bekerja (kulkas, setrika, dispenser menyala-mati otomatis) */
  duty: number
  /** Jam pemakaian per hari untuk tiap mode */
  hours: number[]
  plug: "stopkontak" | "saklar"
  needsGround?: boolean
  wet?: boolean
  rooms: RoomKind[]
  description: string
  tip?: string
  /** dibuat sendiri oleh pengguna */
  custom?: boolean
}

export interface Room {
  id: string
  name: string
  kind: RoomKind
  circuitId: string
  /** jumlah lubang stopkontak di ruangan */
  sockets: number
  /** MCB tambahan yang dipasang untuk ruangan ini (boleh masih kosong) */
  extraCircuitIds?: string[]
}

export interface Device {
  id: string
  applianceId: string
  roomId: string
  on: boolean
  mode: number
  hours: number[]
  /** null = ikut grup MCB ruangan */
  circuitId: string | null
  /** nama sendiri, mis. "Terminal meja kerja" */
  label?: string
}

export interface Circuit {
  id: string
  name: string
  mcbAmp: number
  cable: number
  on: boolean
  color: string
  /** Grup khusus lampu: semua lampu (lewat saklar) otomatis masuk ke sini */
  forLights?: boolean
}

export type TripReason = "overload" | "surge"

export interface TripEvent {
  id: number
  scope: "main" | "circuit"
  circuitId?: string
  reason: TripReason
  loadVA: number
  limitVA: number
  triggerDeviceId?: string
  contributors: { deviceId: string; va: number }[]
  retrip: boolean
}

export interface LogEntry {
  id: number
  time: number
  tone: "info" | "on" | "off" | "warn" | "danger" | "ok"
  text: string
}

export interface Flicker {
  id: number
  deviceId: string
  peakVA: number
}

export interface SimState {
  version: 1
  dayaVA: number
  subsidi: boolean
  billing: "prabayar" | "pascabayar"
  ppj: number
  grounding: boolean
  elcb: boolean
  mainOn: boolean
  rooms: Room[]
  devices: Device[]
  circuits: Circuit[]
  trip: TripEvent | null
  flicker: Flicker | null
  log: LogEntry[]
  seq: number
  onboarded: boolean
  /** id rumah tersimpan yang sedang dibuka (null = belum pernah disimpan) */
  docId?: string | null
  docName?: string
  /** perangkat buatan pengguna (ikut tersimpan bersama rumah) */
  customAppliances?: Appliance[]
}
