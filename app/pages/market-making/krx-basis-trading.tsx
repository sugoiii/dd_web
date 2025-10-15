import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  type ColDef,
  type GetRowIdParams,
  type ICellRendererParams,
  type RowClickedEvent,
} from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import {
  ArrowDownRight,
  ArrowUpRight,
  Circle,
  Flag,
  PauseCircle,
  PlayCircle,
  RotateCcw,
  Settings2,
} from "lucide-react";

import { PageTemplate } from "~/components/page-template";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "~/components/ui/drawer";
import { Input } from "~/components/ui/input";
import { ScrollArea } from "~/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { Separator } from "~/components/ui/separator";
import { Switch } from "~/components/ui/switch";
import { cn } from "~/lib/utils";

import "ag-grid-enterprise/styles/ag-grid.css";
import "ag-grid-enterprise/styles/ag-theme-quartz.css";

type BasisRow = {
  symbol: string;
  name: string;
  sector: string;
  pxEquity: number;
  f1Px: number;
  f2Px: number;
  spreadF1F2: number;
  basisVsF1Bps: number;
  basisVsF2Bps: number;
  dividendNext: string;
  dividendYield: number;
  strategyMode: "Aggressive" | "Passive" | "Neutral";
  entryExit: { entry: number; exit: number };
  hedgeRatio: number;
  equityQty: number;
  f1Qty: number;
  f2Qty: number;
  netDelta: number;
  unrealizedPnl: number;
  orders: number;
  active: boolean;
  direction: "long" | "short" | "flat";
  residualBps: number;
  borrowFlag?: boolean;
  exDateFlag?: boolean;
  openOrders?: boolean;
  fvInputs: { r: number; q: number; c: number; t: number; timestamp: string };
  lastUpdateMs: number;
  legs: Array<{ leg: string; qty: number; avgPrice: number; mark: number; pnl: number }>;
  carry: {
    r: number;
    q: number;
    c: number;
    t: number;
    pvDiv: number;
    modelFv: number;
    marketFv: number;
    modelBasisBps: number;
    marketBasisBps: number;
    residualBps: number;
    breakEvenBps: number;
    carrySpreadBps: number;
    residualAfterCostBps: number;
    oneDayCarryBps: number;
    impliedQ: number;
    allInCostBps: number;
    pnlPer10Bps: number;
    borrowAvail: string;
    exposureAdv: number;
    upcomingExDate: string;
    timestampLagMs: number;
  };
  quickTicket: {
    suggestedLots: number;
    slippageBps: number;
    feeBps: number;
    breakEvenResidual: number;
  };
  lotSizingRule: string;
  autoHedge: boolean;
  borrowSource: string;
  borrowCap: string;
  ordersAndFills: Array<{
    id: string;
    side: "Buy" | "Sell";
    product: string;
    size: number;
    price: number;
    status: "Working" | "Filled" | "Partial" | "Cancelled";
    time: string;
  }>;
  positionDetail: {
    equity: {
      qty: number;
      avgPrice: number;
      mark: number;
      realized: number;
      unrealized: number;
    };
    f1: {
      qty: number;
      avgPrice: number;
      mark: number;
      realized: number;
      unrealized: number;
    };
    f2?: {
      qty: number;
      avgPrice: number;
      mark: number;
      realized: number;
      unrealized: number;
    };
    spread: {
      ratio: number;
      syntheticPrice: number;
      pnl: number;
    };
  };
  dividendInfo: {
    nextExDate: string;
    expectedAmount: number;
    certainty: "High" | "Medium" | "Low";
    override: boolean;
    notes: string;
  };
};

type FilterMode = "all" | "active" | "long" | "short" | "sector";
type WhatIfMode = "base" | "qDown" | "rUp" | "cUp";

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "KRW",
  maximumFractionDigits: 0,
});

const quantityFormatter = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });

const percentageFormatter = (value: number, digits = 1) => `${value.toFixed(digits)}%`;

const pnlFormatter = (value: number) => {
  const formatted = currencyFormatter.format(Math.abs(value));
  return value >= 0 ? `+${formatted}` : `-${formatted}`;
};

const basisRowSeed: BasisRow[] = [
  {
    symbol: "005930 KS",
    name: "Samsung Electronics",
    sector: "Technology",
    pxEquity: 70800,
    f1Px: 708.6,
    f2Px: 702.9,
    spreadF1F2: 5.7,
    basisVsF1Bps: 18.4,
    basisVsF2Bps: 42.1,
    dividendNext: "₩361 (Apr)",
    dividendYield: 1.7,
    strategyMode: "Aggressive",
    entryExit: { entry: 18, exit: 6 },
    hedgeRatio: 0.94,
    equityQty: 4200,
    f1Qty: -42,
    f2Qty: 0,
    netDelta: 138,
    unrealizedPnl: 18500000,
    orders: 3,
    active: true,
    direction: "long",
    residualBps: 14,
    openOrders: true,
    fvInputs: { r: 3.15, q: 1.7, c: 0.45, t: 62, timestamp: "08:44:12" },
    lastUpdateMs: 900,
    borrowFlag: false,
    exDateFlag: false,
    legs: [
      { leg: "Equity", qty: 4200, avgPrice: 70250, mark: 70800, pnl: 23100000 },
      { leg: "KOSPI F1", qty: -42, avgPrice: 707.2, mark: 708.6, pnl: -4200000 },
      { leg: "Spread", qty: 1, avgPrice: 14.8, mark: 13.6, pnl: 1620000 },
    ],
    carry: {
      r: 3.15,
      q: 1.7,
      c: 0.45,
      t: 62,
      pvDiv: 349,
      modelFv: 70480,
      marketFv: 70340,
      modelBasisBps: 26,
      marketBasisBps: 20,
      residualBps: 6,
      breakEvenBps: 11,
      carrySpreadBps: 18,
      residualAfterCostBps: 5,
      oneDayCarryBps: 0.9,
      impliedQ: 1.65,
      allInCostBps: 12,
      pnlPer10Bps: 2100000,
      borrowAvail: "Ample",
      exposureAdv: 3.2,
      upcomingExDate: "2025-03-28",
      timestampLagMs: 420,
    },
    quickTicket: {
      suggestedLots: 38,
      slippageBps: 3.4,
      feeBps: 0.9,
      breakEvenResidual: 7.2,
    },
    lotSizingRule: "Vol-target 18% of ADV",
    autoHedge: true,
    borrowSource: "Samsung Sec. internal",
    borrowCap: "KRW 65B",
    ordersAndFills: [
      { id: "O-1084", side: "Buy", product: "Equity", size: 1200, price: 70810, status: "Working", time: "08:44:05" },
      { id: "O-1083", side: "Sell", product: "F1", size: 12, price: 708.8, status: "Partial", time: "08:43:52" },
      { id: "F-2071", side: "Sell", product: "F1", size: 6, price: 708.6, status: "Filled", time: "08:43:14" },
    ],
    positionDetail: {
      equity: { qty: 4200, avgPrice: 70250, mark: 70800, realized: 4800000, unrealized: 23100000 },
      f1: { qty: -42, avgPrice: 707.2, mark: 708.6, realized: -1200000, unrealized: -4200000 },
      spread: { ratio: 0.94, syntheticPrice: 70730, pnl: 18900000 },
    },
    dividendInfo: {
      nextExDate: "2025-03-28",
      expectedAmount: 361,
      certainty: "High",
      override: false,
      notes: "Board confirmed, funding desk comfortable",
    },
  },
  {
    symbol: "000660 KS",
    name: "SK Hynix",
    sector: "Technology",
    pxEquity: 124500,
    f1Px: 1241.8,
    f2Px: 1229.6,
    spreadF1F2: 12.2,
    basisVsF1Bps: -9.4,
    basisVsF2Bps: 16.8,
    dividendNext: "₩300 (Mar)",
    dividendYield: 0.9,
    strategyMode: "Passive",
    entryExit: { entry: 12, exit: 4 },
    hedgeRatio: 0.88,
    equityQty: -3200,
    f1Qty: 29,
    f2Qty: 11,
    netDelta: -164,
    unrealizedPnl: -6200000,
    orders: 2,
    active: true,
    direction: "short",
    residualBps: -11,
    borrowFlag: true,
    openOrders: true,
    exDateFlag: false,
    fvInputs: { r: 3.12, q: 0.9, c: 0.62, t: 58, timestamp: "08:44:08" },
    lastUpdateMs: 1350,
    legs: [
      { leg: "Equity", qty: -3200, avgPrice: 125200, mark: 124500, pnl: 22400000 },
      { leg: "KOSPI F1", qty: 29, avgPrice: 1238.4, mark: 1241.8, pnl: -9900000 },
      { leg: "KOSPI F2", qty: 11, avgPrice: 1224.9, mark: 1229.6, pnl: -8600000 },
      { leg: "Spread", qty: 1, avgPrice: -8.3, mark: -11.2, pnl: -1700000 },
    ],
    carry: {
      r: 3.12,
      q: 0.9,
      c: 0.62,
      t: 58,
      pvDiv: 255,
      modelFv: 123880,
      marketFv: 124020,
      modelBasisBps: -6,
      marketBasisBps: -10,
      residualBps: -4,
      breakEvenBps: 9,
      carrySpreadBps: 11,
      residualAfterCostBps: -2,
      oneDayCarryBps: 0.4,
      impliedQ: 0.92,
      allInCostBps: 13,
      pnlPer10Bps: 2600000,
      borrowAvail: "Tight",
      exposureAdv: 4.9,
      upcomingExDate: "2025-03-18",
      timestampLagMs: 860,
    },
    quickTicket: {
      suggestedLots: 24,
      slippageBps: 4.2,
      feeBps: 1.1,
      breakEvenResidual: 9.8,
    },
    lotSizingRule: "Liquidity tiered ladder",
    autoHedge: false,
    borrowSource: "External (Nomura)",
    borrowCap: "KRW 32B",
    ordersAndFills: [
      { id: "O-2077", side: "Sell", product: "Equity", size: 800, price: 124480, status: "Working", time: "08:43:58" },
      { id: "F-3110", side: "Buy", product: "F2", size: 5, price: 1229.8, status: "Filled", time: "08:42:41" },
    ],
    positionDetail: {
      equity: { qty: -3200, avgPrice: 125200, mark: 124500, realized: 6800000, unrealized: 22400000 },
      f1: { qty: 29, avgPrice: 1238.4, mark: 1241.8, realized: -4200000, unrealized: -9900000 },
      f2: { qty: 11, avgPrice: 1224.9, mark: 1229.6, realized: -2100000, unrealized: -8600000 },
      spread: { ratio: -0.88, syntheticPrice: 124780, pnl: 5300000 },
    },
    dividendInfo: {
      nextExDate: "2025-03-18",
      expectedAmount: 300,
      certainty: "Medium",
      override: false,
      notes: "Borrow premium elevated, verify availability daily",
    },
  },
  {
    symbol: "035420 KS",
    name: "NAVER",
    sector: "Communication",
    pxEquity: 189200,
    f1Px: 1890.4,
    f2Px: 1876.8,
    spreadF1F2: 13.6,
    basisVsF1Bps: 21.5,
    basisVsF2Bps: 52.8,
    dividendNext: "₩0 (Growth)",
    dividendYield: 0,
    strategyMode: "Neutral",
    entryExit: { entry: 16, exit: 5 },
    hedgeRatio: 0.91,
    equityQty: 1500,
    f1Qty: -14,
    f2Qty: -6,
    netDelta: 92,
    unrealizedPnl: 9200000,
    orders: 1,
    active: true,
    direction: "long",
    residualBps: 19,
    openOrders: false,
    fvInputs: { r: 3.18, q: 0.2, c: 0.35, t: 60, timestamp: "08:44:11" },
    lastUpdateMs: 610,
    legs: [
      { leg: "Equity", qty: 1500, avgPrice: 187100, mark: 189200, pnl: 31500000 },
      { leg: "KOSPI F1", qty: -14, avgPrice: 1886.2, mark: 1890.4, pnl: -5900000 },
      { leg: "KOSPI F2", qty: -6, avgPrice: 1871.9, mark: 1876.8, pnl: -2940000 },
      { leg: "Spread", qty: 1, avgPrice: 16.3, mark: 18.1, pnl: 1800000 },
    ],
    carry: {
      r: 3.18,
      q: 0.2,
      c: 0.35,
      t: 60,
      pvDiv: 0,
      modelFv: 188350,
      marketFv: 188070,
      modelBasisBps: 18,
      marketBasisBps: 15,
      residualBps: 3,
      breakEvenBps: 8,
      carrySpreadBps: 15,
      residualAfterCostBps: 2,
      oneDayCarryBps: 0.6,
      impliedQ: 0.18,
      allInCostBps: 9,
      pnlPer10Bps: 1650000,
      borrowAvail: "Clean",
      exposureAdv: 2.6,
      upcomingExDate: "—",
      timestampLagMs: 300,
    },
    quickTicket: {
      suggestedLots: 12,
      slippageBps: 2.8,
      feeBps: 0.7,
      breakEvenResidual: 6.4,
    },
    lotSizingRule: "k-factor 1.2",
    autoHedge: true,
    borrowSource: "Internal pool",
    borrowCap: "KRW 20B",
    ordersAndFills: [
      { id: "F-1188", side: "Sell", product: "F1", size: 4, price: 1890.2, status: "Filled", time: "08:42:19" },
    ],
    positionDetail: {
      equity: { qty: 1500, avgPrice: 187100, mark: 189200, realized: 4200000, unrealized: 31500000 },
      f1: { qty: -14, avgPrice: 1886.2, mark: 1890.4, realized: -1300000, unrealized: -5900000 },
      f2: { qty: -6, avgPrice: 1871.9, mark: 1876.8, realized: -640000, unrealized: -2940000 },
      spread: { ratio: 0.91, syntheticPrice: 188580, pnl: 22100000 },
    },
    dividendInfo: {
      nextExDate: "N/A",
      expectedAmount: 0,
      certainty: "High",
      override: false,
      notes: "Reinvest residual into futures leg",
    },
  },
  {
    symbol: "051910 KS",
    name: "LG Chem",
    sector: "Materials",
    pxEquity: 482500,
    f1Px: 4818.4,
    f2Px: 4769.5,
    spreadF1F2: 48.9,
    basisVsF1Bps: -22.6,
    basisVsF2Bps: -3.3,
    dividendNext: "₩6000 (Mar)",
    dividendYield: 1.2,
    strategyMode: "Passive",
    entryExit: { entry: 20, exit: 7 },
    hedgeRatio: 0.97,
    equityQty: -950,
    f1Qty: 9,
    f2Qty: 4,
    netDelta: -212,
    unrealizedPnl: -12400000,
    orders: 2,
    active: true,
    direction: "short",
    residualBps: -18,
    borrowFlag: false,
    exDateFlag: true,
    openOrders: true,
    fvInputs: { r: 3.05, q: 1.2, c: 0.72, t: 57, timestamp: "08:44:09" },
    lastUpdateMs: 1470,
    legs: [
      { leg: "Equity", qty: -950, avgPrice: 486200, mark: 482500, pnl: 35150000 },
      { leg: "KOSPI F1", qty: 9, avgPrice: 4812.5, mark: 4818.4, pnl: -5340000 },
      { leg: "KOSPI F2", qty: 4, avgPrice: 4761.4, mark: 4769.5, pnl: -3270000 },
      { leg: "Spread", qty: 1, avgPrice: -28.6, mark: -32.1, pnl: -8900000 },
    ],
    carry: {
      r: 3.05,
      q: 1.2,
      c: 0.72,
      t: 57,
      pvDiv: 5800,
      modelFv: 479620,
      marketFv: 480140,
      modelBasisBps: -18,
      marketBasisBps: -12,
      residualBps: -6,
      breakEvenBps: 13,
      carrySpreadBps: 9,
      residualAfterCostBps: -4,
      oneDayCarryBps: 0.5,
      impliedQ: 1.24,
      allInCostBps: 15,
      pnlPer10Bps: 2980000,
      borrowAvail: "Firm",
      exposureAdv: 5.4,
      upcomingExDate: "2025-03-20",
      timestampLagMs: 1020,
    },
    quickTicket: {
      suggestedLots: 9,
      slippageBps: 5.2,
      feeBps: 1.3,
      breakEvenResidual: 11.5,
    },
    lotSizingRule: "Stress VaR <= KRW 1.5B",
    autoHedge: false,
    borrowSource: "KB Borrow window",
    borrowCap: "KRW 18B",
    ordersAndFills: [
      { id: "O-5120", side: "Sell", product: "Equity", size: 240, price: 482400, status: "Working", time: "08:43:49" },
      { id: "O-5116", side: "Buy", product: "F1", size: 2, price: 4818.2, status: "Partial", time: "08:43:15" },
    ],
    positionDetail: {
      equity: { qty: -950, avgPrice: 486200, mark: 482500, realized: 7200000, unrealized: 35150000 },
      f1: { qty: 9, avgPrice: 4812.5, mark: 4818.4, realized: -2300000, unrealized: -5340000 },
      f2: { qty: 4, avgPrice: 4761.4, mark: 4769.5, realized: -1180000, unrealized: -3270000 },
      spread: { ratio: -0.97, syntheticPrice: 481040, pnl: 24600000 },
    },
    dividendInfo: {
      nextExDate: "2025-03-20",
      expectedAmount: 6000,
      certainty: "High",
      override: false,
      notes: "Ex-date in 3 days, confirm hedge roll",
    },
  },
  {
    symbol: "068270 KS",
    name: "Celltrion",
    sector: "Healthcare",
    pxEquity: 149800,
    f1Px: 1495.5,
    f2Px: 1484.2,
    spreadF1F2: 11.3,
    basisVsF1Bps: 3.8,
    basisVsF2Bps: 24.1,
    dividendNext: "₩120 (Jul)",
    dividendYield: 0.3,
    strategyMode: "Neutral",
    entryExit: { entry: 10, exit: 3 },
    hedgeRatio: 0.89,
    equityQty: 0,
    f1Qty: 0,
    f2Qty: 0,
    netDelta: 0,
    unrealizedPnl: 0,
    orders: 0,
    active: false,
    direction: "flat",
    residualBps: 4,
    openOrders: false,
    fvInputs: { r: 3.09, q: 0.3, c: 0.38, t: 63, timestamp: "08:44:06" },
    lastUpdateMs: 540,
    legs: [
      { leg: "Equity", qty: 0, avgPrice: 0, mark: 0, pnl: 0 },
      { leg: "KOSPI F1", qty: 0, avgPrice: 0, mark: 0, pnl: 0 },
      { leg: "KOSPI F2", qty: 0, avgPrice: 0, mark: 0, pnl: 0 },
    ],
    carry: {
      r: 3.09,
      q: 0.3,
      c: 0.38,
      t: 63,
      pvDiv: 116,
      modelFv: 149040,
      marketFv: 149120,
      modelBasisBps: 2,
      marketBasisBps: 3,
      residualBps: -1,
      breakEvenBps: 7,
      carrySpreadBps: 8,
      residualAfterCostBps: -2,
      oneDayCarryBps: 0.3,
      impliedQ: 0.31,
      allInCostBps: 7,
      pnlPer10Bps: 980000,
      borrowAvail: "Neutral",
      exposureAdv: 0,
      upcomingExDate: "2025-07-12",
      timestampLagMs: 360,
    },
    quickTicket: {
      suggestedLots: 0,
      slippageBps: 0,
      feeBps: 0,
      breakEvenResidual: 0,
    },
    lotSizingRule: "Standby",
    autoHedge: true,
    borrowSource: "Unused",
    borrowCap: "KRW 8B",
    ordersAndFills: [],
    positionDetail: {
      equity: { qty: 0, avgPrice: 0, mark: 0, realized: 0, unrealized: 0 },
      f1: { qty: 0, avgPrice: 0, mark: 0, realized: 0, unrealized: 0 },
      spread: { ratio: 0, syntheticPrice: 0, pnl: 0 },
    },
    dividendInfo: {
      nextExDate: "2025-07-12",
      expectedAmount: 120,
      certainty: "Medium",
      override: false,
      notes: "Monitor biotech pipeline catalysts",
    },
  },
];


const detailCellRenderer = (params: ICellRendererParams<BasisRow>) => {
  if (!params.data) return null;
  const row = params.data;

  return (
    <div className="bg-muted/40 grid w-full grid-cols-1 gap-3 p-4 text-sm sm:grid-cols-2">
      {row.legs.map((leg) => (
        <Card key={`${row.symbol}-${leg.leg}`} className="shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">{leg.leg}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-1 text-xs text-muted-foreground">
            <div className="flex justify-between"><span>Qty</span><span>{quantityFormatter.format(leg.qty)}</span></div>
            <div className="flex justify-between">
              <span>Avg Px</span>
              <span>{leg.avgPrice ? leg.avgPrice.toLocaleString("en-US", { maximumFractionDigits: 1 }) : "-"}</span>
            </div>
            <div className="flex justify-between">
              <span>Mark</span>
              <span>{leg.mark ? leg.mark.toLocaleString("en-US", { maximumFractionDigits: 1 }) : "-"}</span>
            </div>
            <div className="flex justify-between">
              <span>PnL</span>
              <span className={leg.pnl >= 0 ? "text-emerald-600" : "text-rose-600"}>{pnlFormatter(leg.pnl)}</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

const modeBadgeTone: Record<BasisRow["strategyMode"], string> = {
  Aggressive: "bg-emerald-100 text-emerald-800",
  Passive: "bg-sky-100 text-sky-800",
  Neutral: "bg-slate-100 text-slate-800",
};

const statusTone: Record<string, string> = {
  Working: "bg-amber-50 text-amber-600 border border-amber-200",
  Filled: "bg-emerald-50 text-emerald-600 border border-emerald-200",
  Partial: "bg-sky-50 text-sky-600 border border-sky-200",
  Cancelled: "bg-slate-50 text-slate-500 border border-slate-200",
};

const SymbolCell = (params: ICellRendererParams<BasisRow>) => {
  if (!params.data) return null;
  const { symbol, name, sector, direction, active, openOrders, borrowFlag, exDateFlag, residualBps } = params.data;

  const DirectionIcon = direction === "long" ? ArrowUpRight : direction === "short" ? ArrowDownRight : PauseCircle;
  const directionTone =
    direction === "long"
      ? "text-emerald-600"
      : direction === "short"
        ? "text-rose-600"
        : "text-slate-400";

  return (
    <div className="flex h-full items-center gap-2">
      <span className={cn("flex h-5 w-5 items-center justify-center rounded-full border text-xs", directionTone)}>
        <DirectionIcon className="h-3 w-3" />
      </span>
      <div className="flex flex-col">
        <span className="font-medium text-sm">{symbol}</span>
        <span className="text-xs text-muted-foreground">{name}</span>
      </div>
      <div className="ml-auto flex items-center gap-1">
        {active ? <Badge className="bg-emerald-100 text-emerald-700">Active</Badge> : null}
        <Badge variant="outline" className="text-[10px] uppercase">
          {sector}
        </Badge>
        {openOrders ? <Circle className="h-3 w-3 text-amber-500" /> : null}
        {borrowFlag ? <Flag className="h-3 w-3 text-sky-500" /> : null}
        {exDateFlag ? <Flag className="h-3 w-3 text-amber-600" /> : null}
        <span className={cn("text-xs font-semibold", residualBps >= 0 ? "text-emerald-600" : "text-rose-600")}> 
          {residualBps >= 0 ? "+" : ""}
          {residualBps.toFixed(1)}
        </span>
      </div>
    </div>
  );
};

const OrdersCell = (params: ICellRendererParams<BasisRow>) => {
  if (!params.data) return null;
  const working = params.data.ordersAndFills.filter((item) => item.status === "Working" || item.status === "Partial").length;
  const filled = params.data.ordersAndFills.filter((item) => item.status === "Filled").length;

  return (
    <div className="flex items-center justify-between text-xs">
      <span className="flex items-center gap-1">
        <Circle className="h-2.5 w-2.5 text-emerald-500" />
        {filled}
      </span>
      <span className="flex items-center gap-1">
        <Circle className="h-2.5 w-2.5 text-amber-500" />
        {working}
      </span>
      <span className="text-muted-foreground">{params.data.orders}</span>
    </div>
  );
};

const rowStyle = (data?: BasisRow) => {
  if (!data) return undefined;
  const magnitude = Math.min(Math.abs(data.residualBps), 30) / 30;
  const baseAlpha = 0.08 + magnitude * 0.2;
  const background =
    data.direction === "long"
      ? `rgba(34,197,94,${baseAlpha})`
      : data.direction === "short"
        ? `rgba(248,113,113,${baseAlpha})`
        : `rgba(148,163,184,${baseAlpha / 1.5})`;
  const borderColor =
    data.direction === "long"
      ? "rgba(34,197,94,0.8)"
      : data.direction === "short"
        ? "rgba(248,113,113,0.85)"
        : "rgba(148,163,184,0.65)";

  return {
    background,
    borderLeft: `4px solid ${borderColor}`,
    transition: "background-color 200ms ease, border-color 200ms ease",
  } as const;
};

const toneForNumber = (value: number) => {
  if (value > 0) return "text-emerald-600";
  if (value < 0) return "text-rose-600";
  return "text-muted-foreground";
};

const borrowTone = (value: string) => {
  if (value === "Ample" || value === "Clean") return "text-emerald-600";
  if (value === "Tight" || value === "None") return "text-rose-600";
  if (value === "Firm") return "text-amber-600";
  return "text-muted-foreground";
};

type MetricLineProps = {
  label: string;
  value: string | number;
  tone?: string;
};

const MetricLine = ({ label, value, tone }: MetricLineProps) => (
  <div className="flex items-center justify-between">
    <span className="text-muted-foreground">{label}</span>
    <span className={cn("font-medium", tone)}>{value}</span>
  </div>
);

type CarryBandProps = {
  title: string;
  cards: Array<{ label: string; value: string | number; tone?: string }>;
  compact?: boolean;
};

const CarryBand = ({ title, cards, compact = false }: CarryBandProps) => (
  <section
    className={cn(
      "rounded-xl border bg-white px-4 py-3 shadow-sm",
      compact ? "pt-2" : "pt-3",
    )}
  >
    <div className="mb-2 flex items-center justify-between">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</h3>
      <span className="text-[10px] uppercase text-muted-foreground">Live synced</span>
    </div>
    <div className="grid gap-2 text-sm md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-11">
      {cards.map((card) => (
        <div
          key={card.label}
          className="flex flex-col gap-1 rounded-lg border bg-muted/40 px-3 py-2"
        >
          <span className="text-[11px] uppercase text-muted-foreground">{card.label}</span>
          <span className={cn("text-right text-sm font-semibold", card.tone)}>{card.value}</span>
        </div>
      ))}
    </div>
  </section>
);

type HeaderBarProps = {
  metrics: {
    netExposure: number;
    netDelta: number;
    pnlRealized: number;
    pnlUnrealized: number;
    marginUsage: number;
    leverage: number;
  };
  freshnessClass: string;
  clock: Date;
};

const HeaderBar = ({ metrics, freshnessClass, clock }: HeaderBarProps) => {
  return (
    <section className="grid grid-cols-2 gap-3 rounded-xl border bg-white px-4 py-3 shadow-sm sm:grid-cols-3 lg:grid-cols-6">
      <HeaderTile label="Net Exposure" value={currencyFormatter.format(metrics.netExposure)} />
      <HeaderTile label="Net Delta" value={metrics.netDelta.toLocaleString("en-US") + " Δ"} />
      <HeaderTile
        label="Total PnL"
        value={`${pnlFormatter(metrics.pnlRealized)} / ${pnlFormatter(metrics.pnlUnrealized)}`}
      />
      <HeaderTile label="Margin Usage" value={percentageFormatter(metrics.marginUsage * 100, 1)} />
      <HeaderTile label="Portfolio Leverage" value={`${metrics.leverage.toFixed(1)}x`} />
      <div className="flex flex-col justify-between">
        <span className="text-[11px] uppercase text-muted-foreground">Data freshness</span>
        <div className="flex items-center gap-2">
          <span className={cn("h-2.5 w-2.5 rounded-full", freshnessClass)} />
          <span className="text-sm font-medium">{clock.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</span>
        </div>
      </div>
    </section>
  );
};

type HeaderTileProps = {
  label: string;
  value: string;
};

const HeaderTile = ({ label, value }: HeaderTileProps) => (
  <div className="flex flex-col justify-between">
    <span className="text-[11px] uppercase text-muted-foreground">{label}</span>
    <span className="text-sm font-semibold">{value}</span>
  </div>
);

export default function KrxBasisTradingPage() {
  const [rows, setRows] = useState<BasisRow[]>(basisRowSeed);
  const [filterMode, setFilterMode] = useState<FilterMode>("all");
  const [sectorFilter, setSectorFilter] = useState<string>("all");
  const [activeSymbol, setActiveSymbol] = useState<string>(basisRowSeed[0]?.symbol ?? "");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [whatIfMode, setWhatIfMode] = useState<WhatIfMode>("base");
  const [clock, setClock] = useState(() => new Date());
  const gridRef = useRef<AgGridReact<BasisRow>>(null);

  const selectedRow = useMemo(
    () => rows.find((row) => row.symbol === activeSymbol) ?? rows[0] ?? null,
    [activeSymbol, rows],
  );

  useEffect(() => {
    const interval = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const filtered = rows.filter((row) => {
      if (filterMode === "sector" && sectorFilter !== "all") {
        return row.sector === sectorFilter || row.active;
      }
      if (filterMode === "active") {
        return row.active;
      }
      if (filterMode === "long") {
        return row.direction === "long" || row.active;
      }
      if (filterMode === "short") {
        return row.direction === "short" || row.active;
      }
      return true;
    });

    if (filtered.length === 0) {
      return;
    }

    if (!filtered.some((row) => row.symbol === activeSymbol)) {
      setActiveSymbol(filtered[0].symbol);
    }
  }, [activeSymbol, filterMode, rows, sectorFilter]);

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      const matches = (() => {
        switch (filterMode) {
          case "active":
            return row.active;
          case "long":
            return row.direction === "long";
          case "short":
            return row.direction === "short";
          case "sector":
            return sectorFilter === "all" ? true : row.sector === sectorFilter;
          default:
            return true;
        }
      })();

      return matches || row.active;
    });
  }, [filterMode, rows, sectorFilter]);

  const columnDefs = useMemo<ColDef<BasisRow>[]>(
    () => [
      {
        field: "symbol",
        headerName: "Symbol",
        pinned: "left",
        width: 170,
        cellRenderer: SymbolCell,
      },
      {
        field: "pxEquity",
        headerName: "Px (Equity)",
        valueFormatter: (params) =>
          params.value?.toLocaleString("en-US", { maximumFractionDigits: 0 }) ?? "",
        type: "numericColumn",
        width: 140,
      },
      {
        field: "f1Px",
        headerName: "F1 Px",
        valueFormatter: (params) =>
          params.value?.toLocaleString("en-US", { minimumFractionDigits: 1, maximumFractionDigits: 1 }) ?? "",
        type: "numericColumn",
        width: 120,
      },
      {
        field: "f2Px",
        headerName: "F2 Px",
        valueFormatter: (params) =>
          params.value?.toLocaleString("en-US", { minimumFractionDigits: 1, maximumFractionDigits: 1 }) ?? "",
        type: "numericColumn",
        width: 120,
      },
      {
        field: "spreadF1F2",
        headerName: "Spread F1-F2",
        valueFormatter: (params) => `${params.value?.toFixed(1) ?? "0.0"}`,
        width: 140,
      },
      {
        field: "basisVsF1Bps",
        headerName: "Basis vs F1 (bps)",
        valueFormatter: (params) => `${params.value?.toFixed(1) ?? "0.0"}`,
        width: 160,
        cellClass: (params) => (params.value ?? 0) >= 0 ? "text-emerald-600" : "text-rose-600",
      },
      {
        field: "basisVsF2Bps",
        headerName: "Basis vs F2 (bps)",
        valueFormatter: (params) => `${params.value?.toFixed(1) ?? "0.0"}`,
        width: 160,
        cellClass: (params) => (params.value ?? 0) >= 0 ? "text-emerald-600" : "text-rose-600",
      },
      {
        headerName: "Dividend (Next / Yield)",
        valueGetter: (params) =>
          `${params.data?.dividendNext ?? "-"} / ${percentageFormatter(params.data?.dividendYield ?? 0)}`,
        width: 200,
      },
      {
        field: "strategyMode",
        headerName: "Strategy Mode",
        width: 150,
        cellRenderer: (params: ICellRendererParams<BasisRow>) => (
          <Badge className={cn("text-xs font-medium", modeBadgeTone[params.data?.strategyMode ?? "Neutral"])}>
            {params.data?.strategyMode ?? "Neutral"}
          </Badge>
        ),
      },
      {
        headerName: "Entry / Exit Threshold",
        valueGetter: (params) =>
          `${params.data?.entryExit.entry.toFixed(0)} / ${params.data?.entryExit.exit.toFixed(0)} bps`,
        width: 180,
      },
      {
        field: "hedgeRatio",
        headerName: "Hedge Ratio",
        valueFormatter: (params) => params.value?.toFixed(2) ?? "",
        width: 130,
      },
      {
        field: "equityQty",
        headerName: "Equity Qty",
        valueFormatter: (params) => quantityFormatter.format(params.value ?? 0),
        width: 130,
      },
      {
        field: "f1Qty",
        headerName: "F1 Qty",
        valueFormatter: (params) => quantityFormatter.format(params.value ?? 0),
        width: 110,
      },
      {
        field: "f2Qty",
        headerName: "F2 Qty",
        valueFormatter: (params) => quantityFormatter.format(params.value ?? 0),
        width: 110,
      },
      {
        field: "netDelta",
        headerName: "Net Δ",
        valueFormatter: (params) => quantityFormatter.format(params.value ?? 0),
        width: 110,
        cellClass: (params) => (params.value ?? 0) >= 0 ? "text-emerald-600" : "text-rose-600",
      },
      {
        field: "unrealizedPnl",
        headerName: "Unrealized PnL",
        valueFormatter: (params) => pnlFormatter(params.value ?? 0),
        width: 170,
        cellClass: (params) => (params.value ?? 0) >= 0 ? "text-emerald-600" : "text-rose-600",
      },
      {
        field: "orders",
        headerName: "Orders",
        width: 120,
        cellRenderer: OrdersCell,
      },
    ],
    [],
  );

  const defaultColDef = useMemo<ColDef<BasisRow>>(
    () => ({
      sortable: true,
      resizable: true,
      filter: false,
      minWidth: 110,
      tooltipValueGetter: (params) =>
        params.data
          ? `r: ${params.data.fvInputs.r.toFixed(2)}%\nq: ${params.data.fvInputs.q.toFixed(2)}%\nc: ${params.data.fvInputs.c.toFixed(2)}%\nT: ${params.data.fvInputs.t}d\nModel @ ${params.data.fvInputs.timestamp}`
          : undefined,
      cellClass: "text-sm",
    }),
    [],
  );

  useEffect(() => {
    if (!gridRef.current || !gridRef.current.api) return;
    const api = gridRef.current.api;
    api.forEachNode((node) => {
      node.setSelected(node.data?.symbol === activeSymbol);
    });
  }, [activeSymbol, filteredRows]);

  const onRowClicked = useCallback(
    (event: RowClickedEvent<BasisRow>) => {
      if (!event.data) return;
      setActiveSymbol(event.data.symbol);
      setDrawerOpen(true);
    },
    [],
  );

  const onModeChange = useCallback(
    (mode: BasisRow["strategyMode"]) => {
      if (!selectedRow) return;
      setRows((prev) =>
        prev.map((row) =>
          row.symbol === selectedRow.symbol
            ? {
                ...row,
                strategyMode: mode,
              }
            : row,
        ),
      );
    },
    [selectedRow],
  );

  const onThresholdChange = useCallback(
    (field: "entry" | "exit", value: number) => {
      if (!selectedRow) return;
      setRows((prev) =>
        prev.map((row) =>
          row.symbol === selectedRow.symbol
            ? {
                ...row,
                entryExit: {
                  ...row.entryExit,
                  [field]: value,
                },
              }
            : row,
        ),
      );
    },
    [selectedRow],
  );

  const onAutoHedgeToggle = useCallback(
    (value: boolean) => {
      if (!selectedRow) return;
      setRows((prev) =>
        prev.map((row) =>
          row.symbol === selectedRow.symbol
            ? {
                ...row,
                autoHedge: value,
              }
            : row,
        ),
      );
    },
    [selectedRow],
  );

  const headerMetrics = useMemo(() => {
    const totals = rows.reduce(
      (acc, row) => {
        const equityExposure = row.pxEquity * row.equityQty;
        const futuresExposure = row.f1Px * row.f1Qty * 50 + row.f2Px * row.f2Qty * 50;
        return {
          exposure: acc.exposure + equityExposure + futuresExposure,
          delta: acc.delta + row.netDelta,
          unrealized: acc.unrealized + row.unrealizedPnl,
        };
      },
      { exposure: 0, delta: 0, unrealized: 0 },
    );

    const realized = 2580000000;
    const marginUsage = 0.68;
    const leverage = 3.4;

    return {
      netExposure: totals.exposure,
      netDelta: totals.delta,
      pnlRealized: realized,
      pnlUnrealized: totals.unrealized,
      marginUsage,
      leverage,
    };
  }, [rows]);

  const freshnessAge = selectedRow ? selectedRow.lastUpdateMs : 0;
  const freshnessClass = freshnessAge < 1000 ? "bg-emerald-500" : freshnessAge < 2500 ? "bg-amber-500" : "bg-rose-500";

  const whatIfCarry = useMemo(() => {
    if (!selectedRow) return null;
    const base = selectedRow.carry;
    if (whatIfMode === "base") return base;
    if (whatIfMode === "qDown") {
      return {
        ...base,
        q: base.q * 0.9,
        impliedQ: base.impliedQ * 0.9,
        modelBasisBps: base.modelBasisBps + 6,
        residualBps: base.residualBps + 6,
        residualAfterCostBps: base.residualAfterCostBps + 5,
      };
    }
    if (whatIfMode === "rUp") {
      return {
        ...base,
        r: base.r + 0.1,
        modelFv: base.modelFv - 45,
        modelBasisBps: base.modelBasisBps - 4,
        residualBps: base.residualBps - 4,
        oneDayCarryBps: base.oneDayCarryBps + 0.1,
      };
    }
    return {
      ...base,
      c: base.c + 0.1,
      residualAfterCostBps: base.residualAfterCostBps - 5,
      allInCostBps: base.allInCostBps + 4,
      carrySpreadBps: base.carrySpreadBps - 2,
    };
  }, [selectedRow, whatIfMode]);

  const handleSave = useCallback(() => {
    setDrawerOpen(false);
  }, []);

  const handleRevert = useCallback(() => {
    if (!selectedRow) return;
    setRows((prev) =>
      prev.map((row) =>
        row.symbol === selectedRow.symbol
          ? basisRowSeed.find((seed) => seed.symbol === row.symbol) ?? row
          : row,
      ),
    );
  }, [selectedRow]);

  const bottomCardsRow1 = useMemo(() => {
    if (!selectedRow || !whatIfCarry) return [];
    return [
      { label: "r (annualized)", value: `${whatIfCarry.r.toFixed(2)}%`, tone: toneForNumber(whatIfCarry.r - 3) },
      { label: "q (dividend yield)", value: `${whatIfCarry.q.toFixed(2)}%`, tone: toneForNumber(whatIfCarry.q - 1) },
      { label: "c (borrow cost)", value: `${whatIfCarry.c.toFixed(2)}%`, tone: toneForNumber(-whatIfCarry.c) },
      { label: "T (days to exp)", value: `${whatIfCarry.t}d`, tone: "" },
      { label: "PV (div)", value: currencyFormatter.format(whatIfCarry.pvDiv), tone: toneForNumber(whatIfCarry.pvDiv) },
      { label: "Model FV", value: currencyFormatter.format(whatIfCarry.modelFv), tone: toneForNumber(whatIfCarry.modelFv - selectedRow.carry.modelFv) },
      { label: "Market FV", value: currencyFormatter.format(whatIfCarry.marketFv), tone: "" },
      { label: "Model Basis bps", value: `${whatIfCarry.modelBasisBps.toFixed(1)}`, tone: toneForNumber(whatIfCarry.modelBasisBps) },
      { label: "Market Basis bps", value: `${whatIfCarry.marketBasisBps.toFixed(1)}`, tone: toneForNumber(whatIfCarry.marketBasisBps) },
      { label: "Residual bps", value: `${whatIfCarry.residualBps.toFixed(1)}`, tone: toneForNumber(whatIfCarry.residualBps) },
      { label: "Break-Even bps", value: `${whatIfCarry.breakEvenBps.toFixed(1)}`, tone: toneForNumber(-whatIfCarry.breakEvenBps) },
    ];
  }, [selectedRow, whatIfCarry]);

  const bottomCardsRow2 = useMemo(() => {
    if (!selectedRow || !whatIfCarry) return [];
    return [
      { label: "Carry Spread bps", value: `${whatIfCarry.carrySpreadBps.toFixed(1)}`, tone: toneForNumber(whatIfCarry.carrySpreadBps) },
      { label: "Residual after Cost bps", value: `${whatIfCarry.residualAfterCostBps.toFixed(1)}`, tone: toneForNumber(whatIfCarry.residualAfterCostBps) },
      { label: "1-Day Carry bps", value: `${whatIfCarry.oneDayCarryBps.toFixed(2)}`, tone: toneForNumber(whatIfCarry.oneDayCarryBps) },
      { label: "Implied q (%)", value: `${whatIfCarry.impliedQ.toFixed(2)}%`, tone: toneForNumber(whatIfCarry.impliedQ - selectedRow.carry.q) },
      { label: "All-in Cost bps", value: `${whatIfCarry.allInCostBps.toFixed(1)}`, tone: toneForNumber(-whatIfCarry.allInCostBps) },
      { label: "PnL / 10 bps KRW", value: currencyFormatter.format(whatIfCarry.pnlPer10Bps), tone: toneForNumber(whatIfCarry.pnlPer10Bps) },
      { label: "Borrow Avail", value: whatIfCarry.borrowAvail, tone: borrowTone(whatIfCarry.borrowAvail) },
      { label: "Exposure %ADV", value: `${whatIfCarry.exposureAdv.toFixed(1)}%`, tone: toneForNumber(-Math.abs(whatIfCarry.exposureAdv - 4)) },
      { label: "Upcoming Ex-date", value: whatIfCarry.upcomingExDate, tone: selectedRow.exDateFlag ? "text-amber-600" : "" },
      { label: "Timestamp Lag ms", value: `${whatIfCarry.timestampLagMs} ms`, tone: toneForNumber(-whatIfCarry.timestampLagMs + 500) },
    ];
  }, [selectedRow, whatIfCarry]);

  const lastUpdate = clock.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });

  return (
    <PageTemplate
      title="KRX Equity–Futures Basis"
      description="Unified delta-one pad for live basis, positions, and execution control"
      fullWidth
    >
      <div className="flex h-full flex-col gap-4">
        <HeaderBar metrics={headerMetrics} freshnessClass={freshnessClass} clock={clock} />

        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {(["all", "active", "long", "short"] as FilterMode[]).map((mode) => (
                <Button
                  key={mode}
                  size="sm"
                  variant={filterMode === mode ? "default" : "outline"}
                  onClick={() => {
                    setFilterMode(mode);
                    setSectorFilter("all");
                  }}
                >
                  {mode === "all" ? "All" : mode === "active" ? "Active" : mode === "long" ? "Long" : "Short"}
                </Button>
              ))}
              <Select
                value={filterMode === "sector" ? sectorFilter : "all"}
                onValueChange={(value) => {
                  setSectorFilter(value);
                  setFilterMode(value === "all" ? "all" : "sector");
                }}
              >
                <SelectTrigger className="h-8 w-[160px] text-sm">
                  <SelectValue placeholder="Sector" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sectors</SelectItem>
                  {[...new Set(rows.map((row) => row.sector))].map((sector) => (
                    <SelectItem key={sector} value={sector}>
                      {sector}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <PlayCircle className="h-4 w-4 text-emerald-500" />
              <span>Real-time sync</span>
              <Separator orientation="vertical" className="h-4" />
              <span>{filteredRows.length} symbols</span>
            </div>
          </div>

          <div className="ag-theme-quartz flex-1 rounded-xl border shadow-sm" style={{ minHeight: 480 }}>
            <AgGridReact<BasisRow>
              ref={gridRef}
              rowData={filteredRows}
              columnDefs={columnDefs}
              defaultColDef={defaultColDef}
              tooltipShowDelay={0}
              tooltipHideDelay={1200}
              rowSelection="single"
              onRowClicked={onRowClicked}
              masterDetail
              detailCellRenderer={detailCellRenderer}
              detailRowAutoHeight
              animateRows
              suppressRowClickSelection
              getRowId={(params: GetRowIdParams<BasisRow>) => params.data.symbol}
              getRowStyle={(params) => rowStyle(params.data)}
              rowClassRules={{
                "krx-basis-row": () => true,
                "krx-basis-row-long": (params) => params.data?.direction === "long",
                "krx-basis-row-short": (params) => params.data?.direction === "short",
                "krx-basis-row-flat": (params) => params.data?.direction === "flat",
              }}
              headerHeight={36}
              rowHeight={64}
            />
          </div>
        </div>

        <CarryBand title="Funding & Fair-Value Inputs" cards={bottomCardsRow1} />
        <CarryBand title="Carry & Practical Checks" cards={bottomCardsRow2} compact />

        <footer className="flex items-center justify-between gap-3 rounded-xl border bg-white px-4 py-2 text-xs text-muted-foreground shadow-sm">
          <span>Last update {lastUpdate}</span>
          <span className="flex items-center gap-1">
            <Settings2 className="h-3.5 w-3.5" />
            Direct feed · SeamlessOMS
          </span>
          <span>Latency 410 μs</span>
        </footer>

        <Drawer open={drawerOpen} onOpenChange={setDrawerOpen} direction="right">
          <DrawerContent className="w-full sm:max-w-2xl">
            <DrawerHeader className="border-b pb-4">
              <DrawerTitle className="flex items-center justify-between text-lg">
                <span>{selectedRow?.symbol ?? "--"}</span>
                <span className="text-sm font-normal text-muted-foreground">{selectedRow?.name}</span>
              </DrawerTitle>
              <DrawerDescription>
                Live controls for hedge, thresholds, and carry on the selected symbol
              </DrawerDescription>
            </DrawerHeader>
            <ScrollArea className="h-[calc(100vh-5rem)]">
              <div className="flex flex-col gap-4 p-5">
                {selectedRow ? (
                  <>
                    <section className="rounded-xl border bg-white p-4 shadow-sm">
                      <div className="mb-3 flex items-center justify-between">
                        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                          Quick Ticket
                        </h3>
                        <Badge variant="outline" className="text-xs">
                          Hedge ratio {selectedRow.hedgeRatio.toFixed(2)}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        {[
                          { label: "Enter Pair", icon: ArrowUpRight },
                          { label: "Hedge", icon: PlayCircle },
                          { label: "Unwind", icon: ArrowDownRight },
                          { label: "Rebalance", icon: RotateCcw },
                        ].map((action) => (
                          <Button key={action.label} size="sm" className="gap-2">
                            <action.icon className="h-4 w-4" />
                            {action.label}
                          </Button>
                        ))}
                      </div>
                      <div className="mt-4 grid gap-3 text-xs sm:grid-cols-2">
                        <div className="rounded-lg border bg-muted/40 p-3">
                          <div className="flex justify-between font-medium">
                            <span>Suggested lots</span>
                            <span>{selectedRow.quickTicket.suggestedLots}</span>
                          </div>
                          <p className="mt-1 text-muted-foreground">
                            Auto scaled to ADV window and hedge ratio
                          </p>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-right">
                          <MetricLine
                            label="Slippage"
                            value={`${selectedRow.quickTicket.slippageBps.toFixed(1)} bps`}
                            tone="text-amber-600"
                          />
                          <MetricLine
                            label="Fees"
                            value={`${selectedRow.quickTicket.feeBps.toFixed(1)} bps`}
                          />
                          <MetricLine
                            label="Break-even residual"
                            value={`${selectedRow.quickTicket.breakEvenResidual.toFixed(1)} bps`}
                            tone="text-emerald-600"
                          />
                          <MetricLine label="Lot hedge" value={`${selectedRow.hedgeRatio.toFixed(2)}`} />
                        </div>
                      </div>
                    </section>

                    <section className="rounded-xl border bg-white p-4 shadow-sm">
                      <div className="mb-3 flex items-center justify-between">
                        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                          Strategy Settings
                        </h3>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={handleRevert}>
                            Revert
                          </Button>
                          <Button size="sm" onClick={handleSave}>
                            Save
                          </Button>
                        </div>
                      </div>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="flex flex-col gap-2">
                          <span className="text-xs font-medium text-muted-foreground">Mode</span>
                          <Select
                            value={selectedRow.strategyMode}
                            onValueChange={(value) => onModeChange(value as BasisRow["strategyMode"])}
                          >
                            <SelectTrigger className="h-9">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Aggressive">Aggressive</SelectItem>
                              <SelectItem value="Neutral">Neutral</SelectItem>
                              <SelectItem value="Passive">Passive</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <span className="text-xs font-medium text-muted-foreground">Entry (bps)</span>
                            <Input
                              className="mt-1 h-9"
                              type="number"
                              value={selectedRow.entryExit.entry}
                              onChange={(event) => onThresholdChange("entry", Number(event.target.value))}
                            />
                          </div>
                          <div>
                            <span className="text-xs font-medium text-muted-foreground">Exit (bps)</span>
                            <Input
                              className="mt-1 h-9"
                              type="number"
                              value={selectedRow.entryExit.exit}
                              onChange={(event) => onThresholdChange("exit", Number(event.target.value))}
                            />
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          <span className="text-xs font-medium text-muted-foreground">Lot sizing rule</span>
                          <Input
                            className="h-9"
                            value={selectedRow.lotSizingRule}
                            onChange={(event) =>
                              setRows((prev) =>
                                prev.map((row) =>
                                  row.symbol === selectedRow.symbol
                                    ? { ...row, lotSizingRule: event.target.value }
                                    : row,
                                ),
                              )
                            }
                          />
                        </div>
                        <div className="flex items-center justify-between rounded-lg border bg-muted/40 p-3">
                          <div>
                            <p className="text-xs font-medium text-muted-foreground">Auto-hedge</p>
                            <p className="text-xs text-muted-foreground">Fire immediately on fill</p>
                          </div>
                          <Switch checked={selectedRow.autoHedge} onCheckedChange={onAutoHedgeToggle} />
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-xs font-medium text-muted-foreground">Borrow source</span>
                          <Input
                            className="h-9"
                            value={selectedRow.borrowSource}
                            onChange={(event) =>
                              setRows((prev) =>
                                prev.map((row) =>
                                  row.symbol === selectedRow.symbol
                                    ? { ...row, borrowSource: event.target.value }
                                    : row,
                                ),
                              )
                            }
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-xs font-medium text-muted-foreground">Borrow cap</span>
                          <Input
                            className="h-9"
                            value={selectedRow.borrowCap}
                            onChange={(event) =>
                              setRows((prev) =>
                                prev.map((row) =>
                                  row.symbol === selectedRow.symbol
                                    ? { ...row, borrowCap: event.target.value }
                                    : row,
                                ),
                              )
                            }
                          />
                        </div>
                      </div>
                    </section>

                    <section className="rounded-xl border bg-white p-4 shadow-sm">
                      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                          Carry Snapshot
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            className="h-7 px-2 text-xs"
                            variant={whatIfMode === "base" ? "default" : "outline"}
                            onClick={() => setWhatIfMode("base")}
                          >
                            Base
                          </Button>
                          <Button
                            size="sm"
                            className="h-7 px-2 text-xs"
                            variant={whatIfMode === "qDown" ? "default" : "outline"}
                            onClick={() => setWhatIfMode("qDown")}
                          >
                            q −10%
                          </Button>
                          <Button
                            size="sm"
                            className="h-7 px-2 text-xs"
                            variant={whatIfMode === "rUp" ? "default" : "outline"}
                            onClick={() => setWhatIfMode("rUp")}
                          >
                            r +10 bps
                          </Button>
                          <Button
                            size="sm"
                            className="h-7 px-2 text-xs"
                            variant={whatIfMode === "cUp" ? "default" : "outline"}
                            onClick={() => setWhatIfMode("cUp")}
                          >
                            c +10 bps
                          </Button>
                        </div>
                      </div>
                      {whatIfCarry ? (
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div className="grid gap-2 text-xs">
                            <MetricLine label="r" value={`${whatIfCarry.r.toFixed(2)}%`} />
                            <MetricLine label="q" value={`${whatIfCarry.q.toFixed(2)}%`} />
                            <MetricLine label="c" value={`${whatIfCarry.c.toFixed(2)}%`} />
                            <MetricLine label="T" value={`${whatIfCarry.t} days`} />
                            <MetricLine label="Model FV" value={currencyFormatter.format(whatIfCarry.modelFv)} />
                            <MetricLine label="Market FV" value={currencyFormatter.format(whatIfCarry.marketFv)} />
                          </div>
                          <div className="grid gap-2 text-xs">
                            <MetricLine label="Model basis" value={`${whatIfCarry.modelBasisBps.toFixed(1)} bps`} />
                            <MetricLine label="Market basis" value={`${whatIfCarry.marketBasisBps.toFixed(1)} bps`} />
                            <MetricLine label="Residual" value={`${whatIfCarry.residualBps.toFixed(1)} bps`} />
                            <MetricLine label="All-in cost" value={`${whatIfCarry.allInCostBps.toFixed(1)} bps`} />
                            <MetricLine label="Residual after cost" value={`${whatIfCarry.residualAfterCostBps.toFixed(1)} bps`} />
                            <MetricLine label="PnL / 10 bps" value={currencyFormatter.format(whatIfCarry.pnlPer10Bps)} />
                          </div>
                        </div>
                      ) : null}
                    </section>

                    <section className="rounded-xl border bg-white p-4 shadow-sm">
                      <div className="mb-3 flex items-center justify-between">
                        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                          Orders & Fills
                        </h3>
                        <Button size="sm" variant="outline">
                          Amend / Cancel
                        </Button>
                      </div>
                      <div className="flex flex-col gap-2 text-xs">
                        {selectedRow.ordersAndFills.length > 0 ? (
                          selectedRow.ordersAndFills.map((order) => (
                            <div
                              key={order.id}
                              className="flex items-center justify-between rounded-lg border bg-muted/40 px-3 py-2"
                            >
                              <div className="flex items-center gap-2">
                                <Badge className={cn("text-[10px] uppercase", order.side === "Buy" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700")}>
                                  {order.side}
                                </Badge>
                                <span>{order.product}</span>
                              </div>
                              <div className="flex items-center gap-3">
                                <span>{order.size} @ {order.price}</span>
                                <span className={cn("rounded-full px-2 py-0.5 text-[10px]", statusTone[order.status])}>
                                  {order.status}
                                </span>
                                <span className="text-muted-foreground">{order.time}</span>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-muted-foreground">No recent orders.</p>
                        )}
                      </div>
                    </section>

                    <section className="rounded-xl border bg-white p-4 shadow-sm">
                      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                        Position Detail
                      </h3>
                      <div className="grid gap-3 text-xs sm:grid-cols-2">
                        {(Object.entries(selectedRow.positionDetail) as Array<[string, any]>).map(([leg, detail]) => (
                          <div key={leg} className="rounded-lg border bg-muted/40 p-3">
                            <div className="mb-2 flex items-center justify-between">
                              <span className="font-medium uppercase">{leg}</span>
                              {"qty" in detail ? (
                                <span className="text-muted-foreground">
                                  Qty {"qty" in detail ? (detail as { qty: number }).qty : "-"}
                                </span>
                              ) : null}
                            </div>
                            {"avgPrice" in detail ? (
                              <div className="flex justify-between">
                                <span>Avg</span>
                                <span>{(detail as { avgPrice: number }).avgPrice.toLocaleString("en-US")}</span>
                              </div>
                            ) : null}
                            {"mark" in detail ? (
                              <div className="flex justify-between">
                                <span>Mark</span>
                                <span>{(detail as { mark: number }).mark.toLocaleString("en-US")}</span>
                              </div>
                            ) : null}
                            {"realized" in detail ? (
                              <div className="flex justify-between">
                                <span>Realized</span>
                                <span>{pnlFormatter((detail as { realized: number }).realized)}</span>
                              </div>
                            ) : null}
                            {"unrealized" in detail ? (
                              <div className="flex justify-between">
                                <span>Unrealized</span>
                                <span>{pnlFormatter((detail as { unrealized: number }).unrealized)}</span>
                              </div>
                            ) : null}
                            {"ratio" in detail ? (
                              <div className="flex justify-between">
                                <span>Ratio</span>
                                <span>{(detail as { ratio: number }).ratio.toFixed(2)}</span>
                              </div>
                            ) : null}
                            {"syntheticPrice" in detail ? (
                              <div className="flex justify-between">
                                <span>Synthetic</span>
                                <span>{(detail as { syntheticPrice: number }).syntheticPrice.toLocaleString("en-US")}</span>
                              </div>
                            ) : null}
                            {"pnl" in detail ? (
                              <div className="flex justify-between">
                                <span>PnL</span>
                                <span>{pnlFormatter((detail as { pnl: number }).pnl)}</span>
                              </div>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    </section>

                    <section className="rounded-xl border bg-white p-4 shadow-sm">
                      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                        Dividend & Events
                      </h3>
                      <div className="grid gap-3 text-xs sm:grid-cols-2">
                        <MetricLine label="Next ex-date" value={selectedRow.dividendInfo.nextExDate} tone={selectedRow.exDateFlag ? "text-amber-600" : undefined} />
                        <MetricLine label="Expected amount" value={currencyFormatter.format(selectedRow.dividendInfo.expectedAmount)} />
                        <MetricLine label="Certainty" value={selectedRow.dividendInfo.certainty} />
                        <MetricLine label="Override" value={selectedRow.dividendInfo.override ? "Manual" : "Model"} />
                      </div>
                      <p className="mt-3 rounded-lg border bg-muted/40 p-3 text-xs text-muted-foreground">
                        {selectedRow.dividendInfo.notes}
                      </p>
                    </section>
                  </>
                ) : null}
              </div>
            </ScrollArea>
          </DrawerContent>
        </Drawer>
      </div>
    </PageTemplate>
  );
}
