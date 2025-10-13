import type { CSSProperties } from "react";
import { useEffect, useMemo, useState } from "react";
import type { ColDef, ICellRendererParams } from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  ReferenceLine,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChevronDown, Settings2, X as CloseIcon } from "lucide-react";

import { Button } from "~/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "~/components/ui/collapsible";
import { Input } from "~/components/ui/input";
import { Progress } from "~/components/ui/progress";
import { Switch } from "~/components/ui/switch";
import { cn } from "~/lib/utils";

const integerFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 0,
});

const compactFormatter = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
});

const decimalFormatter = (fractionDigits = 2) =>
  new Intl.NumberFormat("en-US", {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "KRW",
  maximumFractionDigits: 0,
});

const percentFormatter = new Intl.NumberFormat("en-US", {
  style: "percent",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const headroomFormatter = new Intl.NumberFormat("en-US", {
  style: "percent",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const premiumFormats = {
  bps: (bps: number, krw: number) => `Prem: ${bps >= 0 ? "+" : "−"}${Math.abs(bps)} bp | ${krw >= 0 ? "+" : "−"}${integerFormatter.format(Math.abs(krw))} KRW/g`,
  krw: (bps: number, krw: number, percent: number) =>
    `Prem: ${krw >= 0 ? "+" : "−"}${integerFormatter.format(Math.abs(krw))} KRW/g | ${percent >= 0 ? "+" : "−"}${decimalFormatter(2).format(Math.abs(percent))}%`,
  percent: (bps: number, krw: number, percent: number) =>
    `Prem: ${percent >= 0 ? "+" : "−"}${decimalFormatter(2).format(Math.abs(percent))}% | ${bps >= 0 ? "+" : "−"}${Math.abs(bps)} bp`,
};

const signedInteger = (value: number, fractionDigits = 0) => {
  const formatter = decimalFormatter(fractionDigits);
  return `${value >= 0 ? "+" : "−"}${formatter.format(Math.abs(value))}`;
};

const deltaTone = (value: number) => {
  const abs = Math.abs(value);
  if (abs >= 5) return "text-rose-400";
  if (abs >= 3) return "text-amber-400";
  if (abs >= 1) return "text-emerald-300";
  return "text-slate-100";
};

const changeTone = (value: number) => {
  if (value > 0) return "text-emerald-300";
  if (value < 0) return "text-rose-400";
  return "text-slate-200";
};

type MajorMarketDetailAccent = "neutral" | "positive" | "negative" | "info";

type MajorMarketDetail = {
  label: string;
  value: string;
  accent?: MajorMarketDetailAccent;
};

type MajorMarketStat = {
  product: string;
  venue: string;
  type: "Spot" | "Futures" | "FX" | "Index";
  last: string;
  change: number;
  changePct: number;
  changePrecision?: number;
  pctPrecision?: number;
  sessionRange: string;
  timeLabel: string;
  details: MajorMarketDetail[];
};

type QuoteState = "joined" | "inside" | "resting" | "off";

type MarketRow = {
  product: string;
  tenor: string;
  venue: string;
  bestBid: number;
  bestBidChange: number;
  bestAsk: number;
  bestAskChange: number;
  ourBid: number | null;
  ourBidChange: number;
  ourBidState: QuoteState | null;
  ourAsk: number | null;
  ourAskChange: number;
  ourAskState: QuoteState | null;
  theo: number;
  theoChange: number;
  premiumBps: number;
  premiumKrw: number;
  premiumChange: number;
  pnl: number;
  pnlChange: number;
  position: number;
  positionChange: number;
  microTrend: number[];
  lastUpdate: string;
};

type PnLSegment = {
  name: string;
  value: number;
  accent: "core" | "hedge" | "carry" | "cost";
};

const zeroGlyph = "·";

const detailAccentTone: Record<MajorMarketDetailAccent, string> = {
  neutral: "text-slate-300",
  positive: "text-emerald-300",
  negative: "text-rose-400",
  info: "text-sky-300",
};

const statTypeAccent: Record<MajorMarketStat["type"], string> = {
  Spot: "border-sky-500/40 text-sky-200",
  Futures: "border-emerald-500/40 text-emerald-200",
  FX: "border-amber-500/40 text-amber-200",
  Index: "border-violet-500/40 text-violet-200",
};

const pnlAccentColors: Record<PnLSegment["accent"], string> = {
  core: "#34d399",
  hedge: "#38bdf8",
  carry: "#fbbf24",
  cost: "#f97316",
};

const formatSignedCompactKrw = (value: number) =>
  `${value >= 0 ? "+" : "−"}₩${compactFormatter.format(Math.abs(value))}`;

const formatSignedKg = (value: number, fractionDigits = 2) =>
  `${value >= 0 ? "+" : "−"}${decimalFormatter(fractionDigits).format(Math.abs(value))} kg`;

const formatDelta = (value: number, fractionDigits = 1) => {
  if (Math.abs(value) < 0.05) return zeroGlyph;
  return `${value >= 0 ? "+" : "−"}${decimalFormatter(fractionDigits).format(Math.abs(value))}`;
};

const headerBackground = "bg-[#101522]";

const netDeltaHistory = Array.from({ length: 30 }, (_, idx) => ({
  timestamp: `${14 + Math.floor(idx / 6)}:${String((idx * 2) % 60).padStart(2, "0")}`,
  value: 2.6 + Math.sin(idx / 3.5) * 0.6 + idx * -0.02,
}));

const premiumTrend = Array.from({ length: 18 }, (_, idx) => ({
  label: `${14}:${String(6 + idx * 2).padStart(2, "0")}`,
  value: 188 - idx * 1.2 + Math.sin(idx / 2.2) * 6,
}));

const latencyHistogram = [
  { bucket: "<20", count: 2 },
  { bucket: "20-30", count: 6 },
  { bucket: "30-40", count: 10 },
  { bucket: "40-50", count: 7 },
  { bucket: "50-60", count: 4 },
  { bucket: ">60", count: 1 },
];

const quoteStateRows = [
  { instrument: "1kg", side: "Bid", price: "95,705", size: "2", state: "Active" },
  { instrument: "1kg", side: "Ask", price: "95,745", size: "2", state: "Active" },
  { instrument: "100g", side: "Bid", price: "95,720", size: "3", state: "Paused" },
  { instrument: "100g", side: "Ask", price: "95,760", size: "3", state: "Active" },
];

const hedgeLog = [
  {
    time: "14:02:16",
    instrument: "COMEX",
    action: "Auto Sell",
    qty: "2",
    price: "2,348.1",
    latency: "27 ms",
    pnl: "+30k",
  },
  {
    time: "14:04:21",
    instrument: "FX",
    action: "Manual Buy",
    qty: "100k",
    price: "1,407.2",
    latency: "35 ms",
    pnl: "−5k",
  },
  {
    time: "14:07:02",
    instrument: "KRX 1kg",
    action: "Quote Hit",
    qty: "1",
    price: "95,732",
    latency: "19 ms",
    pnl: "+420k",
  },
  {
    time: "14:09:18",
    instrument: "COMEX",
    action: "Manual Buy",
    qty: "1",
    price: "2,347.6",
    latency: "32 ms",
    pnl: "−18k",
  },
];

const positionBreakdown = [
  {
    leg: "KRX 1kg",
    qty: 14,
    avgPx: 95680,
    mtm: 95740,
    deltaPnl: 1850000,
  },
  {
    leg: "KRX 100g",
    qty: 38,
    avgPx: 95795,
    mtm: 95760,
    deltaPnl: -320000,
  },
  {
    leg: "COMEX Fut",
    qty: -12,
    avgPx: 2347.2,
    mtm: 2348.1,
    deltaPnl: 420000,
  },
  {
    leg: "FX Hedge",
    qty: 420000,
    avgPx: 1405.8,
    mtm: 1407.3,
    deltaPnl: -150000,
  },
];

const pnlSegments: PnLSegment[] = [
  { name: "Realized Trading", value: 8_450_000, accent: "core" },
  { name: "Inventory MTM", value: 12_450_000, accent: "core" },
  { name: "Carry / Funding", value: 620_000, accent: "carry" },
  { name: "Hedge Slippage", value: -410_000, accent: "hedge" },
  { name: "Fees & Rebate", value: -280_000, accent: "cost" },
];

const marketGridRows: MarketRow[] = [
  {
    product: "KRX 1kg",
    tenor: "Spot 1kg",
    venue: "KRX",
    bestBid: 95705,
    bestBidChange: 8.2,
    bestAsk: 95745,
    bestAskChange: -6.4,
    ourBid: 95704,
    ourBidChange: 4.2,
    ourBidState: "joined",
    ourAsk: 95746,
    ourAskChange: -3.8,
    ourAskState: "joined",
    theo: 95718,
    theoChange: 1.6,
    premiumBps: 23,
    premiumKrw: 182,
    premiumChange: -1.2,
    pnl: 3_200_000,
    pnlChange: 140_000,
    position: 2.38,
    positionChange: -0.24,
    microTrend: [95692, 95701, 95712, 95708, 95715, 95718, 95720, 95716, 95718, 95722],
    lastUpdate: "14:35:18",
  },
  {
    product: "KRX 100g",
    tenor: "Spot 100g",
    venue: "KRX",
    bestBid: 95718,
    bestBidChange: 6.1,
    bestAsk: 95758,
    bestAskChange: -4.4,
    ourBid: 95717,
    ourBidChange: 3.3,
    ourBidState: "inside",
    ourAsk: 95760,
    ourAskChange: -2.1,
    ourAskState: "resting",
    theo: 95710,
    theoChange: 1.1,
    premiumBps: 18,
    premiumKrw: 141,
    premiumChange: -0.6,
    pnl: 1_120_000,
    pnlChange: 60_000,
    position: 0.84,
    positionChange: 0.08,
    microTrend: [95688, 95694, 95702, 95709, 95714, 95712, 95718, 95722, 95719, 95725],
    lastUpdate: "14:35:11",
  },
  {
    product: "COMEX Apr",
    tenor: "Future",
    venue: "CME",
    bestBid: 2347.6,
    bestBidChange: 2.4,
    bestAsk: 2348.2,
    bestAskChange: 1.8,
    ourBid: null,
    ourBidChange: 0,
    ourBidState: null,
    ourAsk: null,
    ourAskChange: 0,
    ourAskState: null,
    theo: 2347.9,
    theoChange: 0.9,
    premiumBps: 11,
    premiumKrw: 86,
    premiumChange: 0.4,
    pnl: 42_000,
    pnlChange: 12_000,
    position: -3.62,
    positionChange: 0.18,
    microTrend: [2344.6, 2345.2, 2346.1, 2346.8, 2347.4, 2347.9, 2348.2, 2347.7, 2348.1, 2348.4],
    lastUpdate: "14:35:05",
  },
];

const fairValueInputs = {
  "1kg": {
    comex: 2348.1,
    fx: 1346.2,
    funding: -12.4,
    carry: 8.6,
    fairValue: 95712,
    premiumBps: 23,
    premiumKrw: 182,
  },
  "100g": {
    comex: 2348.4,
    fx: 1346.2,
    funding: -10.8,
    carry: 6.9,
    fairValue: 95718,
    premiumBps: 18,
    premiumKrw: 141,
  },
};

const majorMarketStats: MajorMarketStat[] = [
  {
    product: "XAUUSD Spot",
    venue: "LDN OTC",
    type: "Spot",
    last: "2,348.6",
    change: 3.8,
    changePct: 0.16,
    changePrecision: 1,
    sessionRange: "2340.1 – 2358.4",
    timeLabel: "Last 14:35:21",
    details: [
      { label: "Vs KRX", value: "+168 KRW/g", accent: "positive" },
      { label: "Asia Fix", value: "2,352.3", accent: "info" },
    ],
  },
  {
    product: "COMEX Apr Fut",
    venue: "CME Globex",
    type: "Futures",
    last: "2,350.2",
    change: 5.1,
    changePct: 0.22,
    changePrecision: 1,
    sessionRange: "2344.8 – 2353.9",
    timeLabel: "Roll vs Jun −0.8",
    details: [
      { label: "Basis", value: "+184 KRW/g", accent: "positive" },
      { label: "OI", value: "198k", accent: "info" },
      { label: "Volume", value: "42k", accent: "info" },
    ],
  },
  {
    product: "LBMA PM Fix",
    venue: "London",
    type: "Spot",
    last: "2,344.7",
    change: -2.4,
    changePct: -0.1,
    changePrecision: 1,
    pctPrecision: 2,
    sessionRange: "2342.1 – 2350.5",
    timeLabel: "Fix 14:00 London",
    details: [
      { label: "Vs KRX", value: "+168 KRW/g", accent: "positive" },
      { label: "Prev Fix", value: "2,347.1", accent: "neutral" },
    ],
  },
  {
    product: "SHFE Au (g)",
    venue: "Shanghai",
    type: "Futures",
    last: "470.3",
    change: 1.1,
    changePct: 0.24,
    changePrecision: 1,
    sessionRange: "466.5 – 471.1",
    timeLabel: "Arb window +116",
    details: [
      { label: "Arb", value: "+116 KRW/g", accent: "positive" },
      { label: "Active", value: "Jun 24", accent: "info" },
      { label: "Volume", value: "312k", accent: "info" },
    ],
  },
  {
    product: "USD/KRW",
    venue: "KRX FX",
    type: "FX",
    last: "1,346.2",
    change: -2.1,
    changePct: -0.16,
    changePrecision: 1,
    pctPrecision: 2,
    sessionRange: "1339 – 1351",
    timeLabel: "1M Fwd 1,343.6",
    details: [
      { label: "KTB Basis", value: "−3.2", accent: "negative" },
      { label: "CNH Spread", value: "+0.9", accent: "info" },
    ],
  },
  {
    product: "XAU/JPY",
    venue: "Tokyo",
    type: "FX",
    last: "298,420",
    change: 8.6,
    changePct: 0.29,
    changePrecision: 1,
    sessionRange: "297,110 – 298,960",
    timeLabel: "Hedge ref 14:34",
    details: [
      { label: "FX Adj", value: "+132 KRW/g", accent: "positive" },
      { label: "JPY Spot", value: "151.2", accent: "info" },
    ],
  },
];

const fxDeltaUsd = -420000;
const fxDeltaKrw = fxDeltaUsd * 1346.2;

const formatPriceValue = (value: number | null) => {
  if (value == null) return "—";
  if (Number.isInteger(value)) {
    return integerFormatter.format(value);
  }
  if (Math.abs(value) >= 1000) {
    return decimalFormatter(1).format(value);
  }
  return decimalFormatter(2).format(value);
};

const resolvePriceChange = (
  field: string | undefined,
  data: MarketRow | undefined,
): number | undefined => {
  if (!field || !data) return undefined;
  switch (field) {
    case "bestBid":
      return data.bestBidChange;
    case "bestAsk":
      return data.bestAskChange;
    case "ourBid":
      return data.ourBidChange;
    case "ourAsk":
      return data.ourAskChange;
    case "theo":
      return data.theoChange;
    default:
      return undefined;
  }
};

const resolveQuoteState = (
  field: string | undefined,
  data: MarketRow | undefined,
): QuoteState | null => {
  if (!field || !data) return null;
  if (field === "ourBid") return data.ourBidState;
  if (field === "ourAsk") return data.ourAskState;
  return null;
};

const ProductCellRenderer = (props: ICellRendererParams<MarketRow, string>) => {
  const data = props.data;
  if (!data) return null;
  return (
    <div className="flex flex-col gap-1 leading-tight">
      <div className="flex items-center justify-between">
        <span className="font-medium text-slate-100">{data.product}</span>
        <span
          className="rounded-full border border-slate-700/60 px-2 py-[2px] text-[9px] uppercase tracking-[0.18em] text-slate-400"
        >
          {data.venue}
        </span>
      </div>
      <div className="flex items-center justify-between font-mono text-[11px] text-slate-500">
        <span>{data.tenor}</span>
        <span>{data.lastUpdate}</span>
      </div>
    </div>
  );
};

const PriceCellRenderer = (props: ICellRendererParams<MarketRow, number | null>) => {
  const value = props.value ?? null;
  const field = props.colDef?.field as string | undefined;
  const change = resolvePriceChange(field, props.data);
  const state = resolveQuoteState(field, props.data);
  const isOurColumn = field === "ourBid" || field === "ourAsk";
  const formatted = formatPriceValue(value);

  const joinedClass = state === "joined" ? "border border-emerald-500/40 bg-emerald-500/10 text-emerald-200" : "";
  const insideClass = state === "inside" ? "border border-amber-500/40 bg-amber-500/10 text-amber-200" : "";
  const restingClass = state === "resting" ? "border border-slate-700 bg-[#111827] text-slate-200" : "";
  const offClass = state === "off" ? "border border-slate-800 bg-transparent text-slate-500" : "";

  const stateClass = joinedClass || insideClass || restingClass || offClass || "text-slate-100";

  return (
    <div className="flex flex-col items-end gap-1 leading-tight">
      <span
        className={cn(
          "font-mono text-[13px]",
          isOurColumn
            ? cn("inline-flex min-w-[5.2rem] justify-center rounded px-2 py-0.5", stateClass)
            : stateClass,
          value == null ? "text-slate-500" : null,
        )}
      >
        {formatted}
      </span>
      <span className={cn("font-mono text-[10px]", changeTone(change ?? 0))}>
        {change == null ? zeroGlyph : formatDelta(change)}
      </span>
    </div>
  );
};

const PremiumCellRenderer = (props: ICellRendererParams<MarketRow, number>) => {
  const data = props.data;
  if (!data) return null;
  return (
    <div className="flex flex-col items-end leading-tight">
      <span className={cn("font-mono text-[13px]", data.premiumBps >= 0 ? "text-amber-300" : "text-sky-300")}>
        {data.premiumBps >= 0 ? "+" : "−"}
        {Math.abs(data.premiumBps)} bp
      </span>
      <span className="font-mono text-[11px] text-slate-400">
        {data.premiumKrw >= 0 ? "+" : "−"}
        {integerFormatter.format(Math.abs(data.premiumKrw))} KRW/g
      </span>
      <span className={cn("font-mono text-[10px]", changeTone(data.premiumChange))}>
        {formatDelta(data.premiumChange, 1)}
      </span>
    </div>
  );
};

const PositionCellRenderer = (props: ICellRendererParams<MarketRow, number>) => {
  const value = props.value ?? 0;
  const change = props.data?.positionChange ?? 0;
  const changeDisplay = Math.abs(change) < 0.01 ? zeroGlyph : formatSignedKg(change);
  return (
    <div className="flex flex-col items-end leading-tight">
      <span className={cn("font-mono text-[13px]", value >= 0 ? "text-slate-100" : "text-rose-300")}> 
        {formatSignedKg(value)}
      </span>
      <span className={cn("font-mono text-[10px]", changeTone(change))}>{changeDisplay}</span>
    </div>
  );
};

const PnLCellRenderer = (props: ICellRendererParams<MarketRow, number>) => {
  const value = props.value ?? 0;
  const change = props.data?.pnlChange ?? 0;
  return (
    <div className="flex flex-col items-end leading-tight">
      <span className={cn("font-mono text-[13px]", value >= 0 ? "text-emerald-300" : "text-rose-400")}>
        {formatSignedCompactKrw(value)}
      </span>
      <span className={cn("font-mono text-[10px]", changeTone(change))}>
        {change === 0 ? zeroGlyph : formatSignedCompactKrw(change)}
      </span>
    </div>
  );
};

const TrendCellRenderer = (props: ICellRendererParams<MarketRow, number[]>) => {
  const values = props.value ?? [];
  if (!values.length) {
    return <span className="font-mono text-xs text-slate-500">{zeroGlyph}</span>;
  }
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const latest = values[values.length - 1];
  const previous = values[values.length - 2] ?? latest;
  const delta = latest - previous;
  const points = values
    .map((point, idx) => {
      const x = (idx / Math.max(values.length - 1, 1)) * 100;
      const y = 28 - ((point - min) / range) * 22;
      return `${x},${y}`;
    })
    .join(" ");
  const latestFormatted = Number.isInteger(latest)
    ? integerFormatter.format(latest)
    : decimalFormatter(1).format(latest);

  return (
    <div className="flex items-center gap-3">
      <svg viewBox="0 0 100 30" className="h-10 w-full max-w-[110px]" preserveAspectRatio="none">
        <polyline
          points={points}
          fill="none"
          stroke="#f59e0b"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <div className="flex flex-col items-end leading-tight">
        <span className="font-mono text-[12px] text-slate-200">{latestFormatted}</span>
        <span className={cn("font-mono text-[10px]", changeTone(delta))}>
          {Math.abs(delta) < 0.05 ? zeroGlyph : formatDelta(delta)}
        </span>
      </div>
    </div>
  );
};

export default function KRXGoldMonitorPage() {
  const [premiumUnit, setPremiumUnit] = useState<"bps" | "krw" | "percent">("bps");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [strategyOpen, setStrategyOpen] = useState(true);
  const [nudgeMessage, setNudgeMessage] = useState<string | null>(null);
  const [autoQuote, setAutoQuote] = useState(true);
  const [autoHedge, setAutoHedge] = useState(true);
  const [productFocus, setProductFocus] = useState<"1kg" | "100g">("1kg");

  const marketRowData = useMemo(() => marketGridRows, []);
  const marketColumnDefs = useMemo<ColDef<MarketRow>[]>(
    () => [
      {
        headerName: "Product",
        field: "product",
        minWidth: 220,
        cellRenderer: ProductCellRenderer,
        lockPosition: true,
      },
      {
        headerName: "Best Bid",
        field: "bestBid",
        minWidth: 120,
        cellRenderer: PriceCellRenderer,
      },
      {
        headerName: "Best Ask",
        field: "bestAsk",
        minWidth: 120,
        cellRenderer: PriceCellRenderer,
      },
      {
        headerName: "Our Bid",
        field: "ourBid",
        minWidth: 130,
        cellRenderer: PriceCellRenderer,
      },
      {
        headerName: "Our Ask",
        field: "ourAsk",
        minWidth: 130,
        cellRenderer: PriceCellRenderer,
      },
      {
        headerName: "Theo",
        field: "theo",
        minWidth: 120,
        cellRenderer: PriceCellRenderer,
      },
      {
        headerName: "Premium",
        field: "premiumBps",
        minWidth: 140,
        cellRenderer: PremiumCellRenderer,
      },
      {
        headerName: "Position",
        field: "position",
        minWidth: 130,
        cellRenderer: PositionCellRenderer,
      },
      {
        headerName: "ΔPnL",
        field: "pnl",
        minWidth: 140,
        cellRenderer: PnLCellRenderer,
      },
      {
        headerName: "Micro Trend",
        field: "microTrend",
        minWidth: 180,
        flex: 1.2,
        cellRenderer: TrendCellRenderer,
      },
    ],
    [],
  );

  const defaultMarketColDef = useMemo<ColDef<MarketRow>>(
    () => ({
      sortable: false,
      resizable: false,
      suppressMenu: true,
      suppressMovable: true,
      flex: 1,
    }),
    [],
  );

  const gridThemeStyles = useMemo<CSSProperties>(
    () => ({
      width: "100%",
      height: 260,
      ["--ag-background-color" as any]: "#0d1320",
      ["--ag-header-background-color" as any]: "#101522",
      ["--ag-header-foreground-color" as any]: "#94a3b8",
      ["--ag-border-color" as any]: "#1f2937",
      ["--ag-odd-row-background-color" as any]: "#101522",
      ["--ag-row-hover-color" as any]: "#162032",
      ["--ag-foreground-color" as any]: "#e2e8f0",
      ["--ag-font-size" as any]: "12px",
      ["--ag-font-family" as any]: "var(--font-family-mono, 'JetBrains Mono', 'Menlo', 'ui-monospace')",
    }),
    [],
  );

  const pnlTotal = useMemo(() => pnlSegments.reduce((acc, seg) => acc + seg.value, 0), []);

  useEffect(() => {
    if (!nudgeMessage) return;
    const timeout = window.setTimeout(() => setNudgeMessage(null), 2200);
    return () => window.clearTimeout(timeout);
  }, [nudgeMessage]);

  const fairValue = fairValueInputs[productFocus];

  const premiumText = useMemo(() => {
    if (premiumUnit === "bps") {
      return premiumFormats.bps(fairValue.premiumBps, fairValue.premiumKrw);
    }
    if (premiumUnit === "krw") {
      return premiumFormats.krw(
        fairValue.premiumBps,
        fairValue.premiumKrw,
        fairValue.premiumBps / 100,
      );
    }
    return premiumFormats.percent(
      fairValue.premiumBps,
      fairValue.premiumKrw,
      fairValue.premiumBps / 100,
    );
  }, [fairValue.premiumBps, fairValue.premiumKrw, premiumUnit]);

  const handleNudge = (direction: "bid+" | "bid-" | "ask+" | "ask-") => {
    const label =
      direction === "bid+"
        ? "Bid ↑"
        : direction === "bid-"
          ? "Bid ↓"
          : direction === "ask+"
            ? "Ask ↑"
            : "Ask ↓";
    const sign = direction.endsWith("+") ? "+" : "−";
    setNudgeMessage(`${label} | Repriced ${sign}0.2 KRW`);
  };

  const hedgeImbalance = 0.028;

  return (
    <div className="min-h-screen bg-[#070b10] text-slate-100">
      <div className="mx-auto flex h-full w-full max-w-[1920px] flex-col gap-4 px-6 py-6">
        <header className="flex h-14 items-stretch gap-3">
          <div className="grid flex-1 grid-cols-6 gap-3 text-sm">
            <div
              className={cn(
                "flex cursor-pointer flex-col justify-center rounded-md border border-slate-800 px-3",
                headerBackground,
              )}
            >
              <span className="text-[10px] uppercase tracking-[0.18em] text-slate-400">
                PnL Today
              </span>
              <span className="font-mono text-lg text-emerald-400">
                PnL: +12,450,000 | +8,300,000 KRW
              </span>
            </div>
            <div
              className={cn(
                "flex cursor-pointer flex-col justify-center rounded-md border border-slate-800 px-3",
                headerBackground,
              )}
            >
              <span className="text-[10px] uppercase tracking-[0.18em] text-slate-400">
                Gold Net Delta
              </span>
              <span className={cn("font-mono text-lg", deltaTone(2.35))}>
                ΔAu: {decimalFormatter(2).format(2.35)} kg
              </span>
            </div>
            <div
              className={cn(
                "flex cursor-pointer flex-col justify-center rounded-md border border-slate-800 px-3",
                headerBackground,
              )}
            >
              <span className="text-[10px] uppercase tracking-[0.18em] text-slate-400">
                FX Delta
              </span>
              <span className="font-mono text-lg text-rose-400">
                ΔFX: {signedInteger(fxDeltaUsd / 1000, 0)}$k
              </span>
              <span className="font-mono text-[11px] text-slate-400">
                {currencyFormatter.format(Math.abs(fxDeltaKrw))} offset
              </span>
            </div>
            <button
              type="button"
              onClick={() =>
                setPremiumUnit((prev) =>
                  prev === "bps" ? "krw" : prev === "krw" ? "percent" : "bps",
                )
              }
              className={cn(
                "flex flex-col justify-center rounded-md border border-slate-800 px-3 text-left transition",
                headerBackground,
                "hover:border-slate-600",
              )}
            >
              <span className="text-[10px] uppercase tracking-[0.18em] text-slate-400">
                Premium
              </span>
              <span className="font-mono text-lg text-amber-300">{premiumText}</span>
              <span className="text-[11px] text-slate-500">Tap to cycle units</span>
            </button>
            <div
              className={cn(
                "flex cursor-pointer flex-col justify-center rounded-md border border-slate-800 px-3",
                headerBackground,
              )}
            >
              <span className="text-[10px] uppercase tracking-[0.18em] text-slate-400">
                Quote State
              </span>
              <span className="font-mono text-lg text-emerald-300">
                Quote: 1kg [Both], 100g [Bid]
              </span>
            </div>
            <div
              className={cn(
                "flex flex-col justify-center rounded-md border border-slate-800 px-3",
                headerBackground,
              )}
            >
              <span className="text-[10px] uppercase tracking-[0.18em] text-slate-400">
                Risk Headroom
              </span>
              <div className="flex items-center justify-between gap-3 text-xs">
                <div className="flex-1">
                  <div className="flex items-center justify-between font-mono">
                    <span>Notional</span>
                    <span>{headroomFormatter.format(0.62)}</span>
                  </div>
                  <Progress value={62} className="mt-1 h-1.5 bg-slate-800" />
                </div>
              </div>
              <div className="mt-1 flex items-center justify-between gap-3 text-xs">
                <div className="flex-1">
                  <div className="flex items-center justify-between font-mono">
                    <span>Delta</span>
                    <span>{headroomFormatter.format(0.48)}</span>
                  </div>
                  <Progress value={48} className="mt-1 h-1.5 bg-slate-800" />
                </div>
              </div>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            className="border-slate-700 bg-[#0c111a] text-slate-100 hover:border-slate-500"
            onClick={() => setDrawerOpen(true)}
          >
            <Settings2 className="mr-2 h-4 w-4" /> Quote Drawer
          </Button>
        </header>

        <div className="flex flex-1 gap-4 overflow-hidden">
          <aside className="flex w-[25%] min-w-[320px] max-w-[360px] flex-col gap-4">
            <section className="rounded-lg border border-slate-800 bg-[#0d1320] p-4">
              <div className="flex flex-col gap-3">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
                    Net Gold Delta
                  </p>
                  <p className={cn("font-mono text-3xl", deltaTone(2.35))}>
                    {decimalFormatter(2).format(2.35)} kg
                  </p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
                    FX Delta
                  </p>
                  <p className="font-mono text-2xl text-rose-400">
                    {signedInteger(fxDeltaUsd / 1000, 0)}$k
                  </p>
                  <p className="font-mono text-sm text-slate-400">
                    {currencyFormatter.format(Math.abs(fxDeltaKrw))} KRW
                  </p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
                    Total Notional
                  </p>
                  <p className="font-mono text-2xl text-slate-100">₩58.2B</p>
                </div>
              </div>
            </section>

            <section className="rounded-lg border border-slate-800 bg-[#0d1320] p-4">
              <header className="mb-3 flex items-center justify-between">
                <h3 className="text-xs uppercase tracking-[0.2em] text-slate-400">
                  Book Breakdown
                </h3>
                <span className="text-[11px] text-slate-500">Pricing in KRW</span>
              </header>
              <div className="overflow-hidden">
                <table className="w-full table-fixed border-collapse text-[12px] text-slate-200">
                  <thead className="text-[11px] uppercase tracking-[0.12em] text-slate-500">
                    <tr className="border-b border-slate-800">
                      <th className="py-2 text-left">Leg</th>
                      <th className="text-right">Qty</th>
                      <th className="text-right">Avg Px</th>
                      <th className="text-right">MTM</th>
                      <th className="text-right">ΔPnL</th>
                    </tr>
                  </thead>
                  <tbody>
                    {positionBreakdown.map((row) => (
                      <tr key={row.leg} className="border-b border-slate-900/60 last:border-none">
                        <td className="py-2 text-left font-medium text-slate-100">{row.leg}</td>
                        <td className="text-right font-mono">{row.qty}</td>
                        <td className="text-right font-mono">{integerFormatter.format(row.avgPx)}</td>
                        <td className="text-right font-mono">{integerFormatter.format(row.mtm)}</td>
                        <td
                          className={cn(
                            "text-right font-mono",
                            row.deltaPnl >= 0 ? "text-emerald-300" : "text-rose-400",
                          )}
                        >
                          {row.deltaPnl >= 0 ? "+" : "−"}
                          {integerFormatter.format(Math.abs(row.deltaPnl))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="rounded-lg border border-slate-800 bg-[#0d1320] p-4">
              <header className="mb-3 flex items-center justify-between">
                <h3 className="text-xs uppercase tracking-[0.2em] text-slate-400">
                  Net Delta (30m)
                </h3>
                <span className="font-mono text-xs text-slate-400">
                  Last {decimalFormatter(2).format(netDeltaHistory.at(-1)?.value ?? 0)} kg
                </span>
              </header>
              <div className="h-24 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={netDeltaHistory} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="deltaGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#34d399" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <YAxis hide domain={[0, "dataMax+1"]} />
                    <XAxis hide dataKey="timestamp" />
                    <Tooltip
                      cursor={false}
                      formatter={(value: number) => [`${value.toFixed(2)} kg`, "Net Δ"]}
                      contentStyle={{
                        backgroundColor: "#111827",
                        borderRadius: 6,
                        border: "1px solid #1f2937",
                        padding: 8,
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="#34d399"
                      strokeWidth={1.5}
                      fillOpacity={1}
                      fill="url(#deltaGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              {hedgeImbalance > 0.02 ? (
                <div className="mt-3 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
                  Hedge imbalance {percentFormatter.format(hedgeImbalance)} — check COMEX leg sizing.
                </div>
              ) : null}
            </section>
          </aside>

          <section className="relative flex flex-1 flex-col gap-4">
            <div
              className={cn(
                "flex h-full flex-col gap-4 transition-opacity duration-150",
                drawerOpen ? "opacity-90" : "opacity-100",
              )}
            >
              <section className="rounded-lg border border-slate-800 bg-[#0d1320] p-3">
                <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.18em] text-slate-500">
                  <span>Global Market Watch</span>
                  <span className="font-mono text-[10px] normal-case text-slate-500">Streaming 1s</span>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
                  {majorMarketStats.map((stat) => (
                    <div
                      key={stat.product}
                      className="flex flex-col justify-between rounded-md border border-slate-800 bg-[#101522] px-3 py-2"
                    >
                      <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.16em] text-slate-400">
                        <span>{stat.product}</span>
                        <span
                          className={cn(
                            "rounded-full border px-2 py-[2px] text-[9px] font-mono tracking-[0.18em]",
                            statTypeAccent[stat.type],
                          )}
                        >
                          {stat.type}
                        </span>
                      </div>
                      <div className="mt-1 flex items-start justify-between gap-3">
                        <div className="flex flex-col">
                          <span className="font-mono text-lg text-slate-100">{stat.last}</span>
                          <span className="font-mono text-[10px] text-slate-500">{stat.venue} • {stat.sessionRange}</span>
                        </div>
                        <div className="text-right">
                          <div className={cn("font-mono text-sm", changeTone(stat.change))}>
                            {signedInteger(stat.change, stat.changePrecision ?? 1)}
                          </div>
                          <div className="font-mono text-[11px] text-slate-500">
                            ({signedInteger(stat.changePct, stat.pctPrecision ?? 2)}%)
                          </div>
                        </div>
                      </div>
                      <div className="mt-2 grid gap-1 font-mono text-[11px]">
                        {stat.details.map((detail) => (
                          <div key={`${stat.product}-${detail.label}`} className="flex items-center justify-between">
                            <span className="text-slate-500">{detail.label}</span>
                            <span className={cn(detailAccentTone[detail.accent ?? "neutral"])}>{detail.value}</span>
                          </div>
                        ))}
                      </div>
                      <div className="mt-2 font-mono text-[10px] text-slate-500">{stat.timeLabel}</div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-lg border border-slate-800 bg-[#0d1320] p-4">
                <header className="mb-3 flex items-center justify-between">
                  <h2 className="text-xs uppercase tracking-[0.2em] text-slate-400">
                    Market Core
                  </h2>
                  <span className="font-mono text-[11px] text-slate-500">Live ticks, fixed grid</span>
                </header>
                <div className="ag-theme-quartz-dark overflow-hidden rounded-md border border-slate-800/60" style={gridThemeStyles}>
                  <AgGridReact<MarketRow>
                    rowData={marketRowData}
                    columnDefs={marketColumnDefs}
                    defaultColDef={defaultMarketColDef}
                    headerHeight={38}
                    rowHeight={64}
                    animateRows={false}
                    suppressCellFocus={true}
                    suppressRowClickSelection={true}
                    enableCellTextSelection={true}
                    domLayout="normal"
                  />
                </div>
              </section>

              <section className="grid grid-cols-[minmax(0,2fr)_minmax(0,1fr)] gap-4">
                <div className="rounded-lg border border-slate-800 bg-[#0d1320] p-4">
                  <header className="mb-3 flex items-center justify-between">
                    <h3 className="text-xs uppercase tracking-[0.2em] text-slate-400">
                      Micro Spread Trend
                    </h3>
                    <span className="font-mono text-xs text-slate-400">{premiumTrend.at(-1)?.value.toFixed(1)} KRW/g</span>
                  </header>
                  <div className="h-28 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={premiumTrend} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="premiumGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8} />
                            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <XAxis hide dataKey="label" />
                        <YAxis hide domain={["dataMin-8", "dataMax+8"]} />
                        <Tooltip
                          cursor={false}
                          formatter={(value: number) => [`${value.toFixed(1)} KRW/g`, "Premium"]}
                          contentStyle={{
                            backgroundColor: "#111827",
                            borderRadius: 6,
                            border: "1px solid #1f2937",
                            padding: 8,
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="value"
                          stroke="#f59e0b"
                          strokeWidth={1.5}
                          fillOpacity={1}
                          fill="url(#premiumGradient)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="rounded-lg border border-slate-800 bg-[#0d1320] p-4">
                  <header className="mb-3 flex items-center justify-between">
                    <h3 className="text-xs uppercase tracking-[0.2em] text-slate-400">
                      Premium Snapshot
                    </h3>
                    <span className="font-mono text-xs text-slate-400">{premiumText}</span>
                  </header>
                  <div className="flex flex-col gap-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">KRX vs Fair</span>
                      <span className="font-mono text-emerald-300">+{integerFormatter.format(fairValue.premiumKrw)} KRW/g</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Vs Global Basis</span>
                      <span className="font-mono text-amber-300">+{fairValue.premiumBps} bp</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Session Range</span>
                      <span className="font-mono text-slate-200">{signedInteger(-12)} / {signedInteger(34)} KRW</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Quote Spread</span>
                      <span className="font-mono text-slate-200">40 KRW</span>
                    </div>
                  </div>
                </div>
              </section>

              <section className="rounded-lg border border-slate-800 bg-[#0d1320] p-4">
                <header className="mb-3 flex items-center justify-between">
                  <h3 className="text-xs uppercase tracking-[0.2em] text-slate-400">PnL Decomposition</h3>
                  <span className="font-mono text-xs text-slate-400">Total {formatSignedCompactKrw(pnlTotal)}</span>
                </header>
                <div className="grid gap-4 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
                  <div className="h-48 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={pnlSegments}
                        layout="vertical"
                        margin={{ top: 4, right: 12, left: 0, bottom: 4 }}
                      >
                        <XAxis
                          type="number"
                          stroke="#94a3b8"
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(value) => compactFormatter.format(value)}
                        />
                        <YAxis
                          type="category"
                          dataKey="name"
                          width={130}
                          tickLine={false}
                          axisLine={false}
                          tick={{ fill: "#94a3b8", fontSize: 11 }}
                        />
                        <Tooltip
                          cursor={{ fill: "#111827" }}
                          formatter={(value: number, name: string) => [formatSignedCompactKrw(value), name]}
                          contentStyle={{
                            backgroundColor: "#0f172a",
                            borderRadius: 6,
                            border: "1px solid #1f2937",
                            padding: 10,
                          }}
                        />
                        <ReferenceLine x={0} stroke="#475569" strokeDasharray="3 3" />
                        <Bar dataKey="value" radius={[4, 4, 4, 4]}>
                          {pnlSegments.map((segment) => (
                            <Cell
                              key={segment.name}
                              fill={segment.value >= 0 ? pnlAccentColors[segment.accent] : "#f87171"}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex flex-col justify-between gap-3 font-mono text-[12px] text-slate-200">
                    <div className="rounded-md border border-slate-800 bg-[#121a2c] px-3 py-2">
                      <div className="text-[10px] uppercase tracking-[0.16em] text-slate-500">Today</div>
                      <div className="flex items-baseline justify-between">
                        <span className="text-slate-400">Realized</span>
                        <span className="text-emerald-300">{formatSignedCompactKrw(pnlSegments[0].value)}</span>
                      </div>
                      <div className="flex items-baseline justify-between">
                        <span className="text-slate-400">Unrealized</span>
                        <span className="text-emerald-300">{formatSignedCompactKrw(pnlSegments[1].value)}</span>
                      </div>
                      <div className="flex items-baseline justify-between">
                        <span className="text-slate-400">Carry</span>
                        <span className="text-amber-300">{formatSignedCompactKrw(pnlSegments[2].value)}</span>
                      </div>
                      <div className="flex items-baseline justify-between">
                        <span className="text-slate-400">Slippage</span>
                        <span className="text-rose-400">{formatSignedCompactKrw(pnlSegments[3].value)}</span>
                      </div>
                      <div className="flex items-baseline justify-between">
                        <span className="text-slate-400">Fees</span>
                        <span className="text-rose-400">{formatSignedCompactKrw(pnlSegments[4].value)}</span>
                      </div>
                    </div>
                    <div className="rounded-md border border-slate-800 bg-[#121a2c] px-3 py-2">
                      <div className="text-[10px] uppercase tracking-[0.16em] text-slate-500">Actionables</div>
                      <div className="mt-1 flex flex-col gap-1 text-[11px]">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Headroom vs limit</span>
                          <span className="text-slate-200">62%</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Hedge cost / oz</span>
                          <span className="text-rose-300">{decimalFormatter(1).format(0.6)} KRW</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Carry pick-up</span>
                          <span className="text-amber-300">{decimalFormatter(1).format(0.9)} bp</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <section className="rounded-lg border border-slate-800 bg-[#0d1320] p-4">
                <Collapsible open={strategyOpen} onOpenChange={setStrategyOpen}>
                  <div className="flex items-center justify-between">
                    <CollapsibleTrigger className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-slate-400">
                      <ChevronDown
                        className={cn(
                          "h-4 w-4 transition-transform",
                          strategyOpen ? "rotate-180" : "rotate-0",
                        )}
                      />
                      Strategy / Fair Value
                    </CollapsibleTrigger>
                    <div className="flex items-center gap-2">
                      {(["1kg", "100g"] as const).map((key) => (
                        <Button
                          key={key}
                          type="button"
                          size="sm"
                          variant={productFocus === key ? "default" : "outline"}
                          className={cn(
                            "h-7 rounded-full px-3 text-xs",
                            productFocus === key
                              ? "bg-emerald-500 text-black hover:bg-emerald-400"
                              : "border-slate-700 bg-transparent text-slate-200 hover:border-slate-500",
                          )}
                          onClick={() => setProductFocus(key)}
                        >
                          {key}
                        </Button>
                      ))}
                    </div>
                  </div>
                  <CollapsibleContent>
                    <div className="mt-4 grid gap-4 text-sm">
                      <div className="grid grid-cols-5 gap-3 font-mono text-sm">
                        <div className="rounded-md border border-slate-800 bg-[#121a2c] p-3">
                          <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">COMEX USD</p>
                          <p className="text-lg text-slate-100">{decimalFormatter(1).format(fairValue.comex)}</p>
                        </div>
                        <div className="rounded-md border border-slate-800 bg-[#121a2c] p-3">
                          <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">FX USD/KRW</p>
                          <p className="text-lg text-slate-100">{decimalFormatter(2).format(fairValue.fx)}</p>
                        </div>
                        <div className="rounded-md border border-slate-800 bg-[#121a2c] p-3">
                          <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Funding</p>
                          <p className="text-lg text-rose-300">{signedInteger(fairValue.funding, 1)} bp</p>
                        </div>
                        <div className="rounded-md border border-slate-800 bg-[#121a2c] p-3">
                          <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Carry/Storage</p>
                          <p className="text-lg text-emerald-300">{signedInteger(fairValue.carry, 1)} bp</p>
                        </div>
                        <div className="rounded-md border border-slate-800 bg-[#121a2c] p-3">
                          <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Fair Value</p>
                          <p className="text-lg text-slate-100">{integerFormatter.format(fairValue.fairValue)} KRW/g</p>
                        </div>
                      </div>
                      <div>
                        <div className="mb-2 flex items-center justify-between text-xs text-slate-400">
                          <span>Premium Decomposition</span>
                          <span>Last funding update 14:28:06</span>
                        </div>
                        <div className="relative h-10 overflow-hidden rounded-md border border-slate-800 bg-[#121a2c]">
                          <div
                            className="absolute inset-y-0 left-0 flex items-center justify-center bg-emerald-500/60 font-mono text-xs text-slate-900"
                            style={{ width: `${fairValue.premiumBps * 1.5}%` }}
                          >
                            Carry +{fairValue.carry} bp
                          </div>
                          <div
                            className="absolute inset-y-0 flex items-center justify-center bg-amber-500/70 font-mono text-xs text-black"
                            style={{
                              width: `${Math.max(10, fairValue.premiumBps + 40)}%`,
                              left: "30%",
                            }}
                          >
                            Funding {signedInteger(fairValue.funding, 1)} bp
                          </div>
                          <div className="absolute inset-y-0 right-0 flex w-32 items-center justify-center bg-emerald-300/60 font-mono text-xs text-black">
                            Premium {fairValue.premiumBps} bp
                          </div>
                        </div>
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </section>

              <section className="grid grid-cols-[minmax(0,2fr)_minmax(0,1fr)] gap-4">
                <div className="rounded-lg border border-slate-800 bg-[#0d1320] p-4">
                  <header className="mb-3 flex items-center justify-between">
                    <h3 className="text-xs uppercase tracking-[0.2em] text-slate-400">
                      Hedge Tracker
                    </h3>
                    <span className="font-mono text-[11px] text-slate-500">Latency median 28 ms</span>
                  </header>
                  <div className="overflow-hidden">
                    <table className="w-full table-fixed border-collapse text-sm">
                      <thead className="border-b border-slate-800 text-[11px] uppercase tracking-[0.14em] text-slate-500">
                        <tr>
                          <th className="py-2 text-left">Time</th>
                          <th className="text-left">Instrument</th>
                          <th className="text-left">Action</th>
                          <th className="text-right">Qty</th>
                          <th className="text-right">Price</th>
                          <th className="text-right">Latency</th>
                          <th className="text-right">ΔPnL</th>
                        </tr>
                      </thead>
                      <tbody>
                        {hedgeLog.map((event) => (
                          <tr key={`${event.time}-${event.instrument}`} className="border-b border-slate-900/60 last:border-none">
                            <td className="py-2 text-left font-mono text-slate-300">{event.time}</td>
                            <td className="text-left font-mono text-slate-200">{event.instrument}</td>
                            <td className="text-left text-slate-200">{event.action}</td>
                            <td className="text-right font-mono text-slate-200">{event.qty}</td>
                            <td className="text-right font-mono text-slate-200">{event.price}</td>
                            <td className="text-right font-mono text-slate-200">{event.latency}</td>
                            <td className="text-right font-mono text-emerald-300">{event.pnl}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div className="rounded-lg border border-slate-800 bg-[#0d1320] p-4">
                  <header className="mb-3 flex items-center justify-between">
                    <h3 className="text-xs uppercase tracking-[0.2em] text-slate-400">Latency Histogram</h3>
                    <span className="font-mono text-[11px] text-slate-500">Window 5 min</span>
                  </header>
                  <div className="h-32 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={latencyHistogram}>
                        <XAxis dataKey="bucket" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                        <YAxis hide domain={[0, "dataMax+2"]} />
                        <Tooltip
                          cursor={{ fill: "#1f2937" }}
                          formatter={(value: number) => [`${value} fills`, "Count"]}
                          contentStyle={{
                            backgroundColor: "#111827",
                            borderRadius: 6,
                            border: "1px solid #1f2937",
                            padding: 8,
                          }}
                        />
                        <Bar dataKey="count" radius={[3, 3, 0, 0]} fill="#38bdf8" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </section>
            </div>
          </section>
        </div>

        <footer className="mt-2 flex h-10 items-center justify-between rounded-md border border-slate-800 bg-[#0b111b] px-4 text-[13px] text-slate-300">
          <div className="flex items-center gap-3 font-mono text-xs text-slate-400">
            Feeds: <span className="text-emerald-300">KRX Live</span> • COMEX Live • XAU Live
          </div>
          <div className="font-mono text-xs text-amber-300">Hedge Mismatch 2.8%</div>
          <div className="flex items-center gap-3 font-mono text-xs text-slate-400">
            Latency 28 ms • Clock 14:35:12 • CPU 22%
          </div>
        </footer>
      </div>

      {drawerOpen ? (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setDrawerOpen(false)}
            aria-hidden="true"
          />
          <aside className="fixed inset-y-0 right-0 z-50 w-[32vw] max-w-[500px] border-l border-slate-800 bg-[#0f172a] shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Quote Control</p>
                <h2 className="font-mono text-xl text-slate-100">KRX Gold</h2>
              </div>
              <Button
                type="button"
                variant="ghost"
                className="text-slate-400 hover:text-slate-100"
                onClick={() => setDrawerOpen(false)}
              >
                <CloseIcon className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-col gap-6 px-5 py-5">
              <div className="grid grid-cols-2 gap-4">
                <label className="flex items-center justify-between rounded-md border border-slate-800 bg-[#101b33] px-3 py-3">
                  <span className="text-xs uppercase tracking-[0.18em] text-slate-400">Auto-Quote</span>
                  <Switch checked={autoQuote} onCheckedChange={setAutoQuote} />
                </label>
                <label className="flex items-center justify-between rounded-md border border-slate-800 bg-[#101b33] px-3 py-3">
                  <span className="text-xs uppercase tracking-[0.18em] text-slate-400">Auto-Hedge</span>
                  <Switch checked={autoHedge} onCheckedChange={setAutoHedge} />
                </label>
              </div>

              <div>
                <h3 className="mb-3 text-xs uppercase tracking-[0.2em] text-slate-500">Parameters</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <label className="flex flex-col gap-1">
                    <span className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
                      Offset from Best (bp)
                    </span>
                    <Input defaultValue="4.5" className="font-mono bg-[#0b1424] text-slate-100" />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
                      Target Spread (KRW)
                    </span>
                    <Input defaultValue="42" className="font-mono bg-[#0b1424] text-slate-100" />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
                      Quote Size (lots)
                    </span>
                    <Input defaultValue="2" className="font-mono bg-[#0b1424] text-slate-100" />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
                      Hedge Ratio
                    </span>
                    <Input defaultValue="0.92" className="font-mono bg-[#0b1424] text-slate-100" />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
                      Refresh Interval (sec)
                    </span>
                    <Input defaultValue="0.8" className="font-mono bg-[#0b1424] text-slate-100" />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
                      Staleness Timeout (ms)
                    </span>
                    <Input defaultValue="450" className="font-mono bg-[#0b1424] text-slate-100" />
                  </label>
                </div>
              </div>

              <div>
                <h3 className="mb-3 text-xs uppercase tracking-[0.2em] text-slate-500">
                  Current Quote State
                </h3>
                <div className="overflow-hidden rounded-md border border-slate-800">
                  <table className="w-full table-fixed border-collapse text-sm">
                    <thead className="bg-[#101b33] text-[11px] uppercase tracking-[0.14em] text-slate-400">
                      <tr>
                        <th className="py-2 text-left">Instr</th>
                        <th className="text-left">Side</th>
                        <th className="text-right">Price</th>
                        <th className="text-right">Size</th>
                        <th className="text-right">State</th>
                      </tr>
                    </thead>
                    <tbody>
                      {quoteStateRows.map((row) => (
                        <tr key={`${row.instrument}-${row.side}`} className="border-b border-slate-900/60 last:border-none">
                          <td className="py-2 text-left font-mono text-slate-200">{row.instrument}</td>
                          <td className="text-left font-mono text-slate-200">{row.side}</td>
                          <td className="text-right font-mono text-slate-200">{row.price}</td>
                          <td className="text-right font-mono text-slate-200">{row.size}</td>
                          <td
                            className={cn(
                              "text-right font-mono",
                              row.state === "Active"
                                ? "text-emerald-300"
                                : row.state === "Paused"
                                  ? "text-amber-300"
                                  : "text-slate-400",
                            )}
                          >
                            {row.state}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <h3 className="mb-3 text-xs uppercase tracking-[0.2em] text-slate-500">Quick Nudges</h3>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="border-slate-700 bg-[#101b33] text-slate-100 hover:border-slate-500"
                    onClick={() => handleNudge("bid+")}
                  >
                    Bid ↑
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="border-slate-700 bg-[#101b33] text-slate-100 hover:border-slate-500"
                    onClick={() => handleNudge("bid-")}
                  >
                    Bid ↓
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="border-slate-700 bg-[#101b33] text-slate-100 hover:border-slate-500"
                    onClick={() => handleNudge("ask+")}
                  >
                    Ask ↑
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="border-slate-700 bg-[#101b33] text-slate-100 hover:border-slate-500"
                    onClick={() => handleNudge("ask-")}
                  >
                    Ask ↓
                  </Button>
                </div>
                {nudgeMessage ? (
                  <div className="mt-3 rounded-md border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-200">
                    {nudgeMessage}
                  </div>
                ) : null}
              </div>

              <div>
                <h3 className="mb-2 text-xs uppercase tracking-[0.2em] text-slate-500">Risk Snapshot</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-md border border-slate-800 bg-[#101b33] p-3">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Max Delta</p>
                    <p className="font-mono text-lg text-slate-100">5.0 kg</p>
                  </div>
                  <div className="rounded-md border border-slate-800 bg-[#101b33] p-3">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Max Notional</p>
                    <p className="font-mono text-lg text-slate-100">₩92B</p>
                  </div>
                  <div className="rounded-md border border-slate-800 bg-[#101b33] p-3">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Funding Spread</p>
                    <p className="font-mono text-lg text-amber-300">−11.8 bp</p>
                  </div>
                  <div className="rounded-md border border-slate-800 bg-[#101b33] p-3">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Avg Latency</p>
                    <p className="font-mono text-lg text-slate-100">28 ms</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-auto border-t border-slate-800 bg-[#101b33]/60 px-5 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    className="bg-emerald-500 text-black hover:bg-emerald-400"
                    onClick={() => setDrawerOpen(false)}
                  >
                    Apply
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="border-slate-700 bg-[#0d1422] text-slate-100 hover:border-slate-500"
                  >
                    Reset
                  </Button>
                </div>
                <span className="font-mono text-xs text-slate-400">Autosaved 14:34:58</span>
              </div>
            </div>
          </aside>
        </>
      ) : null}
    </div>
  );
}
