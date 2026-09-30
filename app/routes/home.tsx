import {
  ArrowRightIcon,
  BookOpenIcon,
  CalculatorIcon,
  ChevronDownIcon,
  ShieldCheckIcon,
  ZapOffIcon,
} from "lucide-react"
import { Link } from "react-router"

import { ApplianceArt } from "~/components/art/appliance-art"
import {
  BrandMark,
  KwhMeterArt,
  McbArt,
  PoleArt,
  Volti,
} from "~/components/art/gear-art"
import { buttonVariants } from "~/components/ui/button"
import { APPLIANCES } from "~/lib/sim/catalog"
import { FAQ, SITE, absUrl, jsonLd, pageMeta } from "~/lib/site"
import { cn } from "~/lib/utils"
import type { Route } from "./+types/home"

export function meta({}: Route.MetaArgs) {
  return [
    ...pageMeta({
      title: "Simulasi Listrik Rumah — belajar listrik tanpa kesetrum",
      description: SITE.description,
      path: "/",
    }),
    { name: "keywords", content: KEYWORDS },
    jsonLd({
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "WebSite",
          "@id": `${SITE.url}/#website`,
          url: `${SITE.url}/`,
          name: SITE.name,
          description: SITE.description,
          inLanguage: SITE.lang,
          publisher: { "@id": `${SITE.url}/#author` },
        },
        {
          "@type": "Person",
          "@id": `${SITE.url}/#author`,
          name: SITE.author,
          url: `${SITE.url}/`,
        },
        {
          "@type": "WebApplication",
          "@id": `${SITE.url}/#app`,
          name: SITE.name,
          url: absUrl("/simulator"),
          description: SITE.description,
          image: absUrl(SITE.ogImage),
          applicationCategory: "EducationalApplication",
          operatingSystem: "Semua (berbasis web)",
          browserRequirements: "Membutuhkan JavaScript",
          inLanguage: SITE.lang,
          isAccessibleForFree: true,
          offers: { "@type": "Offer", price: "0", priceCurrency: "IDR" },
          audience: {
            "@type": "Audience",
            audienceType: "Pemilik dan penghuni rumah di Indonesia",
          },
          featureList: [
            "Menghitung beban listrik dan rekomendasi daya PLN (450–7.700 VA)",
            "Menjelaskan penyebab MCB turun (njeglek)",
            "Memperkirakan tagihan listrik PLN bulanan",
            "Memeriksa keamanan instalasi: kabel, arde, ELCB",
            `${APPLIANCES.length} perangkat rumah tangga dengan daya realistis`,
          ],
          author: { "@id": `${SITE.url}/#author` },
        },
        {
          "@type": "HowTo",
          name: "Cara menghitung kebutuhan daya listrik rumah dengan simulator",
          step: STEPS.map((s, i) => ({
            "@type": "HowToStep",
            position: i + 1,
            name: s.t,
            text: s.d,
          })),
        },
        {
          "@type": "FAQPage",
          mainEntity: FAQ.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        },
      ],
    }),
  ]
}

const KEYWORDS =
  "simulasi listrik rumah, simulator listrik, hitung daya listrik, MCB njeglek, MCB turun, daya 900 VA, daya 1300 VA, tagihan listrik PLN, tarif listrik 2025, instalasi listrik rumah, watt ke VA"

const STEPS = [
  {
    t: "Pilih rumah & daya",
    d: "Mulai dari contoh rumah tipe 36, rumah keluarga, atau kosong. Atur daya sesuai meteranmu.",
  },
  {
    t: "Pasang & nyalakan perangkat",
    d: "Tambah perangkat ke tiap ruangan. Ketuk untuk menyalakan dan lihat jarum meteran bergerak.",
  },
  {
    t: "Pahami & hitung",
    d: "Ketuk (i) untuk tahu kenapa perangkat menyala atau mati. Buka Biaya & Daya untuk tagihan bulanan.",
  },
]

export default function Home() {
  return (
    <div className="min-h-svh overflow-x-hidden">
      <header className="mx-auto flex max-w-6xl items-center gap-3 px-5 py-4">
        <Link
          to="/"
          className="flex items-center gap-3 rounded-lg font-heading text-base font-semibold"
        >
          <BrandMark className="size-9" />
          Simulasi Listrik Rumah
        </Link>
        <Link
          to="/simulator"
          className={cn(buttonVariants({ variant: "outline" }), "ml-auto")}
        >
          Buka simulator
        </Link>
      </header>

      <main id="konten">
        <section
          aria-labelledby="judul"
          className="mx-auto grid max-w-6xl items-center gap-10 px-5 pt-6 pb-16 lg:grid-cols-[1fr_1.1fr] lg:pt-12"
        >
          <div>
            <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-art-soft px-3 py-1 text-xs font-semibold text-primary">
              <span className="size-1.5 rounded-full bg-primary" /> Untuk rumah
              di Indonesia · 450 VA – 7.700 VA
            </p>
            <h1
              id="judul"
              className="font-heading text-4xl leading-[1.1] font-semibold tracking-tight text-balance sm:text-5xl"
            >
              Pahami listrik rumahmu{" "}
              <span className="text-primary">sebelum njeglek.</span>
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              Pasang lampu, kulkas, magic com, sampai AC di rumah virtual. Lihat
              berapa daya yang terpakai, kenapa MCB turun, dan berapa tagihan
              PLN-mu tiap bulan — tanpa perlu paham istilah teknik.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/simulator"
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "h-12 rounded-xl px-5 text-base"
                )}
              >
                Mulai simulasi
                <ArrowRightIcon />
              </Link>
              <a
                href="#cara"
                className={cn(
                  buttonVariants({ variant: "ghost", size: "lg" }),
                  "h-12 rounded-xl px-4 text-base"
                )}
              >
                Lihat caranya
              </a>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              Gratis · tanpa daftar · tersimpan otomatis di perangkatmu
            </p>
          </div>
          <HeroScene />
        </section>

        <section className="bg-card py-16">
          <div className="mx-auto max-w-6xl px-5">
            <h2 className="max-w-2xl font-heading text-3xl font-semibold tracking-tight">
              Tiga pertanyaan yang sering bikin bingung
            </h2>
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              <Feature
                icon={<CalculatorIcon className="size-5" />}
                art={
                  <KwhMeterArt
                    powered
                    display="1300"
                    sub="VA"
                    mcbOn
                    className="h-24 w-16"
                  />
                }
                title="“Daya 900 VA cukup nggak?”"
                text="Masukkan perangkatmu, simulator menghitung beban dan merekomendasikan daya yang pas — lengkap dengan opsi pakai bergantian."
              />
              <Feature
                icon={<ZapOffIcon className="size-5" />}
                art={
                  <McbArt amp={4} on={false} tripped className="h-24 w-12" />
                }
                title="“Kok listriknya njeglek?”"
                text="Saat MCB turun, Volti menjelaskan perangkat mana pemicunya, kenapa, dan langkah menyalakannya lagi."
              />
              <Feature
                icon={<ShieldCheckIcon className="size-5" />}
                art={<ApplianceArt kind="washer" on className="size-20" />}
                title="“Instalasiku aman?”"
                text="Cek kabel yang terlalu kecil, stopkontak bertumpuk, rumah tanpa arde, dan kamar mandi tanpa ELCB."
              />
            </div>
          </div>
        </section>

        <section id="cara" className="mx-auto max-w-6xl px-5 py-16">
          <h2 className="font-heading text-3xl font-semibold tracking-tight">
            Cara pakainya
          </h2>
          <ol className="mt-8 grid gap-4 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <li
                key={s.t}
                className="rounded-3xl bg-card p-6 ring-1 ring-foreground/8"
              >
                <span className="grid size-10 place-items-center rounded-2xl bg-primary font-heading text-lg font-semibold text-primary-foreground">
                  {i + 1}
                </span>
                <h3 className="mt-4 font-heading text-lg font-semibold">
                  {s.t}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  {s.d}
                </p>
              </li>
            ))}
          </ol>
        </section>

        <section className="mx-auto max-w-6xl px-5 pb-16">
          <div className="rounded-3xl bg-art-soft/60 p-6 sm:p-10">
            <h2 className="font-heading text-2xl font-semibold tracking-tight">
              {APPLIANCES.length} perangkat yang umum di rumah Indonesia
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Dari magic com, pompa air sumur, dispenser galon, sampai cas motor
              listrik — dengan daya yang realistis.
            </p>
            <ul className="mt-6 grid grid-cols-4 gap-3 sm:grid-cols-6 lg:grid-cols-10">
              {APPLIANCES.filter(
                (a, i, arr) => arr.findIndex((b) => b.art === a.art) === i
              )
                .slice(0, 20)
                .map((a, i) => (
                  <li
                    key={a.id}
                    className="flex flex-col items-center gap-1.5 rounded-2xl bg-card p-2.5 text-center ring-1 ring-foreground/5"
                  >
                    <ApplianceArt
                      kind={a.art}
                      on={i % 3 === 0}
                      mode={a.art === "ricecooker" ? 0 : 1}
                      className="size-11"
                    />
                    <span className="text-[10.5px] leading-tight font-medium">
                      {a.short}
                    </span>
                  </li>
                ))}
            </ul>
          </div>
        </section>

        <section
          id="faq"
          aria-labelledby="judul-faq"
          className="mx-auto max-w-3xl px-5 pb-20"
        >
          <h2
            id="judul-faq"
            className="font-heading text-3xl font-semibold tracking-tight"
          >
            Pertanyaan yang sering ditanyakan
          </h2>
          <div className="mt-6 divide-y rounded-3xl bg-card ring-1 ring-foreground/8">
            {FAQ.map((f) => (
              <details key={f.q} className="group px-6 py-1">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-lg py-4 font-heading text-base font-semibold [&::-webkit-details-marker]:hidden">
                  <h3>{f.q}</h3>
                  <ChevronDownIcon
                    aria-hidden
                    className="size-5 shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
                  />
                </summary>
                <p className="pb-5 text-sm leading-relaxed text-muted-foreground">
                  {f.a}
                </p>
              </details>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 pb-20">
          <div className="relative flex flex-col items-center gap-5 overflow-hidden rounded-3xl bg-primary px-6 py-12 text-center text-primary-foreground sm:flex-row sm:text-left">
            <Volti mood="cheer" className="anim-bob h-28 w-24 shrink-0" />
            <div className="flex-1">
              <p className="font-heading text-2xl font-semibold">
                Siap menyalakan rumah virtualmu?
              </p>
              <p className="mt-1 text-primary-foreground/80">
                Butuh sekitar 5 menit untuk memahami dasar-dasarnya.
              </p>
            </div>
            <Link
              to="/simulator"
              className={cn(
                buttonVariants({ variant: "secondary", size: "lg" }),
                "h-12 rounded-xl px-5 text-base"
              )}
            >
              Mulai sekarang
              <ArrowRightIcon />
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t py-8 text-center text-xs text-muted-foreground">
        <p className="mx-auto max-w-2xl px-5 leading-relaxed">
          Simulator edukasi. Angka daya dan tarif PLN (2025) adalah perkiraan.
          Pemasangan instalasi sungguhan harus oleh instalatir bersertifikat.
        </p>
        <Link
          to="/simulator"
          className="mt-2 inline-flex items-center gap-1 font-medium text-primary"
        >
          <BookOpenIcon className="size-3.5" /> Pelajari di simulator
        </Link>
      </footer>
    </div>
  )
}

function Feature({
  icon,
  art,
  title,
  text,
}: {
  icon: React.ReactNode
  art: React.ReactNode
  title: string
  text: string
}) {
  return (
    <article className="flex flex-col rounded-3xl bg-background p-6 ring-1 ring-foreground/8">
      <div className="flex items-start justify-between">
        <span className="grid size-10 place-items-center rounded-xl bg-art-soft text-primary">
          {icon}
        </span>
        <div className="grid h-24 place-items-center">{art}</div>
      </div>
      <h3 className="mt-4 font-heading text-lg font-semibold">{title}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
        {text}
      </p>
    </article>
  )
}

/** Ilustrasi hero: tiang PLN → kabel → rumah terpotong dengan perangkat menyala. */
function HeroScene() {
  const rooms: {
    art: Parameters<typeof ApplianceArt>[0]["kind"][]
    wall: string
    lit: boolean
  }[] = [
    { art: ["bulb", "tv", "fan"], wall: "oklch(0.95 0.035 300)", lit: true },
    { art: ["bulb", "ac"], wall: "oklch(0.95 0.035 260)", lit: true },
    {
      art: ["fridge", "ricecooker", "kettle"],
      wall: "oklch(0.96 0.04 80)",
      lit: true,
    },
    { art: ["washer", "pump"], wall: "oklch(0.95 0.025 180)", lit: false },
  ]
  return (
    <div className="relative">
      <div className="relative overflow-hidden rounded-[2rem] bg-linear-to-b from-[oklch(0.86_0.08_290)] via-[oklch(0.93_0.04_300)] to-[oklch(0.97_0.015_300)] p-5 pt-10 ring-1 ring-foreground/5 sm:p-8 sm:pt-12">
        <div
          aria-hidden
          className="absolute top-6 right-8 size-12 rounded-full bg-[oklch(0.97_0.05_95)] shadow-[0_0_40px_10px_oklch(0.97_0.05_95/0.6)]"
        />
        <div className="relative flex items-end gap-3 sm:gap-5">
          <div className="relative hidden shrink-0 min-[420px]:block">
            <PoleArt live className="h-64 w-12" />
            <svg
              aria-hidden
              className="absolute top-[26px] left-[36px] h-24 w-14 overflow-visible sm:w-16"
              viewBox="0 0 64 96"
              preserveAspectRatio="none"
            >
              <path
                d="M0 0 C 20 40, 40 58, 64 62"
                stroke="var(--ink)"
                strokeWidth="3"
                fill="none"
                vectorEffect="non-scaling-stroke"
              />
              <path
                d="M0 0 C 20 40, 40 58, 64 62"
                stroke="var(--energy)"
                strokeWidth="2"
                fill="none"
                className="anim-flow"
                vectorEffect="non-scaling-stroke"
              />
            </svg>
          </div>
          <div className="relative flex-1">
            <svg
              viewBox="0 0 400 60"
              preserveAspectRatio="none"
              className="block h-12 w-full sm:h-16"
              aria-hidden
            >
              <path
                d="M6 60 L70 4 H330 L394 60 Z"
                fill="var(--primary)"
                stroke="var(--ink)"
                strokeWidth="3"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
              />
            </svg>
            <div className="grid grid-cols-2 gap-1.5 rounded-b-2xl border-2 border-t-0 border-ink/80 bg-ink/80 p-1.5">
              {rooms.map((r, i) => (
                <div
                  key={i}
                  className="relative flex h-24 items-end justify-center gap-1 overflow-hidden rounded-lg p-2 sm:h-28"
                  style={{ background: r.wall }}
                >
                  {r.lit && (
                    <div
                      aria-hidden
                      className="absolute inset-0"
                      style={{
                        background:
                          "radial-gradient(100% 70% at 50% 0%, color-mix(in oklch, var(--energy) 45%, transparent), transparent 70%)",
                      }}
                    />
                  )}
                  {!r.lit && (
                    <div aria-hidden className="absolute inset-0 bg-night/25" />
                  )}
                  {r.art.map((k, j) => (
                    <ApplianceArt
                      key={j}
                      kind={k}
                      on={r.lit && k !== "kettle"}
                      mode={k === "ricecooker" ? 1 : 1}
                      className={cn(
                        "relative",
                        k === "bulb"
                          ? "absolute top-1 size-9"
                          : "size-11 sm:size-12"
                      )}
                    />
                  ))}
                </div>
              ))}
            </div>
            <div className="-mx-4 h-2.5 rounded-full bg-[oklch(0.72_0.1_145)] ring-2 ring-ink/80" />
          </div>
        </div>
      </div>
      <div className="absolute -bottom-6 -left-2 flex items-end gap-2 sm:-left-6">
        <Volti mood="happy" className="anim-bob h-24 w-20 drop-shadow-lg" />
        <div className="mb-10 max-w-44 rounded-2xl rounded-bl-sm bg-card px-3 py-2 text-xs leading-snug shadow-lg ring-1 ring-foreground/10">
          Beban <b>1.020 VA</b> dari 1.300 VA — masih aman! ⚡
        </div>
      </div>
      <div className="absolute -top-4 -right-2 rotate-3 rounded-2xl bg-card p-2 shadow-lg ring-1 ring-foreground/10 sm:-right-4">
        <KwhMeterArt
          powered
          display="78%"
          sub="beban"
          mcbOn
          className="h-24 w-16"
        />
      </div>
    </div>
  )
}
