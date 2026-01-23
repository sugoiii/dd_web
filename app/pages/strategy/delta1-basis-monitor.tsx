import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import type {
  ColDef,
  ColGroupDef,
  ColumnState,
  FirstDataRenderedEvent,
  GetRowIdParams,
  GridApi,
  GridOptions,
  GridReadyEvent,
  ICellRendererParams,
  RowClassParams,
} from "ag-grid-community"
import {
  Activity,
  Filter,
  LineChart as LineChartIcon,
  PauseCircle,
  PlayCircle,
  RotateCcw,
  X,
} from "lucide-react"
import { Area } from "recharts"

import { PageTemplate } from "~/components/page-template"
import { Badge } from "~/components/ui/badge"
import { Button } from "~/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card"
import { Input } from "~/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select"
import { Slider } from "~/components/ui/slider"
import { Switch } from "~/components/ui/switch"
import { ToggleGroup, ToggleGroupItem } from "~/components/ui/toggle-group"
import {
  type ConnectionState,
  type Delta1BasisSnapshot,
  type NormalizedEvent,
  type NormalizedTrade,
  type PositionStackRow,
  useDelta1BasisFeed,
} from "~/hooks/use-delta1-basis-feed"
import { timestampFormatter } from "~/lib/formatters"
import { ChartTemplate } from "~/templates/chart-template"
import { GridTemplate } from "~/templates/grid-template"
import { delta1ColumnSets, type Delta1ColumnSetKey } from "~/templates/columns/delta1"
import { createPositionColumnDefs, createTapeColumnDefs } from "~/templates/columns/strategy"
import { GridChartLayout } from "~/templates/pages/grid-chart-layout"

type TapeRow = {
  id: string
  timestamp: number
  instrumentId: string
  symbol: string
  type: "trade" | "event"
  leg?: string
  price?: number
  size?: number
  side?: string
  level?: string
  message?: string
}

type PositionRow = PositionStackRow & { autoHedge: boolean }

type AutoHedgeRendererParams = ICellRendererParams<PositionRow, boolean> & {
  onToggle: (id: string, next: boolean) => void
}

const COLUMN_STATE_STORAGE_KEY = "delta1-basis-monitor-column-state"

const connectionBadgeIntent: Record<ConnectionState, "default" | "destructive" | "secondary" | "outline"> = {
  connecting: "secondary",
  open: "default",
  closed: "destructive",
  mock: "outline",
}

const AutoHedgeRenderer = (params: AutoHedgeRendererParams) => {
  if (!params.data) {
    return <span className="text-[10px] text-muted-foreground">—</span>
  }
  const checked = Boolean(params.value)
  const id = params.data.id
  return (
    <div className="flex items-center justify-center">
      <Switch
        checked={checked}
        onCheckedChange={(next) => params.onToggle(id, next)}
        aria-label="Toggle auto hedge"
      />
    </div>
  )
}

export default function Delta1BasisMonitorPage() {
  const {
    connectionState,
    isPaused,
    search,
    setSearch,
    snapshots,
    positionStack,
    tradeTape,
    eventTape,
    metrics,
    metricsHistory,
    pause,
    resume,
    reset,
  } = useDelta1BasisFeed()

  const [basisAlertBps, setBasisAlertBps] = useState(35)
  const [edgeAlertBps, setEdgeAlertBps] = useState(5)
  const [activeColumnSet, setActiveColumnSet] = useState<Delta1ColumnSetKey>("core")
  const [autoHedgeEnabled, setAutoHedgeEnabled] = useState(true)
  const [selectedSymbol, setSelectedSymbol] = useState<string>("")
  const [watchlist, setWatchlist] = useState<string[]>([])
  const [autoHedgeOverrides, setAutoHedgeOverrides] = useState<Record<string, boolean>>({})

  const gridApiRef = useRef<GridApi<Delta1BasisSnapshot> | null>(null)
  const tapeGridApiRef = useRef<GridApi<TapeRow> | null>(null)

  const autoSizeStrategy = useMemo(() => ({ type: "fitGridWidth" as const }), [])

  const mainGridOptions = useMemo(
    () => ({ deltaRowDataMode: true } as unknown as GridOptions<Delta1BasisSnapshot>),
    [],
  )

  const columnDefs = useMemo<(ColDef | ColGroupDef)[]>(
    () => delta1ColumnSets[activeColumnSet],
    [activeColumnSet],
  )

  const instrumentOptions = useMemo(
    () => snapshots.map((snapshot) => snapshot.symbol),
    [snapshots],
  )

  const handleAddToWatchlist = useCallback(
    (symbol: string) => {
      if (!symbol) return
      setWatchlist((prev) => (prev.includes(symbol) ? prev : [...prev, symbol]))
      setSearch(symbol)
    },
    [setSearch],
  )

  const removeFromWatchlist = useCallback((symbol: string) => {
    setWatchlist((prev) => prev.filter((item) => item !== symbol))
  }, [])

  const handleAutoHedgeToggle = useCallback((id: string, next: boolean) => {
    if (!id) return
    setAutoHedgeOverrides((prev) => ({ ...prev, [id]: next }))
  }, [])

  useEffect(() => {
    const currentIds = new Set(positionStack.map((row) => row.id))
    setAutoHedgeOverrides((prev) => {
      const next: Record<string, boolean> = {}
      currentIds.forEach((id) => {
        if (prev[id] !== undefined) {
          next[id] = prev[id]
        }
      })
      return next
    })
  }, [positionStack])

  const augmentedPositions = useMemo<PositionRow[]>(() => {
    return positionStack.map((row) => ({
      ...row,
      autoHedge:
        autoHedgeEnabled && autoHedgeOverrides[row.id] !== undefined
          ? autoHedgeOverrides[row.id]
          : autoHedgeEnabled
            ? row.autoHedge
            : false,
    }))
  }, [autoHedgeEnabled, autoHedgeOverrides, positionStack])

  const positionColumnDefs = useMemo<(ColDef | ColGroupDef)[]>(
    () =>
      createPositionColumnDefs({
        autoHedgeRenderer: AutoHedgeRenderer,
        onAutoHedgeToggle: handleAutoHedgeToggle,
      }),
    [handleAutoHedgeToggle],
  )

  const tapeRows = useMemo<TapeRow[]>(() => {
    const trades = tradeTape.map<TapeRow>((trade: NormalizedTrade) => ({
      id: `trade-${trade.id}`,
      timestamp: trade.timestamp,
      instrumentId: trade.instrumentId,
      symbol: trade.symbol,
      type: "trade",
      leg: trade.leg,
      price: trade.price,
      size: trade.size,
      side: trade.side,
    }))
    const events = eventTape.map<TapeRow>((event: NormalizedEvent) => ({
      id: `event-${event.id}`,
      timestamp: event.timestamp,
      instrumentId: event.instrumentId,
      symbol: event.symbol,
      type: "event",
      level: event.level,
      message: event.message,
    }))
    return [...trades, ...events].sort((a, b) => a.timestamp - b.timestamp)
  }, [eventTape, tradeTape])

  const tapeColumnDefs = useMemo<(ColDef | ColGroupDef)[]>(
    () => createTapeColumnDefs(),
    [],
  )

  const pinnedBottomRowData = useMemo(() => {
    if (!snapshots.length) {
      return []
    }
    const totalNet = snapshots.reduce((acc, snapshot) => acc + snapshot.netPosition, 0)
    const basisValues = snapshots.filter((snapshot) => snapshot.basisBps !== null)
    const avgBasis = basisValues.length
      ? basisValues.reduce((acc, snapshot) => acc + (snapshot.basisBps ?? 0), 0) /
        basisValues.length
      : null
    const totalCarry = snapshots.reduce((acc, snapshot) => acc + snapshot.carryPnL, 0)
    const summary: Delta1BasisSnapshot = {
      instrumentId: "summary",
      symbol: "Desk Net",
      cashBid: null,
      cashAsk: null,
      futuresBid: null,
      futuresAsk: null,
      cashMid: null,
      futuresMid: null,
      basisBps: avgBasis,
      theoreticalBasisBps: null,
      theoreticalFutures: null,
      theoreticalEdgeBps: null,
      netPosition: totalNet,
      cashPosition: totalNet,
      futuresPosition: 0,
      carryPnL: totalCarry,
      carryDaily: totalCarry / 260,
      hedgeSuggestion:
        totalNet > 0 ? "Trim Long Bias" : totalNet < 0 ? "Trim Short Bias" : "Flat",
      predictedHedgeFill: null,
      lastQuoteTimestamp: null,
      lastTradeTimestamp: null,
      lastEventTimestamp: null,
      lastUpdated: Date.now(),
    }
    return [summary]
  }, [snapshots])

  const rowClassRules = useMemo(
    () => ({
      "bg-emerald-50/80 dark:bg-emerald-900/30": (
        params: RowClassParams<Delta1BasisSnapshot>,
      ) =>
        params.node.rowPinned !== "bottom" &&
        (params.data?.theoreticalEdgeBps ?? 0) >= edgeAlertBps,
      "bg-rose-50/80 dark:bg-rose-900/30": (
        params: RowClassParams<Delta1BasisSnapshot>,
      ) =>
        params.node.rowPinned !== "bottom" &&
        Math.abs(params.data?.basisBps ?? 0) >= basisAlertBps,
    }),
    [basisAlertBps, edgeAlertBps],
  )

  const statusBar = useMemo(
    () => ({
      statusPanels: [
        { statusPanel: "agTotalRowCountComponent" },
        { statusPanel: "agFilteredRowCountComponent" },
        { statusPanel: "agAggregationComponent" },
      ],
    }),
    [],
  )

  const sideBar = useMemo(
    () => ({
      toolPanels: [
        {
          id: "columns",
          labelDefault: "Columns",
          labelKey: "columns",
          iconKey: "columns",
          toolPanel: "agColumnsToolPanel",
        },
      ],
      position: "right" as const,
      hiddenByDefault: false,
    }),
    [],
  )

  const getRowId = useCallback((params: GetRowIdParams<Delta1BasisSnapshot>) => {
    if (params.data?.instrumentId) return params.data.instrumentId
    if (params.data?.symbol) return params.data.symbol
    return Math.random().toString(36)
  }, [])

  const onGridReady = useCallback((event: GridReadyEvent<Delta1BasisSnapshot>) => {
    gridApiRef.current = event.api
    if (typeof window !== "undefined") {
      const storedState = window.localStorage.getItem(COLUMN_STATE_STORAGE_KEY)
      if (storedState) {
        try {
          const parsed = JSON.parse(storedState) as ColumnState[]
          event.api.applyColumnState({ state: parsed, applyOrder: true })
        } catch (error) {
          console.warn("Failed to load stored column state", error)
        }
      }
    }
    event.api.sizeColumnsToFit()
  }, [])

  const persistColumnState = useCallback(() => {
    if (typeof window === "undefined") return
    const state = gridApiRef.current?.getColumnState()
    if (state) {
      window.localStorage.setItem(COLUMN_STATE_STORAGE_KEY, JSON.stringify(state))
    }
  }, [])

  const onFirstDataRendered = useCallback((event: FirstDataRenderedEvent) => {
    event.api.sizeColumnsToFit()
  }, [])

  useEffect(() => {
    if (gridApiRef.current) {
      gridApiRef.current.refreshClientSideRowModel("filter")
      gridApiRef.current.sizeColumnsToFit()
    }
  }, [activeColumnSet, search, snapshots])

  useEffect(() => {
    if (tapeRows.length && tapeGridApiRef.current) {
      tapeGridApiRef.current.ensureIndexVisible(tapeRows.length - 1, "bottom")
    }
  }, [tapeRows])

  const metricsChartData = useMemo(() =>
    [...metricsHistory].reverse().slice(-40),
  [metricsHistory])

  const connectionLabel = useMemo(() => {
    switch (connectionState) {
      case "open":
        return "Live"
      case "mock":
        return "Mock Feed"
      case "closed":
        return "Disconnected"
      default:
        return "Connecting"
    }
  }, [connectionState])

  const handlePauseResume = useCallback(() => {
    if (isPaused) {
      resume()
    } else {
      pause()
    }
  }, [isPaused, pause, resume])

  const quickFilterPlaceholder = useMemo(
    () => (activeColumnSet === "core" ? "Filter basis ladder" : "Filter liquidity view"),
    [activeColumnSet],
  )

  return (
    <PageTemplate
      title="Delta-1 Basis Monitor"
      description="Track cash-futures alignment, carry decay, and hedge actions across the delta-one ladder."
      fullWidth
      headingVariant="compact"
    >
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={connectionBadgeIntent[connectionState]} className="uppercase">
            {connectionLabel}
          </Badge>
          <Button size="sm" variant="outline" onClick={handlePauseResume} className="gap-1">
            {isPaused ? (
              <PlayCircle className="size-4" />
            ) : (
              <PauseCircle className="size-4" />
            )}
            <span>{isPaused ? "Resume" : "Pause"}</span>
          </Button>
          <Button size="sm" variant="outline" onClick={reset} className="gap-1">
            <RotateCcw className="size-4" />
            Reset
          </Button>
          <div className="flex items-center gap-1 rounded-md border px-2 py-1 text-xs text-muted-foreground">
            <Activity className="size-3.5" />
            <span>{metrics.avgLatencyMs.toFixed(0)} ms latency</span>
          </div>
          <div className="flex items-center gap-1 rounded-md border px-2 py-1 text-xs text-muted-foreground">
            <LineChartIcon className="size-3.5" />
            <span>{metrics.basisVolatility.toFixed(2)} bps σ</span>
          </div>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <ToggleGroup
              type="single"
              value={activeColumnSet}
              onValueChange={(value) =>
                setActiveColumnSet((value as Delta1ColumnSetKey) ?? "core")
              }
              variant="outline"
              size="sm"
            >
              <ToggleGroupItem value="core" className="px-2 text-xs">
                Ladder
              </ToggleGroupItem>
              <ToggleGroupItem value="liquidity" className="px-2 text-xs">
                Liquidity
              </ToggleGroupItem>
            </ToggleGroup>
            <div className="flex items-center gap-2 rounded-md border px-2 py-1">
              <Switch
                id="auto-hedge"
                checked={autoHedgeEnabled}
                onCheckedChange={setAutoHedgeEnabled}
              />
              <label htmlFor="auto-hedge" className="text-xs font-medium">
                Hedge automation
              </label>
            </div>
          </div>
        </div>
        <GridChartLayout
          primaryGrid={
            <>
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex min-w-[220px] items-center gap-2 rounded-md border px-2 py-1">
                  <Filter className="size-4 text-muted-foreground" />
                  <Input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder={quickFilterPlaceholder}
                    className="h-8 border-0 px-0 text-xs focus-visible:ring-0"
                  />
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-semibold">Basis alert</span>
                  <Slider
                    value={[basisAlertBps]}
                    min={5}
                    max={100}
                    step={1}
                    className="w-32"
                    onValueChange={([value]) => setBasisAlertBps(value)}
                  />
                  <span>{basisAlertBps} bps</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-semibold">Edge alert</span>
                  <Slider
                    value={[edgeAlertBps]}
                    min={1}
                    max={25}
                    step={1}
                    className="w-28"
                    onValueChange={([value]) => setEdgeAlertBps(value)}
                  />
                  <span>{edgeAlertBps} bps</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <Select
                    value={selectedSymbol}
                    onValueChange={(value) => {
                      setSelectedSymbol("")
                      handleAddToWatchlist(value)
                    }}
                  >
                    <SelectTrigger className="h-8 w-44 text-xs">
                      <SelectValue placeholder="Add symbol to watch" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60 text-xs">
                      {instrumentOptions.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="flex flex-wrap items-center gap-1">
                    {watchlist.map((symbol) => (
                      <Badge key={symbol} variant="outline" className="gap-1 text-[11px]">
                        {symbol}
                        <button
                          type="button"
                          aria-label={`Remove ${symbol}`}
                          onClick={() => removeFromWatchlist(symbol)}
                          className="rounded-full p-0.5 hover:bg-muted"
                        >
                          <X className="size-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
              <GridTemplate<Delta1BasisSnapshot>
                containerClassName="flex-1"
                gridOptions={mainGridOptions}
                columnDefs={columnDefs}
                rowData={snapshots}
                pinnedBottomRowData={pinnedBottomRowData}
                autoSizeStrategy={autoSizeStrategy}
                animateRows
                rowClassRules={rowClassRules}
                getRowId={getRowId}
                quickFilterText={search}
                statusBar={statusBar}
                sideBar={sideBar}
                onGridReady={onGridReady}
                onFirstDataRendered={onFirstDataRendered}
                onColumnMoved={persistColumnState}
                onColumnPinned={persistColumnState}
                onColumnVisible={persistColumnState}
                onColumnResized={persistColumnState}
                suppressAggFuncInHeader
              />
            </>
          }
          secondaryGrid={
            <>
              <Card className="flex flex-1 flex-col">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-semibold">Position Stack</CardTitle>
                  <Badge variant="secondary" className="gap-1 text-[11px]">
                    <Activity className="size-3" />
                    {augmentedPositions.length}
                  </Badge>
                </CardHeader>
                <CardContent className="flex-1 p-0">
                  <GridTemplate<PositionRow>
                    containerClassName="h-full w-full rounded-none border-0 border-t"
                    density="compact"
                    columnDefs={positionColumnDefs}
                    autoGroupColumnDef={{
                      headerName: "Book / Strategy",
                      minWidth: 160,
                      cellClass: "text-xs font-semibold",
                    }}
                    groupDisplayType="multipleColumns"
                    rowData={augmentedPositions}
                    animateRows
                    suppressAggFuncInHeader
                    getRowId={(params) => params.data?.id ?? Math.random().toString(36)}
                    autoSizeStrategy={autoSizeStrategy}
                    statusBar={statusBar}
                    rowBuffer={20}
                  />
                </CardContent>
              </Card>
              <Card className="flex flex-col">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-semibold">Trade & Event Tape</CardTitle>
                  <Badge variant="secondary" className="gap-1 text-[11px]">
                    <Activity className="size-3" />
                    {tapeRows.length}
                  </Badge>
                </CardHeader>
                <CardContent className="flex-1 p-0">
                  <GridTemplate<TapeRow>
                    containerClassName="h-[220px] w-full rounded-none border-0 border-t"
                    density="compact"
                    columnDefs={tapeColumnDefs}
                    rowData={tapeRows}
                    animateRows
                    rowBuffer={40}
                    suppressAggFuncInHeader
                    getRowId={(params) => params.data?.id ?? Math.random().toString(36)}
                    onGridReady={(event) => {
                      tapeGridApiRef.current = event.api
                    }}
                    autoSizeStrategy={autoSizeStrategy}
                    onFirstDataRendered={(event) =>
                      event.api.ensureIndexVisible(event.api.getDisplayedRowCount() - 1)
                    }
                  />
                </CardContent>
              </Card>
            </>
          }
          chartPanel={
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Market Pulse</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ChartTemplate
                  config={{
                    volatility: {
                      label: "Basis Volatility",
                      color: "var(--color-volatility)",
                    },
                    latency: {
                      label: "Latency",
                      color: "var(--color-latency)",
                    },
                  }}
                  data={metricsChartData}
                  xAxisKey="timestamp"
                  xAxisFormatter={(value) => timestampFormatter(Number(value))}
                  leftAxisFormatter={(value) => `${value.toFixed(1)}bps`}
                  rightAxisFormatter={(value) => `${Math.round(value)}ms`}
                  showRightAxis
                  className="h-[180px]"
                >
                  <defs>
                    <linearGradient id="basis-vol" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-volatility, #22c55e)" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="var(--color-volatility, #22c55e)" stopOpacity={0.1} />
                    </linearGradient>
                    <linearGradient id="latency" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-latency, #06b6d4)" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="var(--color-latency, #06b6d4)" stopOpacity={0.1} />
                    </linearGradient>
                  </defs>
                  <Area
                    type="monotone"
                    dataKey="basisVolatility"
                    stroke="var(--color-volatility, #16a34a)"
                    fill="url(#basis-vol)"
                    strokeWidth={2}
                    dot={false}
                    yAxisId="left"
                  />
                  <Area
                    type="monotone"
                    dataKey="latencyMs"
                    stroke="var(--color-latency, #0891b2)"
                    fill="url(#latency)"
                    strokeWidth={2}
                    dot={false}
                    yAxisId="right"
                  />
                </ChartTemplate>
              </CardContent>
            </Card>
          }
        />
      </div>
    </PageTemplate>
  )
}
