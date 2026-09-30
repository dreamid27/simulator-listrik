export const GLOSSARY = {
  watt: {
    term: "Watt (W)",
    short:
      "Tenaga yang benar-benar dipakai perangkat untuk bekerja — memanaskan, mendinginkan, memutar motor. Angka ini yang tertera di label perangkat.",
  },
  va: {
    term: "Volt-Ampere (VA)",
    short:
      "‘Jatah’ daya dari PLN. Daya rumahmu (900 VA, 1.300 VA, …) dihitung dalam VA. Perangkat bermotor atau berballast memakai jatah VA lebih besar dari wattnya.",
  },
  ampere: {
    term: "Ampere (A)",
    short:
      "Besarnya arus listrik yang mengalir di kabel. Ibarat derasnya aliran air di pipa. Arus = Daya (VA) ÷ Tegangan (220 V).",
  },
  volt: {
    term: "Volt (V)",
    short:
      "Tegangan listrik — ibarat tekanan air. Listrik rumah PLN bertegangan sekitar 220 V.",
  },
  kwh: {
    term: "kWh (kilowatt-jam)",
    short:
      "Satuan energi yang kamu bayar ke PLN. 1 kWh = perangkat 1.000 W menyala selama 1 jam, atau lampu 10 W menyala 100 jam.",
  },
  pf: {
    term: "Faktor daya (cos φ)",
    short:
      "Seberapa efisien perangkat memakai jatah VA. Pemanas (setrika, rice cooker) nilainya 1. Motor dan lampu neon lama lebih rendah, jadi butuh VA lebih besar dari wattnya.",
  },
  mcb: {
    term: "MCB (Miniature Circuit Breaker)",
    short:
      "Saklar pengaman otomatis. Kalau arus melebihi batasnya (misal 10 A), tuasnya turun sendiri — orang bilang ‘njeglek’. Ini melindungi kabel dari panas berlebih.",
  },
  mcbpln: {
    term: "MCB PLN",
    short:
      "MCB di meteran milik PLN. Batasnya sesuai daya langganan: 900 VA = 4 A, 1.300 VA = 6 A, 2.200 VA = 10 A. Kalau total beban rumah melebihi daya, MCB ini yang turun.",
  },
  grup: {
    term: "Grup MCB",
    short:
      "Pembagian jalur listrik di dalam rumah, masing-masing dengan MCB sendiri di box MCB. Kalau satu grup bermasalah, hanya area itu yang padam. Umumnya lampu dibuat satu grup sendiri (kabel 1,5 mm²), terpisah dari stopkontak (2,5 mm²).",
  },
  elcb: {
    term: "ELCB / RCBO",
    short:
      "Pengaman arus bocor. Kalau ada listrik ‘bocor’ ke tubuh orang atau ke air, ELCB memutus listrik dalam 0,03 detik. MCB biasa tidak bisa melakukan ini.",
  },
  arde: {
    term: "Arde (grounding)",
    short:
      "Kabel pengaman yang menghubungkan badan logam perangkat ke tanah. Kalau ada kebocoran, listrik mengalir ke tanah, bukan ke tubuhmu.",
  },
  surge: {
    term: "Lonjakan arus (arus start)",
    short:
      "Motor dan kompresor (pompa air, kulkas, AC, mesin cuci) butuh arus 2–5× lipat sesaat ketika mulai berputar. Ini sebabnya lampu kadang berkedip.",
  },
  nym: {
    term: "Kabel NYM",
    short:
      "Kabel instalasi rumah berisolasi ganda (biasanya putih). Angka 2,5 mm² adalah ukuran penampang tembaganya — makin besar, makin kuat menahan arus.",
  },
  njeglek: {
    term: "Njeglek",
    short:
      "Istilah sehari-hari untuk MCB yang turun sendiri sehingga listrik padam. Tanda bahwa beban melebihi batas atau ada korsleting.",
  },
} as const

export type GlossaryKey = keyof typeof GLOSSARY
