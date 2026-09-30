import * as React from "react"
import { ChevronDownIcon, ShieldAlertIcon } from "lucide-react"

import { ApplianceArt } from "~/components/art/appliance-art"
import {
  CableArt,
  ElcbArt,
  GroundArt,
  KwhMeterArt,
  McbArt,
  PanelBoxArt,
  PoleArt,
  SocketArt,
  SwitchArt,
  TerminalArt,
  Volti,
} from "~/components/art/gear-art"
import { cn } from "~/lib/utils"

const JOURNEY = [
  {
    art: <PoleArt live className="h-16 w-5" />,
    title: "Tiang & kabel PLN",
    text: "Listrik 220 V datang dari trafo di tiang, masuk lewat kabel sambungan rumah (SR).",
  },
  {
    art: <KwhMeterArt powered display="1300" mcbOn className="h-16 w-12" />,
    title: "Meteran + MCB PLN",
    text: "Mencatat kWh yang kamu pakai. MCB di bawahnya membatasi daya sesuai langganan.",
  },
  {
    art: <PanelBoxArt className="h-12 w-16" />,
    title: "Box MCB rumah",
    text: "Membagi listrik ke beberapa grup/jalur, masing-masing dengan MCB sendiri.",
  },
  {
    art: <CableArt className="h-12 w-16" />,
    title: "Kabel instalasi",
    text: "Kabel NYM di dalam dinding/plafon mengantar listrik ke tiap ruangan.",
  },
  {
    art: <SocketArt className="size-14" />,
    title: "Stopkontak & saklar",
    text: "Titik tempat perangkat dicolok (stopkontak) atau dinyalakan (saklar lampu).",
  },
  {
    art: <ApplianceArt kind="ricecooker" on mode={0} className="size-14" />,
    title: "Perangkatmu",
    text: "Menyala kalau semua sambungan dari tiang sampai sini tidak terputus.",
  },
]

const PARTS = [
  {
    art: <McbArt amp={10} on className="h-20 w-10" />,
    name: "MCB",
    what: "Saklar pengaman otomatis. Tuas turun sendiri kalau arus melebihi batas.",
    why: "Melindungi kabel supaya tidak panas dan terbakar.",
    tip: "Pilih MCB berlogo SNI. Angka C6, C10, C16 artinya batas 6, 10, 16 ampere.",
  },
  {
    art: <ElcbArt className="h-20 w-14" />,
    name: "ELCB / RCBO",
    what: "Pengaman arus bocor. Ada tombol “T” untuk tes bulanan.",
    why: "MCB tidak bisa mendeteksi orang kesetrum. ELCB bisa, dalam 0,03 detik.",
    tip: "Wajib untuk kamar mandi, area cuci, dan pemanas air.",
  },
  {
    art: <CableArt mm2={2.5} className="h-16 w-24" />,
    name: "Kabel NYM",
    what: "Kabel isi 2–3 inti tembaga: coklat/hitam (fasa), biru (netral), hijau-kuning (arde).",
    why: "Ukuran kabel menentukan berapa arus yang aman dialirkan.",
    tip: "Sesuai PUIL: 1,5 mm² untuk jalur lampu (MCB 6–10 A), 2,5 mm² untuk jalur stopkontak (MCB 10–16 A). Jangan pakai 1,5 mm² untuk stopkontak.",
  },
  {
    art: <SocketArt className="size-18" />,
    name: "Stopkontak",
    what: "Model Indonesia: dua lubang bulat dengan klip logam arde di atas-bawah.",
    why: "Klip arde menyambungkan badan logam perangkat ke tanah.",
    tip: "Pasang minimal 30 cm dari lantai, dan di kamar mandi pakai yang bertutup (IP44).",
  },
  {
    art: <SwitchArt on className="size-18" />,
    name: "Saklar",
    what: "Memutus/menyambung kabel fasa ke lampu.",
    why: "Yang diputus harus kabel fasa, bukan netral, supaya fitting lampu aman saat ganti bohlam.",
    tip: "Saklar kamar mandi sebaiknya dipasang di luar pintu.",
  },
  {
    art: <TerminalArt warn className="h-16 w-18" />,
    name: "Colokan T / terminal",
    what: "Cabang stopkontak portabel.",
    why: "Terminal murah sering kabelnya tipis. Kalau dipakai setrika + rice cooker sekaligus, bisa meleleh.",
    tip: "Jangan menumpuk terminal. Alat ≥ 300 W sebaiknya langsung ke stopkontak dinding.",
  },
  {
    art: <GroundArt className="size-18" />,
    name: "Arde (grounding)",
    what: "Batang tembaga ± 1–3 m ditanam ke tanah, disambung kabel hijau-kuning.",
    why: "Kalau ada kebocoran, listrik mengalir ke tanah, bukan ke tubuhmu.",
    tip: "Ciri rumah tanpa arde: badan kulkas/mesin cuci terasa ‘nyetrum’ saat disentuh.",
  },
]

const FAQ = [
  {
    q: "Kenapa listrik sering njeglek?",
    a: "Karena total perangkat yang menyala melebihi daya langganan (misal 900 VA), atau satu grup melebihi rating MCB-nya. Bisa juga karena korsleting. Solusi: matikan sebagian perangkat, naikkan MCB, dan gunakan alat berdaya besar bergantian. Kalau MCB langsung turun walau semua perangkat mati, kemungkinan ada korsleting — panggil teknisi.",
  },
  {
    q: "Kenapa lampu berkedip saat pompa air atau kulkas menyala?",
    a: "Motor butuh arus 2–5× lipat sesaat untuk mulai berputar (arus start). Tegangan turun sepersekian detik sehingga lampu berkedip. Kalau rumah sudah hampir penuh bebannya, lonjakan ini bisa membuat MCB turun.",
  },
  {
    q: "Apa bedanya Watt dan VA?",
    a: "Watt adalah tenaga yang benar-benar dipakai perangkat. VA adalah ‘jatah’ yang ditarik dari PLN. Untuk pemanas (setrika, rice cooker) angkanya hampir sama. Untuk motor dan lampu neon lama, VA bisa jauh lebih besar dari Watt — jadi 900 VA tidak berarti bisa menyalakan 900 W perangkat bermotor.",
  },
  {
    q: "Kenapa kabel harus sesuai MCB?",
    a: "MCB bertugas melindungi kabel. Kalau MCB 16 A dipasang di kabel 1,5 mm² (aman ± 10 A), arus 14 A tidak akan membuat MCB turun, padahal kabelnya sudah panas. Lama-lama isolasi meleleh dan bisa memicu kebakaran. Inilah salah satu penyebab kebakaran rumah yang paling umum.",
  },
  {
    q: "Kenapa lampu dan stopkontak biasanya beda grup MCB?",
    a: "Di rumah Indonesia, lampu umumnya punya grup sendiri dengan kabel NYM 1,5 mm² dan MCB 6–10 A, sedangkan stopkontak memakai kabel 2,5 mm² dan MCB 10–16 A. Alasannya: beban lampu kecil dan stabil, sedangkan stopkontak bisa dicolok alat besar. Kalau ada alat yang korsleting atau terlalu berat di stopkontak, hanya MCB stopkontak yang turun — lampu tetap menyala sehingga kamu tidak gelap-gelapan saat memperbaikinya. Di rumah lama berdaya kecil (450–900 VA) kadang semuanya masih satu jalur langsung dari MCB PLN.",
  },
  {
    q: "Naik daya bikin tagihan naik?",
    a: "Tidak otomatis. Tagihan dihitung dari kWh yang kamu pakai. Tarif per kWh untuk 1.300 VA dan 2.200 VA sama. Tapi kalau dari 900 VA subsidi naik ke 1.300 VA, tarifnya naik dari Rp605 ke Rp1.444,70 per kWh.",
  },
  {
    q: "Prabayar atau pascabayar, mana yang lebih baik?",
    a: "Tarif per kWh-nya sama. Prabayar (token) memudahkan mengontrol pengeluaran. Pascabayar lebih praktis tapi ada rekening minimum 40 jam nyala per bulan dan denda kalau telat bayar.",
  },
  {
    q: "Boleh pasang instalasi sendiri?",
    a: "Mengganti lampu atau memindah perangkat boleh. Tapi menarik kabel baru, menambah grup MCB, atau mengubah instalasi sebaiknya oleh instalatir bersertifikat. Rumah baru atau tambah daya memerlukan Sertifikat Laik Operasi (SLO).",
  },
]

export function LearnView() {
  return (
    <div className="flex flex-col gap-8">
      <section>
        <SectionTitle
          kicker="Perjalanan listrik"
          title="Dari tiang PLN sampai rice cooker-mu"
        />
        <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {JOURNEY.map((j, i) => (
            <li
              key={j.title}
              className="relative flex flex-col items-center gap-2 rounded-2xl bg-card p-4 text-center ring-1 ring-foreground/8"
            >
              <span className="absolute top-3 left-3 grid size-6 place-items-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                {i + 1}
              </span>
              <div className="grid h-20 place-items-center">{j.art}</div>
              <p className="font-heading text-sm font-semibold">{j.title}</p>
              <p className="text-xs leading-relaxed text-muted-foreground">
                {j.text}
              </p>
            </li>
          ))}
        </ol>
        <p className="mt-3 text-center text-sm text-muted-foreground">
          Kalau satu saja sambungan putus (misal MCB turun), semua perangkat
          setelahnya ikut mati.
        </p>
      </section>

      <section>
        <SectionTitle
          kicker="Satuan penting"
          title="Volt, Ampere, Watt — pakai analogi air"
        />
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <UnitCard
            sym="V"
            name="Volt"
            color="oklch(0.68 0.13 190)"
            analog="Tekanan air di pipa"
            text="Listrik PLN ± 220 V. Selalu sama, tidak perlu kamu atur."
          />
          <UnitCard
            sym="A"
            name="Ampere"
            color="oklch(0.75 0.15 70)"
            analog="Derasnya aliran air"
            text="Makin banyak perangkat menyala, makin deras arusnya. MCB membatasi ini."
          />
          <UnitCard
            sym="W"
            name="Watt / VA"
            color="var(--primary)"
            analog="Tenaga air untuk memutar kincir"
            text="Volt × Ampere. 220 V × 4 A ≈ 900 VA — itulah daya rumah 900 VA."
          />
          <UnitCard
            sym="kWh"
            name="kilowatt-jam"
            color="oklch(0.65 0.18 10)"
            analog="Jumlah air yang terpakai sebulan"
            text="Yang kamu bayar ke PLN. Setrika 350 W × 1 jam × 30 hari ≈ 10,5 kWh."
          />
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-center gap-2 rounded-2xl bg-art-soft/60 p-4 text-center font-heading text-lg">
          <span>Arus (A)</span>
          <span className="text-muted-foreground">=</span>
          <span>Daya (VA)</span>
          <span className="text-muted-foreground">÷</span>
          <span>220 V</span>
          <span className="mx-3 hidden text-muted-foreground sm:inline">·</span>
          <span className="w-full font-sans text-sm text-muted-foreground sm:w-auto">
            contoh: magic com 395 VA ÷ 220 V ≈ 1,8 A
          </span>
        </div>
      </section>

      <section>
        <SectionTitle
          kicker="Kenali komponennya"
          title="Yang ada di instalasi rumahmu"
        />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {PARTS.map((p) => (
            <article
              key={p.name}
              className="flex flex-col gap-2 rounded-2xl bg-card p-4 ring-1 ring-foreground/8"
            >
              <div className="grid h-24 place-items-center rounded-xl bg-art-soft/50">
                {p.art}
              </div>
              <h3 className="font-heading text-base font-semibold">{p.name}</h3>
              <p className="text-[13px] leading-relaxed">{p.what}</p>
              <p className="text-[13px] leading-relaxed text-muted-foreground">
                <b className="text-foreground">Kenapa penting: </b>
                {p.why}
              </p>
              <p className="mt-auto rounded-lg bg-energy-soft px-2.5 py-2 text-xs leading-relaxed">
                {p.tip}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section>
        <SectionTitle
          kicker="Tanya jawab"
          title="Pertanyaan yang sering muncul"
        />
        <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
          <div className="flex flex-col gap-2">
            {FAQ.map((f, i) => (
              <Faq key={f.q} q={f.q} a={f.a} defaultOpen={i === 0} />
            ))}
          </div>
          <aside className="flex flex-col items-center gap-3 self-start rounded-2xl bg-danger-soft p-5 text-center">
            <Volti mood="worried" className="h-20 w-16" />
            <p className="flex items-center gap-1.5 font-heading text-sm font-semibold">
              <ShieldAlertIcon className="size-4 text-destructive" /> Ingat ya
            </p>
            <p className="text-xs leading-relaxed text-foreground/80">
              Simulator ini untuk belajar dan memperkirakan. Angka daya
              perangkat bisa berbeda tergantung merek. Pekerjaan instalasi
              sungguhan harus dikerjakan instalatir bersertifikat, dan selalu
              matikan MCB sebelum menyentuh kabel.
            </p>
          </aside>
        </div>
      </section>
    </div>
  )
}

function SectionTitle({ kicker, title }: { kicker: string; title: string }) {
  return (
    <header className="mb-4">
      <p className="text-xs font-semibold tracking-wider text-primary uppercase">
        {kicker}
      </p>
      <h2 className="font-heading text-2xl font-semibold tracking-tight">
        {title}
      </h2>
    </header>
  )
}

function UnitCard({
  sym,
  name,
  color,
  analog,
  text,
}: {
  sym: string
  name: string
  color: string
  analog: string
  text: string
}) {
  return (
    <div className="flex gap-3 rounded-2xl bg-card p-4 ring-1 ring-foreground/8">
      <span
        className="grid size-12 shrink-0 place-items-center rounded-xl font-heading text-lg font-bold text-white"
        style={{ background: color }}
      >
        {sym}
      </span>
      <div>
        <p className="text-sm font-semibold">{name}</p>
        <p className="text-xs font-medium text-primary">≈ {analog}</p>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          {text}
        </p>
      </div>
    </div>
  )
}

function Faq({
  q,
  a,
  defaultOpen,
}: {
  q: string
  a: string
  defaultOpen?: boolean
}) {
  const [open, setOpen] = React.useState(!!defaultOpen)
  return (
    <div className="rounded-2xl bg-card ring-1 ring-foreground/8">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 p-4 text-left"
      >
        <span className="flex-1 text-sm font-semibold">{q}</span>
        <ChevronDownIcon
          className={cn(
            "size-4 shrink-0 text-muted-foreground transition",
            open && "rotate-180"
          )}
        />
      </button>
      {open && (
        <p className="px-4 pb-4 text-[13px] leading-relaxed text-muted-foreground">
          {a}
        </p>
      )}
    </div>
  )
}
