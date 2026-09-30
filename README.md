# Simulasi Listrik Rumah

Simulator instalasi listrik rumah Indonesia untuk orang awam: hitung daya yang
dibutuhkan, pahami kenapa MCB njeglek, dan perkirakan tagihan PLN.

Produksi: **https://listrik.selo.my.id**

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

## Deploy ke Cloudflare

`wrangler.toml` mengonfigurasi **Workers static assets** (`build/client`,
`html_handling = "auto-trailing-slash"`, `not_found_handling = "404-page"`).
`public/_headers` berlaku di Workers maupun Pages.

### Workers (Workers Builds, terhubung ke Git)

1. **Workers & Pages → Create → Import a repository** → `dreamid27/simulator-listrik`.
2. Build command: `bun run build` · Deploy command: `npx wrangler deploy` · branch `master`.
3. **Settings → Domains & Routes → Add → Custom domain** → `listrik.selo.my.id`.

Deploy manual dari lokal: `bun run build && bunx wrangler deploy`.

### Alternatif: Pages

Build command `bun run build`, output directory `build/client`, tanpa deploy
command. Deploy manual: `bunx wrangler pages deploy build/client --project-name simulator-listrik`.

Domain bawaan `*.workers.dev` / `*.pages.dev` diberi `X-Robots-Tag: noindex`
supaya tidak bersaing dengan domain utama.

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

Setelah domain aktif, daftarkan `https://listrik.selo.my.id/sitemap.xml` di
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
