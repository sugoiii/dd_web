
import { useMemo, useState } from "react";
import {
  themeBalham,
  type ColDef,
  type ColGroupDef,
  type ICellRendererParams,
  type ValueFormatterParams,
} from "ag-grid-community";
import { ModuleRegistry, AllEnterpriseModule } from "ag-grid-enterprise";
import { AgGridReact } from "ag-grid-react";

ModuleRegistry.registerModules([AllEnterpriseModule]);

type FuturesRow = {
  contract: string;
  currency: "KRW" | "USD";
  actual: number;
  theoretical: number;
  basisBps: number;
  carryBps: number;
  openInterest: number;
};

type LadderRow = {
  level: string;
  ourBid: number;
  ourBidQty: number;
  mmBid: number;
  mmBidQty: number;
  nonMmBid: number;
  nonMmBidQty: number;
  ourAsk: number;
  ourAskQty: number;
  mmAsk: number;
  mmAskQty: number;
  nonMmAsk: number;
  nonMmAskQty: number;
};

type PositionRow = {
  book: string;
  goldDeltaOz: number;
  fxDeltaUsdMillions: number;
  reference: number;
  mark: number;
  pricingUnit: "KRW" | "USD" | "FX";
  hedgeInstrument: string;
  hedgeRatio: number;
  pnl: number;
  pnlCurrency: "KRW" | "USD";
};

type FxHedgeRow = {
  pair: string;
  positionUsdMillions: number;
  hedgeInstrument: string;
  coverage: number;
  points: number;
  comment: string;
};

type GlobalBasisRow = {
  market: string;
  currency: "KRW" | "USD";
  last: number;
  krwEquivalent: number;
  internalTheo: number;
  basisToKrxBps: number;
  basisToTheoBps: number;
  fundingAdjBps: number;
  carryBps: number;
  comment: string;
};

type PremiumHistoryRow = {
  bucket: string;
  vsXau: number;
  vsCme: number;
  fxAdj: number;
  trail: number[];
};

type PremiumSignalRow = {
  signal: string;
  level: string;
  change: string;
  action: string;
};

const krwFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "KRW",
  maximumFractionDigits: 0,
});

const usdFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

const fxFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 2,
});

const sizeFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 0,
});

const bpsFormatter = (value: number) => {
  const prefix = value > 0 ? "+" : value < 0 ? "-" : "";
  return `${prefix}${Math.abs(value).toFixed(1)} bps`;
};

const ozFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 0,
});

const usdMillionsFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 1,
});

const percentFormatter = (value: number) => `${(value * 100).toFixed(0)}%`;

const usdKrw = 1346.1;

const krx1kgSnapshot = {
  last: 82460,
  internalTheo: 82330,
  basisVsXauBps: 146,
  basisVsCmeBps: 171,
  prevClose: 82205,
  sessionHigh: 82540,
  sessionLow: 82190,
};

const krx100gSnapshot = {
  last: 82488,
  internalTheo: 82340,
  basisVsXauBps: 158,
  basisVsCmeBps: 183,
  prevClose: 82260,
  sessionHigh: 82520,
  sessionLow: 82210,
};

const krx1kgLadderRows: LadderRow[] = [
  {
    level: "Top",
    ourBid: 82447,
    ourBidQty: 62,
    mmBid: 82445,
    mmBidQty: 118,
    nonMmBid: 82442,
    nonMmBidQty: 86,
    ourAsk: 82453,
    ourAskQty: 58,
    mmAsk: 82455,
    mmAskQty: 112,
    nonMmAsk: 82458,
    nonMmAskQty: 79,
  },
  {
    level: "L2",
    ourBid: 82444,
    ourBidQty: 55,
    mmBid: 82441,
    mmBidQty: 105,
    nonMmBid: 82438,
    nonMmBidQty: 81,
    ourAsk: 82457,
    ourAskQty: 54,
    mmAsk: 82460,
    mmAskQty: 103,
    nonMmAsk: 82463,
    nonMmAskQty: 73,
  },
  {
    level: "L3",
    ourBid: 82439,
    ourBidQty: 47,
    mmBid: 82436,
    mmBidQty: 96,
    nonMmBid: 82433,
    nonMmBidQty: 74,
    ourAsk: 82462,
    ourAskQty: 49,
    mmAsk: 82466,
    mmAskQty: 95,
    nonMmAsk: 82469,
    nonMmAskQty: 66,
  },
  {
    level: "L4",
    ourBid: 82434,
    ourBidQty: 41,
    mmBid: 82431,
    mmBidQty: 88,
    nonMmBid: 82428,
    nonMmBidQty: 69,
    ourAsk: 82466,
    ourAskQty: 46,
    mmAsk: 82470,
    mmAskQty: 87,
    nonMmAsk: 82474,
    nonMmAskQty: 61,
  },
  {
    level: "L5",
    ourBid: 82430,
    ourBidQty: 36,
    mmBid: 82427,
    mmBidQty: 79,
    nonMmBid: 82424,
    nonMmBidQty: 63,
    ourAsk: 82470,
    ourAskQty: 42,
    mmAsk: 82475,
    mmAskQty: 78,
    nonMmAsk: 82479,
    nonMmAskQty: 55,
  },
];

const krx100gLadderRows: LadderRow[] = [
  {
    level: "Top",
    ourBid: 82476,
    ourBidQty: 58,
    mmBid: 82475,
    mmBidQty: 122,
    nonMmBid: 82472,
    nonMmBidQty: 94,
    ourAsk: 82488,
    ourAskQty: 61,
    mmAsk: 82491,
    mmAskQty: 116,
    nonMmAsk: 82495,
    nonMmAskQty: 87,
  },
  {
    level: "L2",
    ourBid: 82472,
    ourBidQty: 52,
    mmBid: 82470,
    mmBidQty: 109,
    nonMmBid: 82468,
    nonMmBidQty: 88,
    ourAsk: 82494,
    ourAskQty: 55,
    mmAsk: 82498,
    mmAskQty: 105,
    nonMmAsk: 82502,
    nonMmAskQty: 79,
  },
  {
    level: "L3",
    ourBid: 82468,
    ourBidQty: 45,
    mmBid: 82466,
    mmBidQty: 101,
    nonMmBid: 82464,
    nonMmBidQty: 82,
    ourAsk: 82499,
    ourAskQty: 49,
    mmAsk: 82503,
    mmAskQty: 97,
    nonMmAsk: 82507,
    nonMmAskQty: 72,
  },
  {
    level: "L4",
    ourBid: 82464,
    ourBidQty: 39,
    mmBid: 82462,
    mmBidQty: 92,
    nonMmBid: 82460,
    nonMmBidQty: 76,
    ourAsk: 82504,
    ourAskQty: 44,
    mmAsk: 82508,
    mmAskQty: 89,
    nonMmAsk: 82512,
    nonMmAskQty: 67,
  },
  {
    level: "L5",
    ourBid: 82460,
    ourBidQty: 33,
    mmBid: 82458,
    mmBidQty: 84,
    nonMmBid: 82456,
    nonMmBidQty: 69,
    ourAsk: 82508,
    ourAskQty: 39,
    mmAsk: 82513,
    mmAskQty: 81,
    nonMmAsk: 82517,
    nonMmAskQty: 61,
  },
];

const futuresRows: FuturesRow[] = [
  {
    contract: "KRX Gold Futures",
    currency: "KRW",
    actual: 82505,
    theoretical: 82360,
    basisBps: 177,
    carryBps: 61,
    openInterest: 18240,
  },
  {
    contract: "CME GC Dec",
    currency: "USD",
    actual: 2381.5,
    theoretical: 2383.2,
    basisBps: -71,
    carryBps: -18,
    openInterest: 286500,
  },
  {
    contract: "TOCOM Gold",
    currency: "USD",
    actual: 2379.8,
    theoretical: 2381.1,
    basisBps: -55,
    carryBps: -11,
    openInterest: 89210,
  },
];

const positionRows: PositionRow[] = [
  {
    book: "Physical Inventory",
    goldDeltaOz: 1620,
    fxDeltaUsdMillions: 0,
    reference: 82120,
    mark: 82460,
    pricingUnit: "KRW",
    hedgeInstrument: "Short KRX Futures",
    hedgeRatio: 0.78,
    pnl: 551000,
    pnlCurrency: "KRW",
  },
  {
    book: "KRX Futures",
    goldDeltaOz: -1290,
    fxDeltaUsdMillions: 0,
    reference: 82310,
    mark: 82490,
    pricingUnit: "KRW",
    hedgeInstrument: "Long CME GC",
    hedgeRatio: 0.65,
    pnl: -232000,
    pnlCurrency: "KRW",
  },
  {
    book: "CME Futures",
    goldDeltaOz: 940,
    fxDeltaUsdMillions: 0,
    reference: 2380.4,
    mark: 2381.1,
    pricingUnit: "USD",
    hedgeInstrument: "Short Spot Swap",
    hedgeRatio: 0.54,
    pnl: 0.48,
    pnlCurrency: "USD",
  },
  {
    book: "FX Forwards",
    goldDeltaOz: 0,
    fxDeltaUsdMillions: -14,
    reference: 1338.2,
    mark: 1346.1,
    pricingUnit: "FX",
    hedgeInstrument: "USD/KRW Swap",
    hedgeRatio: 0.92,
    pnl: -0.62,
    pnlCurrency: "USD",
  },
  {
    book: "Options Delta",
    goldDeltaOz: -220,
    fxDeltaUsdMillions: 3.4,
    reference: 82510,
    mark: 82420,
    pricingUnit: "KRW",
    hedgeInstrument: "Dynamic Delta",
    hedgeRatio: 0.48,
    pnl: -198000,
    pnlCurrency: "KRW",
  },
];

const fxHedgeRows: FxHedgeRow[] = [
  {
    pair: "USD/KRW",
    positionUsdMillions: -14,
    hedgeInstrument: "KRW Cross-Ccy Swap",
    coverage: 0.91,
    points: 21.5,
    comment: "Next roll T+2",
  },
  {
    pair: "JPY/KRW",
    positionUsdMillions: 3.2,
    hedgeInstrument: "Short-dated NDF",
    coverage: 0.76,
    points: 18.1,
    comment: "Tighten before Tokyo close",
  },
  {
    pair: "CNH/KRW",
    positionUsdMillions: -1.8,
    hedgeInstrument: "CNH Swap",
    coverage: 0.64,
    points: 25.4,
    comment: "Monitor CNH funding",
  },
];

const globalBasisRows: GlobalBasisRow[] = [
  {
    market: "KRX Gold 1kg",
    currency: "KRW",
    last: krx1kgSnapshot.last,
    krwEquivalent: krx1kgSnapshot.last,
    internalTheo: krx1kgSnapshot.internalTheo,
    basisToKrxBps: 0,
    basisToTheoBps: krx1kgSnapshot.basisVsXauBps,
    fundingAdjBps: 18,
    carryBps: 22,
    comment: "We lead offer; keep lean.",
  },
  {
    market: "KRX Gold 100g",
    currency: "KRW",
    last: krx100gSnapshot.last,
    krwEquivalent: krx100gSnapshot.last,
    internalTheo: krx100gSnapshot.internalTheo,
    basisToKrxBps: 36,
    basisToTheoBps: krx100gSnapshot.basisVsXauBps,
    fundingAdjBps: 22,
    carryBps: 26,
    comment: "Retail bid still sticky.",
  },
  {
    market: "XAU Spot",
    currency: "USD",
    last: 2383.4,
    krwEquivalent: 82315,
    internalTheo: 82320,
    basisToKrxBps: -32,
    basisToTheoBps: -6,
    fundingAdjBps: -4,
    carryBps: -3,
    comment: "Spot softer vs KRX prints.",
  },
  {
    market: "CME Gold Front",
    currency: "USD",
    last: 2381.1,
    krwEquivalent: 82245,
    internalTheo: 82300,
    basisToKrxBps: -55,
    basisToTheoBps: -18,
    fundingAdjBps: -12,
    carryBps: -18,
    comment: "Carry supported by funding.",
  },
  {
    market: "TOCOM Gold",
    currency: "USD",
    last: 2379.8,
    krwEquivalent: 82190,
    internalTheo: 82270,
    basisToKrxBps: -78,
    basisToTheoBps: -24,
    fundingAdjBps: -9,
    carryBps: -12,
    comment: "JPY leg heavy; watch cross.",
  },
];

const premiumHistoryRows: PremiumHistoryRow[] = [
  {
    bucket: "09:10",
    vsXau: 118,
    vsCme: 142,
    fxAdj: 12,
    trail: [104, 110, 114, 118, 117, 119],
  },
  {
    bucket: "09:30",
    vsXau: 132,
    vsCme: 156,
    fxAdj: 15,
    trail: [118, 121, 129, 132, 131, 133],
  },
  {
    bucket: "09:50",
    vsXau: 145,
    vsCme: 167,
    fxAdj: 18,
    trail: [132, 136, 140, 145, 143, 147],
  },
  {
    bucket: "10:10",
    vsXau: 138,
    vsCme: 160,
    fxAdj: 16,
    trail: [145, 142, 140, 138, 139, 141],
  },
  {
    bucket: "10:30",
    vsXau: 152,
    vsCme: 175,
    fxAdj: 19,
    trail: [138, 144, 149, 152, 154, 156],
  },
];

export default function KrxGoldMonitor() {
  const ladderColumnDefs = useMemo<
    (ColDef<LadderRow> | ColGroupDef<LadderRow>)[]
  >(() => {
    const formatSize = (value?: number) =>
      value && value !== 0 ? sizeFormatter.format(value) : "";

    const makeSizeColumn = (
      field: keyof LadderRow,
      side: "bid" | "ask",
      label: string,
      extra?: Partial<ColDef<LadderRow>> & {
        cellClassRules?: ColDef<LadderRow>["cellClassRules"];
      },
    ): ColDef<LadderRow> => ({
      field,
      headerName: label,
      width: extra?.width ?? 72,
      suppressHeaderMenuButton: true,
      sortable: false,
      valueFormatter: (params: ValueFormatterParams<LadderRow, number>) => {
        if (params.node?.rowPinned) {
          return label;
        }
        return formatSize(params.value as number | undefined);
      },
      tooltipValueGetter: (params) => {
        if (params.node?.rowPinned) {
          return `${label} ${side} size`;
        }
        const data = params.data;
        if (!data) {
          return "";
        }
        const priceField = (() => {
          if (side === "bid") {
            if (field === "ourBidQty") return "ourBid";
            if (field === "mmBidQty") return "mmBid";
            return "nonMmBid";
          }
          if (field === "ourAskQty") return "ourAsk";
          if (field === "mmAskQty") return "mmAsk";
          return "nonMmAsk";
        })();
        const px = data[priceField as keyof LadderRow] as number | undefined;
        const qty = params.value as number | undefined;
        if (!qty || qty === 0) {
          return `${label} no ${side === "bid" ? "bid" : "offer"}`;
        }
        return `${label} ${side === "bid" ? "Bid" : "Offer"} ${formatSize(
          qty,
        )} @ ${krwFormatter.format(px ?? 0)}`;
      },
      cellClassRules: {
        "text-muted-foreground": (p) =>
          !p.node?.rowPinned && (!p.value || (p.value as number) === 0),
        ...(extra?.cellClassRules ?? {}),
      },
      cellClass: "px-1 text-right text-sm tabular-nums tracking-tight",
      ...extra,
    });

    const priceColumn: ColDef<LadderRow> = {
      colId: "ladderPrice",
      headerName: "Price",
      width: 108,
      suppressHeaderMenuButton: true,
      sortable: false,
      cellRenderer: (params: ICellRendererParams<LadderRow>) => {
        if (params.node?.rowPinned) {
          return (
            <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              {params.data?.level}
            </span>
          );
        }
        const data = params.data;
        if (!data) {
          return null;
        }
        const bestBid = Math.max(
          data.ourBid ?? 0,
          data.mmBid ?? 0,
          data.nonMmBid ?? 0,
        );
        const askCandidates = [data.ourAsk, data.mmAsk, data.nonMmAsk].filter(
          (p) => p && p > 0,
        );
        const bestAsk = askCandidates.length ? Math.min(...askCandidates) : 0;
        const mid =
          bestBid && bestAsk ? (bestBid + bestAsk) / 2 : bestBid || bestAsk;
        const spread = bestBid && bestAsk ? bestAsk - bestBid : 0;
        return (
          <div className="flex flex-col items-center leading-tight">
            <span className="text-sm font-semibold tabular-nums">
              {krwFormatter.format(mid)}
            </span>
            <span className="text-[10px] text-muted-foreground">
              {data.level} · {spread ? `${spread.toFixed(0)}₩` : "—"}
            </span>
          </div>
        );
      },
      tooltipValueGetter: (params) => {
        if (params.node?.rowPinned) {
          return params.data?.level ?? "";
        }
        const data = params.data;
        if (!data) {
          return "";
        }
        const bestBid = Math.max(
          data.ourBid ?? 0,
          data.mmBid ?? 0,
          data.nonMmBid ?? 0,
        );
        const askCandidates = [data.ourAsk, data.mmAsk, data.nonMmAsk].filter(
          (p) => p && p > 0,
        );
        const bestAsk = askCandidates.length ? Math.min(...askCandidates) : 0;
        const mid =
          bestBid && bestAsk ? (bestBid + bestAsk) / 2 : bestBid || bestAsk;
        const spread = bestBid && bestAsk ? bestAsk - bestBid : 0;
        return `Mid ${krwFormatter.format(mid)} · Spread ${spread.toFixed(0)}₩`;
      },
      headerClass: "text-[10px] uppercase tracking-wide text-muted-foreground",
      cellClass: "px-2",
    };

    const bidGroup: ColGroupDef<LadderRow> = {
      headerName: "Bid Size",
      marryChildren: true,
      headerClass: "text-[10px] uppercase tracking-wide text-muted-foreground",
      children: [
        makeSizeColumn("nonMmBidQty", "bid", "Public", { pinned: "left" }),
        makeSizeColumn("mmBidQty", "bid", "Other MM", { pinned: "left" }),
        makeSizeColumn("ourBidQty", "bid", "Our", {
          pinned: "left",
          cellClassRules: {
            "font-semibold text-emerald-500": (p) => {
              if (p.node?.rowPinned) {
                return false;
              }
              const data = p.data as LadderRow | undefined;
              if (!data) {
                return false;
              }
              const best = Math.max(
                data.ourBid ?? 0,
                data.mmBid ?? 0,
                data.nonMmBid ?? 0,
              );
              return (data.ourBid ?? 0) === best && (p.value as number) > 0;
            },
          },
        }),
      ],
    };

    const askGroup: ColGroupDef<LadderRow> = {
      headerName: "Offer Size",
      marryChildren: true,
      headerClass: "text-[10px] uppercase tracking-wide text-muted-foreground",
      children: [
        makeSizeColumn("ourAskQty", "ask", "Our", {
          pinned: "right",
          cellClassRules: {
            "font-semibold text-rose-500": (p) => {
              if (p.node?.rowPinned) {
                return false;
              }
              const data = p.data as LadderRow | undefined;
              if (!data) {
                return false;
              }
              const asks = [
                data.ourAsk ?? 0,
                data.mmAsk ?? 0,
                data.nonMmAsk ?? 0,
              ].filter((v) => v > 0);
              const best = asks.length ? Math.min(...asks) : 0;
              return (data.ourAsk ?? 0) === best && (p.value as number) > 0;
            },
          },
        }),
        makeSizeColumn("mmAskQty", "ask", "Other MM", { pinned: "right" }),
        makeSizeColumn("nonMmAskQty", "ask", "Public", { pinned: "right" }),
      ],
    };

    return [bidGroup, priceColumn, askGroup];
  }, []);


  const ladderDefaultColDef = useMemo<Partial<ColDef<LadderRow>>>(
    () => ({
      sortable: false,
      filter: false,
      resizable: false,
      suppressHeaderMenuButton: true,
      suppressMovable: true,
    }),
    [],
  );

  const ladderRowClassRules = useMemo(
    () => ({
      "bg-muted/20": (params: any) => params.node?.rowPinned === "top",
      "bg-muted/10": (params: any) =>
        params.node?.rowPinned !== "top" && params.data?.level === "Top",
    }),
    [],
  );

  const pinned1kgTopRow = useMemo(() => [{ level: "KRX GOLD 1KG" }], []);
  const pinned100gTopRow = useMemo(() => [{ level: "KRX GOLD 100G" }], []);

  const premiumHistoryColumnDefs = useMemo<ColDef<PremiumHistoryRow>[]>(
    () => [
      {
        field: "bucket",
        headerName: "Time",
        width: 82,
        cellClass: "text-xs font-medium uppercase tracking-wide text-muted-foreground",
      },
      {
        field: "vsXau",
        headerName: "vs XAU",
        width: 110,
        valueFormatter: (params) => `${params.value as number} bps`,
        cellClassRules: {
          "text-emerald-500 font-semibold": (p) => (p.value as number) >= 140,
          "text-destructive font-semibold": (p) => (p.value as number) <= 110,
        },
      },
      {
        field: "vsCme",
        headerName: "vs CME",
        width: 110,
        valueFormatter: (params) => `${params.value as number} bps`,
        cellClassRules: {
          "text-emerald-500 font-semibold": (p) => (p.value as number) >= 160,
          "text-destructive font-semibold": (p) => (p.value as number) <= 120,
        },
      },
      {
        field: "fxAdj",
        headerName: "FX Adj",
        width: 100,
        valueFormatter: (params) => `${params.value as number} bps`,
      },
      {
        field: "trail",
        headerName: "Skew Trail",
        flex: 1,
        minWidth: 160,
        cellRenderer: "agSparklineCellRenderer",
        cellRendererParams: {
          sparklineOptions: {
            type: "line",
            line: { strokeWidth: 1.5, stroke: "#f59e0b" },
            marker: { size: 0 },
            axis: { strokeWidth: 0 },
            highlightStyle: {
              size: 4,
              fill: "#f97316",
              strokeWidth: 0,
            },
          },
        },
      },
    ],
    [],
  );

  const premiumHistoryDefaultColDef = useMemo<
    Partial<ColDef<PremiumHistoryRow>>
  >(
    () => ({
      sortable: false,
      filter: false,
      resizable: false,
      suppressHeaderMenuButton: true,
      suppressMovable: true,
    }),
    [],
  );

  const premiumSignalColumnDefs = useMemo<ColDef<PremiumSignalRow>[]>(
    () => [
      {
        field: "signal",
        headerName: "Signal",
        width: 140,
        cellClass: "text-xs font-semibold uppercase tracking-wide text-muted-foreground",
      },
      {
        field: "level",
        headerName: "Level",
        width: 120,
        cellClass: "text-xs tabular-nums text-foreground",
      },
      {
        field: "change",
        headerName: "Δ",
        width: 110,
        cellClass: "text-xs tabular-nums",
        cellClassRules: {
          "text-emerald-500 font-semibold": (p) =>
            typeof p.value === "string" && p.value.startsWith("+"),
          "text-destructive font-semibold": (p) =>
            typeof p.value === "string" && p.value.startsWith("-"),
        },
      },
      {
        field: "action",
        headerName: "Action",
        flex: 1,
        minWidth: 200,
        wrapText: true,
        autoHeight: true,
        cellClass: "text-[11px] leading-snug text-foreground",
      },
    ],
    [],
  );

  const futuresColumnDefs = useMemo<ColDef<FuturesRow>[]>(
    () => [
      { field: "contract", headerName: "Contract", width: 180 },
      {
        field: "actual",
        headerName: "Last",
        valueFormatter: (params) =>
          params.data?.currency === "KRW"
            ? krwFormatter.format(params.value as number)
            : usdFormatter.format(params.value as number),
        width: 150,
      },
      {
        field: "theoretical",
        headerName: "Theo",
        valueFormatter: (params) =>
          params.data?.currency === "KRW"
            ? krwFormatter.format(params.value as number)
            : usdFormatter.format(params.value as number),
        width: 150,
      },
      {
        field: "basisBps",
        headerName: "Basis",
        valueFormatter: (params) => bpsFormatter(params.value as number),
        cellClassRules: {
          "font-semibold": (p) => Math.abs(p.value as number) >= 120,
          "text-destructive": (p) => (p.value as number) < 0,
        },
        width: 130,
      },
      {
        field: "carryBps",
        headerName: "Carry Adj",
        valueFormatter: (params) => bpsFormatter(params.value as number),
        width: 140,
      },
      {
        field: "openInterest",
        headerName: "Open Interest",
        valueFormatter: (params) => sizeFormatter.format(params.value as number),
        width: 160,
      },
    ],
    [],
  );

  const positionColumnDefs = useMemo<ColDef<PositionRow>[]>(
    () => [
      { field: "book", headerName: "Book", width: 180, cellClass: "text-sm" },
      {
        field: "goldDeltaOz",
        headerName: "Gold Delta (oz)",
        valueFormatter: (params) => ozFormatter.format(params.value as number),
        cellClassRules: {
          "text-muted-foreground": (p) => Math.abs(p.value as number) < 500,
          "font-medium": (p) =>
            Math.abs(p.value as number) >= 500 && Math.abs(p.value as number) < 1200,
          "font-semibold text-destructive": (p) => Math.abs(p.value as number) >= 1200,
        },
        width: 170,
      },
      {
        field: "fxDeltaUsdMillions",
        headerName: "FX Delta (USDm)",
        valueFormatter: (params) =>
          usdMillionsFormatter.format((params.value as number) * 1_000_000),
        cellClassRules: {
          "text-muted-foreground": (p) => Math.abs((p.value as number) ?? 0) < 5,
          "font-medium": (p) => {
            const v = Math.abs((p.value as number) ?? 0);
            return v >= 5 && v < 12;
          },
          "font-semibold text-destructive": (p) => Math.abs((p.value as number) ?? 0) >= 12,
        },
        width: 180,
      },
      {
        field: "reference",
        headerName: "Ref",
        valueFormatter: (params: ValueFormatterParams<PositionRow, number>) => {
          const unit = params.data?.pricingUnit;
          if (unit === "KRW") return krwFormatter.format(params.value as number);
          if (unit === "USD") return usdFormatter.format(params.value as number);
          return fxFormatter.format(params.value as number);
        },
        width: 140,
      },
      {
        field: "mark",
        headerName: "Mark",
        valueFormatter: (params: ValueFormatterParams<PositionRow, number>) => {
          const unit = params.data?.pricingUnit;
          if (unit === "KRW") return krwFormatter.format(params.value as number);
          if (unit === "USD") return usdFormatter.format(params.value as number);
          return fxFormatter.format(params.value as number);
        },
        width: 140,
      },
      {
        field: "hedgeInstrument",
        headerName: "Hedge",
        width: 170,
      },
      {
        field: "hedgeRatio",
        headerName: "Coverage",
        valueFormatter: (params) => `${(params.value as number * 100).toFixed(0)}%`,
        cellClassRules: {
          "font-semibold text-destructive": (p) => (p.value as number) < 0.7,
          "font-medium": (p) => (p.value as number) >= 0.7 && (p.value as number) < 0.9,
          "text-muted-foreground": (p) => (p.value as number) >= 0.9,
        },
        width: 140,
      },
    ],
    [],
  );

  const fxHedgeColumnDefs = useMemo<ColDef<FxHedgeRow>[]>(
    () => [
      { field: "pair", headerName: "Pair", width: 130 },
      {
        field: "positionUsdMillions",
        headerName: "Position (USDm)",
        valueFormatter: (params) =>
          usdMillionsFormatter.format((params.value as number) * 1_000_000),
        cellClassRules: {
          "text-muted-foreground": (p) => Math.abs((p.value as number) ?? 0) < 3,
          "font-medium": (p) => {
            const v = Math.abs((p.value as number) ?? 0);
            return v >= 3 && v < 8;
          },
          "font-semibold text-destructive": (p) => Math.abs((p.value as number) ?? 0) >= 8,
        },
        width: 190,
      },
      { field: "hedgeInstrument", headerName: "Hedge", width: 220 },
      {
        field: "coverage",
        headerName: "Coverage",
        valueFormatter: (params) => percentFormatter(params.value as number),
        cellClassRules: {
          "font-semibold text-destructive": (p) => (p.value as number) < 0.7,
          "font-medium": (p) => (p.value as number) >= 0.7 && (p.value as number) < 0.9,
          "text-muted-foreground": (p) => (p.value as number) >= 0.9,
        },
        width: 140,
      },
      {
        field: "points",
        headerName: "Points",
        valueFormatter: (params) => `${(params.value as number).toFixed(1)} pts`,
        width: 120,
      },
      { field: "comment", headerName: "Comment", width: 220 },
    ],
    [],
  );

  const globalBasisColumnDefs = useMemo<ColDef<GlobalBasisRow>[]>(() => [
    {
      field: "market",
      headerName: "Market",
      pinned: "left",
      width: 180,
      cellClass: "text-sm font-semibold",
    },
    {
      field: "currency",
      headerName: "Ccy",
      width: 80,
      cellClass: "text-xs font-medium text-muted-foreground",
    },
    {
      field: "last",
      headerName: "Last",
      valueFormatter: (params) =>
        params.data?.currency === "KRW"
          ? krwFormatter.format(params.value as number)
          : usdFormatter.format(params.value as number),
      width: 130,
    },
    {
      field: "krwEquivalent",
      headerName: "KRW Eq.",
      valueFormatter: (params) => krwFormatter.format(params.value as number),
      width: 140,
    },
    {
      field: "internalTheo",
      headerName: "Internal Theo",
      valueFormatter: (params) => krwFormatter.format(params.value as number),
      width: 150,
    },
    {
      field: "basisToKrxBps",
      headerName: "vs KRX",
      valueFormatter: (params) => bpsFormatter(params.value as number),
      cellClassRules: {
        "font-semibold": (p) => Math.abs(p.value as number) >= 40,
        "text-destructive": (p) => (p.value as number) < 0,
      },
      width: 110,
    },
    {
      field: "basisToTheoBps",
      headerName: "vs Theo",
      valueFormatter: (params) => bpsFormatter(params.value as number),
      cellClassRules: {
        "font-semibold": (p) => Math.abs(p.value as number) >= 40,
        "text-destructive": (p) => (p.value as number) < 0,
      },
      width: 110,
    },
    {
      field: "fundingAdjBps",
      headerName: "Funding Adj",
      valueFormatter: (params) => bpsFormatter(params.value as number),
      width: 130,
    },
    { field: "comment", headerName: "Comment", flex: 1, minWidth: 220 },
  ], []);


  const netGoldDelta = positionRows.reduce((acc, row) => acc + row.goldDeltaOz, 0);
  const netFxDelta = positionRows.reduce((acc, row) => acc + row.fxDeltaUsdMillions, 0);

  const fxResidual = fxHedgeRows.reduce((acc, row) => acc + row.positionUsdMillions, 0);
  const avgFxCoverage =
    fxHedgeRows.length > 0
      ? fxHedgeRows.reduce((acc, row) => acc + row.coverage, 0) / fxHedgeRows.length
      : 0;
  const formatUsdMillions = (value: number) => {
    const abs = Math.abs(value);
    return `${value < 0 ? "-" : ""}$${abs.toFixed(1)}M`;
  };

  const totalPnlKrw = positionRows.reduce((acc, row) => {
    if (row.pnlCurrency === "KRW") {
      return acc + row.pnl;
    }
    return acc + row.pnl * usdKrw;
  }, 0);

  const xauSpotRow = globalBasisRows.find((row) => row.market === "XAU Spot");
  const cmeFrontRow = globalBasisRows.find((row) => row.market === "CME Gold Front");

  const avgHedgeRatio =
    positionRows.length > 0
      ? positionRows.reduce((acc, row) => acc + row.hedgeRatio, 0) /
        positionRows.length
      : 0;

  const formatDeltaKrw = (value: number) => {
    if (!value) return "0";
    const rounded = Math.round(value);
    return `${rounded > 0 ? "+" : ""}${rounded.toLocaleString()}₩`;
  };

  const formatBpsDelta = (value: number) => {
    if (!value) return "0 bps";
    const rounded = Math.round(value);
    const prefix = rounded > 0 ? "+" : rounded < 0 ? "-" : "";
    return `${prefix}${Math.abs(rounded)} bps`;
  };

  const deskPnlUsd = totalPnlKrw / usdKrw;
  const deskPnlUsdMillions = deskPnlUsd / 1_000_000;

  const latestPremiumPoint = premiumHistoryRows[premiumHistoryRows.length - 1];
  const prevPremiumPoint =
    premiumHistoryRows.length > 1
      ? premiumHistoryRows[premiumHistoryRows.length - 2]
      : undefined;

  const premiumPulse = useMemo(() => {
    if (!latestPremiumPoint) {
      return {
        vsXau: 0,
        vsCme: 0,
        fxAdj: 0,
        deltaVsXau: 0,
        deltaVsCme: 0,
        slope: 0,
        bias: "steady" as const,
        executionHint: "Monitor premium feed.",
      };
    }
    const deltaVsXau = prevPremiumPoint
      ? latestPremiumPoint.vsXau - prevPremiumPoint.vsXau
      : 0;
    const deltaVsCme = prevPremiumPoint
      ? latestPremiumPoint.vsCme - prevPremiumPoint.vsCme
      : 0;
    const trail = latestPremiumPoint.trail ?? [];
    const slope = trail.length > 1 ? trail[trail.length - 1] - trail[0] : deltaVsXau;

    let bias: "steady" | "widening" | "narrowing" = "steady";
    if (deltaVsXau > 2 || slope > 4) {
      bias = "widening";
    } else if (deltaVsXau < -2 || slope < -4) {
      bias = "narrowing";
    }

    let executionHint = "Hold neutral quoting.";
    if (bias === "widening") {
      executionHint =
        netGoldDelta > 0
          ? "Release offers to bleed long inventory."
          : "Lean on bids to capture premium.";
    }
    if (bias === "narrowing") {
      executionHint =
        netGoldDelta > 0
          ? "Guard bids; premium compression vs longs."
          : "Scale offers slower while premium compresses.";
    }

    return {
      vsXau: latestPremiumPoint.vsXau,
      vsCme: latestPremiumPoint.vsCme,
      fxAdj: latestPremiumPoint.fxAdj,
      deltaVsXau,
      deltaVsCme,
      slope,
      bias,
      executionHint,
    };
  }, [latestPremiumPoint, prevPremiumPoint, netGoldDelta]);

  const computeSpread = (row?: LadderRow) => {
    if (!row) {
      return 0;
    }
    const bestBid = Math.max(row.ourBid ?? 0, row.mmBid ?? 0, row.nonMmBid ?? 0);
    const asks = [row.ourAsk, row.mmAsk, row.nonMmAsk].filter((value) => value && value > 0);
    const bestAsk = asks.length ? Math.min(...asks) : 0;
    return bestBid && bestAsk ? bestAsk - bestBid : 0;
  };

  const formatLead = (value: number) => {
    if (!value) {
      return "0₩";
    }
    const rounded = Math.round(value);
    return `${rounded > 0 ? "+" : ""}${rounded}₩`;
  };

  const top1kg = krx1kgLadderRows[0];
  const top100g = krx100gLadderRows[0];

  const spread1kg = computeSpread(top1kg);
  const spread100g = computeSpread(top100g);
  const bidLead1kg = top1kg ? (top1kg.ourBid ?? 0) - (top1kg.mmBid ?? 0) : 0;
  const askLead1kg = top1kg ? (top1kg.mmAsk ?? 0) - (top1kg.ourAsk ?? 0) : 0;
  const bidLead100g = top100g ? (top100g.ourBid ?? 0) - (top100g.mmBid ?? 0) : 0;
  const askLead100g = top100g ? (top100g.mmAsk ?? 0) - (top100g.ourAsk ?? 0) : 0;

  const delta1kg = krx1kgSnapshot.last - krx1kgSnapshot.prevClose;
  const delta100g = krx100gSnapshot.last - krx100gSnapshot.prevClose;

  const summaryBands = useMemo(
    () => [
      {
        id: "krx-1kg",
        label: "KRX 1kg",
        primary: krwFormatter.format(krx1kgSnapshot.last),
        change: formatDeltaKrw(delta1kg),
        changePositive: delta1kg >= 0,
        sub: `Range ${krwFormatter.format(krx1kgSnapshot.sessionHigh)} / ${krwFormatter.format(
          krx1kgSnapshot.sessionLow,
        )}`,
        metrics: [
          { label: "Theo", value: krwFormatter.format(krx1kgSnapshot.internalTheo) },
          { label: "Basis", value: bpsFormatter(krx1kgSnapshot.basisVsXauBps) },
          { label: "Spread", value: `${spread1kg.toFixed(0)}₩` },
          {
            label: "Lead",
            value: `${formatLead(bidLead1kg)} / ${formatLead(askLead1kg)}`,
          },
        ],
      },
      {
        id: "krx-100g",
        label: "KRX 100g",
        primary: krwFormatter.format(krx100gSnapshot.last),
        change: formatDeltaKrw(delta100g),
        changePositive: delta100g >= 0,
        sub: `Range ${krwFormatter.format(krx100gSnapshot.sessionHigh)} / ${krwFormatter.format(
          krx100gSnapshot.sessionLow,
        )}`,
        metrics: [
          { label: "Theo", value: krwFormatter.format(krx100gSnapshot.internalTheo) },
          { label: "Basis", value: bpsFormatter(krx100gSnapshot.basisVsXauBps) },
          { label: "Spread", value: `${spread100g.toFixed(0)}₩` },
          {
            label: "Lead",
            value: `${formatLead(bidLead100g)} / ${formatLead(askLead100g)}`,
          },
        ],
      },
      {
        id: "global-spot",
        label: "Global Spot",
        primary: xauSpotRow ? krwFormatter.format(xauSpotRow.krwEquivalent) : "-",
        change: xauSpotRow ? formatBpsDelta(xauSpotRow.basisToKrxBps) : "0",
        changePositive: xauSpotRow ? xauSpotRow.basisToKrxBps >= 0 : false,
        sub: xauSpotRow ? `USD ${usdFormatter.format(xauSpotRow.last)}` : "Spot feed", 
        metrics: [
          {
            label: "CME",
            value: cmeFrontRow ? usdFormatter.format(cmeFrontRow.last) : "-",
          },
          {
            label: "Carry",
            value: cmeFrontRow ? bpsFormatter(cmeFrontRow.carryBps) : "0 bps",
          },
          {
            label: "Funding",
            value: cmeFrontRow ? bpsFormatter(cmeFrontRow.fundingAdjBps) : "0 bps",
          },
          { label: "FX Adj", value: `${premiumPulse.fxAdj} bps` },
        ],
      },
      {
        id: "desk-risk",
        label: "Desk Risk",
        primary: krwFormatter.format(totalPnlKrw),
        change: formatUsdMillions(deskPnlUsdMillions),
        changePositive: deskPnlUsdMillions >= 0,
        sub: `${ozFormatter.format(netGoldDelta)} oz · ${formatUsdMillions(netFxDelta)}`,
        metrics: [
          { label: "Hedge", value: `${(avgHedgeRatio * 100).toFixed(0)}%` },
          { label: "FX Cover", value: `${(avgFxCoverage * 100).toFixed(0)}%` },
          { label: "Residual", value: formatUsdMillions(fxResidual) },
        ],
      },
    ],
    [
      avgFxCoverage,
      avgHedgeRatio,
      bidLead100g,
      bidLead1kg,
      cmeFrontRow,
      delta100g,
      delta1kg,
      deskPnlUsdMillions,
      fxResidual,
      netFxDelta,
      netGoldDelta,
      premiumPulse.fxAdj,
      spread1kg,
      spread100g,
      totalPnlKrw,
      xauSpotRow,
      askLead1kg,
      askLead100g,
    ],
  );

  const premiumSignalRows: PremiumSignalRow[] = [
    {
      signal: "1kg vs XAU",
      level: `${premiumPulse.vsXau} bps`,
      change: formatBpsDelta(premiumPulse.deltaVsXau),
      action:
        premiumPulse.bias === "widening"
          ? "Thin offers; hedge via CME while premium lifts."
          : premiumPulse.bias === "narrowing"
          ? "Defend bid edge; prep to reload offers on bounce."
          : "Keep stack balanced; monitor CNH leg.",
    },
    {
      signal: "100g vs CME",
      level: `${premiumPulse.vsCme} bps`,
      change: formatBpsDelta(premiumPulse.deltaVsCme),
      action:
        spread100g > spread1kg
          ? "Route skew to 100g; richer spread than 1kg."
          : "Focus 1kg flow; 100g ladder compressed.",
    },
    {
      signal: "Book Lead",
      level: `${spread1kg.toFixed(0)}₩ / ${spread100g.toFixed(0)}₩`,
      change: `${formatLead(bidLead1kg)} | ${formatLead(bidLead100g)}`,
      action:
        netGoldDelta > 0
          ? "Work offers first to shed long metal."
          : netGoldDelta < 0
          ? "Step in on bids; rebuild long inventory."
          : "Inventory flat; keep depth two levels each side.",
    },
    {
      signal: "FX Residual",
      level: formatUsdMillions(netFxDelta),
      change: `${(avgFxCoverage * 100).toFixed(0)}% cover`,
      action:
        Math.abs(netFxDelta) > 8
          ? "Square CNH hedge via swaps before adding risk."
          : "FX leg neutral; focus on metal premium.",
    },
  ];

  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="relative flex h-full w-full flex-col overflow-auto bg-background text-foreground">
      <div className="flex items-start gap-3 border-b border-border/50 bg-card/60 px-3 py-2">
        <div className="flex-1 overflow-hidden">
          <div className="flex flex-wrap gap-2">
            {summaryBands.map((band) => (
              <div
                key={band.id}
                className="flex min-w-[200px] flex-1 basis-[220px] flex-col gap-1 rounded-md border border-border/40 bg-background/60 px-3 py-2"
              >
                <div className="flex items-center justify-between text-[10px] uppercase tracking-wide text-muted-foreground">
                  <span>{band.label}</span>
                  <span
                    className={`font-semibold ${
                      band.changePositive ? "text-emerald-500" : "text-destructive"
                    }`}
                  >
                    {band.change}
                  </span>
                </div>
                <div className="flex items-end justify-between gap-3">
                  <span className="text-lg font-semibold tracking-tight md:text-xl">
                    {band.primary}
                  </span>
                  <span className="text-[11px] text-muted-foreground">{band.sub}</span>
                </div>
                <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[10px] text-muted-foreground">
                  {band.metrics.map((metric) => (
                    <div key={`${band.id}-${metric.label}`} className="flex items-center justify-between gap-2">
                      <span className="uppercase tracking-wide">{metric.label}</span>
                      <span className="tabular-nums text-[11px] text-foreground">{metric.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        <aside className="w-60 shrink-0 rounded-md border border-border/40 bg-background/70 px-3 py-2">
          <div className="flex items-center justify-between text-[10px] uppercase tracking-wide text-muted-foreground">
            <span>Premium Pulse</span>
            <button
              type="button"
              className="rounded border border-border/50 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground transition hover:border-foreground hover:text-foreground"
              onClick={() => setDrawerOpen(true)}
            >
              History
            </button>
          </div>
          <dl className="mt-2 space-y-1.5 text-[11px] text-muted-foreground">
            <div className="flex items-center justify-between gap-2">
              <dt className="uppercase tracking-wide">vs XAU</dt>
              <dd className="text-foreground tabular-nums">
                {premiumPulse.vsXau} bps ({formatBpsDelta(premiumPulse.deltaVsXau)})
              </dd>
            </div>
            <div className="flex items-center justify-between gap-2">
              <dt className="uppercase tracking-wide">vs CME</dt>
              <dd className="text-foreground tabular-nums">
                {premiumPulse.vsCme} bps ({formatBpsDelta(premiumPulse.deltaVsCme)})
              </dd>
            </div>
            <div className="flex items-center justify-between gap-2">
              <dt className="uppercase tracking-wide">Bias</dt>
              <dd className="text-foreground">
                {premiumPulse.bias === "widening"
                  ? "Premium widening"
                  : premiumPulse.bias === "narrowing"
                  ? "Premium narrowing"
                  : "Premium steady"}
              </dd>
            </div>
            <div className="flex items-start justify-between gap-2">
              <dt className="pt-0.5 uppercase tracking-wide">Execution</dt>
              <dd className="text-left text-foreground leading-snug">
                {premiumPulse.executionHint}
              </dd>
            </div>
          </dl>
        </aside>
      </div>
      <div className="relative flex flex-1 overflow-auto bg-muted/5">
        <div className="grid h-full w-full grid-cols-12 grid-rows-8 gap-px bg-border/30 p-px">
          <div className="col-span-5 row-span-4 bg-card">
            <AgGridReact
              className="h-full w-full"
              theme={themeBalham}
              rowData={krx1kgLadderRows}
              columnDefs={ladderColumnDefs}
              defaultColDef={ladderDefaultColDef}
              headerHeight={26}
              rowHeight={34}
              rowClassRules={ladderRowClassRules}
              tooltipShowDelay={0}
              tooltipHideDelay={0}
              pinnedTopRowData={pinned1kgTopRow}
              suppressMovableColumns
              suppressCellFocus
              enableCellTextSelection
              animateRows={false}
            />
          </div>
          <div className="col-span-5 row-span-4 bg-card">
            <AgGridReact
              className="h-full w-full"
              theme={themeBalham}
              rowData={krx100gLadderRows}
              columnDefs={ladderColumnDefs}
              defaultColDef={ladderDefaultColDef}
              headerHeight={26}
              rowHeight={34}
              rowClassRules={ladderRowClassRules}
              tooltipShowDelay={0}
              tooltipHideDelay={0}
              pinnedTopRowData={pinned100gTopRow}
              suppressMovableColumns
              suppressCellFocus
              enableCellTextSelection
              animateRows={false}
            />
          </div>
          <aside className="col-span-2 row-span-4 flex flex-col bg-card">
            <header className="border-b border-border/40 px-3 py-2">
              <h2 className="text-sm font-semibold uppercase tracking-wide">Market Signals</h2>
              <p className="text-[11px] text-muted-foreground">Premium &amp; hedge cues</p>
            </header>
            <AgGridReact
              className="flex-1"
              theme={themeBalham}
              rowData={premiumSignalRows}
              columnDefs={premiumSignalColumnDefs}
              headerHeight={26}
              rowHeight={48}
              suppressMovableColumns
              suppressMenuHide
              enableCellTextSelection
            />
          </aside>
          <section className="col-span-7 row-span-2 flex flex-col bg-card">
            <header className="flex items-center justify-between border-b border-border/40 px-3 py-2">
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-wide">
                  Hedge &amp; Position Stack
                </h2>
                <p className="text-xs text-muted-foreground">
                  Net {ozFormatter.format(netGoldDelta)} oz · FX {formatUsdMillions(netFxDelta)}
                </p>
              </div>
              <span className="text-[11px] uppercase text-muted-foreground">
                Avg cover {(avgHedgeRatio * 100).toFixed(0)}%
              </span>
            </header>
            <AgGridReact
              className="flex-1"
              theme={themeBalham}
              rowData={positionRows}
              columnDefs={positionColumnDefs}
              headerHeight={28}
              rowHeight={34}
              suppressMovableColumns
              enableCellTextSelection
            />
          </section>
          <section className="col-span-5 row-span-2 flex flex-col bg-card">
            <header className="flex items-center justify-between border-b border-border/40 px-3 py-2">
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-wide">FX Hedge Alignment</h2>
                <p className="text-xs text-muted-foreground">
                  Residual {formatUsdMillions(fxResidual)}
                </p>
              </div>
              <span className="text-[11px] uppercase text-muted-foreground">
                Avg {(avgFxCoverage * 100).toFixed(0)}%
              </span>
            </header>
            <AgGridReact
              className="flex-1"
              theme={themeBalham}
              rowData={fxHedgeRows}
              columnDefs={fxHedgeColumnDefs}
              headerHeight={28}
              rowHeight={34}
              suppressMovableColumns
              enableCellTextSelection
            />
          </section>
          <section className="col-span-12 row-span-2 flex flex-col bg-card">
            <header className="flex items-center justify-between border-b border-border/40 px-3 py-2">
              <h2 className="text-sm font-semibold uppercase tracking-wide">Global Basis Landscape</h2>
              <span className="text-[11px] uppercase text-muted-foreground">Theo vs Funding adj.</span>
            </header>
            <div className="flex flex-1 flex-col divide-y divide-border/40">
              <AgGridReact
                className="flex-1"
                theme={themeBalham}
                rowData={globalBasisRows}
                columnDefs={globalBasisColumnDefs}
                headerHeight={28}
                rowHeight={32}
                suppressMovableColumns
                enableCellTextSelection
              />
              <AgGridReact
                className="flex-1"
                theme={themeBalham}
                rowData={futuresRows}
                columnDefs={futuresColumnDefs}
                headerHeight={28}
                rowHeight={32}
                suppressMovableColumns
                enableCellTextSelection
              />
            </div>
          </section>
        </div>

        <div
          className={`absolute inset-0 z-30 transition ${
            drawerOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
          }`}
        >
          <div
            className={`absolute inset-0 bg-background/40 backdrop-blur-sm transition-opacity ${
              drawerOpen ? "opacity-100" : "opacity-0"
            }`}
            onClick={() => setDrawerOpen(false)}
          />
          <aside
            className={`absolute right-0 top-0 flex h-full w-[380px] flex-col border-l border-border/40 bg-card shadow-xl transition-transform duration-300 ${
              drawerOpen ? "translate-x-0" : "translate-x-full"
            }`}
          >
            <header className="flex items-center justify-between border-b border-border/40 px-4 py-3">
              <h3 className="text-sm font-semibold uppercase tracking-wide">Premium Timeline</h3>
              <button
                type="button"
                className="rounded-md border border-border/40 px-2 py-1 text-[11px] uppercase tracking-wide text-muted-foreground hover:border-foreground hover:text-foreground"
                onClick={() => setDrawerOpen(false)}
              >
                Close
              </button>
            </header>
            <div className="flex flex-1 flex-col gap-3 px-4 py-3 text-[11px] text-muted-foreground">
              <p>
                Spot vs futures premium with funding adjustments. Use to time skew trades without
                opening the external charting package.
              </p>
              <AgGridReact
                className="flex-1"
                theme={themeBalham}
                rowData={premiumHistoryRows}
                columnDefs={premiumHistoryColumnDefs}
                defaultColDef={premiumHistoryDefaultColDef}
                headerHeight={28}
                rowHeight={30}
                suppressMovableColumns
                enableCellTextSelection
              />
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
