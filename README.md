# Simulasi Listrik Rumah

Simulator instalasi listrik rumah Indonesia untuk orang awam: hitung daya yang
dibutuhkan, pahami kenapa MCB njeglek, dan perkirakan tagihan PLN.

Produksi: **https://faris.selo.my.id**

React Router v7 (prerender statis, tanpa server), shadcn/ui (Base UI),
Tailwind CSS v4, Zustand. Data pengguna disimpan di `localStorage`.

## Pengembangan

```bash
bun install
bun run dev        # http://localhost:5173
bun run typecheck
bun run format
```

## Build

```bash
bun run build      # → build/client (situs statis siap unggah)
bun run preview    # layani build/client di http://localhost:3000
```

`bun run build` menjalankan `react-router build` lalu `scripts/postbuild.ts`, yang:

- meratakan `simulator/index.html` → `simulator.html` supaya URL kanonis `/simulator` tanpa redirect;
- mengubah SPA fallback menjadi `404.html` (noindex);
- menyisipkan Content-Security-Policy per halaman dengan hash SHA-256 untuk skrip inline;
- membuat `llms.txt` dan `llms-full.txt` dari data katalog, tarif, glosarium, dan FAQ.

## Deploy ke Cloudflare Pages

1. Cloudflare dashboard → **Workers & Pages → Create → Pages → Connect to Git**, pilih repo `dreamid27/faris-selo-my-id`.
2. Pengaturan build:
   | Setting | Nilai |
   | --- | --- |
   | Framework preset | None |
   | Build command | `bun run build` |
   | Build output directory | `build/client` |
   | Production branch | `main` |
   | Environment variable | `BUN_VERSION` = `1.3.5` (opsional, mengunci versi bun) |
3. Setelah deploy pertama: **Custom domains → Set up a domain → `faris.selo.my.id`**. Jika DNS `selo.my.id` ada di Cloudflare, CNAME dibuat otomatis; jika tidak, tambahkan `CNAME faris → <project>.pages.dev`.
4. Disarankan: aktifkan **Always Use HTTPS** dan **Web Analytics** (tanpa cookie) di dashboard.

Alternatif lewat CLI: `bun run build && bunx wrangler pages deploy` (membaca `wrangler.toml`).

Header keamanan & cache ada di `public/_headers`. Domain `*.pages.dev` diberi
`X-Robots-Tag: noindex` supaya tidak bersaing dengan domain utama.

## Self-host dengan nginx / Docker

```bash
docker build -t simulasi-listrik .
docker run -p 8080:80 simulasi-listrik
```

Konfigurasi ada di `nginx/default.conf` (URL tanpa `.html`/garis miring
penutup, 404, gzip, cache aset immutable, header keamanan). TLS diterminasi di
depan nginx.

## SEO & GEO

- Meta title/description, canonical, Open Graph, dan Twitter Card per halaman (`app/lib/site.ts`).
- JSON-LD: `WebSite`, `WebApplication`, `HowTo`, `FAQPage`, `BreadcrumbList`.
- `robots.txt` (mengizinkan crawler mesin pencari & AI), `sitemap.xml`, `site.webmanifest`.
- `llms.txt` / `llms-full.txt` berisi ringkasan fakta untuk mesin jawab AI.
- FAQ di beranda ter-render di HTML statis supaya bisa dikutip.

Setelah domain aktif, daftarkan `https://faris.selo.my.id/sitemap.xml` di
Google Search Console dan Bing Webmaster Tools. Perbarui `<lastmod>` di
`public/sitemap.xml` saat konten berubah.

## Logo & ikon

Logo sumber: `public/favicon.svg`. Setelah mengubahnya, samakan path di
`scripts/generate-icons.ts` lalu jalankan `bun run icons` untuk membuat ulang
`favicon.ico`, ikon PWA, `apple-touch-icon.png`, dan `og-image.png`.

## Aksesibilitas

Diperiksa dengan axe-core (WCAG 2.1 AA) di beranda, ketiga tab simulator, dan
halaman 404, pada lebar desktop dan mobile: tautan "lewati ke konten", landmark,
label untuk tombol ikon, kontras warna AA, dan `prefers-reduced-motion`.
