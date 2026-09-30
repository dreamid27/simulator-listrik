/**
 * Langkah setelah `react-router build` untuk hosting statis
 * (Cloudflare Pages / nginx). Semua keluaran ada di build/client.
 *
 * 1. `x/index.html` → `x.html`, supaya /simulator dilayani tanpa redirect
 *    ke /simulator/ (URL kanonis tanpa garis miring penutup).
 * 2. `__spa-fallback.html` → `404.html` (noindex). Cloudflare Pages
 *    melayani file ini dengan status 404; router lalu menampilkan halaman
 *    "tidak ditemukan".
 * 3. Menyisipkan Content-Security-Policy per halaman sebagai <meta>, dengan
 *    hash SHA-256 untuk setiap skrip inline React Router — tanpa
 *    'unsafe-inline' untuk skrip.
 * 4. Membuat llms.txt dan llms-full.txt (GEO) dari data simulator, supaya
 *    selalu sinkron dengan katalog, tarif, dan glosarium.
 */
import { createHash } from "node:crypto"
import { readdir, readFile, rename, rm, writeFile } from "node:fs/promises"
import { join, relative } from "node:path"

import { FAQ, SITE } from "../app/lib/site"
import {
  APPLIANCES,
  CABLES,
  CATEGORIES,
  DAYA_LEVELS,
  tarifPerKwh,
} from "../app/lib/sim/catalog"
import { GLOSSARY } from "../app/lib/sim/glossary"

const ROOT = new URL("../build/client/", import.meta.url).pathname

async function htmlFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true })
  const nested = await Promise.all(
    entries.map((e) => {
      const p = join(dir, e.name)
      if (e.isDirectory()) return e.name === "assets" ? [] : htmlFiles(p)
      return e.name.endsWith(".html") ? [p] : []
    })
  )
  return nested.flat()
}

// Manifest Vite tidak perlu ikut diunggah.
await rm(join(ROOT, ".vite"), { recursive: true, force: true })

// 1. Rapikan URL
for (const file of await htmlFiles(ROOT)) {
  const rel = relative(ROOT, file)
  if (rel !== "index.html" && rel.endsWith("/index.html")) {
    const flat = join(ROOT, rel.replace(/\/index\.html$/, ".html"))
    await rename(file, flat)
    await rm(join(file, ".."), { recursive: true })
  }
}

// 2. Halaman 404
const fallback = join(ROOT, "__spa-fallback.html")
const notFound = (await readFile(fallback, "utf8")).replace(
  "</head>",
  `<title>Halaman tidak ditemukan — ${SITE.name}</title><meta name="robots" content="noindex"/></head>`
)
await writeFile(join(ROOT, "404.html"), notFound)
await rm(fallback)

// 3. CSP
const sha = (s: string) =>
  `'sha256-${createHash("sha256").update(s, "utf8").digest("base64")}'`

for (const file of await htmlFiles(ROOT)) {
  let html = await readFile(file, "utf8")
  const hashes = new Set<string>()
  for (const m of html.matchAll(
    /<script(?![^>]*\ssrc=)[^>]*>([\s\S]*?)<\/script>/g
  )) {
    if (m[1]) hashes.add(sha(m[1]))
  }
  const csp = [
    "default-src 'self'",
    `script-src 'self' ${[...hashes].join(" ")}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    "connect-src 'self'",
    "manifest-src 'self'",
    "worker-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "upgrade-insecure-requests",
  ].join("; ")
  html = html.replace(
    '<meta charSet="utf-8"/>',
    `<meta charSet="utf-8"/><meta http-equiv="Content-Security-Policy" content="${csp}"/>`
  )
  await writeFile(file, html)
}

// 4. llms.txt & llms-full.txt
const rp = (n: number) =>
  "Rp" + n.toLocaleString("id-ID", { maximumFractionDigits: 2 })
const va = (n: number) => n.toLocaleString("id-ID") + " VA"

const tarif = DAYA_LEVELS.map((d) => {
  const sub =
    d.va <= 900 && tarifPerKwh(d.va, true) !== tarifPerKwh(d.va, false)
      ? ` (bersubsidi ${rp(tarifPerKwh(d.va, true))}/kWh)`
      : ""
  return `  - ${va(d.va)} — golongan ${d.golongan}, MCB PLN ${d.mcb} A, tarif ${rp(tarifPerKwh(d.va, false))}/kWh${sub}`
}).join("\n")

const summary = `# ${SITE.name}

> ${SITE.description} Gratis, tanpa daftar, berbahasa Indonesia, dan berjalan sepenuhnya di browser (data tersimpan di perangkat pengguna).

Situs ini adalah simulator edukasi untuk orang awam di Indonesia. Pengguna memasang perangkat rumah tangga di rumah virtual, lalu melihat beban listrik (VA), arus (A), penyebab MCB turun ("njeglek"), keamanan instalasi (kabel, arde, ELCB), dan perkiraan tagihan PLN bulanan. Angka adalah perkiraan; instalasi sungguhan wajib dikerjakan instalatir bersertifikat sesuai PUIL.

## Halaman

- [Beranda](${SITE.url}/): penjelasan singkat, cara pakai, dan tanya-jawab umum tentang daya, MCB, dan tagihan listrik.
- [Simulator](${SITE.url}/simulator): aplikasi interaktif dengan tab Rumah, Biaya & Daya, dan Belajar.

## Referensi

- [Isi lengkap untuk AI](${SITE.url}/llms-full.txt): tarif PLN, daftar perangkat beserta daya, glosarium, dan FAQ dalam satu berkas teks.

## Fakta kunci

- Tegangan listrik rumah PLN: 220 V. Arus (A) = Daya (VA) ÷ 220.
- Daya yang didukung simulator: ${DAYA_LEVELS.map((d) => va(d.va)).join(", ")}.
- ${APPLIANCES.length} perangkat rumah tangga Indonesia dengan daya dan faktor daya realistis.
- Tarif listrik rumah tangga PLN (perkiraan 2025):
${tarif}
`

const byCat = CATEGORIES.map((c) => {
  const rows = APPLIANCES.filter((a) => a.category === c.id).map((a) => {
    const watt = a.modes.map((m) => `${m.label} ${m.watt} W`).join(" / ")
    const vaMax = Math.round(Math.max(...a.modes.map((m) => m.watt)) / a.pf)
    const extra = [
      a.surge > 1 ? `lonjakan start ${a.surge}×` : "",
      a.needsGround ? "perlu arde" : "",
    ]
      .filter(Boolean)
      .join(", ")
    return `- **${a.name}** — ${watt}; cos φ ${a.pf} (±${vaMax} VA)${extra ? `; ${extra}` : ""}. ${a.description}`
  })
  return `### ${c.label}\n\n${rows.join("\n")}`
}).join("\n\n")

const glossary = Object.values(GLOSSARY)
  .map((g) => `- **${g.term}**: ${g.short}`)
  .join("\n")

const cables = CABLES.map(
  (c) => `- ${c.label}: MCB maksimum ${c.maxMcb} A`
).join("\n")

const faq = FAQ.map((f) => `### ${f.q}\n\n${f.a}`).join("\n\n")

const full = `${summary}
## Tanya jawab

${faq}

## Glosarium

${glossary}

## Ukuran kabel & MCB

${cables}

## Katalog perangkat

${byCat}

---
Sumber: ${SITE.url}/ · Penulis: ${SITE.author}
`

await writeFile(join(ROOT, "llms.txt"), summary)
await writeFile(join(ROOT, "llms-full.txt"), full)

console.log("postbuild: URL datar, 404.html, CSP, llms.txt siap")
