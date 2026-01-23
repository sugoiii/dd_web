import { useMemo } from "react";
import type { ColDef } from "ag-grid-enterprise";
import { AgGridReact } from "ag-grid-react";
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  BarChart4,
  Clock,
  RefreshCcw,
  ShieldAlert,
} from "lucide-react";

import { PageTemplate } from "~/components/page-template";
import { SummaryCard } from "~/components/summary-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { useAgGridTheme } from "~/lib/ag-grid-theme";


const makeCellClassRules = <T,>(rules: NonNullable<ColDef<T>["cellClassRules"]>) => rules;

const numberFormatter = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2, minimumFractionDigits: 2 });
const integerFormatter = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
const bpsFormatter = new Intl.NumberFormat("en-US", { maximumFractionDigits: 1, minimumFractionDigits: 1 });
const percentageFormatter = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2, minimumFractionDigits: 2 });

type QuoteState = "Stable" | "Wide" | "No Orders";

type MarketMakingRow = {
  product: string;
  underlying: string;
  currency: string;
  bid: number;
  ask: number;
  last: number;
  netChange: number;
  spreadBps: number;
  inventory: number;
  openPnl: number;
  hedgeTarget: number;
  quoteState: QuoteState;
  lastUpdate: string;
};

type HedgeRow = {
  underlying: string;
  delta: number;
  hedgeInstrument: string;
  target: number;
  variance: number;
  lastAction: string;
};

type ExposureRow = {
  bucket: string;
  fx: number;
  rebalancing: number;
  cash: number;
  comment: string;
};

const realtimeMetrics = [
  { title: "Quote Latency", value: "108 ms", trend: { value: "< 150 ms budget", direction: "up" as const } },
  { title: "Quote Coverage", value: "96%", trend: { value: "Active 48 / 50", direction: "up" as const } },
  { title: "Hedge Completion", value: "88%", trend: { value: "Across 12 underlyings", direction: "flat" as const } },
  { title: "Live Alerts", value: "4", trend: { value: "Need acknowledgement", direction: "down" as const } },
];

const baseMarketUniverse: Omit<MarketMakingRow, "lastUpdate">[] = [
  {
    product: "K200 Momentum",
    underlying: "KOSPI200",
    currency: "KRW",
    bid: 327.4,
    ask: 327.52,
    last: 327.46,
    netChange: 0.38,
    spreadBps: 3.7,
    inventory: 11250,
    openPnl: 185.4,
    hedgeTarget: 9800,
    quoteState: "Stable",
  },
  {
    product: "S&P 500 Overlay",
    underlying: "SPX",
    currency: "USD",
    bid: 451.12,
    ask: 451.21,
    last: 451.18,
    netChange: -0.22,
    spreadBps: 2,
    inventory: -8450,
    openPnl: -94.8,
    hedgeTarget: -9000,
    quoteState: "Stable",
  },
  {
    product: "TOPIX Equal Weight",
    underlying: "TOPIX",
    currency: "JPY",
    bid: 213.87,
    ask: 213.94,
    last: 213.91,
    netChange: 0.12,
    spreadBps: 3.3,
    inventory: 6420,
    openPnl: 72.3,
    hedgeTarget: 6100,
    quoteState: "Stable",
  },
  {
    product: "HSI Growth",
    underlying: "HSI",
    currency: "HKD",
    bid: 49.77,
    ask: 49.84,
    last: 49.81,
    netChange: -0.08,
    spreadBps: 14.1,
    inventory: -12500,
    openPnl: -118.2,
    hedgeTarget: -11000,
    quoteState: "Wide",
  },
  {
    product: "Nasdaq Quality",
    underlying: "NDX",
    currency: "USD",
    bid: 376.64,
    ask: 376.75,
    last: 376.7,
    netChange: 0.56,
    spreadBps: 2.9,
    inventory: 9820,
    openPnl: 165.7,
    hedgeTarget: 9500,
    quoteState: "Stable",
  },
  {
    product: "Euro Stoxx Carry",
    underlying: "SX5E",
    currency: "EUR",
    bid: 112.18,
    ask: 112.25,
    last: 112.22,
    netChange: -0.35,
    spreadBps: 6.2,
    inventory: -4520,
    openPnl: -38.9,
    hedgeTarget: -5000,
    quoteState: "Stable",
  },
  {
    product: "FTSE Dividend",
    underlying: "UKX",
    currency: "GBP",
    bid: 94.45,
    ask: 94.55,
    last: 94.5,
    netChange: 0.04,
    spreadBps: 10,
    inventory: 2340,
    openPnl: 16.8,
    hedgeTarget: 2000,
    quoteState: "Stable",
  },
  {
    product: "CSI 300 Overlay",
    underlying: "SHSZ300",
    currency: "CNY",
    bid: 36.91,
    ask: 36.97,
    last: 36.94,
    netChange: -0.14,
    spreadBps: 16.2,
    inventory: -16440,
    openPnl: -210.5,
    hedgeTarget: -15000,
    quoteState: "Wide",
  },
  {
    product: "ASX Resources",
    underlying: "AS51",
    currency: "AUD",
    bid: 28.36,
    ask: 28.43,
    last: 28.39,
    netChange: 0.09,
    spreadBps: 13.8,
    inventory: 4280,
    openPnl: 24.1,
    hedgeTarget: 4000,
    quoteState: "Stable",
  },
  {
    product: "India Alpha",
    underlying: "NIFTY",
    currency: "INR",
    bid: 19.84,
    ask: 19.92,
    last: 19.88,
    netChange: -0.05,
    spreadBps: 20.1,
    inventory: 1560,
    openPnl: 6.4,
    hedgeTarget: 1800,
    quoteState: "Stable",
  },
];

const statusHighlights = [
  {
    icon: Activity,
    label: "Engines",
    value: "Quote + Hedge synced",
    tone: "success" as const,
  },
  {
    icon: RefreshCcw,
    label: "Rebalance Cycle",
    value: "Next in 00:18:42",
    tone: "info" as const,
  },
  {
    icon: Clock,
    label: "Last Heartbeat",
    value: "09:31:12 Local",
    tone: "info" as const,
  },
  {
    icon: ShieldAlert,
    label: "Risk Overrides",
    value: "2 temporary limits",
    tone: "warn" as const,
  },
];

const alertFeed = [
  {
    time: "09:29:07",
    message: "HSI Growth quoted 14 bps wide vs limit 10 bps.",
    severity: "warning" as const,
  },
  {
    time: "09:25:51",
    message: "CSI 300 Overlay inventory -16.4k vs target -15k.",
    severity: "warning" as const,
  },
  {
    time: "09:19:33",
    message: "Nasdaq Quality hedge partially filled (88%).",
    severity: "info" as const,
  },
  {
    time: "09:14:02",
    message: "No orders detected for FTSE Dividend for 90s.",
    severity: "critical" as const,
  },
];

export default function EtnRealtime() {
  const gridTheme = useAgGridTheme();
  const marketRowData = useMemo<MarketMakingRow[]>(() => {
    return Array.from({ length: 50 }, (_, index) => {
      const template = baseMarketUniverse[index % baseMarketUniverse.length];
      const tier = Math.floor(index / baseMarketUniverse.length);
      const suffix = tier ? ` ${String.fromCharCode(65 + tier)}` : "";
      const volatilityAdjust = 1 + (index % 5) * 0.02;
      const bid = +(template.bid * volatilityAdjust).toFixed(2);
      const ask = +(template.ask * volatilityAdjust).toFixed(2);
      const last = +(template.last * volatilityAdjust).toFixed(2);
      const spreadBps = +(
        ((ask - bid) / ((ask + bid) / 2 || 1)) * 10000 + (index % 3) * 0.4
      ).toFixed(1);
      const quoteState: QuoteState = index % 21 === 0
        ? "No Orders"
        : index % 11 === 0
          ? "Wide"
          : template.quoteState;

      return {
        product: `${template.product}${suffix}`,
        underlying: template.underlying,
        currency: template.currency,
        bid,
        ask,
        last,
        netChange: +(template.netChange - (index % 7) * 0.03).toFixed(2),
        spreadBps,
        inventory: template.inventory + tier * 2500 - (index % 4) * 520,
        openPnl: +(template.openPnl - (index % 5) * 9.4).toFixed(1),
        hedgeTarget: template.hedgeTarget,
        quoteState,
        lastUpdate: `09:${(12 + (index % 45)).toString().padStart(2, "0")}:${(10 + (index % 50))
          .toString()
          .padStart(2, "0")}`,
      } satisfies MarketMakingRow;
    });
  }, []);

  const marketColDefs = useMemo<ColDef<MarketMakingRow>[]>(
    () => [
      {
        headerName: "Product",
        field: "product",
        pinned: "left",
        flex: 1.2,
        cellClass: "font-medium text-foreground",
        tooltipField: "product",
      },
      {
        headerName: "Underlying",
        field: "underlying",
        flex: 1,
        tooltipField: "underlying",
      },
      {
        headerName: "Bid",
        field: "bid",
        type: "numericColumn",
        valueFormatter: (params) => numberFormatter.format(params.value ?? 0),
      },
      {
        headerName: "Ask",
        field: "ask",
        type: "numericColumn",
        valueFormatter: (params) => numberFormatter.format(params.value ?? 0),
      },
      {
        headerName: "Last",
        field: "last",
        type: "numericColumn",
        valueFormatter: (params) => numberFormatter.format(params.value ?? 0),
      },
      {
        headerName: "Δ",
        field: "netChange",
        type: "numericColumn",
        width: 90,
        valueFormatter: (params) => `${params.value >= 0 ? "+" : ""}${numberFormatter.format(params.value ?? 0)}`,
        cellClassRules: makeCellClassRules<MarketMakingRow>({
          "text-emerald-600 dark:text-emerald-400": (params) => (params.value ?? 0) > 0,
          "text-destructive": (params) => (params.value ?? 0) < -0.2,
        }),
      },
      {
        headerName: "Spread (bps)",
        field: "spreadBps",
        type: "numericColumn",
        width: 130,
        valueFormatter: (params) => bpsFormatter.format(params.value ?? 0),
        cellClassRules: makeCellClassRules<MarketMakingRow>({
          "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300": (params) => (params.value ?? 0) < 6,
          "bg-amber-500/10 text-amber-600 dark:text-amber-300": (params) => (params.value ?? 0) >= 6 && (params.value ?? 0) < 12,
          "bg-destructive/10 text-destructive font-semibold": (params) => (params.value ?? 0) >= 12,
        }),
      },
      {
        headerName: "Inventory",
        field: "inventory",
        type: "numericColumn",
        width: 130,
        valueFormatter: (params) => integerFormatter.format(params.value ?? 0),
        cellClassRules: makeCellClassRules<MarketMakingRow>({
          "bg-destructive/20 text-destructive font-semibold": (params) => Math.abs(params.value ?? 0) > 15000,
          "bg-amber-500/10 text-amber-600 dark:text-amber-300": (params) => Math.abs(params.value ?? 0) > 10000,
        }),
      },
      {
        headerName: "Open PnL (k)",
        field: "openPnl",
        type: "numericColumn",
        width: 130,
        valueFormatter: (params) => numberFormatter.format(params.value ?? 0),
        cellClassRules: makeCellClassRules<MarketMakingRow>({
          "text-emerald-600 dark:text-emerald-400": (params) => (params.value ?? 0) > 0,
          "text-destructive": (params) => (params.value ?? 0) < -50,
        }),
      },
      {
        headerName: "Hedge Target",
        field: "hedgeTarget",
        type: "numericColumn",
        width: 130,
        valueFormatter: (params) => integerFormatter.format(params.value ?? 0),
      },
      {
        headerName: "Quote State",
        field: "quoteState",
        width: 140,
        cellClassRules: makeCellClassRules<MarketMakingRow>({
          "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 font-medium": (params) => params.value === "Stable",
          "bg-amber-500/15 text-amber-600 dark:text-amber-300 font-semibold": (params) => params.value === "Wide",
          "bg-destructive/20 text-destructive font-semibold uppercase": (params) => params.value === "No Orders",
        }),
      },
      {
        headerName: "Updated",
        field: "lastUpdate",
        width: 120,
      },
    ],
    []
  );

  const hedgeRowData = useMemo<HedgeRow[]>(
    () => [
      {
        underlying: "KOSPI200",
        delta: 12650,
        hedgeInstrument: "FOK2 Futures",
        target: 11800,
        variance: 7.2,
        lastAction: "09:28:44",
      },
      {
        underlying: "SPX",
        delta: -8650,
        hedgeInstrument: "SPZ3 Futures",
        target: -9000,
        variance: -3.9,
        lastAction: "09:25:02",
      },
      {
        underlying: "TOPIX",
        delta: 6440,
        hedgeInstrument: "TPX Options",
        target: 6100,
        variance: 5.6,
        lastAction: "09:22:11",
      },
      {
        underlying: "HSI",
        delta: -13200,
        hedgeInstrument: "HSI Futures",
        target: -11800,
        variance: -11.9,
        lastAction: "09:29:57",
      },
      {
        underlying: "NDX",
        delta: 10120,
        hedgeInstrument: "QQQ Shares",
        target: 9800,
        variance: 3.3,
        lastAction: "09:26:18",
      },
      {
        underlying: "SX5E",
        delta: -5100,
        hedgeInstrument: "SX5E Futures",
        target: -5000,
        variance: -2.1,
        lastAction: "09:18:07",
      },
    ],
    []
  );

  const hedgeColDefs = useMemo<ColDef<HedgeRow>[]>(
    () => [
      { headerName: "Underlying", field: "underlying", pinned: "left", width: 140 },
      {
        headerName: "Net Delta",
        field: "delta",
        type: "numericColumn",
        valueFormatter: (params) => integerFormatter.format(params.value ?? 0),
        cellClassRules: makeCellClassRules<HedgeRow>({
          "bg-destructive/20 text-destructive font-semibold": (params) => Math.abs(params.value ?? 0) > 12000,
          "bg-amber-500/10 text-amber-600 dark:text-amber-300": (params) => Math.abs(params.value ?? 0) > 8000,
        }),
      },
      {
        headerName: "Hedge Instrument",
        field: "hedgeInstrument",
        flex: 1,
      },
      {
        headerName: "Target",
        field: "target",
        type: "numericColumn",
        valueFormatter: (params) => integerFormatter.format(params.value ?? 0),
      },
      {
        headerName: "Variance %",
        field: "variance",
        type: "numericColumn",
        valueFormatter: (params) => {
          const value = params.value ?? 0;
          const formatted = percentageFormatter.format(Math.abs(value));
          return `${value >= 0 ? "+" : "-"}${formatted}%`;
        },
        cellClassRules: makeCellClassRules<HedgeRow>({
          "text-emerald-600 dark:text-emerald-400": (params) => (params.value ?? 0) > 0,
          "text-destructive": (params) => (params.value ?? 0) < -5,
        }),
      },
      { headerName: "Last Action", field: "lastAction", width: 130 },
    ],
    []
  );

  const exposureRowData = useMemo<ExposureRow[]>(
    () => [
      {
        bucket: "USD / KRW",
        fx: 1334.2,
        rebalancing: -2.4,
        cash: 32.7,
        comment: "KRW demand elevated by Korea ETFs",
      },
      {
        bucket: "USD / JPY",
        fx: 148.9,
        rebalancing: 3.1,
        cash: -18.4,
        comment: "TOPIX book unwind to hedge delta",
      },
      {
        bucket: "USD / HKD",
        fx: 7.81,
        rebalancing: -1.1,
        cash: 12.2,
        comment: "HSI growth protection ongoing",
      },
      {
        bucket: "Daily Rebalance",
        fx: 1,
        rebalancing: -8.7,
        cash: 4.3,
        comment: "Asia session inventory relief",
      },
      {
        bucket: "Synthetic Borrow",
        fx: 1,
        rebalancing: 1.8,
        cash: -6.1,
        comment: "Stock borrow roll at 10:00",
      },
    ],
    []
  );

  const exposureColDefs = useMemo<ColDef<ExposureRow>[]>(
    () => [
      { headerName: "Bucket", field: "bucket", pinned: "left", flex: 1.1 },
      {
        headerName: "FX Level",
        field: "fx",
        type: "numericColumn",
        valueFormatter: (params) => numberFormatter.format(params.value ?? 0),
      },
      {
        headerName: "Rebal (USD mm)",
        field: "rebalancing",
        type: "numericColumn",
        valueFormatter: (params) => numberFormatter.format(params.value ?? 0),
        cellClassRules: makeCellClassRules<ExposureRow>({
          "text-destructive": (params) => (params.value ?? 0) < -5,
          "text-emerald-600 dark:text-emerald-400": (params) => (params.value ?? 0) > 0,
        }),
      },
      {
        headerName: "Cash (USD mm)",
        field: "cash",
        type: "numericColumn",
        valueFormatter: (params) => numberFormatter.format(params.value ?? 0),
      },
      { headerName: "Commentary", field: "comment", flex: 1.4 },
    ],
    []
  );

  return (
    <PageTemplate
      title="Realtime ETF Market Making"
      description="Live visibility on quoting, hedging, and support flows across the ETF complex."
      fullWidth
    >
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {realtimeMetrics.map((metric) => (
          <SummaryCard key={metric.title} {...metric} />
        ))}
      </div>

      <div className="grid grid-cols-12 gap-3 xl:h-[calc(100vh-220px)]">
        <div className="col-span-12 xl:col-span-9 flex flex-col gap-3">
          <Card className="flex h-full flex-col border-border/80 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between gap-2 border-b px-4 py-2">
              <div>
                <CardTitle className="text-lg">Market Making Blotter</CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  50 tradable lines with live quote state, inventory, and pnl monitors.
                </CardDescription>
              </div>
              <Badge variant="outline" className="gap-1 text-xs uppercase">
                <BarChart4 className="h-3.5 w-3.5" />
                Density Optimized
              </Badge>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col p-0">
              <div className="ag-theme-quartz density-compact flex-1">
                <AgGridReact<MarketMakingRow>
                  rowData={marketRowData}
                  columnDefs={marketColDefs}
                  defaultColDef={{
                    sortable: true,
                    filter: true,
                    resizable: true,
                    suppressHeaderMenuButton: true,
                    flex: 1,
                  }}
                  theme={gridTheme}
                  animateRows
                  rowHeight={34}
                  headerHeight={36}
                  suppressCellFocus
                  statusBar={{
                    statusPanels: [
                      { statusPanel: "agTotalRowCountComponent", align: "left" },
                      { statusPanel: "agAggregationComponent", align: "right" },
                    ],
                  }}
                  tooltipShowDelay={0}
                />
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-12 gap-3">
            <Card className="col-span-12 lg:col-span-7 flex flex-col border-border/80 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between gap-2 border-b px-4 py-2">
                <div>
                  <CardTitle className="text-base">Hedge Status</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    Net delta posture and execution freshness per underlying.
                  </CardDescription>
                </div>
                <Badge variant="outline" className="gap-1 text-xs">
                  <RefreshCcw className="h-3.5 w-3.5" />
                  Auto-sync
                </Badge>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col p-0">
                <div className="ag-theme-quartz density-compact flex-1">
                  <AgGridReact<HedgeRow>
                    rowData={hedgeRowData}
                    columnDefs={hedgeColDefs}
                    defaultColDef={{
                      sortable: true,
                      filter: true,
                      resizable: true,
                      suppressHeaderMenuButton: true,
                      flex: 1,
                    }}
                    theme={gridTheme}
                    animateRows
                    rowHeight={34}
                    headerHeight={36}
                    suppressCellFocus
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="col-span-12 lg:col-span-5 flex flex-col border-border/80 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between gap-2 border-b px-4 py-2">
                <div>
                  <CardTitle className="text-base">FX & Funding</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    Cross-currency balances and daily rebalance agenda.
                  </CardDescription>
                </div>
                <Badge variant="outline" className="gap-1 text-xs">
                  <ArrowUpRight className="h-3.5 w-3.5" />
                  Watchlist
                </Badge>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col p-0">
                <div className="ag-theme-quartz density-compact flex-1">
                  <AgGridReact<ExposureRow>
                    rowData={exposureRowData}
                    columnDefs={exposureColDefs}
                    defaultColDef={{
                      sortable: true,
                      filter: true,
                      resizable: true,
                      suppressHeaderMenuButton: true,
                      flex: 1,
                    }}
                    theme={gridTheme}
                    animateRows
                    rowHeight={34}
                    headerHeight={36}
                    suppressCellFocus
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="col-span-12 xl:col-span-3 flex flex-col gap-3">
          <Card className="flex flex-col border-border/80 shadow-sm">
            <CardHeader className="border-b px-4 py-2">
              <CardTitle className="text-base">Desk Health</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Quick view of operational and risk signals.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-2 px-4 py-3">
              {statusHighlights.map(({ icon: Icon, label, value, tone }) => (
                <div
                  key={label}
                  className="flex items-center justify-between rounded-md border border-border/70 bg-muted/30 px-3 py-2 text-sm"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={
                        tone === "success"
                          ? "flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-300"
                          : tone === "warn"
                            ? "flex h-6 w-6 items-center justify-center rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-300"
                            : "flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary"
                      }
                    >
                      <Icon className="h-3.5 w-3.5" />
                    </span>
                    <div className="flex flex-col leading-tight">
                      <span className="text-xs uppercase tracking-wide text-muted-foreground">{label}</span>
                      <span className="font-medium text-foreground">{value}</span>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="flex flex-1 flex-col border-border/80 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between gap-2 border-b px-4 py-2">
              <div>
                <CardTitle className="text-base">Alert Feed</CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Highlighting anomalies requiring trader review.
                </CardDescription>
              </div>
              <Badge variant="outline" className="gap-1 text-xs">
                <AlertTriangle className="h-3.5 w-3.5" />
                Escalations
              </Badge>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col gap-3 overflow-auto px-4 py-3">
              {alertFeed.map((alert) => (
                <div
                  key={`${alert.time}-${alert.message}`}
                  className="flex flex-col gap-1 rounded-md border border-border/70 bg-background/60 px-3 py-2 text-xs"
                >
                  <div className="flex items-center justify-between text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    <span>{alert.time}</span>
                    <span
                      className={
                        alert.severity === "critical"
                          ? "text-destructive"
                          : alert.severity === "warning"
                            ? "text-amber-600 dark:text-amber-300"
                            : "text-primary"
                      }
                    >
                      {alert.severity}
                    </span>
                  </div>
                  <p className="flex items-start gap-2 text-sm text-foreground">
                    <AlertTriangle className="mt-0.5 h-3.5 w-3.5 flex-none text-amber-500" />
                    {alert.message}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </PageTemplate>
  );
}
