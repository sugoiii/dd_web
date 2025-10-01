import { useMemo, useState } from "react";
import {
  Activity,
  BadgeCheck,
  Bell,
  ChevronDown,
  ChevronRight,
  HelpCircle,
  Moon,
  MoreHorizontal,
  Server,
  ShieldCheck,
  Signal,
  Sun,
  Zap,
} from "lucide-react";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle } from "~/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Avatar, AvatarFallback } from "~/components/ui/avatar";
import { ScrollArea } from "~/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "~/components/ui/collapsible";
import { Switch } from "~/components/ui/switch";
import { cn } from "~/lib/utils";

import type { LucideIcon } from "lucide-react";

type LiveStatus = {
  id: string;
  label: string;
  detail: string;
  state: "healthy" | "warning" | "error";
  icon: LucideIcon;
};

type OverviewLeg = {
  side: "Buy" | "Sell";
  size: string;
  venue: string;
  comment?: string;
};

type OverviewEstimate = {
  label: string;
  value: string;
};

type MicrostructureSnapshot = {
  level: string;
  bid: string;
  ask: string;
};

type MicrostructureTick = {
  time: string;
  side: "Buy" | "Sell";
  price: string;
  size: string;
};

type ContextPayload = {
  title: string;
  subtitle: string;
  overview: {
    legs: OverviewLeg[];
    estimates: OverviewEstimate[];
    note: string;
  };
  microstructure: {
    book: MicrostructureSnapshot[];
    ticks: MicrostructureTick[];
  };
  history: { time: string; description: string }[];
  primaryAction: string;
};

type BasisMatrixRow = {
  id: string;
  pair: string;
  venue: string;
  basisBps: number;
  thresholdBps: number;
  edge: number;
  fillLikelihood: "High" | "Medium" | "Low";
  action: "Lean" | "Rest" | "Passive";
  sparkline: number[];
  context: ContextPayload;
};

type PositionLeg = {
  id: string;
  label: string;
  side: "Long" | "Short";
  qty: number;
  avgEntry: number;
  liveBasis: number;
  upl: number;
  rpl: number;
};

type PositionLedgerRow = {
  pair: string;
  netQty: number;
  avgEntry: number;
  liveBasis: number;
  upl: number;
  rpl: number;
  fees: number;
  flags?: string;
  legs: PositionLeg[];
  context: ContextPayload;
};

type OrderTicket = {
  id: string;
  pair: string;
  venue: string;
  side: "Buy" | "Sell";
  size: number;
  price: number;
  status: "Working" | "Filled" | "Cancelled";
  type: string;
  time: string;
  context: ContextPayload;
};

type EventLog = {
  id: string;
  severity: "info" | "warn" | "error";
  label: string;
  message: string;
  timestamp: string;
  related?: { type: "basis" | "position" | "order"; id: string };
};

type DetailedContext = ContextPayload & { type: "basis" | "position" | "order" };

const LIVE_STATUSES: LiveStatus[] = [
  {
    id: "feed",
    label: "Data Feed",
    detail: "12ms",
    state: "healthy",
    icon: Signal,
  },
  {
    id: "gateway",
    label: "Order Gateway",
    detail: "Synced",
    state: "healthy",
    icon: Server,
  },
  {
    id: "risk",
    label: "Risk",
    detail: "Rails on",
    state: "healthy",
    icon: ShieldCheck,
  },
  {
    id: "latency",
    label: "Latency",
    detail: "220µs p95",
    state: "warning",
    icon: Activity,
  },
];

const RISK_RAILS = [
  { label: "Net DV01", value: "$1.6M", limit: "$2.5M" },
  { label: "Cross-Venue", value: "$48M", limit: "$60M" },
  { label: "Intraday Loss", value: "-$1.1M", limit: "-$2.0M" },
];

const BASIS_MATRIX_ROWS: BasisMatrixRow[] = [
  {
    id: "eurusd-cboe",
    pair: "EUR/USD",
    venue: "Cboe FX",
    basisBps: 14.2,
    thresholdBps: 12,
    edge: 18500,
    fillLikelihood: "High",
    action: "Lean",
    sparkline: [4, 6, 5, 7, 9, 8, 11, 12],
    context: {
      title: "EUR/USD • Cboe FX",
      subtitle: "Lean 65% auto-slice against 12 bps rail.",
      overview: {
        legs: [
          { side: "Buy", size: "€45M", venue: "Cboe FX", comment: "Aggressive 45% auto-slice" },
          { side: "Sell", size: "$48M", venue: "CME Sep Future", comment: "Delta hedge via futures" },
          { side: "Sell", size: "€38M", venue: "Spot Ladder", comment: "Passive residual sweep" },
        ],
        estimates: [
          { label: "Est. Fees", value: "$5.3K" },
          { label: "Slippage", value: "0.8 bps" },
          { label: "Borrow / Carry", value: "-$1.2K" },
        ],
        note: "Maintain FX hedge with 50% dynamic roll and respect EU banking holiday calendar.",
      },
      microstructure: {
        book: [
          { level: "BBO", bid: "1.08342 / 12M", ask: "1.08347 / 10M" },
          { level: "Level 2", bid: "1.08338 / 20M", ask: "1.08351 / 18M" },
          { level: "Level 3", bid: "1.08333 / 25M", ask: "1.08355 / 22M" },
        ],
        ticks: [
          { time: "09:42:14", side: "Buy", price: "1.08345", size: "6M" },
          { time: "09:41:52", side: "Sell", price: "1.08339", size: "5M" },
          { time: "09:41:21", side: "Buy", price: "1.08334", size: "8M" },
        ],
      },
      history: [
        { time: "09:39", description: "Threshold tightened to 12 bps" },
        { time: "09:34", description: "Previous fill 18M at 1.08328" },
      ],
      primaryAction: "Send Auto-Slice",
    },
  },
  {
    id: "usdjpy-ldn",
    pair: "USD/JPY",
    venue: "LD4 Aggregator",
    basisBps: -11.6,
    thresholdBps: 10,
    edge: 9200,
    fillLikelihood: "Medium",
    action: "Passive",
    sparkline: [2, 3, 5, 4, 6, 5, 4, 3],
    context: {
      title: "USD/JPY • LD4 Aggregator",
      subtitle: "Passive rest quoting with tightening rails.",
      overview: {
        legs: [
          { side: "Sell", size: "¥3.2B", venue: "LD4", comment: "Resting slices across 5 venues" },
          { side: "Buy", size: "$28M", venue: "CME Sep Future", comment: "Hedge leg offset" },
        ],
        estimates: [
          { label: "Est. Fees", value: "$3.8K" },
          { label: "Slippage", value: "0.4 bps" },
          { label: "Borrow / Carry", value: "+$0.6K" },
        ],
        note: "FX hedge stays enabled with Asia session roll schedule respected.",
      },
      microstructure: {
        book: [
          { level: "BBO", bid: "160.28 / 600M", ask: "160.29 / 450M" },
          { level: "Level 2", bid: "160.27 / 480M", ask: "160.30 / 500M" },
        ],
        ticks: [
          { time: "09:41:50", side: "Sell", price: "160.285", size: "410M" },
          { time: "09:40:48", side: "Buy", price: "160.302", size: "320M" },
        ],
      },
      history: [
        { time: "09:37", description: "Latency alert acknowledged" },
        { time: "09:31", description: "Carry note updated: BOJ operation" },
      ],
      primaryAction: "Send Resting Quote",
    },
  },
  {
    id: "gbpusd-ny",
    pair: "GBP/USD",
    venue: "NY Hub",
    basisBps: 8.4,
    thresholdBps: 9,
    edge: 6400,
    fillLikelihood: "High",
    action: "Lean",
    sparkline: [3, 4, 6, 7, 6, 8, 9, 10],
    context: {
      title: "GBP/USD • NY Hub",
      subtitle: "Lean into 85% fill likelihood vs. roll calendar.",
      overview: {
        legs: [
          { side: "Buy", size: "£32M", venue: "NY Hub", comment: "Primary RFQ" },
          { side: "Sell", size: "$40M", venue: "OTC Swap", comment: "Carry-friendly hedge" },
        ],
        estimates: [
          { label: "Est. Fees", value: "$4.1K" },
          { label: "Slippage", value: "0.6 bps" },
          { label: "Borrow / Carry", value: "-$0.9K" },
        ],
        note: "Calendar respect active for Bank Holiday Monday roll.",
      },
      microstructure: {
        book: [
          { level: "BBO", bid: "1.2748 / 8M", ask: "1.2749 / 9M" },
          { level: "Level 2", bid: "1.2746 / 14M", ask: "1.2751 / 12M" },
        ],
        ticks: [
          { time: "09:42:01", side: "Buy", price: "1.27492", size: "4M" },
          { time: "09:41:29", side: "Sell", price: "1.27478", size: "5M" },
        ],
      },
      history: [
        { time: "09:40", description: "Hedge leg slippage trimmed" },
        { time: "09:32", description: "Previous order: 25M filled" },
      ],
      primaryAction: "Send Lean Order",
    },
  },
  {
    id: "eursek-stockholm",
    pair: "EUR/SEK",
    venue: "Stockholm Dark",
    basisBps: -6.7,
    thresholdBps: 8,
    edge: 2800,
    fillLikelihood: "Low",
    action: "Rest",
    sparkline: [5, 4, 3, 4, 5, 5, 4, 4],
    context: {
      title: "EUR/SEK • Stockholm Dark",
      subtitle: "Rest quietly until borrow normalises.",
      overview: {
        legs: [
          { side: "Sell", size: "SEK 180M", venue: "Stockholm", comment: "Small clip presence" },
          { side: "Buy", size: "€14M", venue: "Forward Strip", comment: "Blend with carry" },
        ],
        estimates: [
          { label: "Est. Fees", value: "$1.6K" },
          { label: "Slippage", value: "0.2 bps" },
          { label: "Borrow / Carry", value: "-$0.3K" },
        ],
        note: "Borrow remains thin; keep calendar respect locked in for SEK payroll date.",
      },
      microstructure: {
        book: [
          { level: "BBO", bid: "11.382 / 35M", ask: "11.385 / 40M" },
          { level: "Level 2", bid: "11.379 / 28M", ask: "11.388 / 32M" },
        ],
        ticks: [
          { time: "09:40:37", side: "Sell", price: "11.3831", size: "12M" },
          { time: "09:38:05", side: "Buy", price: "11.3845", size: "9M" },
        ],
      },
      history: [
        { time: "09:36", description: "Borrow desk flagged limited supply" },
        { time: "09:28", description: "Parameter change: rest-only" },
      ],
      primaryAction: "Send Passive Rest",
    },
  },
];

const POSITION_LEDGER_ROWS: PositionLedgerRow[] = [
  {
    pair: "EUR/USD",
    netQty: 22.4,
    avgEntry: 9.8,
    liveBasis: 12.4,
    upl: 58200,
    rpl: 12400,
    fees: 3800,
    flags: "Hedge roll in 2h",
    legs: [
      {
        id: "eurusd-spot",
        label: "Spot Aggregator",
        side: "Long",
        qty: 14.2,
        avgEntry: 8.9,
        liveBasis: 12.4,
        upl: 32200,
        rpl: 4800,
      },
      {
        id: "eurusd-fut",
        label: "Sep Future",
        side: "Short",
        qty: 11.8,
        avgEntry: 10.2,
        liveBasis: 13.1,
        upl: 15400,
        rpl: 5200,
      },
    ],
    context: BASIS_MATRIX_ROWS[0].context,
  },
  {
    pair: "USD/JPY",
    netQty: -18.6,
    avgEntry: -7.5,
    liveBasis: -9.8,
    upl: -18400,
    rpl: 8600,
    fees: 2900,
    flags: "Latency watch",
    legs: [
      {
        id: "usdjpy-ld4",
        label: "LD4 RFQ",
        side: "Short",
        qty: 9.4,
        avgEntry: -6.8,
        liveBasis: -9.6,
        upl: -8200,
        rpl: 4200,
      },
      {
        id: "usdjpy-future",
        label: "CME Future",
        side: "Long",
        qty: 7.9,
        avgEntry: -8.4,
        liveBasis: -10.3,
        upl: -6200,
        rpl: 3200,
      },
    ],
    context: BASIS_MATRIX_ROWS[1].context,
  },
  {
    pair: "GBP/USD",
    netQty: 15.8,
    avgEntry: 6.2,
    liveBasis: 7.9,
    upl: 28600,
    rpl: 7600,
    fees: 2100,
    legs: [
      {
        id: "gbpusd-spot",
        label: "NY Hub",
        side: "Long",
        qty: 8.2,
        avgEntry: 5.4,
        liveBasis: 7.6,
        upl: 16200,
        rpl: 3600,
      },
      {
        id: "gbpusd-swap",
        label: "Swap Strip",
        side: "Short",
        qty: 7.1,
        avgEntry: 6.9,
        liveBasis: 8.2,
        upl: 9400,
        rpl: 2800,
      },
    ],
    context: BASIS_MATRIX_ROWS[2].context,
  },
];

const ORDER_TICKETS: OrderTicket[] = [
  {
    id: "ORD-1452",
    pair: "EUR/USD",
    venue: "Cboe FX",
    side: "Buy",
    size: 7.5,
    price: 1.08345,
    status: "Working",
    type: "Auto-Slice",
    time: "09:42:33",
    context: BASIS_MATRIX_ROWS[0].context,
  },
  {
    id: "ORD-1448",
    pair: "USD/JPY",
    venue: "LD4",
    side: "Sell",
    size: 12.1,
    price: 160.285,
    status: "Working",
    type: "Resting",
    time: "09:40:54",
    context: BASIS_MATRIX_ROWS[1].context,
  },
  {
    id: "ORD-1439",
    pair: "GBP/USD",
    venue: "NY Hub",
    side: "Buy",
    size: 9.4,
    price: 1.27492,
    status: "Filled",
    type: "Lean",
    time: "09:38:12",
    context: BASIS_MATRIX_ROWS[2].context,
  },
  {
    id: "ORD-1431",
    pair: "EUR/SEK",
    venue: "Stockholm",
    side: "Sell",
    size: 6.8,
    price: 11.3831,
    status: "Cancelled",
    type: "Passive",
    time: "09:34:47",
    context: BASIS_MATRIX_ROWS[3].context,
  },
];

const EVENT_LOG: EventLog[] = [
  {
    id: "event-1",
    severity: "warn",
    label: "Latency",
    message: "p95 creeping to 220µs on LD4 aggregator.",
    timestamp: "09:43:18",
    related: { type: "basis", id: "usdjpy-ldn" },
  },
  {
    id: "event-2",
    severity: "info",
    label: "Borrow",
    message: "Borrow desk confirmed SEK supply limited through noon.",
    timestamp: "09:41:02",
    related: { type: "basis", id: "eursek-stockholm" },
  },
  {
    id: "event-3",
    severity: "error",
    label: "Order Reject",
    message: "LDN venue rejected replace request on ticket ORD-1431.",
    timestamp: "09:38:56",
    related: { type: "order", id: "ORD-1431" },
  },
];

function formatBps(value: number) {
  const fixed = value.toFixed(1);
  const prefix = value >= 0 ? "+" : "";
  return `${prefix}${fixed} bps`;
}

function formatEdge(value: number) {
  const absolute = Math.abs(value);
  const suffix = absolute >= 1000 ? `${(absolute / 1000).toFixed(1)}K` : absolute.toFixed(0);
  const prefix = value >= 0 ? "+" : "-";
  return `${prefix}$${suffix}`;
}

function formatQuantity(value: number) {
  const prefix = value >= 0 ? "" : "-";
  return `${prefix}${Math.abs(value).toFixed(1)}M`;
}

function formatMoney(value: number) {
  const formatter = new Intl.NumberFormat(undefined, {
    maximumFractionDigits: 0,
  });
  const prefix = value >= 0 ? "+" : "-";
  return `${prefix}$${formatter.format(Math.abs(value))}`;
}

function getBasisHeatClass(basis: number, threshold: number) {
  const ratio = Math.abs(basis) / Math.max(threshold, 0.1);
  if (ratio >= 1.15) {
    return basis >= 0
      ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-200"
      : "bg-rose-500/20 text-rose-600 dark:text-rose-200";
  }
  if (ratio >= 0.85) {
    return "bg-amber-500/20 text-amber-800 dark:text-amber-200";
  }
  return "bg-muted/40 text-foreground";
}

function statusPillClasses(state: LiveStatus["state"]) {
  switch (state) {
    case "healthy":
      return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-200";
    case "warning":
      return "bg-amber-500/20 text-amber-800 dark:text-amber-200";
    case "error":
      return "bg-rose-500/20 text-rose-600 dark:text-rose-200";
    default:
      return "bg-muted/40 text-muted-foreground";
  }
}

function severityDotClasses(severity: EventLog["severity"]) {
  switch (severity) {
    case "error":
      return "bg-rose-500";
    case "warn":
      return "bg-amber-500";
    default:
      return "bg-sky-500";
  }
}

function Sparkline({ values }: { values: number[] }) {
  if (!values.length) return null;

  const width = 64;
  const height = 24;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;

  const points = values
    .map((value, index) => {
      if (values.length === 1) {
        return `${width / 2},${height / 2}`;
      }
      const x = (index / (values.length - 1)) * width;
      const y = height - ((value - min) / range) * height;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="h-6 w-16 text-muted-foreground/70"
      role="presentation"
      aria-hidden
    >
      <polyline
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
}

export default function RealtimeStrategyManagementPage() {
  const [selectedBook, setSelectedBook] = useState("global-basis");
  const [environment, setEnvironment] = useState<"uat" | "prod">("uat");
  const [mode, setMode] = useState("auto");
  const [threshold, setThreshold] = useState("18");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedContext, setSelectedContext] = useState<DetailedContext | null>(null);
  const [contextTab, setContextTab] = useState("overview");
  const [expandedPairs, setExpandedPairs] = useState<Set<string>>(new Set());
  const [ordersView, setOrdersView] = useState("working");
  const [eventStripOpen, setEventStripOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [hedgeEnabled, setHedgeEnabled] = useState(true);
  const [rollPolicy, setRollPolicy] = useState(true);
  const [calendarRespect, setCalendarRespect] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);

  const filteredOrders = useMemo(() => {
    switch (ordersView) {
      case "working":
        return ORDER_TICKETS.filter((order) => order.status === "Working");
      case "fills":
        return ORDER_TICKETS.filter((order) => order.status === "Filled");
      default:
        return ORDER_TICKETS;
    }
  }, [ordersView]);

  const ledgerTotals = useMemo(() => {
    return POSITION_LEDGER_ROWS.reduce(
      (acc, row) => {
        acc.net += row.netQty;
        acc.upl += row.upl;
        acc.rpl += row.rpl;
        acc.fees += row.fees;
        return acc;
      },
      { net: 0, upl: 0, rpl: 0, fees: 0 },
    );
  }, []);

  const toggleExpanded = (pair: string) => {
    setExpandedPairs((prev) => {
      const next = new Set(prev);
      if (next.has(pair)) {
        next.delete(pair);
      } else {
        next.add(pair);
      }
      return next;
    });
  };

  const openBasisPreview = (row: BasisMatrixRow) => {
    setSelectedContext({ ...row.context, type: "basis" });
    setContextTab("overview");
    setSheetOpen(true);
  };

  const openPositionPreview = (row: PositionLedgerRow) => {
    setSelectedContext({ ...row.context, type: "position" });
    setContextTab("overview");
    setSheetOpen(true);
  };

  const openOrderPreview = (ticket: OrderTicket) => {
    setSelectedContext({ ...ticket.context, type: "order" });
    setContextTab("overview");
    setSheetOpen(true);
  };

  const handleEventClick = (event: EventLog) => {
    if (!event.related) return;
    if (event.related.type === "basis") {
      const target = BASIS_MATRIX_ROWS.find((row) => row.id === event.related?.id);
      if (target) {
        openBasisPreview(target);
      }
      return;
    }
    if (event.related.type === "position") {
      const target = POSITION_LEDGER_ROWS.find((row) => row.pair === event.related?.id);
      if (target) {
        openPositionPreview(target);
      }
      return;
    }
    if (event.related.type === "order") {
      const target = ORDER_TICKETS.find((row) => row.id === event.related?.id);
      if (target) {
        openOrderPreview(target);
      }
    }
  };

  return (
    <div className="flex h-full flex-1 flex-col bg-background">
      <header className="border-b bg-background/95 px-4 py-4 shadow-sm sm:px-6">
        <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-4 xl:flex-row xl:items-center xl:gap-6">
          <div className="flex flex-wrap items-center gap-3 xl:min-w-[22rem]">
            <div className="min-w-[14rem]">
              <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                Realtime Strategy Control
              </h1>
              <p className="text-sm text-muted-foreground">
                Single-screen oversight of cross-venue basis orchestration.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Label
                htmlFor="strategy-book"
                className="text-[0.65rem] font-semibold uppercase tracking-wide text-muted-foreground"
              >
                Book
              </Label>
              <Select value={selectedBook} onValueChange={setSelectedBook}>
                <SelectTrigger id="strategy-book" className="h-8 w-40 text-sm">
                  <SelectValue placeholder="Select book" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="global-basis">Global Basis</SelectItem>
                  <SelectItem value="emea-basis">EMEA Basis</SelectItem>
                  <SelectItem value="apac-basis">APAC Basis</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Badge
              className={cn(
                "flex items-center gap-1 px-2.5 py-0.5 text-xs",
                environment === "prod"
                  ? "bg-emerald-500 text-emerald-50"
                  : "bg-muted text-foreground",
              )}
            >
              <BadgeCheck className="size-3" aria-hidden />
              {environment === "prod" ? "PROD" : "UAT"}
            </Badge>
          </div>

          <div className="flex flex-1 flex-wrap items-center gap-2 xl:justify-center">
            {LIVE_STATUSES.map((status) => {
              const Icon = status.icon;
              return (
                <span
                  key={status.id}
                  className={cn(
                    "flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium",
                    statusPillClasses(status.state),
                  )}
                >
                  <Icon className="size-3" aria-hidden />
                  {status.label}
                  <span className="text-muted-foreground/80">{status.detail}</span>
                </span>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9"
              onClick={() => setIsDarkMode((prev) => !prev)}
              aria-label="Toggle theme"
            >
              {isDarkMode ? <Sun className="size-4" aria-hidden /> : <Moon className="size-4" aria-hidden />}
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9"
              onClick={() => setEnvironment((prev) => (prev === "uat" ? "prod" : "uat"))}
              aria-label="Toggle environment"
            >
              <Zap className="size-4" aria-hidden />
            </Button>
            <Button variant="ghost" size="icon" className="h-9 w-9" aria-label="Notifications">
              <Bell className="size-4" aria-hidden />
            </Button>
            <Button variant="ghost" size="icon" className="h-9 w-9" aria-label="Help">
              <HelpCircle className="size-4" aria-hidden />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="h-9 w-9 rounded-full">
                  <Avatar className="h-7 w-7">
                    <AvatarFallback className="text-xs">AK</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>Alex Kim</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Switch Desk</DropdownMenuItem>
                <DropdownMenuItem>Preferences</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive">Sign out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <div className="flex flex-1 flex-col overflow-hidden bg-muted/10">
        <div className="mx-auto flex w-full max-w-[1200px] flex-1 flex-col gap-4 px-4 py-4 sm:px-6 sm:py-6">
          <div className="grid flex-1 gap-4 min-[1280px]:grid-cols-2 min-[1280px]:grid-rows-[repeat(2,minmax(0,1fr))]">
            <Card className="flex flex-col">
              <CardHeader className="pb-3">
                <CardTitle>Strategy Dock</CardTitle>
                <CardDescription>Quick controls for orchestration mode and rails.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col gap-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="mode" className="text-xs font-medium text-muted-foreground">
                      Mode
                    </Label>
                    <Select value={mode} onValueChange={setMode}>
                      <SelectTrigger id="mode" className="h-9">
                        <SelectValue placeholder="Select mode" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="auto">Auto-Arm</SelectItem>
                        <SelectItem value="supervised">Supervised</SelectItem>
                        <SelectItem value="manual">Manual</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="threshold" className="text-xs font-medium text-muted-foreground">
                      Threshold (bps)
                    </Label>
                    <Input
                      id="threshold"
                      type="number"
                      value={threshold}
                      onChange={(event) => setThreshold(event.target.value)}
                      className="h-9"
                    />
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  {RISK_RAILS.map((rail) => (
                    <div key={rail.label} className="rounded-md border border-dashed bg-muted/40 p-3">
                      <p className="text-xs font-medium text-muted-foreground">{rail.label}</p>
                      <p className="text-lg font-semibold tracking-tight">{rail.value}</p>
                      <p className="text-[0.7rem] text-muted-foreground">Limit {rail.limit}</p>
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Button className="flex-1 sm:flex-none">Arm</Button>
                  <Button variant="secondary" className="flex-1 sm:flex-none">
                    Pause
                  </Button>
                  <Button variant="outline" className="flex-1 sm:flex-none">
                    Flatten
                  </Button>
                </div>

                <Collapsible open={detailsOpen} onOpenChange={setDetailsOpen}>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" className="gap-2 px-0 text-sm">
                      <ChevronDown
                        className={cn(
                          "size-4 transition-transform",
                          detailsOpen ? "rotate-180" : "rotate-0",
                        )}
                        aria-hidden
                      />
                      Details
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-3 pt-2">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium">FX Hedge</p>
                        <p className="text-xs text-muted-foreground">Pair residuals into automated hedge.</p>
                      </div>
                      <Switch checked={hedgeEnabled} onCheckedChange={setHedgeEnabled} aria-label="Toggle FX hedge" />
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium">Roll Policy</p>
                        <p className="text-xs text-muted-foreground">Respect regional roll windows.</p>
                      </div>
                      <Switch checked={rollPolicy} onCheckedChange={setRollPolicy} aria-label="Toggle roll policy" />
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium">Calendar Respect</p>
                        <p className="text-xs text-muted-foreground">Pause around restricted sessions.</p>
                      </div>
                      <Switch
                        checked={calendarRespect}
                        onCheckedChange={setCalendarRespect}
                        aria-label="Toggle calendar respect"
                      />
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </CardContent>
            </Card>

            <Card className="flex flex-col overflow-hidden">
              <CardHeader className="pb-3">
                <CardTitle>Basis Matrix</CardTitle>
                <CardDescription>Decision-critical signals with contextual preview.</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 overflow-hidden">
                <div className="h-full overflow-auto pr-2">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Pair</TableHead>
                        <TableHead>Venue</TableHead>
                        <TableHead>Basis vs Rail</TableHead>
                        <TableHead className="text-right">Threshold</TableHead>
                        <TableHead className="text-right">Edge</TableHead>
                        <TableHead>Fill Likelihood</TableHead>
                        <TableHead>Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {BASIS_MATRIX_ROWS.map((row) => (
                        <TableRow
                          key={row.id}
                          className="cursor-pointer transition hover:bg-muted/40"
                          onClick={() => openBasisPreview(row)}
                        >
                          <TableCell className="font-medium">
                            <div className="flex items-center justify-between gap-3">
                              <span>{row.pair}</span>
                              <Sparkline values={row.sparkline} />
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground">{row.venue}</TableCell>
                          <TableCell>
                            <span
                              className={cn(
                                "inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm font-medium",
                                getBasisHeatClass(row.basisBps, row.thresholdBps),
                              )}
                            >
                              {formatBps(row.basisBps)}
                              <span className="text-xs text-muted-foreground">rail {row.thresholdBps.toFixed(0)} bps</span>
                            </span>
                          </TableCell>
                          <TableCell className="text-right text-muted-foreground">
                            {formatBps(row.thresholdBps)}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatEdge(row.edge)}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={row.fillLikelihood === "High" ? "secondary" : "outline"}
                              className="text-xs"
                            >
                              {row.fillLikelihood}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-between gap-2">
                              <Badge variant="outline" className="text-xs">
                                {row.action}
                              </Badge>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2 text-xs"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  openBasisPreview(row);
                                }}
                              >
                                Preview
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            <Card className="flex flex-col overflow-hidden">
              <CardHeader className="pb-3">
                <CardTitle>Position Ledger</CardTitle>
                <CardDescription>Aggregated view with drill-down to execution legs.</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 overflow-hidden">
                <div className="h-full overflow-auto pr-2">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Pair</TableHead>
                        <TableHead className="text-right">Net Qty</TableHead>
                        <TableHead className="text-right">Avg Entry</TableHead>
                        <TableHead className="text-right">Live Basis</TableHead>
                        <TableHead className="text-right">UPL</TableHead>
                        <TableHead className="text-right">RPL</TableHead>
                        <TableHead className="text-right">Fees</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {POSITION_LEDGER_ROWS.map((row) => {
                        const expanded = expandedPairs.has(row.pair);
                        return (
                          <>
                            <TableRow
                              key={row.pair}
                              className="cursor-pointer transition hover:bg-muted/40"
                              onClick={() => toggleExpanded(row.pair)}
                            >
                              <TableCell className="w-[16rem]">
                                <div className="flex items-start gap-2">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="mt-0.5 h-6 w-6"
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      toggleExpanded(row.pair);
                                    }}
                                    aria-label={expanded ? "Collapse legs" : "Expand legs"}
                                  >
                                    <ChevronDown
                                      className={cn(
                                        "size-4 transition-transform",
                                        expanded ? "rotate-180" : "rotate-0",
                                      )}
                                      aria-hidden
                                    />
                                  </Button>
                                  <div className="flex flex-col">
                                    <span className="font-medium">{row.pair}</span>
                                    {row.flags ? (
                                      <span className="text-xs text-muted-foreground">{row.flags}</span>
                                    ) : null}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="text-right font-medium">
                                {formatQuantity(row.netQty)}
                              </TableCell>
                              <TableCell className="text-right text-muted-foreground">
                                {formatBps(row.avgEntry)}
                              </TableCell>
                              <TableCell className="text-right text-muted-foreground">
                                {formatBps(row.liveBasis)}
                              </TableCell>
                              <TableCell className="text-right font-medium">
                                {formatMoney(row.upl)}
                              </TableCell>
                              <TableCell className="text-right text-muted-foreground">
                                {formatMoney(row.rpl)}
                              </TableCell>
                              <TableCell className="text-right text-muted-foreground">
                                {formatMoney(row.fees)}
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 px-2 text-xs"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    openPositionPreview(row);
                                  }}
                                >
                                  Preview
                                </Button>
                              </TableCell>
                            </TableRow>
                            {expanded
                              ? row.legs.map((leg) => (
                                  <TableRow key={leg.id} className="bg-muted/30 text-sm text-muted-foreground">
                                    <TableCell className="pl-12">
                                      <div className="flex items-center gap-2">
                                        <ChevronRight className="size-3" aria-hidden />
                                        <span className="font-medium text-foreground">{leg.label}</span>
                                        <Badge variant="outline" className="text-[0.65rem] uppercase">
                                          {leg.side}
                                        </Badge>
                                      </div>
                                    </TableCell>
                                    <TableCell className="text-right">{formatQuantity(leg.qty)}</TableCell>
                                    <TableCell className="text-right">{formatBps(leg.avgEntry)}</TableCell>
                                    <TableCell className="text-right">{formatBps(leg.liveBasis)}</TableCell>
                                    <TableCell className="text-right">{formatMoney(leg.upl)}</TableCell>
                                    <TableCell className="text-right">{formatMoney(leg.rpl)}</TableCell>
                                    <TableCell className="text-right" colSpan={2}>
                                      —
                                    </TableCell>
                                  </TableRow>
                                ))
                              : null}
                          </>
                        );
                      })}
                    </TableBody>
                    <tfoot>
                      <TableRow className="bg-muted/40 text-sm font-medium">
                        <TableCell>Total</TableCell>
                        <TableCell className="text-right">{formatQuantity(ledgerTotals.net)}</TableCell>
                        <TableCell colSpan={2}></TableCell>
                        <TableCell className="text-right">{formatMoney(ledgerTotals.upl)}</TableCell>
                        <TableCell className="text-right">{formatMoney(ledgerTotals.rpl)}</TableCell>
                        <TableCell className="text-right">{formatMoney(ledgerTotals.fees)}</TableCell>
                        <TableCell />
                      </TableRow>
                    </tfoot>
                  </Table>
                </div>
              </CardContent>
            </Card>

            <Card className="flex flex-col overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <CardTitle>Orders Blotter</CardTitle>
                    <CardDescription>One-line state with primary actions up front.</CardDescription>
                  </div>
                  <Tabs value={ordersView} onValueChange={setOrdersView} className="w-auto">
                    <TabsList>
                      <TabsTrigger value="working">Working</TabsTrigger>
                      <TabsTrigger value="fills">Fills</TabsTrigger>
                      <TabsTrigger value="all">All</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
              </CardHeader>
              <CardContent className="flex-1 overflow-hidden">
                <div className="h-full overflow-auto pr-2">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Ticket</TableHead>
                        <TableHead>Pair</TableHead>
                        <TableHead>Venue</TableHead>
                        <TableHead className="text-right">Side</TableHead>
                        <TableHead className="text-right">Size</TableHead>
                        <TableHead className="text-right">Price</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredOrders.map((order) => (
                        <TableRow
                          key={order.id}
                          className="cursor-pointer transition hover:bg-muted/40"
                          onClick={() => openOrderPreview(order)}
                        >
                          <TableCell className="font-medium">{order.id}</TableCell>
                          <TableCell className="text-muted-foreground">{order.pair}</TableCell>
                          <TableCell className="text-muted-foreground">{order.venue}</TableCell>
                          <TableCell className="text-right">
                            <Badge variant="outline" className="text-xs uppercase">
                              {order.side}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right text-muted-foreground">
                            {formatQuantity(order.size)}
                          </TableCell>
                          <TableCell className="text-right text-muted-foreground">
                            {order.price.toFixed(5)}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                order.status === "Working"
                                  ? "secondary"
                                  : order.status === "Filled"
                                    ? "default"
                                    : "outline"
                              }
                              className="text-xs"
                            >
                              {order.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2 text-xs"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  openOrderPreview(order);
                                }}
                              >
                                Preview
                              </Button>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7"
                                    onClick={(event) => event.stopPropagation()}
                                    aria-label="More actions"
                                  >
                                    <MoreHorizontal className="size-4" aria-hidden />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem>Cancel</DropdownMenuItem>
                                  <DropdownMenuItem>Replace</DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="border-t bg-background/95 px-4 py-2 sm:px-6">
          <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-2">
            <div className="flex items-center justify-between gap-3">
              <Button
                variant="ghost"
                size="sm"
                className="gap-2 px-0 text-sm"
                onClick={() => setEventStripOpen((prev) => !prev)}
              >
                <ChevronDown
                  className={cn(
                    "size-4 transition-transform",
                    eventStripOpen ? "rotate-180" : "rotate-0",
                  )}
                  aria-hidden
                />
                Event Log
              </Button>
              {!eventStripOpen ? (
                <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  {EVENT_LOG.map((event) => (
                    <button
                      key={event.id}
                      type="button"
                      className="flex items-center gap-1 truncate rounded-full px-2 py-0.5 transition hover:bg-muted"
                      onClick={() => handleEventClick(event)}
                    >
                      <span className={cn("size-2.5 rounded-full", severityDotClasses(event.severity))} />
                      <span className="max-w-[10rem] truncate">{event.label}</span>
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
            {eventStripOpen ? (
              <div className="rounded-md border bg-muted/40">
                <ScrollArea className="max-h-36">
                  <div className="divide-y">
                    {EVENT_LOG.map((event) => (
                      <button
                        key={event.id}
                        type="button"
                        className="flex w-full items-start gap-3 px-3 py-2 text-left transition hover:bg-background"
                        onClick={() => handleEventClick(event)}
                      >
                        <span
                          className={cn(
                            "mt-1 size-2.5 rounded-full",
                            severityDotClasses(event.severity),
                          )}
                        />
                        <div className="flex flex-1 flex-col gap-1">
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>{event.timestamp}</span>
                            <span className="font-medium text-foreground">{event.label}</span>
                          </div>
                          <p className="text-sm text-foreground">{event.message}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="flex flex-col gap-0 sm:max-w-xl">
          {selectedContext ? (
            <>
              <SheetHeader className="border-b p-6 pb-4">
                <SheetTitle className="text-xl">{selectedContext.title}</SheetTitle>
                <p className="text-sm text-muted-foreground">{selectedContext.subtitle}</p>
              </SheetHeader>
              <div className="flex flex-1 flex-col gap-4 px-6 py-4">
                <Tabs value={contextTab} onValueChange={setContextTab} className="flex flex-1 flex-col gap-4">
                  <TabsList>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="microstructure">Microstructure</TabsTrigger>
                    <TabsTrigger value="history">History</TabsTrigger>
                  </TabsList>
                  <TabsContent value="overview" className="flex-1">
                    <div className="flex h-full flex-col gap-4 rounded-lg border bg-muted/40 p-4">
                      <div className="space-y-3">
                        {selectedContext.overview.legs.map((leg, index) => (
                          <div key={`${leg.venue}-${index}`} className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-medium text-foreground">
                                {leg.side} {leg.size}
                              </p>
                              <p className="text-xs text-muted-foreground">{leg.venue}</p>
                              {leg.comment ? (
                                <p className="text-xs text-muted-foreground/80">{leg.comment}</p>
                              ) : null}
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        {selectedContext.overview.estimates.map((estimate) => (
                          <div key={estimate.label} className="rounded-md border bg-background/70 p-3">
                            <p className="text-xs text-muted-foreground">{estimate.label}</p>
                            <p className="text-lg font-semibold">{estimate.value}</p>
                          </div>
                        ))}
                      </div>
                      <p className="text-sm text-muted-foreground">{selectedContext.overview.note}</p>
                    </div>
                  </TabsContent>
                  <TabsContent value="microstructure" className="flex-1">
                    <div className="flex h-full flex-col gap-4 rounded-lg border bg-muted/40 p-4">
                      <div>
                        <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Book Snapshot
                        </h4>
                        <div className="mt-2 space-y-2 text-sm">
                          {selectedContext.microstructure.book.map((level) => (
                            <div
                              key={level.level}
                              className="flex items-center justify-between rounded-md bg-background/80 px-3 py-2"
                            >
                              <span className="text-muted-foreground">{level.level}</span>
                              <span className="font-medium">
                                {level.bid} <span className="text-muted-foreground">|</span> {level.ask}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="flex-1">
                        <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Recent Ticks
                        </h4>
                        <ScrollArea className="mt-2 max-h-40">
                          <div className="space-y-2 text-sm">
                            {selectedContext.microstructure.ticks.map((tick, index) => (
                              <div
                                key={`${tick.time}-${index}`}
                                className="flex items-center justify-between rounded-md bg-background/80 px-3 py-2"
                              >
                                <span className="text-muted-foreground">{tick.time}</span>
                                <span className="font-medium">{tick.price}</span>
                                <Badge variant="outline" className="text-[0.65rem] uppercase">
                                  {tick.side}
                                </Badge>
                                <span className="text-muted-foreground">{tick.size}</span>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      </div>
                    </div>
                  </TabsContent>
                  <TabsContent value="history" className="flex-1">
                    <div className="flex h-full flex-col gap-2 rounded-lg border bg-muted/40 p-4">
                      {selectedContext.history.map((item, index) => (
                        <div key={`${item.time}-${index}`} className="rounded-md bg-background/80 px-3 py-2">
                          <p className="text-xs text-muted-foreground">{item.time}</p>
                          <p className="text-sm font-medium text-foreground">{item.description}</p>
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
              <SheetFooter className="border-t bg-background/95 px-6 py-4">
                <Button className="w-full" size="lg">
                  {selectedContext.primaryAction}
                </Button>
              </SheetFooter>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center p-6 text-sm text-muted-foreground">
              Select a row to preview full context.
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
