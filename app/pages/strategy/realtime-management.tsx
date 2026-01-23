import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  CellClassRules,
  ColDef,
  ICellRendererParams,
  RowClickedEvent,
  ValueFormatterParams,
} from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";

import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "~/components/ui/drawer";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";

import { ScrollArea } from "~/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";

import { Switch } from "~/components/ui/switch";
import { realtimeManagementStrategies } from "~/fixtures/strategy";
import { useAgGridTheme } from "~/lib/ag-grid-theme";


const formatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 0,
});

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

type StrategyDirection = "Buy Equity / Sell Futures" | "Sell Equity / Buy Futures";

type StrategyOrder = {
  id: string;
  product: string;
  side: "Buy" | "Sell";
  size: number;
  price: number;
  status: "Working" | "Filled" | "Cancelled";
  venue: string;
};

type StrategyPosition = {
  equityQty: number;
  futureQty: number;
  notional: number;
  delta: number;
  basisPnl: number;
  netBasis: number;
};

type StrategyRisk = {
  stopLossBps: number;
  maxSlippageBps: number;
};

type StrategyMarket = {
  equityPrice: number;
  futurePrice: number;
  basisBps: number;
  expectedFill: "High" | "Medium" | "Low";
  liquidityScore: number;
};

type StrategyRow = {
  id: string;
  symbol: string;
  description: string;
  direction: StrategyDirection;
  entryBasisBps: number;
  exitBasisBps: number;
  targetSize: number;
  maxNotional: number;
  autoHedge: boolean;
  market: StrategyMarket;
  orders: StrategyOrder[];
  position: StrategyPosition;
  risk: StrategyRisk;
};

const initialStrategies: StrategyRow[] = realtimeManagementStrategies;

function computeTargetLevels(strategy: StrategyRow) {
  const entryMultiplier = 1 + strategy.entryBasisBps / 10000;
  const exitMultiplier = 1 + strategy.exitBasisBps / 10000;

  const entryFuture = strategy.market.equityPrice * entryMultiplier;
  const exitFuture = strategy.market.equityPrice * exitMultiplier;
  const entryEquity = strategy.market.futurePrice / entryMultiplier;
  const exitEquity = strategy.market.futurePrice / exitMultiplier;

  const distanceToEntry = strategy.market.basisBps - strategy.entryBasisBps;
  const distanceToExit = strategy.market.basisBps - strategy.exitBasisBps;

  return {
    entryFuture,
    exitFuture,
    entryEquity,
    exitEquity,
    distanceToEntry,
    distanceToExit,
  };
}

export default function RealTimeManagement() {
  const gridTheme = useAgGridTheme();
  const [strategies, setStrategies] = useState(initialStrategies);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [focusedStrategyId, setFocusedStrategyId] = useState<string | null>(
    null,
  );
  const [quickFilterText, setQuickFilterText] = useState("");

  const gridRef = useRef<AgGridReact<StrategyRow>>(null);

  const summary = useMemo(() => {
    return strategies.reduce(
      (
        acc,
        { position, orders, autoHedge, market: { basisBps } },
      ) => {
        acc.totalNotional += position.notional;
        acc.netDelta += position.delta;
        acc.averageBasis += basisBps;
        acc.workingOrders += orders.filter(
          (order) => order.status === "Working",
        ).length;
        acc.autoHedged += autoHedge ? 1 : 0;
        acc.totalBasisPnl += position.basisPnl;
        acc.positioned +=
          Math.abs(position.equityQty) + Math.abs(position.futureQty) > 0 ? 1 : 0;
        return acc;
      },
      {
        totalNotional: 0,
        netDelta: 0,
        averageBasis: 0,
        workingOrders: 0,
        autoHedged: 0,
        totalBasisPnl: 0,
        positioned: 0,
      },
    );
  }, [strategies]);

  const averageBasis = strategies.length
    ? summary.averageBasis / strategies.length
    : 0;

  const focusedStrategy = useMemo(
    () =>
      focusedStrategyId
        ? strategies.find((strategy) => strategy.id === focusedStrategyId) ??
          null
        : null,
    [focusedStrategyId, strategies],
  );

  const handleStrategyUpdate = useCallback(
    <K extends keyof StrategyRow>(
      id: string,
      key: K,
      value: StrategyRow[K],
    ) => {
      setStrategies((rows) =>
        rows.map((row) => (row.id === id ? { ...row, [key]: value } : row)),
      );
    },
    [],
  );

  const handleConfigNumberChange = useCallback(
    (
      id: string,
      key: keyof Pick<
        StrategyRow,
        "entryBasisBps" | "exitBasisBps" | "targetSize" | "maxNotional"
      >,
      rawValue: string,
    ) => {
      const nextValue = Number.parseFloat(rawValue || "0");
      handleStrategyUpdate(id, key, Number.isNaN(nextValue) ? 0 : nextValue);
    },
    [handleStrategyUpdate],
  );

  const handleRiskNumberChange = useCallback(
    (id: string, key: keyof StrategyRisk, rawValue: string) => {
      const nextValue = Number.parseFloat(rawValue || "0");
      setStrategies((rows) =>
        rows.map((row) =>
          row.id === id
            ? {
                ...row,
                risk: {
                  ...row.risk,
                  [key]: Number.isNaN(nextValue) ? 0 : nextValue,
                },
              }
            : row,
        ),
      );
    },
    [],
  );

  const positionedStrategies = useMemo(
    () =>
      strategies.filter(
        (strategy) =>
          Math.abs(strategy.position.equityQty) +
            Math.abs(strategy.position.futureQty) >
            0 ||
          Math.abs(strategy.position.notional) > 0,
      ),
    [strategies],
  );

  const workingOrderTicker = useMemo(
    () =>
      strategies.flatMap(({ id, symbol, orders }) =>
        orders.map((order) => ({
          ...order,
          strategyId: id,
          symbol,
        })),
      ),
    [strategies],
  );

  const defaultColDef = useMemo<ColDef<StrategyRow>>(
    () => ({
      resizable: true,
      sortable: true,
      suppressHeaderMenuButton: true,
      flex: 1,
      cellClass: "text-[11px]",
    }),
    [],
  );

  const basisPnlClassRules = useMemo<CellClassRules<StrategyRow>>(
    () => ({
      "text-emerald-500": (params) => (params.value ?? 0) > 0,
      "text-destructive": (params) => (params.value ?? 0) < 0,
    }),
    [],
  );

  const workingOrderClassRules = useMemo<CellClassRules<StrategyRow>>(
    () => ({
      "animate-pulse": (params) =>
        (params.data?.orders ?? []).some(
          (order) => order.status === "Working",
        ),
      "text-amber-500": (params) =>
        (params.data?.orders ?? []).some(
          (order) => order.status === "Working",
        ),
      "bg-amber-500/10": (params) =>
        (params.data?.orders ?? []).some(
          (order) => order.status === "Working",
        ),
    }),
    [],
  );

  const columnDefs = useMemo<ColDef<StrategyRow>[]>(
    () => [
      {
        headerName: "Strategy",
        field: "symbol",
        pinned: "left",
        lockPinned: true,
        flex: 1.4,
        minWidth: 240,
        suppressMovable: true,
        cellRenderer: (params: ICellRendererParams<StrategyRow>) => {
          const data = params.data;
          if (!data) return null;
          return (
            <div className="flex items-center gap-2 overflow-hidden">
              <span className="text-xs font-semibold uppercase tracking-tight text-foreground">
                {data.symbol}
              </span>
              <Badge variant="secondary" className="text-[9px] uppercase">
                {data.market.expectedFill} fill
              </Badge>
              <span className="truncate text-[10px] uppercase text-muted-foreground">
                {data.description}
              </span>
            </div>
          );
        },
      },
      {
        headerName: "Basis / Targets",
        minWidth: 220,
        flex: 1.2,
        valueGetter: (params) => params.data?.market.basisBps ?? 0,
        cellRenderer: (params: ICellRendererParams<StrategyRow>) => {
          const data = params.data;
          if (!data) return null;
          const targets = computeTargetLevels(data);
          return (
            <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
              <span className="font-semibold text-foreground">
                {data.market.basisBps.toFixed(1)} bps
              </span>
              <span>
                Entry {data.entryBasisBps} · Exit {data.exitBasisBps}
              </span>
              <span>
                ΔE {targets.distanceToEntry.toFixed(1)} · ΔX {targets.distanceToExit.toFixed(1)}
              </span>
            </div>
          );
        },
      },
      {
        headerName: "Sizing",
        minWidth: 200,
        valueGetter: (params) => params.data?.targetSize ?? 0,
        cellRenderer: (params: ICellRendererParams<StrategyRow>) => {
          const data = params.data;
          if (!data) return null;
          return (
            <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
              <span className="text-foreground">
                Target {formatter.format(data.targetSize)}
              </span>
              <span>Max {currencyFormatter.format(data.maxNotional)}</span>
            </div>
          );
        },
      },
      {
        headerName: "Notional",
        minWidth: 140,
        valueGetter: (params) => params.data?.position.notional ?? 0,
        valueFormatter: (
          params: ValueFormatterParams<StrategyRow, number>,
        ) => currencyFormatter.format(params.value ?? 0),
        cellClass: ["text-[11px]", "text-right"],
      },
      {
        headerName: "Delta",
        minWidth: 120,
        valueGetter: (params) => params.data?.position.delta ?? 0,
        valueFormatter: (
          params: ValueFormatterParams<StrategyRow, number>,
        ) => formatter.format(params.value ?? 0),
        cellClass: ["text-[11px]", "text-right"],
      },
      {
        headerName: "Net Basis",
        minWidth: 130,
        valueGetter: (params) => params.data?.position.netBasis ?? 0,
        valueFormatter: (
          params: ValueFormatterParams<StrategyRow, number>,
        ) => `${(params.value ?? 0).toFixed(1)} bps`,
        cellClass: ["text-[11px]", "text-right"],
      },
      {
        headerName: "Basis PnL",
        minWidth: 140,
        valueGetter: (params) => params.data?.position.basisPnl ?? 0,
        valueFormatter: (
          params: ValueFormatterParams<StrategyRow, number>,
        ) => currencyFormatter.format(params.value ?? 0),
        cellClass: ["text-[11px]", "text-right"],
        cellClassRules: basisPnlClassRules,
      },
      {
        headerName: "Auto",
        field: "autoHedge",
        minWidth: 90,
        maxWidth: 100,
        sortable: false,
        filter: false,
        cellRenderer: (
          params: ICellRendererParams<StrategyRow, boolean>,
        ) => {
          const data = params.data;
          if (!data) return null;
          return (
            <div
              className="flex items-center justify-center"
              onClick={(event) => event.stopPropagation()}
              onKeyDown={(event) => event.stopPropagation()}
            >
              <Switch
                id={`${data.id}-auto-grid`}
                checked={data.autoHedge}
                onCheckedChange={(checked) =>
                  handleStrategyUpdate(data.id, "autoHedge", checked)
                }
              />
            </div>
          );
        },
      },
      {
        headerName: "Orders",
        field: "orders",
        flex: 1.1,
        minWidth: 200,
        valueGetter: (params) =>
          params.data?.orders.filter((order) => order.status === "Working")
            .length ?? 0,
        cellClassRules: workingOrderClassRules,
        cellRenderer: (params: ICellRendererParams<StrategyRow>) => {
          const data = params.data;
          if (!data) return null;
          const working = data.orders.filter(
            (order) => order.status === "Working",
          ).length;
          const filled = data.orders.filter(
            (order) => order.status === "Filled",
          ).length;
          const cancelled = data.orders.filter(
            (order) => order.status === "Cancelled",
          ).length;
          if (!data.orders.length) {
            return <span className="text-[10px] text-muted-foreground">None</span>;
          }
          return (
            <div className="flex items-center gap-1">
              {working ? (
                <Badge
                  variant="outline"
                  className="border-amber-400 text-[9px] uppercase text-amber-500"
                >
                  W {working}
                </Badge>
              ) : null}
              {filled ? (
                <Badge
                  variant="outline"
                  className="border-emerald-400 text-[9px] uppercase text-emerald-500"
                >
                  F {filled}
                </Badge>
              ) : null}
              {cancelled ? (
                <Badge
                  variant="outline"
                  className="border-destructive/60 text-[9px] uppercase text-destructive"
                >
                  C {cancelled}
                </Badge>
              ) : null}
            </div>
          );
        },
      },
    ],
    [basisPnlClassRules, handleStrategyUpdate, workingOrderClassRules],
  );

  const handleRowClicked = useCallback(
    (event: RowClickedEvent<StrategyRow>) => {
      const strategyId = event.data?.id;
      if (!strategyId) return;
      setFocusedStrategyId(strategyId);
      setDrawerOpen(true);
    },
    [],
  );

  useEffect(() => {
    if (!gridRef.current?.api) {
      return;
    }
    if (!focusedStrategyId) {
      gridRef.current.api.deselectAll();
      return;
    }
    gridRef.current.api.forEachNode((node) => {
      const isMatch = node.data?.id === focusedStrategyId;
      node.setSelected(isMatch);
      if (isMatch) {
        gridRef.current?.api?.ensureNodeVisible(node);
      }
    });
  }, [focusedStrategyId]);

  const handleResetFilter = useCallback(() => {
    setQuickFilterText("");
  }, []);

  const handlePositionSelect = useCallback(
    (strategyId: string) => {
      setQuickFilterText("");
      setFocusedStrategyId(strategyId);
      setDrawerOpen(true);
    },
    [],
  );

  const handleOrderSelect = useCallback(
    (strategyId: string, symbol: string) => {
      setQuickFilterText(symbol);
      setFocusedStrategyId(strategyId);
      setDrawerOpen(true);
    },
    [],
  );

  return (
    <div className="flex h-screen w-full flex-col bg-background text-foreground">
      <header className="border-b border-muted/60 bg-background/90 px-4 py-2">
        <div className="grid grid-cols-2 gap-2 text-[11px] sm:grid-cols-5">
          <div className="rounded-md border border-muted/50 bg-muted/10 px-3 py-2">
            <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              Total Notional
            </p>
            <p className="text-sm font-semibold">
              {currencyFormatter.format(summary.totalNotional)}
            </p>
          </div>
          <div className="rounded-md border border-muted/50 bg-muted/10 px-3 py-2">
            <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              Net Delta
            </p>
            <p className="text-sm font-semibold">
              {formatter.format(summary.netDelta)}
            </p>
          </div>
          <div className="rounded-md border border-muted/50 bg-muted/10 px-3 py-2">
            <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              Avg Basis
            </p>
            <p className="text-sm font-semibold">{averageBasis.toFixed(1)} bps</p>
          </div>
          <div className="rounded-md border border-muted/50 bg-muted/10 px-3 py-2">
            <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              Basis PnL
            </p>
            <p
              className={`text-sm font-semibold ${
                summary.totalBasisPnl >= 0
                  ? "text-emerald-500"
                  : "text-red-500"
              }`}
            >
              {currencyFormatter.format(summary.totalBasisPnl)}
            </p>
          </div>
          <div className="rounded-md border border-muted/50 bg-muted/10 px-3 py-2">
            <p className="flex items-center justify-between text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              <span>Orders</span>
              <Badge variant="outline" className="text-[9px] uppercase">
                Auto {summary.autoHedged}/{strategies.length}
              </Badge>
            </p>
            <p className="text-sm font-semibold">
              {formatter.format(summary.workingOrders)} working
            </p>
          </div>
        </div>
      </header>

      <main className="flex flex-1 gap-4 overflow-hidden px-4 pb-4 pt-3">
        <section className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <div className="mb-2 flex items-center justify-between text-[10px] uppercase text-muted-foreground">
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold tracking-wide text-foreground">
                Active strategies
              </span>
              <Badge variant="outline" className="text-[9px] uppercase">
                {strategies.length} tracked
              </Badge>
              <Badge variant="secondary" className="hidden text-[9px] uppercase sm:inline-flex">
                {summary.positioned} live
              </Badge>
              {quickFilterText ? (
                <Badge variant="secondary" className="text-[9px] uppercase">
                  Filter: {quickFilterText}
                </Badge>
              ) : null}
            </div>
            <Button
              variant="outline"
              size="sm"
              className="h-6 px-2 text-[10px] uppercase"
              onClick={handleResetFilter}
              disabled={!quickFilterText}
            >
              Reset filter
            </Button>
          </div>
          <div className="ag-theme-quartz density-compact flex-1 overflow-hidden rounded-md border border-muted/60 bg-background/95" style={{ height: "100%" }}>
            <AgGridReact<StrategyRow>
              ref={gridRef}
              rowData={strategies}
              columnDefs={columnDefs}
              defaultColDef={defaultColDef}
              theme={gridTheme}
              animateRows
              rowHeight={34}
              headerHeight={34}
              suppressHorizontalScroll
              rowSelection="single"
              suppressCellFocus
              quickFilterText={quickFilterText}
              getRowId={(params) => params.data?.id ?? ""}
              onRowClicked={handleRowClicked}
            />
          </div>
        </section>

        <aside className="hidden w-[320px] shrink-0 flex-col gap-3 overflow-hidden rounded-lg border border-muted/60 bg-background/80 p-3 backdrop-blur lg:flex">
          <div className="flex items-center justify-between text-[10px] uppercase text-muted-foreground">
            <span className="text-xs font-semibold text-foreground">Live positions</span>
            <Badge variant="outline" className="text-[9px] uppercase">
              {positionedStrategies.length}
            </Badge>
          </div>
          <div className="overflow-hidden rounded-md border border-muted/40">
            <Table className="text-[11px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="px-2">Symbol</TableHead>
                  <TableHead className="px-2 text-right">Notional</TableHead>
                  <TableHead className="px-2 text-right">Delta</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {positionedStrategies.length ? (
                  positionedStrategies.map((strategy) => (
                    <TableRow
                      key={`position-${strategy.id}`}
                      className="cursor-pointer text-[11px] hover:bg-muted/40"
                      onClick={() => handlePositionSelect(strategy.id)}
                    >
                      <TableCell className="px-2 py-1 font-semibold uppercase text-foreground">
                        {strategy.symbol}
                      </TableCell>
                      <TableCell className="px-2 py-1 text-right">
                        {currencyFormatter.format(strategy.position.notional)}
                      </TableCell>
                      <TableCell className="px-2 py-1 text-right">
                        {formatter.format(strategy.position.delta)}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="px-2 py-2 text-center text-muted-foreground">
                      No open positions
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between text-[10px] uppercase text-muted-foreground">
            <span className="text-xs font-semibold text-foreground">Order tape</span>
            <Badge variant="secondary" className="text-[9px] uppercase">
              {workingOrderTicker.length}
            </Badge>
          </div>
          <div className="flex-1 overflow-hidden rounded-md border border-muted/40">
            <ScrollArea className="h-full">
              <div className="divide-y divide-muted/40">
                {workingOrderTicker.length ? (
                  workingOrderTicker.map((order) => (
                    <div
                      key={`${order.strategyId}-${order.id}`}
                      className="flex cursor-pointer items-center justify-between px-2 py-1 text-[10px] hover:bg-muted/40"
                      onClick={() => handleOrderSelect(order.strategyId, order.symbol)}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-semibold uppercase text-foreground">
                          {order.symbol}
                        </span>
                        <Badge
                          variant="outline"
                          className={`text-[9px] uppercase ${
                            order.status === "Working"
                              ? "border-amber-400 text-amber-500"
                              : order.status === "Filled"
                                ? "border-emerald-400 text-emerald-500"
                                : "border-destructive/60 text-destructive"
                          }`}
                        >
                          {order.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <span className="font-semibold text-foreground">
                          {order.side}
                        </span>
                        <span>{order.product}</span>
                        <span>{formatter.format(order.size)}</span>
                        <span>@ {priceFormatter.format(order.price)}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="px-2 py-6 text-center text-muted-foreground">
                    No recent orders
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </aside>
      </main>

      <Drawer
        direction="right"
        open={drawerOpen && Boolean(focusedStrategy)}
        onOpenChange={(open) => {
          setDrawerOpen(open);
          if (!open) {
            setFocusedStrategyId(null);
          }
        }}
      >
        <DrawerContent className="sm:max-w-lg">
          {focusedStrategy ? (
            <div className="flex h-full flex-col">
              <DrawerHeader className="border-b border-muted/60 bg-background/95">
                <DrawerTitle className="text-base font-semibold uppercase">
                  {focusedStrategy.symbol}
                </DrawerTitle>
                <DrawerDescription className="text-[11px] uppercase">
                  Execution detail & adjustments
                </DrawerDescription>
              </DrawerHeader>
              <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4 text-[11px]">
                <section className="grid gap-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-muted-foreground">
                    <span>{focusedStrategy.description}</span>
                    <Badge variant="secondary" className="text-[9px] uppercase">
                      {focusedStrategy.market.expectedFill} fill
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <Label
                        htmlFor={`${focusedStrategy.id}-drawer-direction`}
                        className="text-[10px] uppercase text-muted-foreground"
                      >
                        Bias
                      </Label>
                      <Select
                        value={focusedStrategy.direction}
                        onValueChange={(value: StrategyDirection) =>
                          handleStrategyUpdate(focusedStrategy.id, "direction", value)
                        }
                      >
                        <SelectTrigger
                          id={`${focusedStrategy.id}-drawer-direction`}
                          className="h-8 text-xs"
                        >
                          <SelectValue placeholder="Select direction" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Buy Equity / Sell Futures">
                            Buy Equity / Sell Futures
                          </SelectItem>
                          <SelectItem value="Sell Equity / Buy Futures">
                            Sell Equity / Buy Futures
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label
                        htmlFor={`${focusedStrategy.id}-drawer-entry`}
                        className="text-[10px] uppercase text-muted-foreground"
                      >
                        Entry bps
                      </Label>
                      <Input
                        id={`${focusedStrategy.id}-drawer-entry`}
                        type="number"
                        className="h-8 text-xs"
                        value={focusedStrategy.entryBasisBps}
                        onChange={(event) =>
                          handleConfigNumberChange(
                            focusedStrategy.id,
                            "entryBasisBps",
                            event.target.value,
                          )
                        }
                      />
                    </div>
                    <div>
                      <Label
                        htmlFor={`${focusedStrategy.id}-drawer-exit`}
                        className="text-[10px] uppercase text-muted-foreground"
                      >
                        Exit bps
                      </Label>
                      <Input
                        id={`${focusedStrategy.id}-drawer-exit`}
                        type="number"
                        className="h-8 text-xs"
                        value={focusedStrategy.exitBasisBps}
                        onChange={(event) =>
                          handleConfigNumberChange(
                            focusedStrategy.id,
                            "exitBasisBps",
                            event.target.value,
                          )
                        }
                      />
                    </div>
                    <div>
                      <Label
                        htmlFor={`${focusedStrategy.id}-drawer-target`}
                        className="text-[10px] uppercase text-muted-foreground"
                      >
                        Target size
                      </Label>
                      <Input
                        id={`${focusedStrategy.id}-drawer-target`}
                        type="number"
                        className="h-8 text-xs"
                        value={focusedStrategy.targetSize}
                        onChange={(event) =>
                          handleConfigNumberChange(
                            focusedStrategy.id,
                            "targetSize",
                            event.target.value,
                          )
                        }
                      />
                    </div>
                    <div>
                      <Label
                        htmlFor={`${focusedStrategy.id}-drawer-notional`}
                        className="text-[10px] uppercase text-muted-foreground"
                      >
                        Max notional
                      </Label>
                      <Input
                        id={`${focusedStrategy.id}-drawer-notional`}
                        type="number"
                        className="h-8 text-xs"
                        value={focusedStrategy.maxNotional}
                        onChange={(event) =>
                          handleConfigNumberChange(
                            focusedStrategy.id,
                            "maxNotional",
                            event.target.value,
                          )
                        }
                      />
                    </div>
                  </div>
                </section>

                <section className="grid grid-cols-2 gap-3 text-[10px] text-muted-foreground">
                  <div className="rounded-md border border-muted/60 bg-muted/10 p-3">
                    <p className="uppercase">Equity qty</p>
                    <p className="text-lg font-semibold text-foreground">
                      {formatter.format(focusedStrategy.position.equityQty)}
                    </p>
                  </div>
                  <div className="rounded-md border border-muted/60 bg-muted/10 p-3">
                    <p className="uppercase">Future qty</p>
                    <p className="text-lg font-semibold text-foreground">
                      {formatter.format(focusedStrategy.position.futureQty)}
                    </p>
                  </div>
                  <div className="rounded-md border border-muted/60 bg-muted/10 p-3">
                    <p className="uppercase">Notional</p>
                    <p className="text-lg font-semibold text-foreground">
                      {currencyFormatter.format(focusedStrategy.position.notional)}
                    </p>
                  </div>
                  <div className="rounded-md border border-muted/60 bg-muted/10 p-3">
                    <p className="uppercase">Basis PnL</p>
                    <p
                      className={`text-lg font-semibold ${
                        focusedStrategy.position.basisPnl >= 0
                          ? "text-emerald-500"
                          : "text-red-500"
                      }`}
                    >
                      {currencyFormatter.format(focusedStrategy.position.basisPnl)}
                    </p>
                  </div>
                </section>

                <section className="grid gap-3 text-[10px]">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label
                        htmlFor={`${focusedStrategy.id}-drawer-stoploss`}
                        className="text-[10px] uppercase text-muted-foreground"
                      >
                        Stop loss (bps)
                      </Label>
                      <Input
                        id={`${focusedStrategy.id}-drawer-stoploss`}
                        type="number"
                        className="h-8 text-xs"
                        value={focusedStrategy.risk.stopLossBps}
                        onChange={(event) =>
                          handleRiskNumberChange(
                            focusedStrategy.id,
                            "stopLossBps",
                            event.target.value,
                          )
                        }
                      />
                    </div>
                    <div>
                      <Label
                        htmlFor={`${focusedStrategy.id}-drawer-slippage`}
                        className="text-[10px] uppercase text-muted-foreground"
                      >
                        Max slippage (bps)
                      </Label>
                      <Input
                        id={`${focusedStrategy.id}-drawer-slippage`}
                        type="number"
                        className="h-8 text-xs"
                        value={focusedStrategy.risk.maxSlippageBps}
                        onChange={(event) =>
                          handleRiskNumberChange(
                            focusedStrategy.id,
                            "maxSlippageBps",
                            event.target.value,
                          )
                        }
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between rounded-md border border-muted/60 bg-muted/10 p-3 text-[10px] text-muted-foreground">
                    <span>Auto hedge</span>
                    <Switch
                      id={`${focusedStrategy.id}-drawer-hedge`}
                      checked={focusedStrategy.autoHedge}
                      onCheckedChange={(checked) =>
                        handleStrategyUpdate(focusedStrategy.id, "autoHedge", checked)
                      }
                    />
                  </div>
                </section>

                <section className="grid gap-2">
                  <p className="text-[10px] font-semibold uppercase text-muted-foreground">
                    Working orders
                  </p>
                  <div className="space-y-1">
                    {focusedStrategy.orders.map((order) => (
                      <div
                        key={`${focusedStrategy.id}-drawer-${order.id}`}
                        className="flex items-center justify-between rounded-md border border-muted/60 bg-background/90 px-2 py-1 text-[10px]"
                      >
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className={`text-[9px] uppercase ${
                              order.status === "Working"
                                ? "border-amber-400 text-amber-500"
                                : order.status === "Filled"
                                  ? "border-emerald-400 text-emerald-500"
                                  : "border-destructive/60 text-destructive"
                            }`}
                          >
                            {order.status}
                          </Badge>
                          <span className="font-semibold uppercase text-foreground">
                            {order.side} {order.product}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <span>{formatter.format(order.size)}</span>
                          <span>@ {priceFormatter.format(order.price)}</span>
                          <span>{order.venue}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
              <DrawerFooter className="border-t border-muted/60 bg-background/95 text-[10px] uppercase text-muted-foreground">
                Changes save instantly
              </DrawerFooter>
            </div>
          ) : null}
        </DrawerContent>
      </Drawer>
    </div>
  );
}
