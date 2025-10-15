import {
  forwardRef,
  type KeyboardEvent,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import type { MetaDescriptor } from "react-router";
import type {
  CellClassParams,
  CellValueChangedEvent,
  ColDef,
  ICellEditorParams,
  GetRowIdParams,
  GridReadyEvent,
  ICellRendererParams,
  ValueParserParams,
  ValueFormatterParams,
  ValueSetterParams,
} from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import {
  AlertTriangle,
  ArrowRightLeft,
  ChevronDown,
  ChevronUp,
  PauseCircle,
  PlayCircle,
  X,
} from "lucide-react";

import { PageTemplate } from "~/components/page-template";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import { Command, CommandGroup, CommandInput, CommandItem, CommandList } from "~/components/ui/command";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "~/components/ui/popover";
import { ScrollArea } from "~/components/ui/scroll-area";
import { Switch } from "~/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Progress } from "~/components/ui/progress";
import { cn } from "~/lib/utils";

import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";

type StrategySide = "Buy Futures / Sell Equity" | "Sell Futures / Buy Equity" | "Idle";
type StrategyStatus = "ACTIVE" | "HALTED" | "ERROR";

type FillRecord = {
  id: string;
  time: string;
  leg: "Futures" | "Equity";
  side: "Buy" | "Sell";
  price: number;
  qty: number;
  status: "Pending" | "Hedged" | "Filled" | "Rejected";
};

type OrderStatus = "Idle" | "Working" | "Partially Filled" | "Filled" | "Error";

type StrategyRow = {
  id: string;
  ticker: string;
  name: string;
  side: StrategySide;
  futPx: number;
  futChange: number;
  eqPx: number;
  eqChange: number;
  spread: number;
  spreadChange: number;
  targetSpread: number;
  entry: number;
  exit: number;
  maxQty: number;
  hedgeRatio: number;
  posEq: number;
  posFutLots: number;
  upl: number;
  latMs: number;
  status: StrategyStatus;
  orderStatus: OrderStatus;
  fillProgress: number;
  lastOrderUpdate: number;
  lastChangeAt: string;
  tolerance: number;
  latencyThreshold: number;
  fills: FillRecord[];
  notes?: string;
};

type AlertSeverity = "success" | "warning" | "critical" | "info";

type AlertChip = {
  id: string;
  ticker: string;
  timestamp: string;
  message: string;
  severity: AlertSeverity;
  tab: DrawerTab;
};

type DrawerTab = "fills" | "alerts" | "system" | "adjustments";

type DrawerEvent = {
  id: string;
  ticker: string;
  timestamp: string;
  summary: string;
  detail: string;
  severity: AlertSeverity;
  tab: DrawerTab;
  category: "Fills" | "Risk" | "System";
  primaryAction: { label: string; intent?: "default" | "destructive" };
  secondaryAction?: { label: string };
  requiresAck?: boolean;
};

type BroadcastDraft = {
  entry?: string;
  exit?: string;
  maxQty?: string;
  hedgeRatio?: string;
};

type DrawerFilter = {
  onlyAbnormal: boolean;
  onlySelected: boolean;
  ticker?: string;
};

type EditableNumericField =
  | "entry"
  | "exit"
  | "maxQty"
  | "hedgeRatio"
  | "tolerance"
  | "latencyThreshold";

type EditableNumberCellParams = ICellEditorParams<StrategyRow, number> & {
  step?: number;
  min?: number;
  max?: number;
  precision?: number;
};

type EditableNumberCellHandle = {
  getValue: () => number;
  afterGuiAttached?: () => void;
};

type SideCellEditorParams = ICellEditorParams<StrategyRow, StrategySide> & {
  descriptions?: Record<StrategySide, string>;
};

type SideCellEditorHandle = {
  getValue: () => StrategySide;
  afterGuiAttached?: () => void;
};

const SIDE_OPTIONS: readonly {
  value: StrategySide;
  label: string;
  description: string;
  icon: typeof ArrowRightLeft;
  accent: string;
}[] = [
  {
    value: "Buy Futures / Sell Equity",
    label: "Buy Fut / Sell Eq",
    description: "Long index future, short underlying cash leg.",
    icon: ArrowRightLeft,
    accent: "text-emerald-500",
  },
  {
    value: "Sell Futures / Buy Equity",
    label: "Sell Fut / Buy Eq",
    description: "Short index future, long underlying cash leg.",
    icon: ArrowRightLeft,
    accent: "text-red-500",
  },
  {
    value: "Idle",
    label: "Idle / Monitor",
    description: "No live orders – monitor only.",
    icon: PauseCircle,
    accent: "text-muted-foreground",
  },
];

const EditableNumberCell = forwardRef<EditableNumberCellHandle, EditableNumberCellParams>(
  ({ value, step = 1, min, max, precision, stopEditing }, ref) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const [displayValue, setDisplayValue] = useState(() =>
      value != null && !Number.isNaN(value) ? String(value) : "",
    );

    const clampValue = useCallback(
      (num: number) => {
        let next = num;
        if (typeof min === "number") {
          next = Math.max(min, next);
        }
        if (typeof max === "number") {
          next = Math.min(max, next);
        }
        if (typeof precision === "number") {
          const factor = 10 ** precision;
          next = Math.round(next * factor) / factor;
        }
        return next;
      },
      [max, min, precision],
    );

    const fallbackValue = useMemo(() => {
      if (typeof value === "number" && !Number.isNaN(value)) {
        return clampValue(value);
      }
      if (typeof min === "number") {
        return min;
      }
      return 0;
    }, [clampValue, min, value]);

    const toDisplayString = useCallback(
      (num: number) => {
        const clamped = clampValue(num);
        if (typeof precision === "number") {
          return clamped.toFixed(precision);
        }
        return String(clamped);
      },
      [clampValue, precision],
    );

    const parseInput = useCallback(
      (raw: string) => {
        const trimmed = raw.trim();
        if (!trimmed.length) {
          return fallbackValue;
        }
        const parsed = Number(trimmed);
        if (!Number.isFinite(parsed)) {
          return fallbackValue;
        }
        return clampValue(parsed);
      },
      [clampValue, fallbackValue],
    );

    const adjustValue = useCallback(
      (direction: 1 | -1, multiplier: number) => {
        const current = Number(displayValue);
        const base = Number.isFinite(current) ? current : fallbackValue;
        const delta = step * multiplier * direction;
        setDisplayValue(toDisplayString(base + delta));
      },
      [displayValue, fallbackValue, step, toDisplayString],
    );

    const handleKeyDown = useCallback(
      (event: KeyboardEvent<HTMLInputElement>) => {
        if (event.key === "ArrowUp" || event.key === "ArrowDown") {
          event.preventDefault();
          const multiplier = event.shiftKey ? 10 : 1;
          adjustValue(event.key === "ArrowUp" ? 1 : -1, multiplier);
        }
        if (event.key === "Enter") {
          event.preventDefault();
          stopEditing?.();
        }
        if (event.key === "Escape") {
          stopEditing?.();
        }
      },
      [adjustValue, stopEditing],
    );

    useImperativeHandle(
      ref,
      () => ({
        getValue: () => parseInput(displayValue),
        afterGuiAttached: () => {
          requestAnimationFrame(() => {
            inputRef.current?.focus();
            inputRef.current?.select();
          });
        },
      }),
      [displayValue, parseInput],
    );

    return (
      <Input
        ref={inputRef}
        value={displayValue}
        onChange={(event) => setDisplayValue(event.target.value)}
        onKeyDown={handleKeyDown}
        className="h-8"
        inputMode="decimal"
        autoFocus
      />
    );
  },
);

const SideCellEditor = forwardRef<SideCellEditorHandle, SideCellEditorParams>(
  ({ value, stopEditing, descriptions }, ref) => {
    const [open, setOpen] = useState(false);
    const [selected, setSelected] = useState<StrategySide>(value ?? "Idle");
    const triggerRef = useRef<HTMLButtonElement>(null);

    const getOption = useCallback(
      (side: StrategySide) => SIDE_OPTIONS.find((option) => option.value === side) ?? SIDE_OPTIONS[0],
      [],
    );

    const handleSelect = useCallback(
      (side: StrategySide) => {
        setSelected(side);
        setOpen(false);
        requestAnimationFrame(() => stopEditing?.());
      },
      [stopEditing],
    );

    useImperativeHandle(
      ref,
      () => ({
        getValue: () => selected,
        afterGuiAttached: () => {
          requestAnimationFrame(() => {
            setOpen(true);
          });
        },
      }),
      [selected],
    );

    const activeOption = getOption(selected);
    const ActiveIcon = activeOption.icon;

    return (
      <Popover
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) {
            requestAnimationFrame(() => stopEditing?.());
          }
        }}
      >
        <PopoverTrigger asChild>
          <button
            ref={triggerRef}
            type="button"
            className={cn(
              "flex h-8 w-full items-center justify-between rounded-md border bg-background px-2 text-left text-xs font-medium",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            )}
          >
            <span className="flex items-center gap-2">
              <ActiveIcon className={cn("size-4", activeOption.accent)} />
              <span>{activeOption.value}</span>
            </span>
            <ChevronDown className="size-3.5 opacity-60" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-72 p-0" align="start" sideOffset={4}>
          <Command>
            <CommandInput placeholder="Search trading side…" autoFocus />
            <CommandList>
              <CommandGroup heading="Playbooks">
                {SIDE_OPTIONS.map((option) => {
                  const Icon = option.icon;
                  const description = descriptions?.[option.value] ?? option.description;
                  return (
                    <CommandItem
                      key={option.value}
                      value={option.value}
                      onSelect={() => handleSelect(option.value)}
                      className="items-start"
                    >
                      <div className="flex flex-col gap-1 text-left">
                        <span className="flex items-center gap-2 text-xs font-semibold">
                          <Icon className={cn("size-4", option.accent)} />
                          {option.value}
                          {selected === option.value ? (
                            <Badge variant="secondary" className="ml-auto text-[10px]">
                              Active
                            </Badge>
                          ) : null}
                        </span>
                        <span className="pl-6 text-[11px] text-muted-foreground">{description}</span>
                      </div>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    );
  },
);

const EDITABLE_NUMERIC_FIELDS: readonly EditableNumericField[] = [
  "entry",
  "exit",
  "maxQty",
  "hedgeRatio",
  "tolerance",
  "latencyThreshold",
];

const isEditableNumericField = (field: string): field is EditableNumericField =>
  (EDITABLE_NUMERIC_FIELDS as readonly string[]).includes(field);

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const priceFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

const numberFormatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const decimalFormatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const now = Date.now();

const initialStrategies: StrategyRow[] = [
  {
    id: "005930",
    ticker: "005930",
    name: "Samsung Electronics vs KOSPI200 Mar Fut",
    side: "Buy Futures / Sell Equity",
    futPx: 712.4,
    futChange: 0.18,
    eqPx: 706.8,
    eqChange: -0.12,
    spread: 5.6,
    spreadChange: 0.3,
    targetSpread: 5.1,
    entry: 4.8,
    exit: 6.2,
    maxQty: 1800,
    hedgeRatio: 0.82,
    posEq: -84000,
    posFutLots: 840,
    upl: 192000,
    latMs: 28,
    status: "ACTIVE",
    orderStatus: "Working",
    fillProgress: 68,
    lastOrderUpdate: now - 52_000,
    lastChangeAt: "09:31:12",
    tolerance: 0.8,
    latencyThreshold: 75,
    fills: [
      {
        id: "F005930-1",
        time: "09:30:58",
        leg: "Futures",
        side: "Buy",
        price: 712.25,
        qty: 120,
        status: "Hedged",
      },
      {
        id: "E005930-1",
        time: "09:31:00",
        leg: "Equity",
        side: "Sell",
        price: 706.7,
        qty: 12000,
        status: "Filled",
      },
    ],
    notes: "Auto-throttled max order after latency normalization.",
  },
  {
    id: "000660",
    ticker: "000660",
    name: "SK Hynix vs KOSPI200 Mar Fut",
    side: "Sell Futures / Buy Equity",
    futPx: 137.86,
    futChange: -0.09,
    eqPx: 136.9,
    eqChange: 0.07,
    spread: -0.96,
    spreadChange: -0.04,
    targetSpread: -1.2,
    entry: -1.4,
    exit: -0.5,
    maxQty: 2200,
    hedgeRatio: 1.05,
    posEq: 56000,
    posFutLots: -520,
    upl: 84000,
    latMs: 142,
    status: "ACTIVE",
    orderStatus: "Partially Filled",
    fillProgress: 42,
    lastOrderUpdate: now - 36_000,
    lastChangeAt: "09:30:44",
    tolerance: 0.6,
    latencyThreshold: 120,
    fills: [
      {
        id: "E000660-1",
        time: "09:30:32",
        leg: "Equity",
        side: "Buy",
        price: 136.88,
        qty: 8000,
        status: "Hedged",
      },
      {
        id: "F000660-1",
        time: "09:30:34",
        leg: "Futures",
        side: "Sell",
        price: 137.92,
        qty: 80,
        status: "Filled",
      },
    ],
    notes: "Latency monitor triggered dual-throttle at 140ms.",
  },
  {
    id: "035420",
    ticker: "035420",
    name: "NAVER vs KOSPI200 Mar Fut",
    side: "Buy Futures / Sell Equity",
    futPx: 217.45,
    futChange: 0.05,
    eqPx: 215.4,
    eqChange: -0.02,
    spread: 2.05,
    spreadChange: 0.07,
    targetSpread: 1.7,
    entry: 1.4,
    exit: 2.4,
    maxQty: 950,
    hedgeRatio: 0.9,
    posEq: -32000,
    posFutLots: 320,
    upl: 124000,
    latMs: 64,
    status: "ACTIVE",
    orderStatus: "Idle",
    fillProgress: 0,
    lastOrderUpdate: now - 95_000,
    lastChangeAt: "09:29:51",
    tolerance: 0.5,
    latencyThreshold: 90,
    fills: [
      {
        id: "F035420-1",
        time: "09:29:36",
        leg: "Futures",
        side: "Buy",
        price: 217.3,
        qty: 60,
        status: "Pending",
      },
      {
        id: "E035420-1",
        time: "09:29:48",
        leg: "Equity",
        side: "Sell",
        price: 215.35,
        qty: 6000,
        status: "Pending",
      },
    ],
    notes: "Monitoring NAV arb leakage after broker fee change.",
  },
  {
    id: "051910",
    ticker: "051910",
    name: "LG Chem vs KOSPI200 Mar Fut",
    side: "Sell Futures / Buy Equity",
    futPx: 424.55,
    futChange: -0.2,
    eqPx: 421.3,
    eqChange: 0.11,
    spread: -3.25,
    spreadChange: -0.09,
    targetSpread: -3.4,
    entry: -3.8,
    exit: -2.6,
    maxQty: 1200,
    hedgeRatio: 1.12,
    posEq: 24000,
    posFutLots: -180,
    upl: 46000,
    latMs: 51,
    status: "ACTIVE",
    orderStatus: "Working",
    fillProgress: 24,
    lastOrderUpdate: now - 18_000,
    lastChangeAt: "09:30:22",
    tolerance: 0.7,
    latencyThreshold: 110,
    fills: [
      {
        id: "F051910-1",
        time: "09:30:42",
        leg: "Futures",
        side: "Sell",
        price: 424.4,
        qty: 30,
        status: "Filled",
      },
    ],
    notes: "Gamma scalp overlay nudged exit by 4bp overnight.",
  },
  {
    id: "068270",
    ticker: "068270",
    name: "Celltrion vs KOSPI200 Mar Fut",
    side: "Idle",
    futPx: 162.7,
    futChange: 0,
    eqPx: 161.9,
    eqChange: 0,
    spread: 0.8,
    spreadChange: 0,
    targetSpread: 0.7,
    entry: 0.5,
    exit: 1.4,
    maxQty: 600,
    hedgeRatio: 0.88,
    posEq: 0,
    posFutLots: 0,
    upl: 0,
    latMs: 33,
    status: "ACTIVE",
    orderStatus: "Idle",
    fillProgress: 0,
    lastOrderUpdate: now - 120_000,
    lastChangeAt: "09:26:11",
    tolerance: 0.3,
    latencyThreshold: 100,
    fills: [],
    notes: "Awaiting trigger after overnight parameter sync.",
  },
];

const availableTickers = [
  { ticker: "105560", name: "KB Financial vs KOSPI200 Mar Fut", side: "Buy Futures / Sell Equity" as StrategySide },
  { ticker: "066570", name: "LG Electronics vs KOSPI200 Jun Fut", side: "Sell Futures / Buy Equity" as StrategySide },
  { ticker: "055550", name: "Shinhan Financial vs KOSPI200 Jun Fut", side: "Buy Futures / Sell Equity" as StrategySide },
  { ticker: "003670", name: "POSCO vs KOSPI200 Mar Fut", side: "Sell Futures / Buy Equity" as StrategySide },
];

const initialAlertChips: AlertChip[] = [
  {
    id: "chip-1",
    ticker: "005930",
    timestamp: "09:31:04",
    message: "Futures leg filled; hedge pending (1.6s)",
    severity: "warning",
    tab: "fills",
  },
  {
    id: "chip-2",
    ticker: "000660",
    timestamp: "09:31:18",
    message: "Spread > Exit; strategy disabled (+₩93k)",
    severity: "critical",
    tab: "alerts",
  },
  {
    id: "chip-3",
    ticker: "035420",
    timestamp: "09:30:54",
    message: "Param auto-adjust: exit widened +0.2bp",
    severity: "info",
    tab: "adjustments",
  },
  {
    id: "chip-4",
    ticker: "051910",
    timestamp: "09:30:44",
    message: "Queue latency normalized <40ms",
    severity: "success",
    tab: "system",
  },
];

const drawerSeedEvents: DrawerEvent[] = [
  {
    id: "evt-1",
    ticker: "005930",
    timestamp: "09:31:04",
    summary: "Futures leg fill awaiting hedge",
    detail: "Primary leg completed at 712.25; equity sell resting at 706.80 with hedge SLA 2.0s",
    severity: "warning",
    tab: "fills",
    category: "Fills",
    primaryAction: { label: "Force Hedge" },
    secondaryAction: { label: "Disable" },
    requiresAck: false,
  },
  {
    id: "evt-2",
    ticker: "000660",
    timestamp: "09:31:18",
    summary: "Spread breached exit band",
    detail: "Live spread -0.32 vs exit -0.50; strategy auto-disabled with ₩93k gain",
    severity: "critical",
    tab: "alerts",
    category: "Risk",
    primaryAction: { label: "Resume +Δ", intent: "destructive" },
    secondaryAction: { label: "Keep Halted" },
    requiresAck: true,
  },
  {
    id: "evt-3",
    ticker: "035420",
    timestamp: "09:30:55",
    summary: "Latency spike cleared",
    detail: "Pricing feed stabilized at 26ms after max 118ms; restored to auto hedge",
    severity: "success",
    tab: "system",
    category: "System",
    primaryAction: { label: "Acknowledge" },
    requiresAck: true,
  },
  {
    id: "evt-4",
    ticker: "051910",
    timestamp: "09:30:22",
    summary: "Hedge ratio auto-tuned",
    detail: "Ratio moved 0.92 → 0.95 to correct 6% drift; revert available",
    severity: "info",
    tab: "adjustments",
    category: "Risk",
    primaryAction: { label: "Revert" },
    secondaryAction: { label: "Keep" },
    requiresAck: false,
  },
];

const severityClassMap: Record<AlertSeverity, string> = {
  success: "border-emerald-500/60 text-emerald-500 bg-emerald-500/10",
  warning: "border-amber-500/60 text-amber-500 bg-amber-500/10",
  critical: "border-red-500/60 text-red-500 bg-red-500/10",
  info: "border-slate-500/60 text-slate-500 bg-slate-500/10",
};

const ORDER_STATUS_STYLES: Record<OrderStatus, string> = {
  Idle: "border-slate-500/60 text-slate-500 bg-slate-500/10",
  Working: "border-blue-500/60 text-blue-500 bg-blue-500/10",
  "Partially Filled": "border-amber-500/60 text-amber-500 bg-amber-500/10",
  Filled: "border-emerald-500/60 text-emerald-500 bg-emerald-500/10",
  Error: "border-red-500/60 text-red-500 bg-red-500/10",
};

const randomBetween = (min: number, max: number) => Math.random() * (max - min) + min;

export function meta(): MetaDescriptor[] {
  return [
    { title: "Equity Hedge Cockpit" },
    {
      name: "description",
      content:
        "High-density cockpit to monitor and action equity-futures pair strategies with event-driven intelligence.",
    },
  ];
}



type PriceDeltaCellParams = ICellRendererParams<StrategyRow, number> & {
  deltaField: keyof StrategyRow;
  formatter?: Intl.NumberFormat;
  precision?: number;
};

function PriceDeltaCell({
  value,
  data,
  deltaField,
  formatter,
  precision = 2,
}: PriceDeltaCellParams) {
  const deltaValue = data ? (data[deltaField] as number | undefined) : undefined;
  const hasDelta = typeof deltaValue === "number" && Number.isFinite(deltaValue);
  const direction = !hasDelta || deltaValue === 0 ? "flat" : deltaValue > 0 ? "up" : "down";
  const tone =
    direction === "up"
      ? "text-emerald-500"
      : direction === "down"
        ? "text-red-500"
        : "text-muted-foreground";
  const formattedValue =
    value != null && Number.isFinite(value)
      ? formatter
        ? formatter.format(value)
        : value.toFixed(precision)
      : "—";

  let formattedDelta: string | null = null;
  if (hasDelta) {
    const magnitude = Math.abs(deltaValue!);
    const base = formatter ? formatter.format(magnitude) : magnitude.toFixed(precision);
    const prefix = deltaValue! > 0 ? "+" : deltaValue! < 0 ? "-" : "";
    formattedDelta = `${prefix}${base}`;
  }

  return (
    <div className="flex items-center justify-between gap-2">
      <span>{formattedValue}</span>
      {formattedDelta ? (
        <span className={cn("flex items-center gap-1 font-sans text-[11px]", tone)}>
          {direction === "up" ? <ChevronUp className="size-3" /> : null}
          {direction === "down" ? <ChevronDown className="size-3" /> : null}
          <span>{formattedDelta}</span>
        </span>
      ) : (
        <span className="text-[11px] text-muted-foreground">—</span>
      )}
    </div>
  );
}

function OrderStatusCell({ data }: ICellRendererParams<StrategyRow>) {
  if (!data) return null;
  const status = data.orderStatus;
  const badgeTone = ORDER_STATUS_STYLES[status];
  return (
    <div className="flex flex-col gap-1">
      <Badge variant="outline" className={cn("w-fit text-[11px]", badgeTone)}>
        {status}
      </Badge>
      {status === "Working" || status === "Partially Filled" ? (
        <Progress value={data.fillProgress} className="h-1 w-full" />
      ) : null}
    </div>
  );
}

function FillProgressCell({ value, data }: ICellRendererParams<StrategyRow, number>) {
  const progress = value ?? data?.fillProgress ?? 0;
  return (
    <div className="flex items-center gap-2">
      <Progress value={progress} className="h-1.5 w-full" />
      <span className="w-10 text-right font-mono text-[11px]">{Math.round(progress)}%</span>
    </div>
  );
}

const formatElapsed = (milliseconds: number) => {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours) {
    return `${hours}h ${minutes}m`;
  }
  if (minutes) {
    return `${minutes}m ${seconds.toString().padStart(2, "0")}s`;
  }
  return `${seconds}s`;
};

function TimeSinceCell({ data }: ICellRendererParams<StrategyRow>) {
  if (!data) return <span className="text-muted-foreground">—</span>;
  const elapsed = Date.now() - data.lastOrderUpdate;
  return <span className="font-mono text-[11px]">{formatElapsed(elapsed)}</span>;
}

function StrategyDetailCell({ data }: ICellRendererParams<StrategyRow>) {
  if (!data) return null;

  return (
    <div className="h-full bg-muted/40 p-3">
      <div className="grid h-full grid-cols-[minmax(0,2fr),minmax(0,1fr)] gap-4 text-xs text-muted-foreground">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between text-[10px] uppercase tracking-wide">
            <span>Recent fills</span>
            <span className="font-medium text-foreground">{data.ticker}</span>
          </div>
          <div className="overflow-hidden rounded-md border">
            <div className="grid grid-cols-[72px,1fr,1fr,72px,72px,1fr] bg-muted px-2 py-1 text-[10px] font-medium uppercase tracking-wide">
              <span>Time</span>
              <span>Leg</span>
              <span>Side</span>
              <span>Price</span>
              <span>Qty</span>
              <span>Status</span>
            </div>
            <ScrollArea className="h-[96px]">
              <div className="divide-y">
                {data.fills.length ? (
                  data.fills.map((fill) => (
                    <div key={fill.id} className="grid grid-cols-[72px,1fr,1fr,72px,72px,1fr] px-2 py-1 font-mono text-[11px]">
                      <span>{fill.time}</span>
                      <span>{fill.leg}</span>
                      <span className={cn(fill.side === "Buy" ? "text-emerald-500" : "text-red-500")}>{fill.side}</span>
                      <span>{priceFormatter.format(fill.price)}</span>
                      <span>{numberFormatter.format(fill.qty)}</span>
                      <span>{fill.status}</span>
                    </div>
                  ))
                ) : (
                  <div className="px-3 py-6 text-center text-[11px] text-muted-foreground">
                    No fills in the last 15 minutes.
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
        <div className="flex flex-col gap-3">
          <div className="rounded-md border border-dashed p-3 text-[11px] leading-tight text-foreground">
            <p className="mb-2 font-semibold text-xs text-muted-foreground">Residual hedge</p>
            <p className="font-mono">Lots pending: {Math.max(0, Math.abs(data.posFutLots) % 10)}</p>
            <p className="font-mono">Eq residual: {numberFormatter.format(Math.max(0, Math.abs(data.posEq) % 5000))}</p>
            <Button variant="outline" size="sm" className="mt-3 w-full text-xs">
              {Math.abs(data.posEq) > 0 ? "Force Hedge" : "Close Residual"}
            </Button>
          </div>
          <div className="rounded-md border bg-background/80 p-3 text-[11px] leading-snug">
            <p className="mb-1 font-semibold uppercase tracking-wide text-muted-foreground">Last note</p>
            <p>{data.notes ?? "No adjustments recorded."}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function SelectCloneControl({
  strategies,
  onClone,
  disabled,
}: {
  strategies: StrategyRow[];
  onClone: (id: string) => void;
  disabled: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button size="sm" variant="outline" disabled={disabled} className="gap-1">
          Clone Params From
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0" align="start">
        <Command>
          <CommandInput placeholder="Select source…" />
          <CommandList>
            <CommandGroup heading="Strategies">
              {strategies.map((strategy) => (
                <CommandItem
                  key={strategy.id}
                  value={strategy.id}
                  onSelect={(value) => {
                    onClone(value);
                    setOpen(false);
                  }}
                >
                  <div className="flex flex-col text-left">
                    <span className="font-semibold">{strategy.ticker}</span>
                    <span className="text-xs text-muted-foreground">{strategy.name}</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export default function EquityHedgeCockpit() {
  const [strategies, setStrategies] = useState<StrategyRow[]>(initialStrategies);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [broadcastOpen, setBroadcastOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [broadcastDraft, setBroadcastDraft] = useState<BroadcastDraft>({});
  const [drawerTab, setDrawerTab] = useState<DrawerTab>("fills");
  const [drawerExpanded, setDrawerExpanded] = useState(false);
  const [drawerFilter, setDrawerFilter] = useState<DrawerFilter>({
    onlyAbnormal: false,
    onlySelected: false,
  });
  const [events] = useState<DrawerEvent[]>(drawerSeedEvents);
  const [acknowledged, setAcknowledged] = useState<Record<string, boolean>>({});
  const [mode, setMode] = useState<"AUTO" | "SEMI" | "MANUAL">("AUTO");
  const [overrideCount, setOverrideCount] = useState(3);
  const [haltConfirm, setHaltConfirm] = useState(false);
  const [alerts, setAlerts] = useState<AlertChip[]>(() =>
    initialAlertChips.slice().sort((a, b) => b.timestamp.localeCompare(a.timestamp)),
  );
  const [alertsExpanded, setAlertsExpanded] = useState(false);

  const gridRef = useRef<AgGridReact<StrategyRow>>(null);
  const haltTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      const nowTs = Date.now();
      setStrategies((prev) =>
        prev.map((row) => {
          const futDelta = Number(randomBetween(-0.22, 0.22).toFixed(2));
          const eqDelta = Number(randomBetween(-0.2, 0.2).toFixed(2));
          const nextFutPx = Number((row.futPx + futDelta).toFixed(2));
          const nextEqPx = Number((row.eqPx + eqDelta).toFixed(2));
          const spreadJitter = Number(randomBetween(-0.08, 0.08).toFixed(2));
          const nextSpread = Number((row.spread + spreadJitter).toFixed(2));
          const spreadChange = Number((nextSpread - row.spread).toFixed(2));
          const nextLatMs = Math.max(0, Math.round(row.latMs + randomBetween(-6, 6)));
          const nextUpl = row.upl + Math.round(randomBetween(-2500, 2500));

          let nextOrderStatus = row.orderStatus;
          let nextFillProgress = row.fillProgress;
          let lastOrderUpdate = row.lastOrderUpdate;
          let statusChanged = false;

          if (row.status === "ACTIVE") {
            if (nextOrderStatus === "Working" || nextOrderStatus === "Partially Filled") {
              if (Math.random() < 0.7) {
                const increment = Math.max(1, Math.round(randomBetween(1, 7)));
                const updatedProgress = Math.min(100, nextFillProgress + increment);
                if (updatedProgress !== nextFillProgress) {
                  nextFillProgress = updatedProgress;
                  statusChanged = true;
                  nextOrderStatus = updatedProgress >= 100 ? "Filled" : "Partially Filled";
                }
              }
            } else if (nextOrderStatus === "Filled") {
              if (Math.random() < 0.12) {
                nextOrderStatus = "Working";
                nextFillProgress = Math.round(randomBetween(0, 12));
                statusChanged = true;
              }
            } else if (nextOrderStatus === "Idle") {
              if (Math.random() < 0.1) {
                nextOrderStatus = "Working";
                nextFillProgress = Math.round(randomBetween(5, 15));
                statusChanged = true;
              }
            } else if (nextOrderStatus === "Error") {
              if (Math.random() < 0.4) {
                nextOrderStatus = "Working";
                nextFillProgress = 0;
                statusChanged = true;
              }
            }
          }

          if (statusChanged) {
            lastOrderUpdate = nowTs;
          }

          const shouldTimestamp =
            statusChanged || Math.abs(spreadChange) > row.tolerance / 2 || Math.abs(futDelta) > 0.15;

          return {
            ...row,
            futPx: nextFutPx,
            futChange: futDelta,
            eqPx: nextEqPx,
            eqChange: eqDelta,
            spread: nextSpread,
            spreadChange,
            upl: nextUpl,
            latMs: nextLatMs,
            orderStatus: nextOrderStatus,
            fillProgress: nextFillProgress,
            lastOrderUpdate,
            lastChangeAt: shouldTimestamp ? new Date(nowTs).toLocaleTimeString() : row.lastChangeAt,
          };
        }),
      );

      gridRef.current?.api?.refreshCells({ columns: ["lastOrderUpdate"], force: true });
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      gridRef.current?.api?.refreshCells({ columns: ["lastOrderUpdate"], force: true });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const totalSummary = useMemo(() => {
    return strategies.reduce(
      (acc, row) => {
        acc.posEq += row.posEq;
        acc.posFut += row.posFutLots;
        acc.upl += row.upl;
        acc.active += row.status === "ACTIVE" ? 1 : 0;
        return acc;
      },
      { posEq: 0, posFut: 0, upl: 0, active: 0 },
    );
  }, [strategies]);

  const pinnedTopRowData = useMemo(
    () => [
      {
        ticker: "TOTAL",
        side: "",
        futPx: "",
        eqPx: "",
        spread: "",
        targetSpread: "",
        entry: "",
        exit: "",
        maxQty: "",
        hedgeRatio: "",
        tolerance: "",
        latencyThreshold: "",
        posEq: totalSummary.posEq,
        posFutLots: totalSummary.posFut,
        upl: totalSummary.upl,
        latMs: "",
        status: `${totalSummary.active} Active`,
        lastChangeAt: "",
      },
    ],
    [totalSummary],
  );

  const defaultColDef = useMemo<ColDef<StrategyRow>>(
    () => ({
      editable: false,
      sortable: true,
      resizable: true,
      filter: true,
      cellClass: "font-mono text-xs",
      suppressHeaderMenuButton: true,
    }),
    [],
  );

  const getRowId = useCallback((params: GetRowIdParams<StrategyRow>) => params.data.id, []);

  const formatSigned = useCallback(
    (value: number) =>
      value >= 0
        ? `+${numberFormatter.format(Math.abs(value))}`
        : `-${numberFormatter.format(Math.abs(value))}`,
    [],
  );

  const normalizeStrategyValue = useCallback(
    (field: EditableNumericField, rawValue: unknown, currentValue: number) => {
      const parsed =
        typeof rawValue === "number" && Number.isFinite(rawValue)
          ? rawValue
          : typeof rawValue === "string"
            ? Number(rawValue)
            : Number.NaN;

      if (!Number.isFinite(parsed)) {
        return currentValue;
      }

      let next = parsed;

      switch (field) {
        case "maxQty": {
          next = Math.round(next);
          next = Math.max(0, Math.min(next, 10000));
          break;
        }
        case "hedgeRatio": {
          next = Math.max(0, Math.min(next, 5));
          next = Number(next.toFixed(2));
          break;
        }
        case "tolerance": {
          next = Math.max(0, Math.min(next, 5));
          next = Number(next.toFixed(2));
          break;
        }
        case "latencyThreshold": {
          next = Math.round(next);
          next = Math.max(0, Math.min(next, 2000));
          break;
        }
        case "entry":
        case "exit": {
          next = Number(next.toFixed(2));
          break;
        }
        default:
          break;
      }

      return next;
    },
    [],
  );

  const handleStrategyPatch = useCallback(
    (id: string, field: EditableNumericField, normalizedValue: number) => {
      setStrategies((prev) =>
        prev.map((row) => {
          if (row.id !== id) {
            return row;
          }
          if (row[field] === normalizedValue) {
            return row;
          }
          return {
            ...row,
            [field]: normalizedValue,
            lastChangeAt: new Date().toLocaleTimeString(),
          };
        }),
      );
    },
    [],
  );

  const handleCellValueChanged = useCallback(
    (event: CellValueChangedEvent<StrategyRow>) => {
      if (!event.data || !event.colDef.field) {
        return;
      }

      const field = event.colDef.field as keyof StrategyRow;

      if (field === "side") {
        return;
      }

      if (isEditableNumericField(field as string)) {
        const numericField = field as EditableNumericField;
        const normalized = normalizeStrategyValue(numericField, event.newValue, event.data[numericField]);
        handleStrategyPatch(event.data.id, numericField, normalized);
        return;
      }

      setStrategies((prev) =>
        prev.map((row) =>
          row.id === event.data!.id
            ? {
                ...row,
                [field]: event.newValue as StrategyRow[keyof StrategyRow],
                lastChangeAt: new Date().toLocaleTimeString(),
              }
            : row,
        ),
      );
    },
    [handleStrategyPatch, normalizeStrategyValue],
  );

  const handleSelectionChanged = useCallback(() => {
    const api = gridRef.current?.api;
    if (!api) return;
    const ids = api.getSelectedRows().map((row) => row.id);
    setSelectedIds(ids);
  }, []);

  const handleGridReady = useCallback((params: GridReadyEvent<StrategyRow>) => {
    params.api.sizeColumnsToFit();
  }, []);

  const handleGridSizeChanged = useCallback(() => {
    const api = gridRef.current?.api;
    if (!api) return;
    api.sizeColumnsToFit();
  }, []);

  const sideClassRules: ColDef<StrategyRow>["cellClassRules"] = useMemo(
    () => ({
      "text-emerald-500": (params: CellClassParams<StrategyRow>) =>
        params.value === "Buy Futures / Sell Equity",
      "text-red-500": (params: CellClassParams<StrategyRow>) =>
        params.value === "Sell Futures / Buy Equity",
      "text-muted-foreground": (params: CellClassParams<StrategyRow>) => params.value === "Idle",
    }),
    [],
  );

  const handleFlatten = useCallback((id: string) => {
    setStrategies((prev) =>
      prev.map((row) =>
        row.id === id
          ? {
              ...row,
              posEq: 0,
              posFutLots: 0,
              upl: row.upl * 0.95,
              status: "HALTED",
              lastChangeAt: new Date().toLocaleTimeString(),
            }
          : row,
      ),
    );
  }, []);

  const handleToggleHalt = useCallback((id: string) => {
    setStrategies((prev) =>
      prev.map((row) =>
        row.id === id
          ? {
              ...row,
              status: row.status === "HALTED" ? "ACTIVE" : "HALTED",
              lastChangeAt: new Date().toLocaleTimeString(),
            }
          : row,
      ),
    );
  }, []);

  const handleReverse = useCallback((id: string) => {
    setStrategies((prev) =>
      prev.map((row) =>
        row.id === id
          ? {
              ...row,
              side:
                row.side === "Buy Futures / Sell Equity"
                  ? "Sell Futures / Buy Equity"
                  : row.side === "Sell Futures / Buy Equity"
                    ? "Buy Futures / Sell Equity"
                    : row.side,
              posEq: -row.posEq,
              posFutLots: -row.posFutLots,
              upl: -row.upl,
              lastChangeAt: new Date().toLocaleTimeString(),
            }
          : row,
      ),
    );
  }, []);

  const handleSideChange = useCallback((id: string, nextSide: StrategySide) => {
    setStrategies((prev) =>
      prev.map((row) =>
        row.id === id
          ? {
              ...row,
              side: nextSide,
              lastChangeAt: new Date().toLocaleTimeString(),
            }
          : row,
      ),
    );
  }, []);

  const columnDefs = useMemo<ColDef<StrategyRow>[]>(
    () => [
      {
        field: "ticker",
        headerName: "Underlying",
        pinned: "left",
        minWidth: 140,
        cellRenderer: (params) => (
          <div className="flex flex-col">
            <span className="font-semibold text-foreground">{params.data?.ticker}</span>
            <span className="font-sans text-[11px] text-muted-foreground">{params.data?.name}</span>
          </div>
        ),
        cellClass: "font-sans",
        valueGetter: (params) => params.data?.ticker,
        sortable: true,
        filter: "agTextColumnFilter",
      },
      {
        field: "side",
        headerName: "Side",
        minWidth: 150,
        editable: true,
        cellClassRules: sideClassRules,
        cellEditor: SideCellEditor,
        cellEditorPopup: true,
        valueSetter: (params: ValueSetterParams<StrategyRow, StrategySide>) => {
          if (!params.data) return false;
          const next = params.newValue as StrategySide | null | undefined;
          if (!next || params.data.side === next) {
            return false;
          }
          params.data.side = next;
          handleSideChange(params.data.id, next);
          return true;
        },
      },
      {
        headerName: "Pricing",
        marryChildren: true,
        children: [
          {
            field: "futPx",
            headerName: "Futures",
            minWidth: 120,
            cellRenderer: PriceDeltaCell,
            cellRendererParams: { deltaField: "futChange", formatter: priceFormatter },
            cellClassRules: {
              "bg-red-500/10": (params) => {
                const data = params.data;
                if (!data || typeof data.futChange !== "number") return false;
                if (data.side === "Buy Futures / Sell Equity") {
                  return data.futChange < 0;
                }
                if (data.side === "Sell Futures / Buy Equity") {
                  return data.futChange > 0;
                }
                return false;
              },
              "bg-emerald-500/10": (params) => {
                const data = params.data;
                if (!data || typeof data.futChange !== "number") return false;
                if (data.side === "Buy Futures / Sell Equity") {
                  return data.futChange > 0;
                }
                if (data.side === "Sell Futures / Buy Equity") {
                  return data.futChange < 0;
                }
                return false;
              },
            },
          },
          {
            field: "eqPx",
            headerName: "Equity",
            minWidth: 120,
            cellRenderer: PriceDeltaCell,
            cellRendererParams: { deltaField: "eqChange", formatter: priceFormatter },
            cellClassRules: {
              "bg-red-500/10": (params) => {
                const data = params.data;
                if (!data || typeof data.eqChange !== "number") return false;
                if (data.side === "Buy Futures / Sell Equity") {
                  return data.eqChange > 0;
                }
                if (data.side === "Sell Futures / Buy Equity") {
                  return data.eqChange < 0;
                }
                return false;
              },
              "bg-emerald-500/10": (params) => {
                const data = params.data;
                if (!data || typeof data.eqChange !== "number") return false;
                if (data.side === "Buy Futures / Sell Equity") {
                  return data.eqChange < 0;
                }
                if (data.side === "Sell Futures / Buy Equity") {
                  return data.eqChange > 0;
                }
                return false;
              },
            },
          },
          {
            field: "spread",
            headerName: "Spread",
            minWidth: 120,
            cellRenderer: PriceDeltaCell,
            cellRendererParams: { deltaField: "spreadChange", formatter: decimalFormatter, precision: 2 },
            cellClassRules: {
              "bg-red-500/10": (params) => {
                const data = params.data;
                if (!data || typeof data.spreadChange !== "number") return false;
                if (Math.abs(data.spread - data.targetSpread) >= data.tolerance) {
                  return true;
                }
                const gap = data.targetSpread - data.spread;
                if (gap === 0) return false;
                return gap > 0 ? data.spreadChange < 0 : data.spreadChange > 0;
              },
              "bg-emerald-500/10": (params) => {
                const data = params.data;
                if (!data || typeof data.spreadChange !== "number") return false;
                const gap = data.targetSpread - data.spread;
                if (gap === 0) return false;
                return gap > 0 ? data.spreadChange > 0 : data.spreadChange < 0;
              },
            },
          },
        ],
      },
      {
        field: "targetSpread",
        headerName: "Target",
        minWidth: 92,
        valueFormatter: (params) => (params.value != null ? decimalFormatter.format(params.value) : ""),
      },
      {
        field: "entry",
        headerName: "Entry",
        minWidth: 92,
        editable: true,
        cellEditor: EditableNumberCell,
        cellEditorParams: { step: 0.05, precision: 2 },
        valueFormatter: (params) => (params.value != null ? decimalFormatter.format(params.value) : ""),
        valueParser: (params: ValueParserParams<StrategyRow>) => {
          const parsed = Number(params.newValue);
          return Number.isFinite(parsed) ? parsed : params.oldValue ?? 0;
        },
        valueSetter: (params: ValueSetterParams<StrategyRow, number>) => {
          if (!params.data) return false;
          const normalized = normalizeStrategyValue("entry", params.newValue, params.data.entry);
          if (normalized === params.data.entry) {
            return false;
          }
          params.data.entry = normalized;
          handleStrategyPatch(params.data.id, "entry", normalized);
          return true;
        },
      },
      {
        field: "exit",
        headerName: "Exit",
        minWidth: 92,
        editable: true,
        cellEditor: EditableNumberCell,
        cellEditorParams: { step: 0.05, precision: 2 },
        valueFormatter: (params) => (params.value != null ? decimalFormatter.format(params.value) : ""),
        valueParser: (params: ValueParserParams<StrategyRow>) => {
          const parsed = Number(params.newValue);
          return Number.isFinite(parsed) ? parsed : params.oldValue ?? 0;
        },
        valueSetter: (params: ValueSetterParams<StrategyRow, number>) => {
          if (!params.data) return false;
          const normalized = normalizeStrategyValue("exit", params.newValue, params.data.exit);
          if (normalized === params.data.exit) {
            return false;
          }
          params.data.exit = normalized;
          handleStrategyPatch(params.data.id, "exit", normalized);
          return true;
        },
      },
      {
        field: "maxQty",
        headerName: "Max/Ord",
        minWidth: 96,
        editable: true,
        cellEditor: EditableNumberCell,
        cellEditorParams: { step: 50, min: 0, max: 10000, precision: 0 },
        valueFormatter: (params) => (params.value != null ? numberFormatter.format(params.value) : ""),
        valueParser: (params: ValueParserParams<StrategyRow>) => {
          const parsed = Number(params.newValue);
          return Number.isFinite(parsed) ? parsed : params.oldValue ?? 0;
        },
        valueSetter: (params: ValueSetterParams<StrategyRow, number>) => {
          if (!params.data) return false;
          const normalized = normalizeStrategyValue("maxQty", params.newValue, params.data.maxQty);
          if (normalized === params.data.maxQty) {
            return false;
          }
          params.data.maxQty = normalized;
          handleStrategyPatch(params.data.id, "maxQty", normalized);
          return true;
        },
      },
      {
        field: "hedgeRatio",
        headerName: "HedgeR",
        minWidth: 92,
        editable: true,
        cellEditor: EditableNumberCell,
        cellEditorParams: { step: 0.01, min: 0, max: 5, precision: 2 },
        valueFormatter: (params) => (params.value != null ? params.value.toFixed(2) : ""),
        valueParser: (params: ValueParserParams<StrategyRow>) => {
          const parsed = Number(params.newValue);
          return Number.isFinite(parsed) ? parsed : params.oldValue ?? 0;
        },
        valueSetter: (params: ValueSetterParams<StrategyRow, number>) => {
          if (!params.data) return false;
          const normalized = normalizeStrategyValue("hedgeRatio", params.newValue, params.data.hedgeRatio);
          if (normalized === params.data.hedgeRatio) {
            return false;
          }
          params.data.hedgeRatio = normalized;
          handleStrategyPatch(params.data.id, "hedgeRatio", normalized);
          return true;
        },
      },
      {
        headerName: "Risk",
        marryChildren: true,
        children: [
          {
            field: "tolerance",
            headerName: "Tolerance",
            minWidth: 110,
            editable: true,
            cellEditor: EditableNumberCell,
            cellEditorParams: { step: 0.05, min: 0, max: 5, precision: 2 },
            valueFormatter: (params) => (params.value != null ? params.value.toFixed(2) : ""),
            valueParser: (params: ValueParserParams<StrategyRow>) => {
              const parsed = Number(params.newValue);
              return Number.isFinite(parsed) ? parsed : params.oldValue ?? 0;
            },
            valueSetter: (params: ValueSetterParams<StrategyRow, number>) => {
              if (!params.data) return false;
              const normalized = normalizeStrategyValue("tolerance", params.newValue, params.data.tolerance);
              if (normalized === params.data.tolerance) {
                return false;
              }
              params.data.tolerance = normalized;
              handleStrategyPatch(params.data.id, "tolerance", normalized);
              return true;
            },
          },
          {
            field: "latencyThreshold",
            headerName: "Latency",
            minWidth: 110,
            editable: true,
            cellEditor: EditableNumberCell,
            cellEditorParams: { step: 5, min: 0, max: 2000, precision: 0 },
            valueFormatter: (params) => (params.value != null ? params.value.toFixed(0) : ""),
            valueParser: (params: ValueParserParams<StrategyRow>) => {
              const parsed = Number(params.newValue);
              return Number.isFinite(parsed) ? parsed : params.oldValue ?? 0;
            },
            valueSetter: (params: ValueSetterParams<StrategyRow, number>) => {
              if (!params.data) return false;
              const normalized = normalizeStrategyValue(
                "latencyThreshold",
                params.newValue,
                params.data.latencyThreshold,
              );
              if (normalized === params.data.latencyThreshold) {
                return false;
              }
              params.data.latencyThreshold = normalized;
              handleStrategyPatch(params.data.id, "latencyThreshold", normalized);
              return true;
            },
          },
        ],
      },
      {
        headerName: "Orders",
        marryChildren: true,
        children: [
          {
            field: "orderStatus",
            headerName: "Status",
            minWidth: 140,
            cellRenderer: OrderStatusCell,
            sortable: false,
            filter: false,
          },
          {
            field: "fillProgress",
            headerName: "Fill %",
            minWidth: 150,
            valueGetter: (params) => params.data?.fillProgress ?? 0,
            cellRenderer: FillProgressCell,
            filter: false,
          },
          {
            field: "lastOrderUpdate",
            headerName: "Since Change",
            minWidth: 130,
            cellRenderer: TimeSinceCell,
            comparator: (a: number | null | undefined, b: number | null | undefined) =>
              (a ?? 0) - (b ?? 0),
            filter: false,
          },
        ],
      },
      {
        field: "posEq",
        headerName: "Pos Eq",
        minWidth: 110,
        valueFormatter: (params) => (params.value != null ? formatSigned(params.value) : ""),
      },
      {
        field: "posFutLots",
        headerName: "Pos Fut",
        minWidth: 110,
        valueFormatter: (params) => (params.value != null ? formatSigned(params.value) : ""),
      },
      {
        field: "upl",
        headerName: "UPL",
        minWidth: 120,
        valueFormatter: (params) => (params.value != null ? currencyFormatter.format(params.value) : ""),
        cellClassRules: {
          "text-emerald-500": (params) => (params.value ?? 0) >= 0,
          "text-red-500": (params) => (params.value ?? 0) < 0,
        },
      },
      {
        field: "latMs",
        headerName: "Lat(ms)",
        minWidth: 96,
        valueFormatter: (params) => (params.value != null ? params.value.toFixed(0) : ""),
        cellClassRules: {
          "bg-red-500/10": (params) => {
            const data = params.data;
            if (!data || params.value == null) return false;
            return params.value >= data.latencyThreshold;
          },
        },
      },
      {
        field: "status",
        headerName: "Status",
        minWidth: 100,
        cellRenderer: (params) => {
          const status = params.data?.status;
          const color =
            status === "ACTIVE"
              ? "text-emerald-500"
              : status === "ERROR"
                ? "text-red-500"
                : "text-muted-foreground";
          return <span className={cn("font-semibold", color)}>{status}</span>;
        },
        cellClass: "font-sans",
      },
      {
        field: "actions",
        headerName: "Actions",
        minWidth: 200,
        cellRenderer: (params: ICellRendererParams<StrategyRow>) => {
          const row = params.data;
          if (!row) return null;
          return (
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleFlatten(row.id)}
                className="h-7 px-2 text-[11px]"
              >
                Flatten
              </Button>
              <Button
                size="sm"
                variant={row.status === "HALTED" ? "secondary" : "outline"}
                onClick={() => handleToggleHalt(row.id)}
                className="h-7 px-2 text-[11px]"
              >
                {row.status === "HALTED" ? "Enable" : "Disable"}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleReverse(row.id)}
                className="h-7 px-2 text-[11px]"
              >
                Reverse
              </Button>
            </div>
          );
        },
        editable: false,
        sortable: false,
        filter: false,
        suppressAutoSize: true,
        cellClass: "font-sans",
      },
    ],
    [
      formatSigned,
      handleFlatten,
      handleReverse,
      handleSideChange,
      handleStrategyPatch,
      handleToggleHalt,
      normalizeStrategyValue,
      sideClassRules,
    ],
  );

  const familySummary = useMemo(() => {
    const families = new Map<StrategySide, {
      active: number;
      halted: number;
      exposure: number;
      upl: number;
      spreadSum: number;
      count: number;
    }>();

    strategies.forEach((row) => {
      if (row.side === "Idle") return;
      if (!families.has(row.side)) {
        families.set(row.side, { active: 0, halted: 0, exposure: 0, upl: 0, spreadSum: 0, count: 0 });
      }
      const bucket = families.get(row.side)!;
      bucket.active += row.status === "ACTIVE" ? 1 : 0;
      bucket.halted += row.status === "HALTED" ? 1 : 0;
      bucket.exposure += Math.abs(row.posEq * row.eqPx) + Math.abs(row.posFutLots * row.futPx * 250);
      bucket.upl += row.upl;
      bucket.spreadSum += row.spread;
      bucket.count += 1;
    });

    return Array.from(families.entries()).map(([side, stats]) => ({
      side,
      active: stats.active,
      halted: stats.halted,
      exposure: stats.exposure,
      upl: stats.upl,
      avgSpread: stats.count ? stats.spreadSum / stats.count : 0,
    }));
  }, [strategies]);

  const exposureSnapshot = useMemo(() => {
    const netEq = strategies.reduce((acc, row) => acc + row.posEq * row.eqPx, 0);
    const netFut = strategies.reduce((acc, row) => acc + row.posFutLots, 0);
    const basisSens = strategies.reduce((acc, row) => acc + row.hedgeRatio * row.maxQty, 0);
    return { netEq, netFut, basisSens };
  }, [strategies]);

  const toggleDrawerExpanded = useCallback(() => {
    setDrawerExpanded((prev) => !prev);
  }, []);

  const handleBroadcastApply = useCallback(() => {
    if (!selectedIds.length) return;
    setStrategies((prev) =>
      prev.map((row) => {
        if (!selectedIds.includes(row.id)) return row;
        return {
          ...row,
          entry: broadcastDraft.entry ? Number(broadcastDraft.entry) : row.entry,
          exit: broadcastDraft.exit ? Number(broadcastDraft.exit) : row.exit,
          maxQty: broadcastDraft.maxQty ? Number(broadcastDraft.maxQty) : row.maxQty,
          hedgeRatio: broadcastDraft.hedgeRatio ? Number(broadcastDraft.hedgeRatio) : row.hedgeRatio,
        };
      }),
    );
    setBroadcastOpen(false);
    setBroadcastDraft({});
  }, [broadcastDraft, selectedIds]);

  const handleAddUnderlying = useCallback(
    (ticker: string) => {
      const template = availableTickers.find((item) => item.ticker === ticker);
      if (!template) return;
      const source = strategies[0];
      const newRow: StrategyRow = {
        id: `${ticker}-${Date.now()}`,
        ticker: template.ticker,
        name: template.name,
        side: template.side,
        futPx: template.side === "Buy Futures / Sell Equity" ? 0 : 0,
        futChange: 0,
        eqPx: 0,
        eqChange: 0,
        spread: 0,
        spreadChange: 0,
        targetSpread: 0,
        entry: source?.entry ?? 0,
        exit: source?.exit ?? 0,
        maxQty: source?.maxQty ?? 0,
        hedgeRatio: source?.hedgeRatio ?? 1,
        posEq: 0,
        posFutLots: 0,
        upl: 0,
        latMs: 0,
        status: "ACTIVE",
        orderStatus: "Idle",
        fillProgress: 0,
        lastOrderUpdate: Date.now(),
        lastChangeAt: new Date().toLocaleTimeString(),
        tolerance: 0.5,
        latencyThreshold: 100,
        fills: [],
        notes: "New underlying initialized from template.",
      };
      setStrategies((prev) => [newRow, ...prev]);
      setAddOpen(false);
    },
    [strategies],
  );

  const handleCloneParams = useCallback(
    (sourceId: string) => {
      const template = strategies.find((row) => row.id === sourceId);
      if (!template) return;
      setStrategies((prev) =>
        prev.map((row) => {
          if (!selectedIds.includes(row.id)) return row;
          return {
            ...row,
            entry: template.entry,
            exit: template.exit,
            maxQty: template.maxQty,
            hedgeRatio: template.hedgeRatio,
          };
        }),
      );
    },
    [selectedIds, strategies],
  );

  const handleHaltAll = useCallback(() => {
    if (!haltConfirm) {
      setHaltConfirm(true);
      if (haltTimeoutRef.current) {
        clearTimeout(haltTimeoutRef.current);
      }
      haltTimeoutRef.current = setTimeout(() => setHaltConfirm(false), 3000);
      return;
    }
    setStrategies((prev) =>
      prev.map((row) => ({
        ...row,
        status: "HALTED",
        lastChangeAt: new Date().toLocaleTimeString(),
      })),
    );
    setHaltConfirm(false);
  }, [haltConfirm]);

  const handleResumeAll = useCallback(() => {
    setStrategies((prev) =>
      prev.map((row) =>
        row.status === "ERROR"
          ? row
          : {
              ...row,
              status: "ACTIVE",
              lastChangeAt: new Date().toLocaleTimeString(),
            },
      ),
    );
  }, []);

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      if (acknowledged[event.id] && event.requiresAck) {
        return false;
      }
      if (event.tab !== drawerTab) return false;
      if (drawerFilter.onlyAbnormal && event.severity === "success") return false;
      if (drawerFilter.ticker && event.ticker !== drawerFilter.ticker) return false;
      if (drawerFilter.onlySelected && selectedIds.length && !selectedIds.some((id) => event.ticker.startsWith(id.slice(0, 6)))) {
        return false;
      }
      return true;
    });
  }, [acknowledged, drawerFilter.onlyAbnormal, drawerFilter.onlySelected, drawerFilter.ticker, drawerTab, events, selectedIds]);

  const handleAck = useCallback((id: string) => {
    setAcknowledged((prev) => ({ ...prev, [id]: true }));
  }, []);

  const handleChipClick = useCallback(
    (chip: AlertChip) => {
      setDrawerExpanded(true);
      setDrawerTab(chip.tab);
      setDrawerFilter((prev) => ({ ...prev, ticker: chip.ticker }));
    },
    [],
  );

  const handleClearAlerts = useCallback(() => {
    setAlerts([]);
  }, []);

  const toggleAlertsExpanded = useCallback(() => {
    setAlertsExpanded((prev) => !prev);
  }, []);

  const handleFamilyFilter = useCallback(
    (side: StrategySide) => {
      const api = gridRef.current?.api;
      if (!api) return;
      api.setFilterModel({
        side: {
          type: "equals",
          filterType: "text",
          filter: side,
        },
      });
      api.onFilterChanged();
    },
    [],
  );

  const rotateMode = useCallback(() => {
    setMode((prev) => (prev === "AUTO" ? "SEMI" : prev === "SEMI" ? "MANUAL" : "AUTO"));
    setOverrideCount((prev) => (prev >= 5 ? 1 : prev + 1));
  }, []);

  return (
    <div className="flex h-full flex-1 flex-col overflow-hidden">
      <PageTemplate
        fullWidth
        headingVariant="compact"
        title="Strategy Cockpit"
        description="Pair-hedged equity-futures command center for high-frequency execution oversight."
      >
        <section className="grid items-start gap-3 md:grid-cols-12">
          <div className="grid items-stretch gap-2 md:col-span-6 md:grid-cols-[minmax(0,1.4fr),minmax(0,1fr)] xl:col-span-5">
            <div className="flex min-h-full flex-wrap items-center gap-2 rounded-lg border bg-background/80 p-3">
              <Popover open={addOpen} onOpenChange={setAddOpen}>
                <PopoverTrigger asChild>
                  <Button size="sm" className="gap-1">
                    + Add Underlying
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-72 p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search ticker…" />
                    <CommandList>
                      <CommandGroup heading="Available">
                        {availableTickers.map((item) => (
                          <CommandItem
                            key={item.ticker}
                            value={item.ticker}
                            onSelect={(value) => handleAddUnderlying(value)}
                          >
                            <div className="flex flex-col">
                              <span className="font-semibold">{item.ticker}</span>
                              <span className="text-xs text-muted-foreground">{item.name}</span>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              <SelectCloneControl strategies={strategies} onClone={handleCloneParams} disabled={!selectedIds.length} />
              <Popover open={broadcastOpen} onOpenChange={setBroadcastOpen}>
                <PopoverTrigger asChild>
                  <Button size="sm" variant="outline" disabled={!selectedIds.length}>
                    Broadcast Params
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 space-y-3" align="start">
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-foreground">Broadcast to {selectedIds.length} rows</p>
                    <p className="text-xs text-muted-foreground">
                      Leave a field empty to skip updating that parameter.
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="space-y-1">
                      <Label htmlFor="broadcast-entry">Entry</Label>
                      <Input
                        id="broadcast-entry"
                        inputMode="decimal"
                        value={broadcastDraft.entry ?? ""}
                        onChange={(event) =>
                          setBroadcastDraft((prev) => ({ ...prev, entry: event.target.value }))
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="broadcast-exit">Exit</Label>
                      <Input
                        id="broadcast-exit"
                        inputMode="decimal"
                        value={broadcastDraft.exit ?? ""}
                        onChange={(event) =>
                          setBroadcastDraft((prev) => ({ ...prev, exit: event.target.value }))
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="broadcast-max">Max/Order</Label>
                      <Input
                        id="broadcast-max"
                        inputMode="numeric"
                        value={broadcastDraft.maxQty ?? ""}
                        onChange={(event) =>
                          setBroadcastDraft((prev) => ({ ...prev, maxQty: event.target.value }))
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="broadcast-hedge">Hedge Ratio</Label>
                      <Input
                        id="broadcast-hedge"
                        inputMode="decimal"
                        value={broadcastDraft.hedgeRatio ?? ""}
                        onChange={(event) =>
                          setBroadcastDraft((prev) => ({ ...prev, hedgeRatio: event.target.value }))
                        }
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button size="sm" variant="ghost" onClick={() => setBroadcastOpen(false)}>
                      Cancel
                    </Button>
                    <Button size="sm" onClick={handleBroadcastApply}>
                      Apply
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            <div className="grid gap-1.5 sm:grid-cols-2">
              {familySummary.map((family) => (
                <Card
                  key={family.side}
                  className="cursor-pointer border-dashed transition hover:border-primary"
                  onClick={() => handleFamilyFilter(family.side)}
                >
                  <CardContent className="flex flex-col gap-0.5 p-2.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-muted-foreground">{family.side}</span>
                      <Badge variant="secondary" className="text-[10px] uppercase">
                        Active {family.active} / Halted {family.halted}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <span>Exposure</span>
                      <span>{currencyFormatter.format(family.exposure)}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <span>UPL</span>
                      <span className={family.upl >= 0 ? "text-emerald-500" : "text-red-500"}>
                        {currencyFormatter.format(family.upl)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <span>Avg Spread</span>
                      <span>{decimalFormatter.format(family.avgSpread)}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
          <div className="md:col-span-3 flex h-full flex-col gap-2.5 rounded-lg border bg-background/80 p-3 xl:col-span-3">
            <div className="flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                variant="destructive"
                className={cn("gap-1", haltConfirm ? "animate-pulse" : undefined)}
                onClick={handleHaltAll}
              >
                <PauseCircle className="size-3.5" /> HALT ALL
              </Button>
              <Button size="sm" variant="outline" onClick={handleResumeAll}>
                <PlayCircle className="size-3.5" /> RESUME ALL
              </Button>
              <Button size="sm" variant="ghost" onClick={rotateMode} className="ml-auto">
                Mode: <span className="ml-1 font-semibold">{mode}</span>
                <Badge variant="outline" className="ml-2 text-[10px]">
                  Overrides {overrideCount}
                </Badge>
              </Button>
            </div>
            <div className="grid gap-1.5 text-[11px] font-mono">
              <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                <span className="font-semibold uppercase tracking-wide text-muted-foreground">
                  Exposure snapshot
                </span>
                <span className="text-right">
                  Net Eq {currencyFormatter.format(exposureSnapshot.netEq)} | Net Fut {formatSigned(exposureSnapshot.netFut)} lots |
                  Basis Sens {decimalFormatter.format(exposureSnapshot.basisSens)} / 1bp
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-[10px] font-semibold">
                <HealthBadge label="FIX" ok />
                <HealthBadge label="Pricing" ok />
                <HealthBadge label="Queue" ok={false} detail="42ms" />
                <Badge variant="outline">Feed 24ms</Badge>
                <Badge variant="outline">Last tick 09:31:22</Badge>
              </div>
            </div>
          </div>
          <div className="md:col-span-3 flex h-full flex-col gap-1.5 overflow-hidden rounded-lg border bg-background/80 p-3 xl:col-span-4">
            <div className="flex items-center gap-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Live Alerts</p>
              <div className="ml-auto flex items-center gap-1.5">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleClearAlerts}
                  disabled={!alerts.length}
                  className="gap-1"
                >
                  <X className="size-3" /> Clear
                </Button>
                <Button size="sm" variant="outline" onClick={toggleAlertsExpanded} className="gap-1">
                  {alertsExpanded ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
                  <span className="text-xs font-semibold">
                    {alertsExpanded ? "Collapse" : "Expand"}
                  </span>
                </Button>
              </div>
            </div>
            <ScrollArea className={cn("rounded-md border bg-background/60", alertsExpanded ? "h-56" : "h-28")}>
              <div className="flex min-h-full flex-col gap-2 px-3 py-2">
                {alerts.length ? (
                  alerts.map((chip) => (
                    <button
                      key={chip.id}
                      type="button"
                      onClick={() => handleChipClick(chip)}
                      className={cn(
                        "flex flex-col gap-1 rounded-md border px-3 py-2 text-left text-xs transition",
                        severityClassMap[chip.severity],
                        alertsExpanded ? "min-h-[72px]" : "min-h-[60px]",
                      )}
                    >
                      <span className="flex items-center justify-between font-mono text-[11px]">
                        <span>{chip.timestamp}</span>
                        <span>{chip.ticker}</span>
                      </span>
                      <span
                        className={cn(
                          "text-[12px] font-semibold text-foreground",
                          alertsExpanded ? "line-clamp-3" : "line-clamp-2",
                        )}
                      >
                        {chip.message}
                      </span>
                    </button>
                  ))
                ) : (
                  <div className="flex h-24 items-center justify-center text-xs text-muted-foreground">
                    All quiet. Waiting for signals.
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </section>
        <div className="flex min-h-0 flex-1 flex-col gap-3 pb-24">
          <div className="ag-theme-quartz h-full w-full rounded-xl border">
            <AgGridReact<StrategyRow>
              ref={gridRef}
              rowData={strategies}
              columnDefs={columnDefs}
              defaultColDef={defaultColDef}
              getRowId={getRowId}
              rowSelection="multiple"
              animateRows
              enableCellChangeFlash
              suppressRowClickSelection={false}
              onCellValueChanged={handleCellValueChanged}
              pinnedTopRowData={pinnedTopRowData}
              masterDetail
              detailRowHeight={165}
              detailCellRenderer={StrategyDetailCell}
              onSelectionChanged={handleSelectionChanged}
              onGridReady={handleGridReady}
              onGridSizeChanged={handleGridSizeChanged}
              rowHeight={42}
              headerHeight={40}
            />
          </div>
        </div>
      </PageTemplate>

      <div className="pointer-events-none fixed bottom-4 left-6 right-6 z-30">
        <div
          className={cn(
            "pointer-events-auto overflow-hidden rounded-2xl border bg-background/95 shadow-2xl backdrop-blur",
            drawerExpanded ? "h-[30vh]" : "h-12",
          )}
        >
          <div className="flex items-center gap-3 border-b px-4 py-2 text-xs">
            <Button variant="ghost" size="sm" onClick={toggleDrawerExpanded} className="gap-1">
              <ArrowRightLeft className="size-3.5" /> {drawerExpanded ? "Collapse" : "Event Drawer"}
            </Button>
            <div className="flex items-center gap-2">
              <Switch
                id="drawer-abnormal"
                checked={drawerFilter.onlyAbnormal}
                onCheckedChange={(checked) =>
                  setDrawerFilter((prev) => ({ ...prev, onlyAbnormal: checked }))
                }
              />
              <Label htmlFor="drawer-abnormal" className="text-xs text-muted-foreground">
                Only abnormal
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="drawer-selected"
                checked={drawerFilter.onlySelected}
                onCheckedChange={(checked) =>
                  setDrawerFilter((prev) => ({ ...prev, onlySelected: checked }))
                }
              />
              <Label htmlFor="drawer-selected" className="text-xs text-muted-foreground">
                Only selected rows
              </Label>
            </div>
            {drawerFilter.ticker ? (
              <Badge variant="secondary" className="ml-auto cursor-pointer" onClick={() => setDrawerFilter((prev) => ({ ...prev, ticker: undefined }))}>
                Filter: {drawerFilter.ticker}
              </Badge>
            ) : null}
          </div>
          {drawerExpanded ? (
            <div className="flex h-full flex-col">
              <Tabs value={drawerTab} onValueChange={(value) => setDrawerTab(value as DrawerTab)} className="flex h-full flex-col">
                <TabsList className="mx-4 mt-3 grid grid-cols-4">
                  <TabsTrigger value="fills">Fills</TabsTrigger>
                  <TabsTrigger value="alerts">Alerts</TabsTrigger>
                  <TabsTrigger value="system">System</TabsTrigger>
                  <TabsTrigger value="adjustments">Auto Adjustments</TabsTrigger>
                </TabsList>
                <TabsContent value="fills" className="flex-1 overflow-hidden px-4 pb-4 pt-3">
                  <EventFeed
                    events={filteredEvents.filter((event) => event.tab === "fills")}
                    onAck={handleAck}
                    acknowledged={acknowledged}
                  />
                </TabsContent>
                <TabsContent value="alerts" className="flex-1 overflow-hidden px-4 pb-4 pt-3">
                  <EventFeed
                    events={filteredEvents.filter((event) => event.tab === "alerts")}
                    onAck={handleAck}
                    acknowledged={acknowledged}
                  />
                </TabsContent>
                <TabsContent value="system" className="flex-1 overflow-hidden px-4 pb-4 pt-3">
                  <EventFeed
                    events={filteredEvents.filter((event) => event.tab === "system")}
                    onAck={handleAck}
                    acknowledged={acknowledged}
                  />
                </TabsContent>
                <TabsContent value="adjustments" className="flex-1 overflow-hidden px-4 pb-4 pt-3">
                  <EventFeed
                    events={filteredEvents.filter((event) => event.tab === "adjustments")}
                    onAck={handleAck}
                    acknowledged={acknowledged}
                  />
                </TabsContent>
              </Tabs>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function EventFeed({
  events,
  onAck,
  acknowledged,
}: {
  events: DrawerEvent[];
  onAck: (id: string) => void;
  acknowledged: Record<string, boolean>;
}) {
  return (
    <ScrollArea className="h-full">
      <div className="flex flex-col gap-2">
        {events.length === 0 ? (
          <div className="flex h-24 items-center justify-center text-xs text-muted-foreground">
            Nothing to show. All clear.
          </div>
        ) : (
          events.map((event) => {
            const isCritical = event.severity === "critical";
            const isAcknowledged = acknowledged[event.id];
            return (
              <div
                key={event.id}
                className={cn(
                  "rounded-lg border p-3 text-xs transition",
                  severityClassMap[event.severity],
                  isCritical && !isAcknowledged ? "ring-2 ring-red-500/60" : undefined,
                )}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 font-mono text-[11px]">
                  <span>{event.timestamp}</span>
                  <span>{event.ticker}</span>
                  <Badge variant="outline">{event.category}</Badge>
                </div>
                <div className="mt-1 flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <p className="font-semibold text-foreground">{event.summary}</p>
                    <p className="text-muted-foreground">{event.detail}</p>
                  </div>
                  {event.severity === "critical" ? <AlertTriangle className="size-4 text-red-500" /> : null}
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Button
                    size="sm"
                    variant={event.primaryAction.intent === "destructive" ? "destructive" : "default"}
                    className="h-7 px-2 text-[11px]"
                  >
                    {event.primaryAction.label}
                  </Button>
                  {event.secondaryAction ? (
                    <Button size="sm" variant="outline" className="h-7 px-2 text-[11px]">
                      {event.secondaryAction.label}
                    </Button>
                  ) : null}
                  {event.requiresAck ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onAck(event.id)}
                      className="h-7 px-2 text-[11px]"
                    >
                      {isAcknowledged ? "Acked" : "Acknowledge"}
                    </Button>
                  ) : null}
                </div>
              </div>
            );
          })
        )}
      </div>
    </ScrollArea>
  );
}

function HealthBadge({ label, ok, detail }: { label: string; ok: boolean; detail?: string }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-1 text-[11px]",
        ok ? "border-emerald-500/60 text-emerald-500" : "border-amber-500/60 text-amber-500",
      )}
    >
      <span className={cn("inline-block size-1.5 rounded-full", ok ? "bg-emerald-500" : "bg-amber-500")} />
      {label}
      {detail ? <span className="font-mono">{detail}</span> : null}
    </Badge>
  );
}
