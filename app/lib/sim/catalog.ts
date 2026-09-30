import type { Appliance, Category, RoomKind } from "./types"

export const VOLT = 220

export const CATEGORIES: { id: Category; label: string }[] = [
  { id: "lampu", label: "Lampu" },
  { id: "pendingin", label: "Pendingin" },
  { id: "dapur", label: "Dapur" },
  { id: "rumah-tangga", label: "Cuci & Bersih" },
  { id: "hiburan", label: "Hiburan & Kerja" },
]

const ALL: RoomKind[] = ["teras", "tamu", "kamar", "dapur", "mandi", "cuci"]

export const APPLIANCES: Appliance[] = [
  // ——— Lampu ———
  {
    id: "led9",
    name: "Lampu LED 9 W",
    short: "LED 9W",
    art: "bulb",
    category: "lampu",
    modes: [{ label: "Nyala", watt: 9 }],
    pf: 0.9,
    surge: 1,
    duty: 1,
    hours: [6],
    plug: "saklar",
    rooms: ALL,
    description:
      "Lampu LED paling umum di rumah Indonesia. Terangnya setara lampu pijar 60 W tapi dayanya cuma 9 W.",
    tip: "Ganti lampu lama ke LED bisa memangkas biaya lampu sampai 80%.",
  },
  {
    id: "led18",
    name: "Lampu LED 18 W",
    short: "LED 18W",
    art: "bulb",
    category: "lampu",
    modes: [{ label: "Nyala", watt: 18 }],
    pf: 0.9,
    surge: 1,
    duty: 1,
    hours: [6],
    plug: "saklar",
    rooms: ALL,
    description:
      "Lampu LED lebih terang untuk ruang tamu atau dapur yang luas.",
  },
  {
    id: "tl36",
    name: "Lampu Neon TL 36 W",
    short: "Neon TL",
    art: "tube",
    category: "lampu",
    modes: [{ label: "Nyala", watt: 46 }],
    pf: 0.5,
    surge: 1.5,
    duty: 1,
    hours: [6],
    plug: "saklar",
    rooms: ALL,
    description:
      "Lampu neon panjang model lama dengan ballast. Tertulis 36 W, tapi ballast-nya ikut makan daya, dan faktor dayanya rendah — jadi 'jatah' VA yang terpakai hampir 2× lipat wattnya.",
    tip: "Contoh bagus kenapa VA ≠ Watt. Ganti ke LED tube 18 W untuk hemat.",
  },
  // ——— Pendingin ———
  {
    id: "kipas",
    name: "Kipas Angin",
    short: "Kipas",
    art: "fan",
    category: "pendingin",
    modes: [
      { label: "Pelan", watt: 35 },
      { label: "Sedang", watt: 45 },
      { label: "Kencang", watt: 55 },
    ],
    pf: 0.9,
    surge: 2,
    duty: 1,
    hours: [0, 8, 0],
    plug: "stopkontak",
    rooms: ["tamu", "kamar", "dapur", "teras"],
    description:
      "Kipas berdiri atau dinding. Motornya butuh sedikit tenaga ekstra sesaat ketika mulai berputar.",
  },
  {
    id: "exhaust",
    name: "Exhaust Fan",
    short: "Exhaust",
    art: "exhaust",
    category: "pendingin",
    modes: [{ label: "Menyedot", watt: 25 }],
    pf: 0.8,
    surge: 1.5,
    duty: 1,
    hours: [3],
    plug: "stopkontak",
    rooms: ["dapur", "mandi", "cuci", "kamar", "tamu"],
    description:
      "Kipas penyedot udara yang dipasang di dinding/plafon kamar mandi atau dapur. Membuang udara lembap, bau, dan asap masakan ke luar rumah.",
    tip: "Nyalakan 10–15 menit setelah mandi atau memasak supaya ruangan tidak lembap dan tidak berjamur.",
  },
  {
    id: "ac05",
    name: "AC ½ PK",
    short: "AC ½PK",
    art: "ac",
    category: "pendingin",
    modes: [{ label: "Dingin", watt: 380 }],
    pf: 0.9,
    surge: 3,
    duty: 0.8,
    hours: [8],
    plug: "stopkontak",
    needsGround: true,
    rooms: ["kamar", "tamu"],
    description:
      "AC standar (non-inverter) untuk kamar ± 3×3 m. Saat kompresor mulai menyala, arusnya bisa melonjak 3× lipat sesaat.",
    tip: "Setel suhu 25–26 °C. Tiap turun 1 °C, konsumsi listrik naik sekitar 6%.",
  },
  {
    id: "ac1",
    name: "AC 1 PK",
    short: "AC 1PK",
    art: "ac",
    category: "pendingin",
    modes: [{ label: "Dingin", watt: 780 }],
    pf: 0.9,
    surge: 3,
    duty: 0.8,
    hours: [8],
    plug: "stopkontak",
    needsGround: true,
    rooms: ["kamar", "tamu"],
    description:
      "AC standar untuk ruangan ± 4×4 m. Idealnya punya jalur (grup MCB) sendiri.",
    tip: "Di rumah 900 VA, AC 1 PK hampir menghabiskan seluruh daya.",
  },
  {
    id: "ac1inv",
    name: "AC 1 PK Inverter",
    short: "AC Inverter",
    art: "ac",
    category: "pendingin",
    modes: [
      { label: "Awal (dingin cepat)", watt: 850 },
      { label: "Stabil", watt: 380 },
    ],
    pf: 0.95,
    surge: 1.2,
    duty: 1,
    hours: [1, 7],
    plug: "stopkontak",
    needsGround: true,
    rooms: ["kamar", "tamu"],
    description:
      "AC inverter mengatur putaran kompresor. Kerja keras di awal, lalu hemat saat ruangan sudah dingin. Lonjakan saat menyala juga kecil.",
    tip: "Cocok dipakai lama (lebih dari 4 jam). Jangan sering dimatikan-nyalakan.",
  },
  {
    id: "kulkas1",
    name: "Kulkas 1 Pintu",
    short: "Kulkas",
    art: "fridge",
    category: "pendingin",
    modes: [{ label: "Menyala", watt: 75 }],
    pf: 0.8,
    surge: 4,
    duty: 0.4,
    hours: [24],
    plug: "stopkontak",
    needsGround: true,
    rooms: ["dapur", "tamu"],
    description:
      "Kulkas menyala 24 jam, tapi kompresornya hidup-mati otomatis (kira-kira 40% waktu). Saat kompresor mulai, arusnya melonjak sesaat.",
    tip: "Jangan tempel ke dinding, beri jarak ± 10 cm agar panasnya terbuang.",
  },
  {
    id: "kulkas2",
    name: "Kulkas 2 Pintu",
    short: "Kulkas 2P",
    art: "fridge2",
    category: "pendingin",
    modes: [{ label: "Menyala", watt: 120 }],
    pf: 0.8,
    surge: 4,
    duty: 0.45,
    hours: [24],
    plug: "stopkontak",
    needsGround: true,
    rooms: ["dapur", "tamu"],
    description:
      "Kulkas dengan freezer terpisah. Lebih besar, lebih boros sedikit.",
  },
  {
    id: "dispenser",
    name: "Dispenser Air Panas",
    short: "Dispenser",
    art: "dispenser",
    category: "dapur",
    modes: [{ label: "Pemanas nyala", watt: 350 }],
    pf: 1,
    surge: 1,
    duty: 0.15,
    hours: [24],
    plug: "stopkontak",
    needsGround: true,
    rooms: ["dapur", "tamu"],
    description:
      "Pemanas dispenser menyala-mati sendiri untuk menjaga air tetap panas sepanjang hari.",
    tip: "Matikan tombol pemanas di malam hari — lumayan menghemat.",
  },
  // ——— Dapur ———
  {
    id: "ricecooker",
    name: "Rice Cooker (Magic Com)",
    short: "Magic Com",
    art: "ricecooker",
    category: "dapur",
    modes: [
      { label: "Memasak", watt: 395 },
      { label: "Menghangatkan", watt: 45 },
    ],
    pf: 1,
    surge: 1,
    duty: 1,
    hours: [1, 10],
    plug: "stopkontak",
    rooms: ["dapur"],
    description:
      "Saat memasak, dayanya besar (± 400 W). Saat menghangatkan hanya ± 45 W — tapi kalau seharian, totalnya lumayan besar.",
    tip: "Menghangatkan nasi 10 jam sehari bisa lebih boros daripada memasaknya!",
  },
  {
    id: "induksi",
    name: "Kompor Induksi",
    short: "Kompor Induksi",
    art: "induction",
    category: "dapur",
    modes: [
      { label: "Rendah", watt: 400 },
      { label: "Sedang", watt: 1000 },
      { label: "Maksimal", watt: 1800 },
    ],
    pf: 0.97,
    surge: 1,
    duty: 1,
    hours: [0, 1, 0],
    plug: "stopkontak",
    needsGround: true,
    rooms: ["dapur"],
    description:
      "Kompor listrik yang memanaskan panci langsung. Aman tanpa api, tapi dayanya besar — biasanya butuh daya rumah minimal 2.200 VA.",
    tip: "Pakai mode rendah/sedang kalau daya rumah terbatas.",
  },
  {
    id: "microwave",
    name: "Microwave",
    short: "Microwave",
    art: "microwave",
    category: "dapur",
    modes: [{ label: "Memanaskan", watt: 1100 }],
    pf: 0.95,
    surge: 1.5,
    duty: 1,
    hours: [0.2],
    plug: "stopkontak",
    needsGround: true,
    rooms: ["dapur"],
    description:
      "Tertulis '800 W' di kotaknya? Itu daya panas yang keluar. Yang diambil dari listrik rumah sekitar 1.100 W.",
  },
  {
    id: "oven",
    name: "Oven Listrik",
    short: "Oven",
    art: "oven",
    category: "dapur",
    modes: [{ label: "Memanggang", watt: 650 }],
    pf: 1,
    surge: 1,
    duty: 0.6,
    hours: [0.5],
    plug: "stopkontak",
    needsGround: true,
    rooms: ["dapur"],
    description: "Oven listrik ukuran rumahan (± 20 liter) untuk kue dan lauk.",
  },
  {
    id: "blender",
    name: "Blender",
    short: "Blender",
    art: "blender",
    category: "dapur",
    modes: [{ label: "Menghaluskan", watt: 300 }],
    pf: 0.85,
    surge: 2,
    duty: 1,
    hours: [0.1],
    plug: "stopkontak",
    rooms: ["dapur"],
    description: "Untuk sambal, jus, dan bumbu halus. Dipakai sebentar saja.",
  },
  {
    id: "ketel",
    name: "Teko Listrik",
    short: "Teko Listrik",
    art: "kettle",
    category: "dapur",
    modes: [{ label: "Merebus", watt: 1000 }],
    pf: 1,
    surge: 1,
    duty: 1,
    hours: [0.2],
    plug: "stopkontak",
    rooms: ["dapur", "kamar"],
    description:
      "Merebus air cepat, tapi dayanya besar. Sering jadi penyebab 'njeglek' di rumah 900 VA.",
  },
  // ——— Cuci & Bersih ———
  {
    id: "mesincuci",
    name: "Mesin Cuci 2 Tabung",
    short: "Mesin Cuci",
    art: "washer",
    category: "rumah-tangga",
    modes: [
      { label: "Mencuci", watt: 350 },
      { label: "Memeras", watt: 200 },
    ],
    pf: 0.8,
    surge: 3,
    duty: 1,
    hours: [0.7, 0.3],
    plug: "stopkontak",
    needsGround: true,
    wet: true,
    rooms: ["cuci", "mandi", "dapur"],
    description:
      "Mesin cuci paling umum di Indonesia. Motornya perlu lonjakan arus saat mulai, dan dipakai di area basah — wajib ada arde (grounding).",
  },
  {
    id: "setrika",
    name: "Setrika",
    short: "Setrika",
    art: "iron",
    category: "rumah-tangga",
    modes: [{ label: "Panas", watt: 350 }],
    pf: 1,
    surge: 1,
    duty: 0.7,
    hours: [1],
    plug: "stopkontak",
    rooms: ["kamar", "tamu", "cuci"],
    description:
      "Setrika biasa ± 350 W. Termostatnya memutus-sambung sendiri agar tidak terlalu panas.",
    tip: "Setrika sekaligus banyak baju, jangan sedikit-sedikit tiap hari.",
  },
  {
    id: "pompa",
    name: "Pompa Air Sumur",
    short: "Pompa Air",
    art: "pump",
    category: "rumah-tangga",
    modes: [{ label: "Memompa", watt: 125 }],
    pf: 0.75,
    surge: 3.5,
    duty: 1,
    hours: [1.5],
    plug: "stopkontak",
    needsGround: true,
    wet: true,
    rooms: ["teras", "cuci", "mandi"],
    description:
      "Pompa air sumur dangkal yang umum di rumah Indonesia. Menyala otomatis saat toren kosong. Lonjakan arusnya saat mulai cukup besar.",
    tip: "Lampu berkedip saat pompa menyala? Itu lonjakan arus dari motornya.",
  },
  {
    id: "waterheater",
    name: "Pemanas Air (Water Heater)",
    short: "Water Heater",
    art: "heater",
    category: "rumah-tangga",
    modes: [{ label: "Memanaskan", watt: 350 }],
    pf: 1,
    surge: 1,
    duty: 0.5,
    hours: [3],
    plug: "stopkontak",
    needsGround: true,
    wet: true,
    rooms: ["mandi"],
    description:
      "Pemanas air tangki kecil (± 15 liter) untuk mandi. Karena di kamar mandi, harus pakai arde dan sebaiknya ELCB.",
  },
  {
    id: "vacuum",
    name: "Penyedot Debu",
    short: "Vacuum",
    art: "vacuum",
    category: "rumah-tangga",
    modes: [{ label: "Menyedot", watt: 600 }],
    pf: 0.9,
    surge: 2,
    duty: 1,
    hours: [0.3],
    plug: "stopkontak",
    rooms: ["tamu", "kamar"],
    description:
      "Vacuum cleaner rumahan. Dipakai sebentar, tapi dayanya lumayan.",
  },
  {
    id: "hairdryer",
    name: "Pengering Rambut",
    short: "Hair Dryer",
    art: "hairdryer",
    category: "rumah-tangga",
    modes: [
      { label: "Hangat", watt: 250 },
      { label: "Panas", watt: 400 },
    ],
    pf: 1,
    surge: 1,
    duty: 1,
    hours: [0, 0.1],
    plug: "stopkontak",
    rooms: ["kamar", "mandi"],
    description: "Hair dryer kecil. Jangan dipakai dengan tangan basah.",
  },
  // ——— Hiburan & Kerja ———
  {
    id: "tv32",
    name: "TV LED 32 inci",
    short: 'TV 32"',
    art: "tv",
    category: "hiburan",
    modes: [{ label: "Menyala", watt: 45 }],
    pf: 0.9,
    surge: 1,
    duty: 1,
    hours: [5],
    plug: "stopkontak",
    rooms: ["tamu", "kamar"],
    description: "TV LED ukuran paling umum. Dayanya kecil.",
  },
  {
    id: "tv50",
    name: "Smart TV 50 inci",
    short: 'TV 50"',
    art: "tv",
    category: "hiburan",
    modes: [{ label: "Menyala", watt: 110 }],
    pf: 0.9,
    surge: 1,
    duty: 1,
    hours: [5],
    plug: "stopkontak",
    rooms: ["tamu", "kamar"],
    description: "TV besar untuk ruang keluarga.",
  },
  {
    id: "laptop",
    name: "Laptop",
    short: "Laptop",
    art: "laptop",
    category: "hiburan",
    modes: [{ label: "Dipakai", watt: 65 }],
    pf: 0.9,
    surge: 1,
    duty: 1,
    hours: [6],
    plug: "stopkontak",
    rooms: ["kamar", "tamu"],
    description:
      "Laptop untuk kerja atau sekolah daring, termasuk mengisi baterainya.",
  },
  {
    id: "pc",
    name: "Komputer (PC)",
    short: "PC",
    art: "pc",
    category: "hiburan",
    modes: [
      { label: "Kerja ringan", watt: 150 },
      { label: "Main game", watt: 350 },
    ],
    pf: 0.95,
    surge: 1.2,
    duty: 1,
    hours: [4, 0],
    plug: "stopkontak",
    needsGround: true,
    rooms: ["kamar", "tamu"],
    description:
      "Komputer meja beserta monitor. Main game butuh daya jauh lebih besar.",
  },
  {
    id: "router",
    name: "Router WiFi",
    short: "WiFi",
    art: "router",
    category: "hiburan",
    modes: [{ label: "Menyala", watt: 10 }],
    pf: 0.9,
    surge: 1,
    duty: 1,
    hours: [24],
    plug: "stopkontak",
    rooms: ["tamu", "kamar"],
    description: "Modem/router internet rumah, menyala 24 jam.",
  },
  {
    id: "charger",
    name: "Charger HP",
    short: "Charger HP",
    art: "phone",
    category: "hiburan",
    modes: [{ label: "Mengisi", watt: 18 }],
    pf: 0.9,
    surge: 1,
    duty: 1,
    hours: [3],
    plug: "stopkontak",
    rooms: ["kamar", "tamu"],
    description: "Mengisi daya ponsel. Kecil sekali dayanya.",
  },
  {
    id: "speaker",
    name: "Speaker Aktif",
    short: "Speaker",
    art: "speaker",
    category: "hiburan",
    modes: [{ label: "Menyala", watt: 60 }],
    pf: 0.9,
    surge: 1,
    duty: 1,
    hours: [2],
    plug: "stopkontak",
    rooms: ["tamu", "kamar", "teras"],
    description: "Salon/speaker aktif untuk musik atau karaoke.",
  },
  {
    id: "motorlistrik",
    name: "Cas Motor Listrik",
    short: "Cas Motor",
    art: "evcharger",
    category: "hiburan",
    modes: [{ label: "Mengisi", watt: 400 }],
    pf: 0.95,
    surge: 1.2,
    duty: 1,
    hours: [4],
    plug: "stopkontak",
    needsGround: true,
    rooms: ["teras", "tamu"],
    description:
      "Mengisi baterai motor listrik. Dayanya ± 400 W selama beberapa jam — perhitungkan kalau daya rumah kecil.",
    tip: "Cas di malam hari saat perangkat lain sudah banyak yang mati.",
  },
  {
    id: "cctv",
    name: "Kamera CCTV",
    short: "CCTV",
    art: "cctv",
    category: "hiburan",
    modes: [{ label: "Merekam", watt: 6 }],
    pf: 0.9,
    surge: 1,
    duty: 1,
    hours: [24],
    plug: "stopkontak",
    rooms: ["teras", "tamu", "dapur", "cuci", "kamar"],
    description:
      "Satu kamera CCTV (indoor/outdoor, dengan lampu inframerah untuk malam). Kecil dayanya, tapi menyala 24 jam.",
    tip: "Pakai adaptor/PoE bersama untuk beberapa kamera supaya rapi dan tidak butuh banyak colokan.",
  },
  {
    id: "dvr",
    name: "Perekam CCTV (DVR/NVR)",
    short: "DVR CCTV",
    art: "dvr",
    category: "hiburan",
    modes: [{ label: "Merekam", watt: 25 }],
    pf: 0.9,
    surge: 1,
    duty: 1,
    hours: [24],
    plug: "stopkontak",
    rooms: ["tamu", "kamar", "teras"],
    description:
      "Kotak perekam untuk 4–8 kamera beserta hardisknya. Menyala 24 jam untuk menyimpan rekaman.",
  },
  {
    id: "elektronik100",
    name: "Perangkat Elektronik 100 W",
    short: "Elektronik 100W",
    art: "multi",
    category: "hiburan",
    modes: [{ label: "Menyala", watt: 100 }],
    pf: 0.9,
    surge: 1,
    duty: 1,
    hours: [4],
    plug: "stopkontak",
    rooms: ["teras", "tamu", "kamar", "dapur", "mandi", "cuci"],
    description:
      "Wakil beberapa alat elektronik yang dicolok di satu stopkontak/terminal dengan total sekitar 100 W (mis. printer, speaker, lampu meja, charger).",
    tip: "Butuh watt yang lebih pas? Pakai “Buat perangkat sendiri”.",
  },
  {
    id: "elektronik200",
    name: "Perangkat Elektronik 200 W",
    short: "Elektronik 200W",
    art: "multi",
    category: "hiburan",
    modes: [{ label: "Menyala", watt: 200 }],
    pf: 0.9,
    surge: 1,
    duty: 1,
    hours: [4],
    plug: "stopkontak",
    rooms: ["teras", "tamu", "kamar", "dapur", "mandi", "cuci"],
    description:
      "Wakil beberapa alat elektronik yang dicolok di satu stopkontak/terminal dengan total sekitar 200 W (mis. printer, speaker, lampu meja, charger).",
    tip: "Butuh watt yang lebih pas? Pakai “Buat perangkat sendiri”.",
  },
  {
    id: "elektronik300",
    name: "Perangkat Elektronik 300 W",
    short: "Elektronik 300W",
    art: "multi",
    category: "hiburan",
    modes: [{ label: "Menyala", watt: 300 }],
    pf: 0.9,
    surge: 1,
    duty: 1,
    hours: [4],
    plug: "stopkontak",
    rooms: ["teras", "tamu", "kamar", "dapur", "mandi", "cuci"],
    description:
      "Wakil beberapa alat elektronik yang dicolok di satu stopkontak/terminal dengan total sekitar 300 W (mis. printer, speaker, lampu meja, charger).",
    tip: "Butuh watt yang lebih pas? Pakai “Buat perangkat sendiri”.",
  },
  {
    id: "elektronik500",
    name: "Perangkat Elektronik 500 W",
    short: "Elektronik 500W",
    art: "multi",
    category: "hiburan",
    modes: [{ label: "Menyala", watt: 500 }],
    pf: 0.9,
    surge: 1,
    duty: 1,
    hours: [4],
    plug: "stopkontak",
    rooms: ["teras", "tamu", "kamar", "dapur", "mandi", "cuci"],
    description:
      "Wakil beberapa alat elektronik yang dicolok di satu stopkontak/terminal dengan total sekitar 500 W (mis. printer, speaker, lampu meja, charger).",
    tip: "Butuh watt yang lebih pas? Pakai “Buat perangkat sendiri”.",
  },
  {
    id: "elektronik1000",
    name: "Perangkat Elektronik 1000 W",
    short: "Elektronik 1000W",
    art: "multi",
    category: "hiburan",
    modes: [{ label: "Menyala", watt: 1000 }],
    pf: 0.9,
    surge: 1,
    duty: 1,
    hours: [4],
    plug: "stopkontak",
    rooms: ["teras", "tamu", "kamar", "dapur", "mandi", "cuci"],
    description:
      "Wakil beberapa alat elektronik yang dicolok di satu stopkontak/terminal dengan total sekitar 1000 W (mis. printer, speaker, lampu meja, charger).",
    tip: "Butuh watt yang lebih pas? Pakai “Buat perangkat sendiri”.",
  },
  {
    id: "akuarium",
    name: "Pompa Akuarium",
    short: "Akuarium",
    art: "aquarium",
    category: "hiburan",
    modes: [{ label: "Menyala", watt: 8 }],
    pf: 0.8,
    surge: 1,
    duty: 1,
    hours: [24],
    plug: "stopkontak",
    rooms: ["tamu", "teras"],
    description: "Aerator/pompa kecil akuarium, menyala terus.",
  },
]

export const APPLIANCE_MAP = Object.fromEntries(
  APPLIANCES.map((a) => [a.id, a])
) as Record<string, Appliance>

export const ELECTRONIC_PRESETS = [100, 200, 300, 500, 1000]

/**
 * Rumah lama bisa berisi "Perangkat Elektronik Lain" dengan watt bebas.
 * Ubah ke preset terdekat (ke atas) supaya tetap bisa dibuka.
 */
export function migrateState<T extends { devices: { applianceId: string }[] }>(
  s: T
): T {
  if (!s?.devices?.some((d) => d.applianceId === "lainnya")) return s
  return {
    ...s,
    devices: s.devices.map((d) => {
      if (d.applianceId !== "lainnya") return d
      const { customWatt, ...rest } = d as typeof d & { customWatt?: number }
      const w =
        ELECTRONIC_PRESETS.find((p) => p >= (customWatt ?? 100)) ??
        ELECTRONIC_PRESETS[ELECTRONIC_PRESETS.length - 1]
      return { ...rest, applianceId: `elektronik${w}` }
    }),
  }
}

/** Daftarkan perangkat buatan pengguna agar bisa dicari lewat APPLIANCE_MAP. */
export function syncCustomAppliances(list: Appliance[] | undefined) {
  for (const id of Object.keys(APPLIANCE_MAP))
    if (APPLIANCE_MAP[id].custom) delete APPLIANCE_MAP[id]
  for (const a of list ?? []) APPLIANCE_MAP[a.id] = { ...a, custom: true }
}

export interface DayaLevel {
  va: number
  mcb: number
  golongan: string
}

export const DAYA_LEVELS: DayaLevel[] = [
  { va: 450, mcb: 2, golongan: "R-1/TR" },
  { va: 900, mcb: 4, golongan: "R-1/TR" },
  { va: 1300, mcb: 6, golongan: "R-1/TR" },
  { va: 2200, mcb: 10, golongan: "R-1/TR" },
  { va: 3500, mcb: 16, golongan: "R-2/TR" },
  { va: 4400, mcb: 20, golongan: "R-2/TR" },
  { va: 5500, mcb: 25, golongan: "R-2/TR" },
  { va: 7700, mcb: 35, golongan: "R-3/TR" },
]

export function dayaLevel(va: number): DayaLevel {
  return DAYA_LEVELS.find((d) => d.va === va) ?? DAYA_LEVELS[2]
}

/** Tarif tenaga listrik rumah tangga PLN (Rp/kWh), berlaku 2025. */
export function tarifPerKwh(va: number, subsidi: boolean): number {
  if (va <= 450) return 415
  if (va <= 900) return subsidi ? 605 : 1352
  if (va <= 2200) return 1444.7
  return 1699.53
}

export const MCB_OPTIONS = [2, 4, 6, 10, 16, 20, 25, 32]

export const CABLES: { mm2: number; maxMcb: number; label: string }[] = [
  { mm2: 1.5, maxMcb: 10, label: "NYM 2×1,5 mm²" },
  { mm2: 2.5, maxMcb: 16, label: "NYM 3×2,5 mm²" },
  { mm2: 4, maxMcb: 25, label: "NYM 3×4 mm²" },
  { mm2: 6, maxMcb: 32, label: "NYM 3×6 mm²" },
]

export function cableSpec(mm2: number) {
  return CABLES.find((c) => c.mm2 === mm2) ?? CABLES[0]
}

export const CIRCUIT_COLORS = [
  "oklch(0.62 0.2 300)",
  "oklch(0.68 0.13 190)",
  "oklch(0.75 0.15 70)",
  "oklch(0.65 0.18 10)",
  "oklch(0.64 0.15 245)",
  "oklch(0.7 0.16 140)",
]

export const ROOM_KINDS: { kind: RoomKind; label: string }[] = [
  { kind: "teras", label: "Teras" },
  { kind: "tamu", label: "Ruang Tamu" },
  { kind: "kamar", label: "Kamar Tidur" },
  { kind: "dapur", label: "Dapur" },
  { kind: "mandi", label: "Kamar Mandi" },
  { kind: "cuci", label: "Area Cuci" },
]
