import * as React from "react"
import {
  BookOpenIcon,
  HouseIcon,
  Settings2Icon,
  WalletIcon,
  ZapIcon,
} from "lucide-react"
import { Link } from "react-router"

import { BrandMark } from "~/components/art/gear-art"
import { BillView } from "~/components/sim/bill-view"
import {
  EventLog,
  MeterPanel,
  SafetyPanel,
  TopConsumers,
  loadTone,
} from "~/components/sim/control-panel"
import { CircuitMapDialog } from "~/components/sim/circuit-map"
import { DeviceSheet } from "~/components/sim/device-sheet"
import { UndoSnackbar } from "~/components/sim/undo-snackbar"
import {
  AddRoomDialog,
  CatalogDialog,
  CircuitDialog,
  OnboardingDialog,
  RoomDialog,
  SettingsDialog,
  TripDialog,
} from "~/components/sim/dialogs"
import { HouseView } from "~/components/sim/house-view"
import {
  HouseMenuButton,
  HousesDialog,
  useSaveShortcut,
} from "~/components/sim/houses"
import { LearnView } from "~/components/sim/learn-view"
import { RoomMcbDialog } from "~/components/sim/room-mcb-dialog"
import { RoomMcbRemoveDialog } from "~/components/sim/room-mcb-remove"
import { StatusBanner } from "~/components/sim/status-banner"
import { useUi, type Tab } from "~/components/sim/ui-store"
import { Button } from "~/components/ui/button"
import { fmt } from "~/lib/sim/engine"
import { useSim, useSimStore } from "~/lib/sim/store"
import { cn } from "~/lib/utils"
import type { Route } from "./+types/simulator"

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Simulator — Simulasi Listrik Rumah" },
    {
      name: "description",
      content:
        "Pasang perangkat, lihat beban listrik, dan pahami kenapa MCB njeglek.",
    },
  ]
}

export default function Simulator() {
  return <Shell />
}

const TABS: { id: Tab; label: string; icon: typeof HouseIcon }[] = [
  { id: "rumah", label: "Rumah", icon: HouseIcon },
  { id: "biaya", label: "Biaya & Daya", icon: WalletIcon },
  { id: "belajar", label: "Belajar", icon: BookOpenIcon },
]

function Shell() {
  const { tab, setTab, setSettingsOpen } = useUi()
  const { state } = useSim()
  useSaveShortcut()
  const hydrate = useSimStore((s) => s.hydrate)
  React.useEffect(hydrate, [hydrate])

  return (
    <div className="min-h-svh pb-24 lg:pb-10">
      <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1400px] items-center gap-3 px-4 py-2.5 sm:px-6">
          <Link to="/" className="flex shrink-0 items-center gap-2">
            <BrandMark className="size-8" />
            <span className="hidden leading-tight sm:block">
              <span className="block font-heading text-[15px] font-semibold">
                Simulasi Listrik Rumah
              </span>
              <span className="block text-[11px] text-muted-foreground">
                belajar listrik tanpa kesetrum
              </span>
            </span>
          </Link>
          <nav
            className="mx-auto flex rounded-xl bg-muted p-1"
            aria-label="Bagian"
          >
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  setTab(t.id)
                  window.scrollTo({ top: 0, behavior: "smooth" })
                }}
                aria-current={tab === t.id ? "page" : undefined}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[13px] font-medium transition sm:px-3.5",
                  tab === t.id
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <t.icon className="size-4" />
                <span
                  className={cn(tab !== t.id && "hidden min-[420px]:inline")}
                >
                  {t.label}
                </span>
              </button>
            ))}
          </nav>
          <HouseMenuButton />
          <Button
            variant="outline"
            onClick={() => setSettingsOpen(true)}
            className="shrink-0"
          >
            <Settings2Icon />
            <span className="hidden md:inline">{fmt(state.dayaVA)} VA</span>
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-[1400px] px-3 pt-4 sm:px-6 sm:pt-6">
        {tab === "rumah" && (
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px] xl:grid-cols-[minmax(0,1fr)_380px]">
            <div className="flex min-w-0 flex-col gap-3">
              <StatusBanner />
              <HouseView />
              <p className="px-1 text-xs text-muted-foreground">
                Ketuk perangkat untuk menyalakan/mematikan · ikon <b>(i)</b>{" "}
                untuk penjelasan · label warna = jalur MCB
              </p>
            </div>
            <aside className="flex flex-col gap-4">
              <MeterPanel />
              <SafetyPanel />
              <TopConsumers />
              <EventLog />
            </aside>
          </div>
        )}
        {tab === "biaya" && <BillView />}
        {tab === "belajar" && <LearnView />}
      </main>

      {tab === "rumah" && <MobileLoadBar />}

      <TripDialog />
      <DeviceSheet />
      <CatalogDialog />
      <RoomDialog />
      <AddRoomDialog />
      <CircuitDialog />
      <SettingsDialog />
      <OnboardingDialog />
      <CircuitMapDialog />
      <UndoSnackbar />
      <HousesDialog />
      <RoomMcbDialog />
      <RoomMcbRemoveDialog />
    </div>
  )
}

function MobileLoadBar() {
  const { state, analysis, dispatch } = useSim()
  const tone = loadTone(analysis.pct)
  return (
    <div className="fixed inset-x-3 bottom-3 z-30 lg:hidden">
      <div className="flex items-center gap-3 rounded-2xl bg-card/95 p-2.5 pl-4 shadow-lg ring-1 ring-foreground/10 backdrop-blur">
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between text-xs">
            <span className="font-semibold tabular-nums">
              {fmt(analysis.totalVA)}{" "}
              <span className="font-normal text-muted-foreground">
                / {fmt(state.dayaVA)} VA
              </span>
            </span>
            <span
              className={cn(
                "font-medium",
                state.mainOn ? tone.cls : "text-destructive"
              )}
            >
              {state.mainOn ? `${Math.round(analysis.pct * 100)}%` : "Padam"}
            </span>
          </div>
          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(analysis.pct * 100, 100)}%`,
                background: tone.color,
              }}
            />
          </div>
        </div>
        <Button
          size="lg"
          variant={state.mainOn ? "outline" : "default"}
          onClick={() => dispatch({ type: "toggle-main" })}
          className={cn("shrink-0", !state.mainOn && "anim-alarm")}
        >
          <ZapIcon />
          {state.mainOn ? "MCB" : "Naikkan MCB"}
        </Button>
      </div>
    </div>
  )
}
