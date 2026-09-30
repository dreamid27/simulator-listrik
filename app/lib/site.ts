/** Identitas situs, dipakai untuk meta tag, JSON-LD, sitemap, dan llms.txt. */
export const SITE = {
  name: "Simulasi Listrik Rumah",
  url: "https://faris.selo.my.id",
  locale: "id_ID",
  lang: "id",
  themeColor: "#8200db",
  author: "Muhammad Al Faris",
  description:
    "Simulator instalasi listrik rumah Indonesia untuk orang awam. Hitung daya yang dibutuhkan, pahami kenapa MCB njeglek, dan perkirakan tagihan PLN.",
  ogImage: "/og-image.png",
} as const

/** URL absolut tanpa garis miring penutup (kecuali beranda). */
export const absUrl = (path: string) => SITE.url + path

type MetaInput = {
  title: string
  description: string
  path: string
  noindex?: boolean
}

/** Meta tag standar + Open Graph + Twitter untuk sebuah halaman. */
export function pageMeta({ title, description, path, noindex }: MetaInput) {
  const url = absUrl(path)
  const image = absUrl(SITE.ogImage)
  return [
    { title },
    { name: "description", content: description },
    {
      name: "robots",
      content: noindex
        ? "noindex, follow"
        : "index, follow, max-image-preview:large",
    },
    { tagName: "link", rel: "canonical", href: url },
    { property: "og:type", content: "website" },
    { property: "og:site_name", content: SITE.name },
    { property: "og:locale", content: SITE.locale },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:url", content: url },
    { property: "og:image", content: image },
    { property: "og:image:width", content: "1200" },
    { property: "og:image:height", content: "630" },
    {
      property: "og:image:alt",
      content: `${SITE.name}: pahami listrik rumahmu sebelum njeglek`,
    },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
    { name: "twitter:image", content: image },
  ]
}

/** Data terstruktur schema.org sebagai meta `script:ld+json`. */
export const jsonLd = (data: object) => ({ "script:ld+json": data })

/**
 * Pertanyaan umum, ditampilkan di beranda dan dikirim sebagai FAQPage JSON-LD.
 * Jawaban ditulis lugas supaya bisa dikutip langsung oleh mesin pencari & AI.
 */
export const FAQ: { q: string; a: string }[] = [
  {
    q: "Apa itu Simulasi Listrik Rumah?",
    a: "Simulasi Listrik Rumah adalah simulator gratis berbasis web untuk memahami instalasi listrik rumah di Indonesia. Kamu bisa memasang perangkat di rumah virtual, melihat beban listrik secara langsung, mengetahui kenapa MCB turun (njeglek), dan memperkirakan tagihan PLN bulanan. Tidak perlu daftar, dan data tersimpan di perangkatmu sendiri.",
  },
  {
    q: "Daya listrik 900 VA cukup untuk apa saja?",
    a: "Daya 900 VA (MCB PLN 4 A) cukup untuk lampu, TV, kipas angin, kulkas, rice cooker, dan pompa air bila tidak dinyalakan bersamaan. Menyalakan setrika, pompa air, dan rice cooker sekaligus biasanya melebihi 900 VA sehingga MCB turun. AC 1/2 PK umumnya butuh minimal 1.300 VA. Gunakan simulator untuk mengecek kombinasi perangkatmu.",
  },
  {
    q: "Kenapa MCB listrik rumah sering turun (njeglek)?",
    a: "MCB turun karena total arus melebihi batasnya, misalnya beberapa perangkat berdaya besar menyala bersamaan, lonjakan arus saat motor atau kompresor (pompa air, kulkas, AC) mulai berputar, korsleting, atau arus bocor yang memicu ELCB. Solusinya adalah menyalakan perangkat bergantian, membagi grup MCB, atau menaikkan daya PLN.",
  },
  {
    q: "Apa bedanya Watt dan VA?",
    a: "Watt adalah daya yang benar-benar dipakai perangkat untuk bekerja, sedangkan VA (Volt-Ampere) adalah jatah daya dari PLN. Perangkat bermotor atau berballast memiliki faktor daya di bawah 1, sehingga memakai VA lebih besar dari wattnya. Karena itu 900 VA tidak selalu berarti bisa memakai perangkat total 900 watt.",
  },
  {
    q: "Berapa tarif listrik PLN per kWh untuk rumah tangga tahun 2025?",
    a: "Perkiraan tarif rumah tangga PLN 2025: 450 VA bersubsidi Rp415/kWh, 900 VA bersubsidi Rp605/kWh, 900 VA non-subsidi Rp1.352/kWh, 1.300–2.200 VA Rp1.444,70/kWh, dan 3.500 VA ke atas Rp1.699,53/kWh. Tarif dapat berubah setiap triwulan sesuai ketetapan pemerintah.",
  },
  {
    q: "Bagaimana cara menghitung tagihan listrik bulanan?",
    a: "Kalikan daya perangkat (kW) dengan lama pemakaian per hari (jam) dan 30 hari untuk mendapatkan kWh per bulan, lalu kalikan dengan tarif per kWh. Contoh: kulkas rata-rata 0,05 kW × 24 jam × 30 hari = 36 kWh; dengan tarif Rp1.444,70 hasilnya sekitar Rp52.000 per bulan. Pelanggan pascabayar juga dikenai rekening minimum 40 jam nyala.",
  },
  {
    q: "Apakah simulator ini bisa menggantikan instalatir listrik?",
    a: "Tidak. Simulasi Listrik Rumah adalah alat edukasi dengan angka perkiraan. Pemasangan dan perubahan instalasi listrik sungguhan wajib dikerjakan oleh instalatir bersertifikat dan mengikuti PUIL (Persyaratan Umum Instalasi Listrik).",
  },
]
