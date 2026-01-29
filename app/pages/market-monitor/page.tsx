import { useEffect, useMemo, useRef, useState } from "react";
import { RefreshCw } from "lucide-react";

import { marketMonitorEmptySnapshot, marketMonitorSnapshot } from "~/fixtures/market-monitor";
import { type ToolbarItem, CommonToolbar } from "~/components/common-toolbar";
import { PageTemplate } from "~/components/page-template";
import { Badge } from "~/components/ui/badge";
import { useAgGridTheme } from "~/lib/ag-grid-theme";

import { AlertsPanel } from "./components/AlertsPanel";
import { DerivBasisPanel } from "./components/DerivBasisPanel";
import { PositionsPanel } from "./components/PositionsPanel";
import { TopOfBookPanel } from "./components/TopOfBookPanel";

const VENUE_OPTIONS = [
  { value: "all", label: "All venues" },
  { value: "cme", label: "CME" },
  { value: "eurex", label: "Eurex" },
  { value: "ice", label: "ICE" },
];

const DATA_OPTIONS = [
  { value: "standard", label: "Live mock" },
  { value: "empty", label: "Quiet tape" },
  { value: "outage", label: "Stream outage" },
];

export default function MarketMonitorPage() {
  const gridTheme = useAgGridTheme();
  const refreshTimer = useRef<number | null>(null);
  const [venue, setVenue] = useState("all");
  const [dataMode, setDataMode] = useState("standard");
  const [isLoading, setIsLoading] = useState(false);

  const snapshot = dataMode === "empty" ? marketMonitorEmptySnapshot : marketMonitorSnapshot;
  const connectionState = dataMode === "outage" ? "closed" : "mock";
  const error = dataMode === "outage" ? "Market data stream interrupted" : null;

  const connectionLabel =
    connectionState === "open"
      ? "Live"
      : connectionState === "connecting"
        ? "Connecting"
        : connectionState === "mock"
          ? "Mock"
          : "Offline";

  const handleRefresh = () => {
    if (refreshTimer.current) {
      window.clearTimeout(refreshTimer.current);
    }
    setIsLoading(true);
    refreshTimer.current = window.setTimeout(() => {
      setIsLoading(false);
    }, 700);
  };

  useEffect(() => {
    return () => {
      if (refreshTimer.current) {
        window.clearTimeout(refreshTimer.current);
      }
    };
  }, []);

  const toolbarItems = useMemo<ToolbarItem[]>(
    () => [
      {
        id: "venue",
        type: "select",
        value: venue,
        onChange: setVenue,
        options: VENUE_OPTIONS,
        placeholder: "Venue",
        size: "sm",
        triggerClassName: "min-w-[140px]",
      },
      {
        id: "data-mode",
        type: "select",
        value: dataMode,
        onChange: setDataMode,
        options: DATA_OPTIONS,
        placeholder: "Data",
        size: "sm",
        triggerClassName: "min-w-[150px]",
      },
      {
        id: "refresh",
        type: "action",
        label: "Refresh",
        icon: RefreshCw,
        onClick: handleRefresh,
        isLoading,
        variant: "secondary",
        size: "sm",
      },
    ],
    [dataMode, isLoading, venue],
  );

  return (
    <PageTemplate
      title="Market Monitor"
      description="Streaming cross-asset snapshots with basis, position, and alert overlays for live supervision."
      actions={
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:items-end">
          <CommonToolbar items={toolbarItems} />
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <Badge variant={isLoading ? "secondary" : "outline"}>{isLoading ? "Refreshing" : "Ready"}</Badge>
            <Badge variant={connectionState === "open" ? "default" : "secondary"}>Stream: {connectionLabel}</Badge>
            {venue !== "all" ? <Badge variant="outline">Venue: {venue.toUpperCase()}</Badge> : null}
            {error ? <Badge variant="destructive">{error}</Badge> : null}
          </div>
        </div>
      }
    >
      <div className="grid gap-3 xl:grid-cols-12">
        <div className="xl:col-span-7">
          <TopOfBookPanel rows={snapshot.topOfBookRows} gridTheme={gridTheme} />
        </div>
        <div className="grid gap-3 xl:col-span-5">
          <DerivBasisPanel rows={snapshot.derivBasisRows} gridTheme={gridTheme} />
          <PositionsPanel rows={snapshot.positionRows} gridTheme={gridTheme} />
          <AlertsPanel rows={snapshot.alertRows} gridTheme={gridTheme} />
        </div>
      </div>
    </PageTemplate>
  );
}
