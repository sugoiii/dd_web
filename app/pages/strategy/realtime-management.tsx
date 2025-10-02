import { useMemo, useState } from "react";

import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Switch } from "~/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";

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

const initialStrategies: StrategyRow[] = [
  {
    id: "aapl",
    symbol: "AAPL",
    description: "Apple Inc. vs Nasdaq Mar Future",
    direction: "Buy Equity / Sell Futures",
    entryBasisBps: -14,
    exitBasisBps: -3,
    targetSize: 18000,
    maxNotional: 3200000,
    autoHedge: true,
    market: {
      equityPrice: 173.24,
      futurePrice: 173.48,
      basisBps: -14.2,
      expectedFill: "High",
      liquidityScore: 92,
    },
    orders: [
      {
        id: "A1",
        product: "Equity",
        side: "Buy",
        size: 6000,
        price: 173.18,
        status: "Working",
        venue: "NYSE",
      },
      {
        id: "A2",
        product: "Future",
        side: "Sell",
        size: 60,
        price: 173.56,
        status: "Working",
        venue: "CME",
      },
    ],
    position: {
      equityQty: 9600,
      futureQty: -96,
      notional: 1660000,
      delta: 8700,
      basisPnl: 21500,
      netBasis: -8.7,
    },
    risk: {
      stopLossBps: 22,
      maxSlippageBps: 5,
    },
  },
  {
    id: "msft",
    symbol: "MSFT",
    description: "Microsoft vs Micro Nasdaq Jun Future",
    direction: "Sell Equity / Buy Futures",
    entryBasisBps: 18,
    exitBasisBps: 5,
    targetSize: 15000,
    maxNotional: 2800000,
    autoHedge: true,
    market: {
      equityPrice: 336.84,
      futurePrice: 337.58,
      basisBps: 21.9,
      expectedFill: "Medium",
      liquidityScore: 88,
    },
    orders: [
      {
        id: "M1",
        product: "Equity",
        side: "Sell",
        size: 4500,
        price: 336.92,
        status: "Filled",
        venue: "NASDAQ",
      },
      {
        id: "M2",
        product: "Future",
        side: "Buy",
        size: 45,
        price: 337.44,
        status: "Working",
        venue: "CME",
      },
    ],
    position: {
      equityQty: -6800,
      futureQty: 68,
      notional: 2280000,
      delta: -6400,
      basisPnl: 12800,
      netBasis: 16.2,
    },
    risk: {
      stopLossBps: 26,
      maxSlippageBps: 7,
    },
  },
  {
    id: "tsla",
    symbol: "TSLA",
    description: "Tesla vs Nasdaq Sep Future",
    direction: "Buy Equity / Sell Futures",
    entryBasisBps: -28,
    exitBasisBps: -8,
    targetSize: 9000,
    maxNotional: 1600000,
    autoHedge: false,
    market: {
      equityPrice: 242.12,
      futurePrice: 241.44,
      basisBps: -28.1,
      expectedFill: "Low",
      liquidityScore: 73,
    },
    orders: [
      {
        id: "T1",
        product: "Equity",
        side: "Buy",
        size: 3200,
        price: 241.88,
        status: "Working",
        venue: "NASDAQ",
      },
      {
        id: "T2",
        product: "Future",
        side: "Sell",
        size: 32,
        price: 241.62,
        status: "Cancelled",
        venue: "CME",
      },
    ],
    position: {
      equityQty: 4200,
      futureQty: -42,
      notional: 1010000,
      delta: 3900,
      basisPnl: -4200,
      netBasis: -19.4,
    },
    risk: {
      stopLossBps: 35,
      maxSlippageBps: 9,
    },
  },
];

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
  const [strategies, setStrategies] = useState(initialStrategies);

  const summary = useMemo(() => {
    return strategies.reduce(
      (
        acc,
        { position, orders, autoHedge, market: { basisBps } },
      ) => {
        acc.totalNotional += position.notional;
        acc.netDelta += position.delta;
        acc.averageBasis += basisBps;
        acc.workingOrders += orders.filter((order) => order.status === "Working").length;
        acc.autoHedged += autoHedge ? 1 : 0;
        return acc;
      },
      {
        totalNotional: 0,
        netDelta: 0,
        averageBasis: 0,
        workingOrders: 0,
        autoHedged: 0,
      },
    );
  }, [strategies]);

  const averageBasis = strategies.length
    ? summary.averageBasis / strategies.length
    : 0;

  const handleStrategyUpdate = <K extends keyof StrategyRow>(
    id: string,
    key: K,
    value: StrategyRow[K],
  ) => {
    setStrategies((rows) =>
      rows.map((row) => (row.id === id ? { ...row, [key]: value } : row)),
    );
  };

  const handleConfigNumberChange = (
    id: string,
    key: keyof Pick<StrategyRow, "entryBasisBps" | "exitBasisBps" | "targetSize" | "maxNotional">,
    rawValue: string,
  ) => {
    const nextValue = Number.parseFloat(rawValue || "0");
    handleStrategyUpdate(id, key, Number.isNaN(nextValue) ? 0 : nextValue);
  };

  const handleRiskNumberChange = (
    id: string,
    key: keyof StrategyRisk,
    rawValue: string,
  ) => {
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
  };

  return (
    <div className="min-h-screen w-full bg-background text-foreground">
      <div className="flex h-full flex-col">
        <header className="grid grid-cols-2 gap-px bg-muted/40 sm:grid-cols-4">
          <div className="flex flex-col justify-center bg-background/90 px-4 py-5">
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Total Notional
            </span>
            <span className="text-3xl font-semibold">
              {currencyFormatter.format(summary.totalNotional)}
            </span>
          </div>
          <div className="flex flex-col justify-center bg-background/90 px-4 py-5">
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Net Delta
            </span>
            <span className="text-3xl font-semibold">
              {formatter.format(summary.netDelta)}
            </span>
          </div>
          <div className="flex flex-col justify-center bg-background/90 px-4 py-5">
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Average Basis
            </span>
            <span className="text-3xl font-semibold">
              {averageBasis.toFixed(1)} bps
            </span>
          </div>
          <div className="flex flex-col justify-center bg-background/90 px-4 py-5">
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Working Orders
            </span>
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-semibold">
                {formatter.format(summary.workingOrders)}
              </span>
              <Badge variant="outline" className="text-xs uppercase">
                Auto hedge {summary.autoHedged}/{strategies.length}
              </Badge>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto">
          <div className="grid gap-px bg-muted/40">
            {strategies.map((strategy) => {
              const targets = computeTargetLevels(strategy);
              return (
                <div
                  key={strategy.id}
                  className="grid grid-cols-12 gap-px bg-muted/40"
                >
                  <section className="col-span-12 flex flex-col gap-3 bg-background/95 p-3 xl:col-span-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-lg font-semibold tracking-tight">
                          {strategy.symbol}
                        </h2>
                        <p className="text-xs text-muted-foreground">
                          {strategy.description}
                        </p>
                      </div>
                      <Badge variant="secondary">
                        {strategy.market.expectedFill} fill
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Liquidity</span>
                      <span className="font-semibold text-foreground">
                        {strategy.market.liquidityScore}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Auto hedge</span>
                      <Switch
                        checked={strategy.autoHedge}
                        onCheckedChange={(checked) =>
                          handleStrategyUpdate(strategy.id, "autoHedge", checked)
                        }
                        aria-label="Toggle auto hedge"
                      />
                    </div>
                    <Button variant="outline" className="w-full">
                      Sync context
                    </Button>
                  </section>

                  <section className="col-span-12 bg-background/95 p-3 xl:col-span-3">
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Strategy configuration
                    </h3>
                    <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                      <div className="col-span-2">
                        <Label htmlFor={`${strategy.id}-direction`}>Bias</Label>
                        <Select
                          value={strategy.direction}
                          onValueChange={(value: StrategyDirection) =>
                            handleStrategyUpdate(strategy.id, "direction", value)
                          }
                        >
                          <SelectTrigger id={`${strategy.id}-direction`} className="h-9">
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
                        <Label htmlFor={`${strategy.id}-entry`}>Entry basis (bps)</Label>
                        <Input
                          id={`${strategy.id}-entry`}
                          type="number"
                          value={strategy.entryBasisBps}
                          onChange={(event) =>
                            handleConfigNumberChange(
                              strategy.id,
                              "entryBasisBps",
                              event.target.value,
                            )
                          }
                        />
                      </div>
                      <div>
                        <Label htmlFor={`${strategy.id}-exit`}>Exit basis (bps)</Label>
                        <Input
                          id={`${strategy.id}-exit`}
                          type="number"
                          value={strategy.exitBasisBps}
                          onChange={(event) =>
                            handleConfigNumberChange(
                              strategy.id,
                              "exitBasisBps",
                              event.target.value,
                            )
                          }
                        />
                      </div>
                      <div>
                        <Label htmlFor={`${strategy.id}-size`}>Target size (shares)</Label>
                        <Input
                          id={`${strategy.id}-size`}
                          type="number"
                          value={strategy.targetSize}
                          onChange={(event) =>
                            handleConfigNumberChange(
                              strategy.id,
                              "targetSize",
                              event.target.value,
                            )
                          }
                        />
                      </div>
                      <div>
                        <Label htmlFor={`${strategy.id}-notional`}>Max notional (USD)</Label>
                        <Input
                          id={`${strategy.id}-notional`}
                          type="number"
                          value={strategy.maxNotional}
                          onChange={(event) =>
                            handleConfigNumberChange(
                              strategy.id,
                              "maxNotional",
                              event.target.value,
                            )
                          }
                        />
                      </div>
                    </div>
                  </section>

                  <section className="col-span-12 bg-background/95 p-3 xl:col-span-3">
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Market & triggers
                    </h3>
                    <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-xs text-muted-foreground">Equity last</p>
                        <p className="text-lg font-semibold">
                          {priceFormatter.format(strategy.market.equityPrice)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Future last</p>
                        <p className="text-lg font-semibold">
                          {priceFormatter.format(strategy.market.futurePrice)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Live basis</p>
                        <p className="text-lg font-semibold">
                          {strategy.market.basisBps.toFixed(1)} bps
                        </p>
                        <p className="text-xs text-muted-foreground">
                          vs entry {strategy.entryBasisBps} bps
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Distance</p>
                        <p className="text-lg font-semibold">
                          {targets.distanceToEntry.toFixed(1)} bps
                        </p>
                        <p className="text-xs text-muted-foreground">to entry trigger</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Equity trigger</p>
                        <p className="text-lg font-semibold">
                          Entry {priceFormatter.format(targets.entryEquity)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Exit {priceFormatter.format(targets.exitEquity)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Future trigger</p>
                        <p className="text-lg font-semibold">
                          Entry {priceFormatter.format(targets.entryFuture)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Exit {priceFormatter.format(targets.exitFuture)}
                        </p>
                      </div>
                    </div>
                  </section>

                  <section className="col-span-12 bg-background/95 p-0 xl:col-span-2">
                    <div className="flex items-center justify-between px-3 pt-3">
                      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Orders
                      </h3>
                      <Badge variant="outline" className="text-[10px] uppercase">
                        {strategy.orders.filter((order) => order.status === "Working").length} active
                      </Badge>
                    </div>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-[10px] uppercase">Product</TableHead>
                          <TableHead className="text-[10px] uppercase">Side</TableHead>
                          <TableHead className="text-[10px] uppercase">Size</TableHead>
                          <TableHead className="text-[10px] uppercase">Px</TableHead>
                          <TableHead className="text-[10px] uppercase">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {strategy.orders.map((order) => (
                          <TableRow key={order.id} className="text-xs">
                            <TableCell className="font-medium">{order.product}</TableCell>
                            <TableCell>
                              <Badge variant="secondary">{order.side}</Badge>
                            </TableCell>
                            <TableCell>{formatter.format(order.size)}</TableCell>
                            <TableCell>{priceFormatter.format(order.price)}</TableCell>
                            <TableCell>
                              <span
                                className={
                                  order.status === "Working"
                                    ? "text-amber-500"
                                    : order.status === "Filled"
                                    ? "text-emerald-500"
                                    : "text-muted-foreground"
                                }
                              >
                                {order.status}
                              </span>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </section>

                  <section className="col-span-12 bg-background/95 p-3 xl:col-span-2">
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Position & risk
                    </h3>
                    <div className="mt-3 space-y-3 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Equity qty</span>
                        <span className="font-semibold">
                          {formatter.format(strategy.position.equityQty)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Future qty</span>
                        <span className="font-semibold">
                          {formatter.format(strategy.position.futureQty)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Notional</span>
                        <span className="font-semibold">
                          {currencyFormatter.format(strategy.position.notional)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Delta</span>
                        <span className="font-semibold">
                          {formatter.format(strategy.position.delta)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Net basis</span>
                        <span className="font-semibold">
                          {strategy.position.netBasis.toFixed(1)} bps
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Basis PnL</span>
                        <span
                          className={
                            strategy.position.basisPnl >= 0
                              ? "font-semibold text-emerald-500"
                              : "font-semibold text-rose-500"
                          }
                        >
                          {currencyFormatter.format(strategy.position.basisPnl)}
                        </span>
                      </div>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <Label htmlFor={`${strategy.id}-stop`}>Stop loss (bps)</Label>
                        <Input
                          id={`${strategy.id}-stop`}
                          type="number"
                          value={strategy.risk.stopLossBps}
                          onChange={(event) =>
                            handleRiskNumberChange(
                              strategy.id,
                              "stopLossBps",
                              event.target.value,
                            )
                          }
                        />
                      </div>
                      <div>
                        <Label htmlFor={`${strategy.id}-slip`}>Max slippage (bps)</Label>
                        <Input
                          id={`${strategy.id}-slip`}
                          type="number"
                          value={strategy.risk.maxSlippageBps}
                          onChange={(event) =>
                            handleRiskNumberChange(
                              strategy.id,
                              "maxSlippageBps",
                              event.target.value,
                            )
                          }
                        />
                      </div>
                    </div>
                    <Button className="mt-4 w-full" variant="secondary">
                      Rebalance
                    </Button>
                  </section>
                </div>
              );
            })}
          </div>
        </main>
      </div>
    </div>
  );
}
