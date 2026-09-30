import { ArrowRightIcon, ZapIcon } from "lucide-react"

import { Volti, type Mood } from "~/components/art/gear-art"
import { Button } from "~/components/ui/button"
import { appliance, fmt } from "~/lib/sim/engine"
import { useSim } from "~/lib/sim/store"
import { cn } from "~/lib/utils"
import { loadTone } from "./control-panel"

const HINTS = [
  "Coba nyalakan teko listrik saat magic com sedang memasak. Apa yang terjadi?",
  "Ketuk ikon (i) di perangkat untuk melihat jalur listrik dari tiang PLN sampai ke perangkat itu.",
  "Nyalakan pompa air — perhatikan lampu berkedip karena lonjakan arus motornya.",
  "Turunkan MCB Grup Lampu di box MCB: lampu padam, tapi kulkas dan TV tetap nyala. Itulah gunanya grup terpisah.",
  "Buka tab Biaya & Daya untuk tahu token Rp100.000 cukup berapa hari.",
]

export function StatusBanner() {
  const { state, analysis, dispatch } = useSim()
  const trippedCircuit = state.circuits.find((c) => !c.on)
  const danger = analysis.warnings.filter((w) => w.level === "danger")
  const flickerDev =
    state.flicker && state.devices.find((d) => d.id === state.flicker!.deviceId)
  const hint = HINTS[state.seq % HINTS.length]

  let mood: Mood = "happy"
  let tone = "bg-card"
  let title: string
  let body: React.ReactNode
  let action: React.ReactNode = null

  if (!state.mainOn) {
    mood = "worried"
    tone = "bg-danger-soft"
    title = "Listrik seluruh rumah padam"
    body = `Beban yang menunggu: ${fmt(analysis.demandVA)} VA dari batas ${fmt(state.dayaVA)} VA. ${
      analysis.demandVA > state.dayaVA
        ? "Matikan dulu beberapa perangkat, baru naikkan MCB."
        : "Beban sudah aman, silakan naikkan MCB."
    }`
    action = (
      <Button onClick={() => dispatch({ type: "toggle-main" })}>
        <ZapIcon />
        Naikkan MCB PLN
      </Button>
    )
  } else if (trippedCircuit) {
    mood = "worried"
    tone = "bg-warn-soft"
    title = `MCB ${trippedCircuit.name} sedang turun`
    body = trippedCircuit.forLights
      ? "Semua lampu padam, tapi perangkat di stopkontak (kulkas, TV) tetap menyala — inilah gunanya lampu punya grup MCB sendiri."
      : "Ruangan di grup ini padam, sementara ruangan lain tetap menyala — inilah gunanya membagi grup MCB."
    action = (
      <Button
        variant="outline"
        onClick={() =>
          dispatch({ type: "toggle-circuit", id: trippedCircuit.id })
        }
      >
        Naikkan MCB
      </Button>
    )
  } else if (flickerDev) {
    mood = "shock"
    tone = "bg-energy-soft"
    title = "Lampu berkedip!"
    body = `${appliance(flickerDev).name} baru menyala. Motornya menarik lonjakan arus sesaat (total ± ${fmt(state.flicker!.peakVA)} VA)${
      state.flicker!.peakVA > state.dayaVA
        ? " — sempat melewati batas, hampir membuat MCB turun!"
        : ", tegangan turun sekejap sehingga lampu meredup."
    }`
  } else if (danger.length) {
    mood = "worried"
    tone = "bg-danger-soft"
    title =
      danger.length === 1
        ? danger[0].title
        : `${danger.length} masalah keamanan ditemukan`
    body =
      "Listrik masih menyala, tapi instalasinya berisiko. Lihat penjelasan dan solusinya di Cek Keamanan."
    action = (
      <Button
        variant="outline"
        onClick={() =>
          document
            .getElementById("cek-keamanan")
            ?.scrollIntoView({ behavior: "smooth", block: "center" })
        }
      >
        Lihat
        <ArrowRightIcon />
      </Button>
    )
  } else if (analysis.pct >= 0.8) {
    mood = "worried"
    tone = "bg-warn-soft"
    title = `Daya hampir habis — ${Math.round(analysis.pct * 100)}%`
    body = `Sisa ${fmt(state.dayaVA - analysis.totalVA)} VA. Perangkat di atas itu akan membuat listrik njeglek.`
  } else {
    title = analysis.runningIds.size
      ? `Aman — ${loadTone(analysis.pct).label.toLowerCase()} (${Math.round(analysis.pct * 100)}%)`
      : "Semua perangkat mati"
    body = hint
  }

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-x-3 gap-y-2 rounded-2xl p-3 pr-4 ring-1 ring-foreground/8 transition-colors",
        tone
      )}
      role="status"
      aria-live="polite"
    >
      <Volti key={mood} mood={mood} className="anim-pop h-14 w-12 shrink-0" />
      <div className="min-w-0 flex-1 basis-40">
        <p className="font-heading text-[15px] leading-snug font-semibold">
          {title}
        </p>
        <p className="text-[13px] leading-snug text-muted-foreground">{body}</p>
      </div>
      {action && (
        <div className="w-full shrink-0 pl-15 sm:w-auto sm:pl-0">{action}</div>
      )}
    </div>
  )
}
