/**
 * Membuat ikon PNG/ICO dan gambar Open Graph dari logo di public/favicon.svg.
 * Jalankan ulang setelah logo berubah: `bun run icons`. Hasilnya di-commit.
 */
import { readFile, writeFile } from "node:fs/promises"
import sharp from "sharp"

const PUBLIC = new URL("../public/", import.meta.url)
const out = (name: string) => new URL(name, PUBLIC)

const PRIMARY = "#8200db"
const INK = "#31254d"
const ENERGY = "#fbc031"
const BG = "#fbf9fe"
const SOFT = "#eee6ff"

// Isi logo (viewBox 0 0 40 40) tanpa elemen <svg> pembungkus.
const MARK = `<path d="M6 18L20 6l14 12v15a3 3 0 0 1-3 3H9a3 3 0 0 1-3-3Z" fill="${PRIMARY}" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/><path d="M22 13l-7 11h5l-2 8 7-11h-5Z" fill="${ENERGY}" stroke="${INK}" stroke-width="1.6" stroke-linejoin="round"/>`

/** Logo di atas latar persegi; `pad` = porsi tepi kosong (0–0.5). */
function tile(size: number, pad: number, bg: string | null, radius = 0) {
  const inner = size * (1 - pad * 2)
  const scale = inner / 40
  const offset = size * pad
  const rect = bg
    ? `<rect width="${size}" height="${size}" rx="${radius}" fill="${bg}"/>`
    : ""
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">${rect}<g transform="translate(${offset} ${offset}) scale(${scale})">${MARK}</g></svg>`
  )
}

const png = (svg: Buffer) => sharp(svg).png({ compressionLevel: 9 }).toBuffer()

/** ICO berisi PNG (didukung semua browser modern). */
function ico(images: { size: number; data: Buffer }[]) {
  const header = Buffer.alloc(6)
  header.writeUInt16LE(0, 0)
  header.writeUInt16LE(1, 2)
  header.writeUInt16LE(images.length, 4)
  const dir = Buffer.alloc(16 * images.length)
  let offset = 6 + dir.length
  images.forEach(({ size, data }, i) => {
    const o = i * 16
    dir.writeUInt8(size >= 256 ? 0 : size, o)
    dir.writeUInt8(size >= 256 ? 0 : size, o + 1)
    dir.writeUInt8(0, o + 2)
    dir.writeUInt8(0, o + 3)
    dir.writeUInt16LE(1, o + 4)
    dir.writeUInt16LE(32, o + 6)
    dir.writeUInt32LE(data.length, o + 8)
    dir.writeUInt32LE(offset, o + 12)
    offset += data.length
  })
  return Buffer.concat([header, dir, ...images.map((i) => i.data)])
}

function ogImage() {
  const W = 1200
  const H = 630
  const serif = "'Noto Serif', 'DejaVu Serif', serif"
  const sans = "'Inter', 'Noto Sans', 'DejaVu Sans', sans-serif"
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#d9c6f7"/>
      <stop offset="1" stop-color="${BG}"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="${BG}"/>
  <rect x="700" y="0" width="500" height="${H}" fill="url(#sky)"/>
  <circle cx="1100" cy="110" r="44" fill="#fff4c9"/>
  <g transform="translate(850 190) scale(7.5)">${MARK}</g>
  <g transform="translate(80 90)">
    <g transform="scale(1.6)">${MARK}</g>
    <text x="84" y="44" font-family="${sans}" font-size="30" font-weight="600" fill="${INK}">Simulasi Listrik Rumah</text>
  </g>
  <text font-family="${serif}" font-size="58" font-weight="700" fill="${INK}">
    <tspan x="80" y="275">Pahami listrik rumahmu</tspan>
    <tspan x="80" y="360" fill="${PRIMARY}">sebelum njeglek.</tspan>
  </text>
  <text font-family="${sans}" font-size="28" fill="#5b5270">
    <tspan x="80" y="440">Hitung daya, pahami MCB turun,</tspan>
    <tspan x="80" y="480">dan perkirakan tagihan PLN.</tspan>
  </text>
  <rect x="80" y="530" width="330" height="48" rx="24" fill="${SOFT}"/>
  <text x="104" y="562" font-family="${sans}" font-size="22" font-weight="600" fill="${PRIMARY}">listrik.selo.my.id</text>
</svg>`)
}

const svg = await readFile(out("favicon.svg"))
if (!svg.toString().includes("M22 13l-7 11h5")) {
  throw new Error("favicon.svg tidak cocok dengan MARK — samakan dulu")
}

const [p16, p32, p48] = await Promise.all(
  [16, 32, 48].map((s) => png(tile(s, 0.02, null)))
)
await writeFile(
  out("favicon.ico"),
  ico([
    { size: 16, data: p16 },
    { size: 32, data: p32 },
    { size: 48, data: p48 },
  ])
)
await writeFile(out("apple-touch-icon.png"), await png(tile(180, 0.14, BG)))
await writeFile(out("icon-192.png"), await png(tile(192, 0.08, BG, 40)))
await writeFile(out("icon-512.png"), await png(tile(512, 0.08, BG, 108)))
// Maskable: zona aman 80% di tengah, latar penuh.
await writeFile(out("icon-maskable-512.png"), await png(tile(512, 0.2, SOFT)))
await writeFile(out("og-image.png"), await png(ogImage()))

console.log("Ikon & og-image.png dibuat di public/")
