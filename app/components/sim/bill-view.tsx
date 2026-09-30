import {
  ArrowRightIcon,
  CheckIcon,
  LightbulbIcon,
  TriangleAlertIcon,
  XIcon,
} from "lucide-react"

import { ApplianceArt } from "~/components/art/appliance-art"
import { Volti } from "~/components/art/gear-art"
import { Button } from "~/components/ui/button"
import { DAYA_LEVELS, dayaLevel, tarifPerKwh } from "~/lib/sim/catalog"
import {
  appliance,
  bill,
  fmt,
  monthlyKwh,
  recommend,
  rupiah,
  deviceName,
} from "~/lib/sim/engine"
import { useSim } from "~/lib/sim/store"
import { cn } from "~/lib/utils"
import { Panel } from "./control-panel"
import { Term } from "./term"
import { useUi } from "./ui-store"

const TOKENS = [20000, 50000, 100000, 200000]

export function BillView() {
  const { state, dispatch } = useSim()
  const { openDevice } = useUi()
  const b = bill(state)
  const rec = recommend(state)
  const perDay = b.kwh / 30
  const lvl = dayaLevel(state.dayaVA)
  const bigDev =
    rec.biggest && state.devices.find((d) => d.id === rec.biggest!.deviceId)

  const rows = state.devices
    .map((d) => ({
      d,
      kwh: monthlyKwh(d),
      a: appliance(d),
      room: state.rooms.find((r) => r.id === d.roomId),
    }))
    .sort((x, y) => y.kwh - x.kwh)
  const maxKwh = Math.max(...rows.map((r) => r.kwh), 0.001)

  return (
    <div className="grid gap-4 lg:grid-cols-[1.15fr_1fr]">
      {/* ringkasan */}
      <section className="relative overflow-hidden rounded-3xl bg-primary p-5 text-primary-foreground sm:p-6">
        <svg
          aria-hidden
          viewBox="0 0 200 200"
          className="absolute -top-10 -right-10 size-56 opacity-15"
        >
          <path d="M110 10 40 110h50l-20 80 90-110h-55Z" fill="white" />
        </svg>
        <p className="text-sm text-primary-foreground/80">
          Perkiraan {state.billing === "prabayar" ? "belanja token" : "tagihan"}{" "}
          per bulan
        </p>
        <p className="mt-1 font-heading text-4xl font-semibold tracking-tight tabular-nums sm:text-5xl">
          {rupiah(b.total)}
        </p>
        <p className="mt-1 text-sm text-primary-foreground/80">
          {fmt(b.kwh, 1)} kWh × Rp{fmt(b.tarif, 2)}
          {state.ppj > 0 && ` + PPJ ${state.ppj}%`}
          {b.belowMinimum && " (kena rekening minimum)"}
        </p>
        <div className="relative mt-5 grid grid-cols-3 gap-2 text-center">
          <SumStat label="per hari" value={rupiah(b.total / 30)} />
          <SumStat label="energi/hari" value={`${fmt(perDay, 1)} kWh`} />
          <SumStat label="golongan" value={`${lvl.golongan}`} />
        </div>
        <div className="relative mt-5 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-primary-foreground/80">Meteran:</span>
          {(["prabayar", "pascabayar"] as const).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() =>
                dispatch({ type: "settings", patch: { billing: k } })
              }
              className={cn(
                "rounded-full px-3 py-1 font-medium ring-1 transition",
                state.billing === k
                  ? "bg-white text-primary ring-white"
                  : "ring-white/40 hover:bg-white/10"
              )}
            >
              {k === "prabayar" ? "Prabayar" : "Pascabayar"}
            </button>
          ))}
          <span className="ml-2 text-primary-foreground/80">PPJ:</span>
          <select
            value={state.ppj}
            onChange={(e) =>
              dispatch({
                type: "settings",
                patch: { ppj: Number(e.target.value) },
              })
            }
            className="rounded-full bg-white/15 px-2 py-1 font-medium ring-1 ring-white/40 outline-none [&>option]:text-foreground"
            aria-label="Pajak Penerangan Jalan"
          >
            {[0, 3, 5, 8, 10].map((p) => (
              <option key={p} value={p}>
                {p === 0 ? "Tanpa pajak" : `${p}%`}
              </option>
            ))}
          </select>
          {state.dayaVA === 900 && (
            <button
              type="button"
              onClick={() =>
                dispatch({
                  type: "settings",
                  patch: { subsidi: !state.subsidi },
                })
              }
              className={cn(
                "rounded-full px-3 py-1 font-medium ring-1 transition",
                state.subsidi
                  ? "bg-white text-primary ring-white"
                  : "ring-white/40 hover:bg-white/10"
              )}
            >
              {state.subsidi ? "✓ Subsidi" : "Subsidi?"}
            </button>
          )}
        </div>
      </section>

      {/* token */}
      <Panel
        title={
          state.billing === "prabayar"
            ? "Token listrik cukup berapa lama?"
            : "Tentang tagihan pascabayar"
        }
      >
        {state.billing === "prabayar" ? (
          <>
            <ul className="grid grid-cols-2 gap-2">
              {TOKENS.map((t) => {
                const kwh = t / (b.tarif * (1 + state.ppj / 100))
                const days = perDay > 0 ? kwh / perDay : Infinity
                return (
                  <li key={t} className="rounded-2xl bg-muted/60 p-3">
                    <p className="text-xs text-muted-foreground">
                      Token {rupiah(t)}
                    </p>
                    <p className="text-lg font-semibold tabular-nums">
                      {Number.isFinite(days) ? `± ${fmt(days)} hari` : "—"}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      dapat ± {fmt(kwh, 1)} kWh
                    </p>
                  </li>
                )
              })}
            </ul>
            <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
              Perkiraan kasar, belum termasuk biaya admin pembelian. Angka{" "}
              <Term k="kwh">kWh</Term> yang masuk ke meteran bergantung tarif
              dan pajak daerahmu.
            </p>
          </>
        ) : (
          <div className="flex flex-col gap-2 text-[13px] leading-relaxed text-muted-foreground">
            <p>
              Pelanggan pascabayar membayar di akhir bulan sesuai angka meteran.
              Ada <b className="text-foreground">rekening minimum</b> 40 jam
              nyala × daya:
            </p>
            <p className="rounded-xl bg-muted/60 p-3 text-foreground">
              40 × {fmt(state.dayaVA / 1000, 1)} kVA × Rp{fmt(b.tarif, 2)} ={" "}
              <b>{rupiah(b.minimum)}</b>
            </p>
            <p>
              {b.belowMinimum
                ? "Pemakaianmu di bawah minimum, jadi yang dibayar adalah rekening minimum."
                : "Pemakaianmu di atas minimum, jadi yang dibayar sesuai pemakaian."}
            </p>
          </div>
        )}
      </Panel>

      {/* rekomendasi daya */}
      <Panel
        title="Daya berapa yang cocok untuk rumahmu?"
        className="lg:col-span-2"
      >
        <div className="grid gap-5 md:grid-cols-[1fr_1.3fr]">
          <div className="flex flex-col gap-3">
            <div className="flex items-start gap-3">
              <Volti
                mood={state.dayaVA >= rec.forStaggered ? "happy" : "worried"}
                className="h-20 w-16 shrink-0"
              />
              <p className="text-[13px] leading-relaxed">
                {state.dayaVA >= rec.forAllOn ? (
                  <>
                    Daya <b>{fmt(state.dayaVA)} VA</b> sudah cukup walau semua
                    perangkat menyala bersamaan. 👍
                  </>
                ) : state.dayaVA >= rec.forStaggered ? (
                  <>
                    Daya <b>{fmt(state.dayaVA)} VA</b> cukup,{" "}
                    <b>asal perangkat besar dipakai bergantian</b>. Kalau mau
                    bebas menyalakan semuanya, butuh{" "}
                    <b>{fmt(rec.forAllOn)} VA</b>.
                  </>
                ) : (
                  <>
                    Daya <b>{fmt(state.dayaVA)} VA</b> terlalu kecil — bahkan
                    kalau digilir pun sering njeglek. Minimal{" "}
                    <b>{fmt(rec.forStaggered)} VA</b>.
                  </>
                )}
              </p>
            </div>
            {bigDev && rec.biggest!.va > state.dayaVA && (
              <p className="rounded-xl bg-danger-soft p-3 text-[13px] leading-relaxed">
                <b>{appliance(bigDev).name}</b> sendiri butuh{" "}
                {fmt(rec.biggest!.va)} VA — sudah melebihi daya{" "}
                {fmt(state.dayaVA)} VA. Perangkat ini pasti membuat njeglek,
                walau semua yang lain dimatikan.
              </p>
            )}
            <dl className="grid grid-cols-2 gap-2 text-center">
              <div className="rounded-xl bg-muted/60 p-2.5">
                <dt className="text-[11px] text-muted-foreground">
                  Semua menyala sekaligus
                </dt>
                <dd className="text-base font-semibold tabular-nums">
                  {fmt(rec.allOnVA)} VA
                </dd>
              </div>
              <div className="rounded-xl bg-muted/60 p-2.5">
                <dt className="text-[11px] text-muted-foreground">
                  Perangkat besar digilir
                </dt>
                <dd className="text-base font-semibold tabular-nums">
                  {fmt(rec.staggeredVA)} VA
                </dd>
              </div>
            </dl>
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              “Digilir” = semua perangkat kecil menyala + hanya satu perangkat ≥
              300 W sekaligus. Rekomendasi sudah memberi cadangan 10%.
            </p>
          </div>
          <ul className="flex flex-col gap-1.5">
            {DAYA_LEVELS.slice(0, 7).map((l) => {
              const all = l.va >= rec.allOnVA * 1.1
              const stag = l.va >= rec.staggeredVA * 1.1
              const current = l.va === state.dayaVA
              const t = tarifPerKwh(
                l.va,
                l.va === state.dayaVA ? state.subsidi : false
              )
              return (
                <li key={l.va}>
                  <button
                    type="button"
                    onClick={() =>
                      dispatch({ type: "settings", patch: { dayaVA: l.va } })
                    }
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left ring-1 transition hover:bg-muted/60",
                      current
                        ? "bg-art-soft ring-2 ring-primary"
                        : "ring-border"
                    )}
                  >
                    <span className="w-20 shrink-0 text-sm font-semibold tabular-nums">
                      {fmt(l.va)} VA
                    </span>
                    <span
                      className={cn(
                        "flex flex-1 items-center gap-1 text-xs font-medium",
                        all
                          ? "text-safe"
                          : stag
                            ? "text-warn"
                            : "text-destructive"
                      )}
                    >
                      {all ? (
                        <CheckIcon className="size-3.5" />
                      ) : stag ? (
                        <TriangleAlertIcon className="size-3.5" />
                      ) : (
                        <XIcon className="size-3.5" />
                      )}
                      {all
                        ? "Bebas nyala bersamaan"
                        : stag
                          ? "Cukup kalau digilir"
                          : "Kurang"}
                    </span>
                    <span className="hidden text-[11px] text-muted-foreground tabular-nums sm:inline">
                      Rp{fmt(t, 0)}/kWh
                    </span>
                    {current && (
                      <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground">
                        sekarang
                      </span>
                    )}
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
        <p className="mt-4 rounded-xl bg-energy-soft p-3 text-[13px] leading-relaxed">
          <b>Apakah naik daya bikin tagihan naik?</b> Tagihan dihitung dari{" "}
          <b>kWh yang dipakai</b>, bukan dari besar daya. Untuk 1.300–2.200 VA
          tarifnya sama. Yang berubah: tarif per kWh saat pindah golongan (misal
          dari 900 VA subsidi), rekening minimum pascabayar, dan biaya
          penyambungan sekali bayar saat tambah daya.
        </p>
      </Panel>

      {/* per perangkat */}
      <Panel
        title="Pemakaian per perangkat (per bulan)"
        className="lg:col-span-2"
      >
        <p className="-mt-1 mb-3 text-xs text-muted-foreground">
          Ketuk baris untuk mengubah jam pemakaian. Diurutkan dari yang paling
          boros.
        </p>
        <ul className="divide-y">
          {rows.map(({ d, kwh, a, room }) => (
            <li key={d.id}>
              <button
                type="button"
                onClick={() => openDevice(d.id)}
                className="flex w-full items-center gap-3 py-2 text-left hover:bg-muted/40"
              >
                <ApplianceArt
                  kind={a.art}
                  mode={d.mode}
                  className="size-9 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2">
                    <span className="truncate text-sm font-medium">
                      {d.label ? deviceName(d) : a.name}
                    </span>
                    <span className="hidden truncate text-xs text-muted-foreground sm:inline">
                      {room?.name}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${(kwh / maxKwh) * 100}%` }}
                      />
                    </div>
                    <span className="w-24 shrink-0 text-right text-[11px] text-muted-foreground tabular-nums">
                      {a.modes
                        .map((m, i) =>
                          d.hours[i] ? `${fmt(d.hours[i], 1)} j` : null
                        )
                        .filter(Boolean)
                        .join(" + ") || "0 j"}
                      /hari
                    </span>
                  </div>
                </div>
                <div className="w-24 shrink-0 text-right">
                  <p className="text-sm font-semibold tabular-nums">
                    {rupiah(kwh * b.tarif)}
                  </p>
                  <p className="text-[11px] text-muted-foreground tabular-nums">
                    {fmt(kwh, 1)} kWh
                  </p>
                </div>
              </button>
            </li>
          ))}
        </ul>
      </Panel>

      <Tips rows={rows.slice(0, 3).map((r) => r.a)} />
    </div>
  )
}

function SumStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white/12 px-2 py-2.5 ring-1 ring-white/15">
      <p className="text-sm font-semibold tabular-nums">{value}</p>
      <p className="text-[11px] text-primary-foreground/75">{label}</p>
    </div>
  )
}

function Tips({ rows }: { rows: ReturnType<typeof appliance>[] }) {
  const { setTab } = useUi()
  const specific = rows.filter((a) => a.tip)
  const generic = [
    "Cabut charger dan matikan TV dari stopkontak kalau tidak dipakai — mode siaga tetap makan listrik.",
    "Pakai perangkat berdaya besar bergantian supaya tidak njeglek.",
    "Pilih perangkat berlabel hemat energi (bintang) dari Kementerian ESDM.",
  ]
  return (
    <Panel title="Tips hemat untuk rumahmu" className="lg:col-span-2">
      <ul className="grid gap-2 md:grid-cols-2">
        {specific.map((a) => (
          <li
            key={a.id}
            className="flex gap-3 rounded-xl bg-energy-soft p-3 text-[13px] leading-relaxed"
          >
            <ApplianceArt kind={a.art} className="size-9 shrink-0" />
            <p>
              <b>{a.short}:</b> {a.tip}
            </p>
          </li>
        ))}
        {generic.map((t) => (
          <li
            key={t}
            className="flex gap-3 rounded-xl bg-muted/60 p-3 text-[13px] leading-relaxed"
          >
            <LightbulbIcon className="mt-0.5 size-4 shrink-0 text-energy-deep" />
            <p>{t}</p>
          </li>
        ))}
      </ul>
      <Button
        variant="link"
        className="mt-2 px-0"
        onClick={() => setTab("belajar")}
      >
        Pelajari istilah listrik
        <ArrowRightIcon />
      </Button>
    </Panel>
  )
}
