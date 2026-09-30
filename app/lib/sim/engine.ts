import {
  APPLIANCE_MAP,
  DAYA_LEVELS,
  VOLT,
  cableSpec,
  dayaLevel,
  tarifPerKwh,
} from "./catalog"
import type { Appliance, Circuit, Device, SimState, TripEvent } from "./types"

/** Lonjakan sesaat di atas batas × faktor ini akan membuat MCB turun. */
export const SURGE_TRIP_FACTOR = 1.6
export const HEAVY_WATT = 300

export function appliance(d: Device): Appliance {
  return APPLIANCE_MAP[d.applianceId]
}

export function deviceWatt(d: Device): number {
  const a = appliance(d)
  return a.modes[d.mode]?.watt ?? a.modes[0].watt
}

/** Watt terbesar perangkat ini (mode paling berat). */
export function maxWatt(d: Device): number {
  return Math.max(...appliance(d).modes.map((m) => m.watt))
}

/** Nama yang ditampilkan: nama sendiri kalau ada. */
export function deviceName(d: Device): string {
  return d.label?.trim() || appliance(d).short
}

export function deviceVA(d: Device): number {
  return deviceWatt(d) / appliance(d).pf
}

export function maxVA(d: Device): number {
  return maxWatt(d) / appliance(d).pf
}

export function circuitIdOf(s: SimState, d: Device): string {
  if (d.circuitId && s.circuits.some((c) => c.id === d.circuitId))
    return d.circuitId
  if (appliance(d).plug === "saklar") {
    const lights = s.circuits.find((c) => c.forLights)
    if (lights) return lights.id
  }
  const room = s.rooms.find((r) => r.id === d.roomId)
  return room?.circuitId ?? s.circuits[0]?.id
}

export function circuitOf(s: SimState, d: Device): Circuit | undefined {
  const id = circuitIdOf(s, d)
  return s.circuits.find((c) => c.id === id)
}

export function isPowered(s: SimState, d: Device): boolean {
  return s.mainOn && !!circuitOf(s, d)?.on
}

export function isRunning(s: SimState, d: Device): boolean {
  return d.on && isPowered(s, d)
}

export const amps = (va: number) => va / VOLT

export interface CircuitLoad {
  circuit: Circuit
  va: number
  watt: number
  amp: number
  pct: number
  deviceIds: string[]
  cableMax: number
}

export interface Analysis {
  totalW: number
  totalVA: number
  dayaVA: number
  pct: number
  /** Beban yang akan menyala kalau MCB dinaikkan lagi */
  demandVA: number
  circuits: CircuitLoad[]
  runningIds: Set<string>
  warnings: Warning[]
}

export type WarningLevel = "danger" | "caution" | "info"

export interface Warning {
  id: string
  level: WarningLevel
  title: string
  detail: string
  fix: string
  circuitId?: string
  roomId?: string
  deviceIds?: string[]
}

export function analyze(s: SimState): Analysis {
  const runningIds = new Set<string>()
  let totalW = 0
  let totalVA = 0
  let demandVA = 0
  const circuits: CircuitLoad[] = s.circuits.map((c) => ({
    circuit: c,
    va: 0,
    watt: 0,
    amp: 0,
    pct: 0,
    deviceIds: [],
    cableMax: cableSpec(c.cable).maxMcb,
  }))
  for (const d of s.devices) {
    const cl = circuits.find((x) => x.circuit.id === circuitIdOf(s, d))
    cl?.deviceIds.push(d.id)
    if (d.on && cl?.circuit.on) demandVA += deviceVA(d)
    if (!isRunning(s, d)) continue
    runningIds.add(d.id)
    const w = deviceWatt(d)
    const va = deviceVA(d)
    totalW += w
    totalVA += va
    if (cl) {
      cl.watt += w
      cl.va += va
    }
  }
  for (const cl of circuits) {
    cl.amp = amps(cl.va)
    cl.pct = cl.amp / cl.circuit.mcbAmp
  }
  const a: Analysis = {
    totalW,
    totalVA,
    dayaVA: s.dayaVA,
    pct: totalVA / s.dayaVA,
    demandVA,
    circuits,
    runningIds,
    warnings: [],
  }
  a.warnings = safetyChecks(s, a)
  return a
}

function names(ids: string[], s: SimState) {
  const list = ids
    .map((id) => s.devices.find((d) => d.id === id))
    .filter(Boolean)
    .map((d) => appliance(d!).short)
  const uniq = [...new Set(list)]
  if (uniq.length <= 3) return uniq.join(", ")
  return `${uniq.slice(0, 3).join(", ")} dan ${uniq.length - 3} lainnya`
}

export function safetyChecks(s: SimState, a: Analysis): Warning[] {
  const w: Warning[] = []
  const pln = dayaLevel(s.dayaVA)

  for (const cl of a.circuits) {
    const c = cl.circuit
    const cab = cableSpec(c.cable)
    if (cl.amp > cab.maxMcb) {
      w.push({
        id: `hot-${c.id}`,
        level: "danger",
        title: `Kabel ${c.name} kepanasan!`,
        detail: `Arus ${fmt(cl.amp, 1)} A mengalir di kabel ${fmtMm(c.cable)} mm² yang aman hanya sampai ± ${cab.maxMcb} A. MCB ${c.mcbAmp} A tidak turun karena batasnya lebih tinggi dari kemampuan kabel. Isolasi kabel bisa meleleh dan memicu kebakaran.`,
        fix: `Matikan sebagian perangkat sekarang juga, lalu ganti MCB grup ini ke ${cab.maxMcb} A atau ganti kabelnya ke ukuran lebih besar.`,
        circuitId: c.id,
      })
    } else if (c.mcbAmp > cab.maxMcb) {
      w.push({
        id: `cable-${c.id}`,
        level: "danger",
        title: `Kabel ${c.name} terlalu kecil untuk MCB ${c.mcbAmp} A`,
        detail: `Kabel ${fmtMm(c.cable)} mm² hanya aman sampai ± ${cab.maxMcb} A. Kalau beban berat, kabel akan panas duluan sebelum MCB sempat turun.`,
        fix: `Pakai MCB maksimal ${cab.maxMcb} A untuk kabel ini, atau ganti kabel ke ukuran yang lebih besar.`,
        circuitId: c.id,
      })
    }
    const sockets = cl.deviceIds.filter((id) => {
      const d = s.devices.find((x) => x.id === id)
      return d && appliance(d).plug === "stopkontak"
    })
    if (c.cable < 2.5 && sockets.length > 0) {
      w.push({
        id: `sockcable-${c.id}`,
        level: "caution",
        title: `Stopkontak di ${c.name} memakai kabel ${fmtMm(c.cable)} mm²`,
        detail: `Menurut PUIL, kabel 1,5 mm² dipakai untuk jalur lampu. Jalur stopkontak sebaiknya minimal 2,5 mm² karena alat yang dicolok (setrika, rice cooker, pompa) bisa menarik arus besar.`,
        fix: "Pakai kabel NYM 3×2,5 mm² untuk jalur stopkontak, atau jadikan grup ini khusus lampu.",
        circuitId: c.id,
        deviceIds: sockets,
      })
    }
    if (c.on && cl.pct >= 0.8 && cl.pct <= 1) {
      w.push({
        id: `cnear-${c.id}`,
        level: "caution",
        title: `${c.name} hampir penuh (${Math.round(cl.pct * 100)}%)`,
        detail: `Arus ${fmt(cl.amp, 1)} A dari batas MCB ${c.mcbAmp} A. Tambah satu perangkat lagi, MCB grup ini bisa turun.`,
        fix: "Pindahkan sebagian perangkat ke grup MCB lain atau pakai bergantian.",
        circuitId: c.id,
      })
    }
  }

  const hasLamps = s.devices.some((d) => appliance(d).plug === "saklar")
  if (
    hasLamps &&
    s.circuits.length > 0 &&
    !s.circuits.some((c) => c.forLights)
  ) {
    w.push({
      id: "no-light-group",
      level: "info",
      title: "Lampu belum punya grup MCB sendiri",
      detail:
        "Di rumah Indonesia, lampu umumnya dibuat satu grup tersendiri (kabel NYM 1,5 mm², MCB 6–10 A). Jadi kalau stopkontak bermasalah dan MCB-nya turun, lampu tetap menyala dan kamu tidak gelap-gelapan.",
      fix: "Tambah grup MCB baru, lalu nyalakan opsi 'Khusus lampu' di pengaturan grup.",
    })
  }

  const bigger = s.circuits.filter((c) => c.mcbAmp > pln.mcb)
  if (bigger.length) {
    w.push({
      id: "pln-bigger",
      level: "info",
      title:
        bigger.length === s.circuits.length
          ? `Semua MCB grup lebih besar dari MCB PLN (${pln.mcb} A)`
          : `${bigger.map((c) => c.name).join(", ")} lebih besar dari MCB PLN (${pln.mcb} A)`,
      detail: `Kalau beban berlebih, yang turun duluan adalah MCB PLN di meteran sehingga seluruh rumah padam — bukan hanya satu grup. Ini wajar di rumah berdaya kecil.`,
      fix: "Tidak berbahaya. Kalau ingin gangguan hanya memadamkan satu area, pakai MCB grup yang lebih kecil dari MCB PLN (selama cukup untuk bebannya).",
    })
  }

  if (s.mainOn && a.pct >= 0.8 && a.pct <= 1) {
    w.push({
      id: "main-near",
      level: "caution",
      title: `Daya rumah hampir habis (${Math.round(a.pct * 100)}%)`,
      detail: `Terpakai ${fmt(a.totalVA)} VA dari ${fmt(s.dayaVA)} VA. Menyalakan perangkat besar sekarang bisa membuat listrik padam.`,
      fix: "Tunda pemakaian alat berdaya besar (setrika, teko listrik, pompa) sampai ada yang dimatikan.",
    })
  }

  const needGround = s.devices.filter((d) => appliance(d).needsGround)
  if (!s.grounding && needGround.length) {
    w.push({
      id: "ground",
      level: "danger",
      title: "Rumah belum punya arde (grounding)",
      detail: `${names(
        needGround.map((d) => d.id),
        s
      )} berbadan logam. Tanpa arde, kalau ada kabel bocor di dalamnya, badan perangkat bisa menyetrum orang yang menyentuhnya.`,
      fix: "Pasang batang arde (ditanam ke tanah) dan pakai stopkontak 3 lubang/berkaki arde. Nyalakan opsi 'Arde' di pengaturan rumah.",
      deviceIds: needGround.map((d) => d.id),
    })
  }

  const wet = s.devices.filter((d) => appliance(d).wet)
  if (!s.elcb && wet.length) {
    w.push({
      id: "elcb",
      level: "caution",
      title: "Perangkat di area basah tanpa ELCB",
      detail: `${names(
        wet.map((d) => d.id),
        s
      )} dipakai dekat air. MCB hanya melindungi dari beban berlebih, bukan dari kesetrum. ELCB/RCBO memutus listrik dalam sekejap kalau ada arus bocor ke tubuh.`,
      fix: "Pasang ELCB/RCBO 30 mA di box MCB. Aktifkan opsi 'ELCB' di pengaturan rumah.",
      deviceIds: wet.map((d) => d.id),
    })
  }

  for (const room of s.rooms) {
    const plugged = s.devices.filter(
      (d) => d.roomId === room.id && appliance(d).plug === "stopkontak"
    )
    if (plugged.length > room.sockets) {
      const heavy = plugged.filter((d) => deviceWatt(d) >= 600)
      w.push({
        id: `sock-${room.id}`,
        level: heavy.length ? "danger" : "caution",
        title: `${room.name}: stopkontak kurang`,
        detail: `Ada ${plugged.length} perangkat tapi hanya ${room.sockets} lubang stopkontak, jadi harus pakai colokan T/terminal bertumpuk.${
          heavy.length
            ? ` ${names(
                heavy.map((d) => d.id),
                s
              )} berdaya besar — terminal murah bisa meleleh.`
            : ""
        }`,
        fix: "Tambah titik stopkontak di ruangan ini (atur di menu ruangan). Colokkan alat berdaya besar langsung ke stopkontak dinding.",
        roomId: room.id,
      })
    }
  }

  for (const d of s.devices) {
    if (appliance(d).art !== "ac") continue
    const cl = a.circuits.find((c) => c.circuit.id === circuitIdOf(s, d))
    if (cl && cl.deviceIds.length > 1) {
      w.push({
        id: `ac-${d.id}`,
        level: "info",
        title: `${appliance(d).short} berbagi jalur dengan perangkat lain`,
        detail: `AC ada di ${cl.circuit.name} bersama ${cl.deviceIds.length - 1} perangkat lain. Saat kompresor mulai, lonjakan arusnya bisa membuat MCB grup turun atau lampu berkedip.`,
        fix: "Idealnya AC punya grup MCB sendiri (10 A, kabel 2,5 mm²). Atur di detail perangkat AC.",
        deviceIds: [d.id],
      })
    }
  }

  const order = { danger: 0, caution: 1, info: 2 }
  return w.sort((x, y) => order[x.level] - order[y.level])
}

export type SettleTrigger =
  | { kind: "device-on"; deviceId: string }
  | { kind: "reset-main" }
  | { kind: "reset-circuit"; circuitId: string }
  | { kind: "change" }

/**
 * Menjalankan "hukum fisika" setelah ada perubahan: cek MCB grup dulu
 * (paling dekat dengan beban), lalu MCB PLN, lalu lonjakan arus motor.
 */
export function settle(s: SimState, trigger: SettleTrigger): SimState {
  if (!s.mainOn) return s
  let next = s
  let trip: TripEvent | null = null
  const retrip =
    trigger.kind === "reset-main" || trigger.kind === "reset-circuit"
  const triggerDeviceId =
    trigger.kind === "device-on" ? trigger.deviceId : undefined
  let seqN = s.seq
  const seq = () => ++seqN

  const contributors = (ids: string[]) =>
    ids
      .map((id) => next.devices.find((d) => d.id === id)!)
      .filter((d) => isRunning(next, d))
      .map((d) => ({ deviceId: d.id, va: deviceVA(d) }))
      .sort((a, b) => b.va - a.va)

  // 1. MCB grup
  const a = analyze(next)
  for (const cl of a.circuits) {
    if (cl.circuit.on && cl.amp > cl.circuit.mcbAmp) {
      next = {
        ...next,
        circuits: next.circuits.map((c) =>
          c.id === cl.circuit.id ? { ...c, on: false } : c
        ),
      }
      trip ??= {
        id: 0,
        scope: "circuit",
        circuitId: cl.circuit.id,
        reason: "overload",
        loadVA: cl.va,
        limitVA: cl.circuit.mcbAmp * VOLT,
        triggerDeviceId,
        contributors: contributors(cl.deviceIds),
        retrip,
      }
    }
  }

  // 2. MCB PLN (beban normal)
  const b = analyze(next)
  if (b.totalVA > s.dayaVA) {
    trip = {
      id: 0,
      scope: "main",
      reason: "overload",
      loadVA: b.totalVA,
      limitVA: s.dayaVA,
      triggerDeviceId,
      contributors: contributors([...b.runningIds]),
      retrip,
    }
    next = { ...next, mainOn: false }
  } else {
    // 3. Lonjakan arus sesaat (motor/kompresor)
    let peak = b.totalVA
    let surgeDevice: string | undefined
    if (trigger.kind === "device-on") {
      const d = next.devices.find((x) => x.id === trigger.deviceId)
      if (d && b.runningIds.has(d.id)) {
        peak = b.totalVA + deviceVA(d) * (appliance(d).surge - 1)
        surgeDevice = d.id
      }
    } else if (
      trigger.kind === "reset-main" ||
      trigger.kind === "reset-circuit"
    ) {
      for (const d of next.devices) {
        if (!b.runningIds.has(d.id)) continue
        if (
          trigger.kind === "reset-circuit" &&
          circuitIdOf(next, d) !== trigger.circuitId
        )
          continue
        peak += deviceVA(d) * (appliance(d).surge - 1)
      }
    }
    if (peak > s.dayaVA * SURGE_TRIP_FACTOR) {
      trip = {
        id: 0,
        scope: "main",
        reason: "surge",
        loadVA: peak,
        limitVA: s.dayaVA,
        triggerDeviceId: surgeDevice,
        contributors: contributors([...b.runningIds]),
        retrip,
      }
      next = { ...next, mainOn: false }
    } else if (surgeDevice && (peak > s.dayaVA || peak - b.totalVA >= 200)) {
      next = {
        ...next,
        flicker: { id: seq(), deviceId: surgeDevice, peakVA: peak },
      }
    }
  }

  if (trip) next = { ...next, trip: { ...trip, id: seq() } }
  return { ...next, seq: seqN }
}

// ——— Energi & tagihan ———

export function dailyWh(d: Device): number {
  const a = appliance(d)
  return a.modes.reduce(
    (sum, m, i) => sum + m.watt * (d.hours[i] ?? 0) * a.duty,
    0
  )
}

export function monthlyKwh(d: Device): number {
  return (dailyWh(d) * 30) / 1000
}

export interface Bill {
  kwh: number
  tarif: number
  energi: number
  minimum: number
  ppj: number
  total: number
  belowMinimum: boolean
}

export function bill(s: SimState): Bill {
  const kwh = s.devices.reduce((sum, d) => sum + monthlyKwh(d), 0)
  const tarif = tarifPerKwh(s.dayaVA, s.subsidi)
  const energi = kwh * tarif
  const minimum =
    s.billing === "pascabayar" ? 40 * (s.dayaVA / 1000) * tarif : 0
  const base = Math.max(energi, minimum)
  const ppj = base * (s.ppj / 100)
  return {
    kwh,
    tarif,
    energi,
    minimum,
    ppj,
    total: base + ppj,
    belowMinimum: minimum > energi,
  }
}

export interface Recommendation {
  biggest?: { deviceId: string; va: number }
  allOnVA: number
  staggeredVA: number
  peakSurgeVA: number
  forAllOn: number
  forStaggered: number
}

function levelFor(va: number) {
  return (
    DAYA_LEVELS.find((l) => l.va >= va * 1.1) ??
    DAYA_LEVELS[DAYA_LEVELS.length - 1]
  ).va
}

export function recommend(s: SimState): Recommendation {
  const all = s.devices.reduce((sum, d) => sum + maxVA(d), 0)
  const light = s.devices
    .filter((d) => maxWatt(d) < HEAVY_WATT)
    .reduce((sum, d) => sum + maxVA(d), 0)
  const heavy = s.devices
    .filter((d) => maxWatt(d) >= HEAVY_WATT)
    .map(maxVA)
    .sort((a, b) => b - a)
  const staggered = light + (heavy[0] ?? 0)
  const biggestSurge = s.devices.reduce(
    (m, d) => Math.max(m, maxVA(d) * (appliance(d).surge - 1)),
    0
  )
  const big = [...s.devices].sort((x, y) => maxVA(y) - maxVA(x))[0]
  return {
    biggest: big && { deviceId: big.id, va: maxVA(big) },
    allOnVA: all,
    staggeredVA: staggered,
    peakSurgeVA: all + biggestSurge,
    forAllOn: levelFor(all),
    forStaggered: levelFor(staggered),
  }
}

// ——— Format ———

const nf = (d: number) =>
  new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: d,
    minimumFractionDigits: 0,
  })

export function fmt(n: number, digits = 0) {
  return nf(digits).format(n)
}

export function fmtMm(n: number) {
  return nf(1).format(n)
}

export function rupiah(n: number) {
  return "Rp" + nf(0).format(Math.round(n / 100) * 100)
}
