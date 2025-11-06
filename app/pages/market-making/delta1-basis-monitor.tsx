import {
  type CSSProperties,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"
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
import { AgGridReact } from "ag-grid-react"
import {
  Activity,
  Filter,
  LineChart as LineChartIcon,
  PauseCircle,
  PlayCircle,
  RotateCcw,
  X,
} from "lucide-react"
import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts"

import { PageTemplate } from "~/components/page-template"
import { Badge } from "~/components/ui/badge"
import { Button } from "~/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "~/components/ui/chart"
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
import { cn } from "~/lib/utils"

import "ag-grid-community/styles/ag-grid.css"
import "ag-grid-community/styles/ag-theme-quartz.css"

type ColumnSetKey = "core" | "liquidity"

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

const numberFormatter = (value: number | null | undefined, digits = 2) => {
  if (value === null || value === undefined || Number.isNaN(value)) return ""
  return value.toLocaleString("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })
}

const integerFormatter = (value: number | null | undefined) => {
  if (value === null || value === undefined || Number.isNaN(value)) return ""
  return value.toLocaleString("en-US", { maximumFractionDigits: 0 })
}

const basisFormatter = (value: number | null | undefined) => {
  if (value === null || value === undefined || Number.isNaN(value)) return ""
  const formatted = value.toFixed(2)
  return `${value > 0 ? "+" : ""}${formatted}`
}

const currencyFormatter = (value: number | null | undefined) => {
  if (value === null || value === undefined || Number.isNaN(value)) return ""
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  })
}

const timestampFormatter = (value: number | null | undefined) => {
  if (!value) return ""
  return new Date(value).toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })
}

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

const compactGridStyle = {
  "--ag-row-height": "32px",
  "--ag-header-height": "32px",
  "--ag-font-size": "12px",
} as CSSProperties & Record<string, string>

const compactSideGridStyle = {
  "--ag-row-height": "30px",
  "--ag-header-height": "30px",
  "--ag-font-size": "11px",
} as CSSProperties & Record<string, string>

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
  const [activeColumnSet, setActiveColumnSet] = useState<ColumnSetKey>("core")
  const [autoHedgeEnabled, setAutoHedgeEnabled] = useState(true)
  const [selectedSymbol, setSelectedSymbol] = useState<string>("")
  const [watchlist, setWatchlist] = useState<string[]>([])
  const [autoHedgeOverrides, setAutoHedgeOverrides] = useState<Record<string, boolean>>({})
  const [columnDefs, setColumnDefs] = useState<(ColDef | ColGroupDef)[]>([])

  const gridApiRef = useRef<GridApi<Delta1BasisSnapshot> | null>(null)
  const tapeGridApiRef = useRef<GridApi<TapeRow> | null>(null)

  const autoSizeStrategy = useMemo(() => ({ type: "fitGridWidth" as const }), [])

  const mainGridOptions = useMemo(
    () => ({ deltaRowDataMode: true } as unknown as GridOptions<Delta1BasisSnapshot>),
    [],
  )

  const defaultColDef = useMemo<ColDef>(() => ({
    sortable: true,
    resizable: true,
    filter: true,
    cellClass: "text-xs",
    headerClass: "text-[11px] font-semibold",
  }), [])

  const columnSets = useMemo<Record<ColumnSetKey, (ColDef | ColGroupDef)[]>>(
    () => ({
      core: [
        {
          headerName: "Instrument",
          field: "symbol",
          pinned: "left",
          minWidth: 120,
          cellClass: "font-semibold",
        },
        {
          headerName: "Cash Leg",
          marryChildren: true,
          children: [
            {
              headerName: "Bid",
              field: "cashBid",
              type: "rightAligned",
              valueFormatter: ({ value }) => numberFormatter(value, 4),
            },
            {
              headerName: "Ask",
              field: "cashAsk",
              type: "rightAligned",
              valueFormatter: ({ value }) => numberFormatter(value, 4),
            },
            {
              headerName: "Mid",
              field: "cashMid",
              type: "rightAligned",
              valueFormatter: ({ value }) => numberFormatter(value, 4),
            },
          ],
        },
        {
          headerName: "Futures Leg",
          marryChildren: true,
          children: [
            {
              headerName: "Bid",
              field: "futuresBid",
              type: "rightAligned",
              valueFormatter: ({ value }) => numberFormatter(value, 4),
            },
            {
              headerName: "Ask",
              field: "futuresAsk",
              type: "rightAligned",
              valueFormatter: ({ value }) => numberFormatter(value, 4),
            },
            {
              headerName: "Mid",
              field: "futuresMid",
              type: "rightAligned",
              valueFormatter: ({ value }) => numberFormatter(value, 4),
            },
          ],
        },
        {
          headerName: "Derived Metrics",
          marryChildren: true,
          children: [
            {
              headerName: "Basis (bps)",
              field: "basisBps",
              type: "rightAligned",
              valueFormatter: ({ value }) => basisFormatter(value),
            },
            {
              headerName: "Theo Edge (bps)",
              field: "theoreticalEdgeBps",
              type: "rightAligned",
              valueFormatter: ({ value }) => basisFormatter(value),
            },
            {
              headerName: "Net Position",
              field: "netPosition",
              type: "rightAligned",
              valueFormatter: ({ value }) => integerFormatter(value),
            },
            {
              headerName: "Carry P&L",
              field: "carryPnL",
              type: "rightAligned",
              valueFormatter: ({ value }) => currencyFormatter(value),
            },
            {
              headerName: "Hedge Suggestion",
              field: "hedgeSuggestion",
            },
            {
              headerName: "Predicted Hedge Fill",
              field: "predictedHedgeFill",
              type: "rightAligned",
              valueFormatter: ({ value }) => numberFormatter(value, 4),
            },
          ],
        },
        {
          headerName: "Timestamps",
          children: [
            {
              headerName: "Quote",
              field: "lastQuoteTimestamp",
              valueFormatter: ({ value }) => timestampFormatter(value),
            },
            {
              headerName: "Trade",
              field: "lastTradeTimestamp",
              valueFormatter: ({ value }) => timestampFormatter(value),
            },
          ],
        },
      ],
      liquidity: [
        {
          headerName: "Instrument",
          field: "symbol",
          pinned: "left",
          minWidth: 120,
          cellClass: "font-semibold",
        },
        {
          headerName: "Execution",
          marryChildren: true,
          children: [
            {
              headerName: "Cash Bid",
              field: "cashBid",
              type: "rightAligned",
              valueFormatter: ({ value }) => numberFormatter(value, 4),
            },
            {
              headerName: "Futures Ask",
              field: "futuresAsk",
              type: "rightAligned",
              valueFormatter: ({ value }) => numberFormatter(value, 4),
            },
            {
              headerName: "Theo Futures",
              field: "theoreticalFutures",
              type: "rightAligned",
              valueFormatter: ({ value }) => numberFormatter(value, 4),
            },
            {
              headerName: "Theo Basis",
              field: "theoreticalBasisBps",
              type: "rightAligned",
              valueFormatter: ({ value }) => basisFormatter(value),
            },
            {
              headerName: "Carry Daily",
              field: "carryDaily",
              type: "rightAligned",
              valueFormatter: ({ value }) => currencyFormatter(value),
            },
            {
              headerName: "Updated",
              field: "lastUpdated",
              valueFormatter: ({ value }) => timestampFormatter(value),
            },
          ],
        },
      ],
    }),
    [],
  )

  useEffect(() => {
    setColumnDefs(columnSets[activeColumnSet])
  }, [activeColumnSet, columnSets])

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
    () => [
      { field: "book", rowGroup: true, hide: true },
      { field: "strategy", rowGroup: true, hide: true },
      {
        headerName: "Symbol",
        field: "symbol",
        pinned: "left",
        minWidth: 120,
      },
      {
        headerName: "Cash Pos",
        field: "cashPosition",
        type: "rightAligned",
        aggFunc: "sum",
        valueFormatter: ({ value }) => integerFormatter(value),
      },
      {
        headerName: "Futures Pos",
        field: "futuresPosition",
        type: "rightAligned",
        aggFunc: "sum",
        valueFormatter: ({ value }) => integerFormatter(value),
      },
      {
        headerName: "Net Δ",
        field: "netDelta",
        type: "rightAligned",
        aggFunc: "sum",
        valueFormatter: ({ value }) => integerFormatter(value),
      },
      {
        headerName: "Carry Decay",
        field: "carryDecay",
        type: "rightAligned",
        aggFunc: "avg",
        valueFormatter: ({ value }) => currencyFormatter(value),
      },
      {
        headerName: "Auto Hedge",
        field: "autoHedge",
        cellRenderer: AutoHedgeRenderer,
        cellRendererParams: {
          onToggle: handleAutoHedgeToggle,
        },
      },
      {
        headerName: "Updated",
        field: "lastUpdated",
        valueFormatter: ({ value }) => timestampFormatter(value),
      },
    ],
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
    () => [
      {
        headerName: "Time",
        field: "timestamp",
        valueFormatter: ({ value }) => timestampFormatter(value),
        minWidth: 110,
      },
      {
        headerName: "Type",
        field: "type",
        width: 90,
        cellClass: "capitalize",
      },
      {
        headerName: "Symbol",
        field: "symbol",
        minWidth: 120,
      },
      {
        headerName: "Leg",
        field: "leg",
        width: 90,
        cellClass: "capitalize",
      },
      {
        headerName: "Side",
        field: "side",
        width: 90,
        cellClass: "capitalize",
      },
      {
        headerName: "Size",
        field: "size",
        type: "rightAligned",
        valueFormatter: ({ value }) => integerFormatter(value),
      },
      {
        headerName: "Price",
        field: "price",
        type: "rightAligned",
        valueFormatter: ({ value }) => numberFormatter(value, 4),
      },
      {
        headerName: "Event",
        field: "message",
        flex: 1,
      },
    ],
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
                setActiveColumnSet((value as ColumnSetKey) ?? "core")
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
        <div className="grid gap-3 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <div className="flex min-h-[540px] flex-col gap-3">
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
            <div
              className="ag-theme-quartz flex-1 overflow-hidden rounded-lg border bg-background"
              style={compactGridStyle}
            >
              <AgGridReact<Delta1BasisSnapshot>
                gridOptions={mainGridOptions}
                columnDefs={columnDefs}
                defaultColDef={defaultColDef}
                rowData={snapshots}
                pinnedBottomRowData={pinnedBottomRowData}
                autoSizeStrategy={autoSizeStrategy}
                className="h-full w-full"
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
                rowHeight={32}
                headerHeight={32}
                suppressAggFuncInHeader
              />
            </div>
          </div>
          <div className="flex min-h-[540px] flex-col gap-3">
            <Card className="flex flex-1 flex-col">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-semibold">Position Stack</CardTitle>
                <Badge variant="secondary" className="gap-1 text-[11px]">
                  <Activity className="size-3" />
                  {augmentedPositions.length}
                </Badge>
              </CardHeader>
              <CardContent className="flex-1 p-0">
                <div
                  className="ag-theme-quartz h-full w-full overflow-hidden border-t"
                  style={compactSideGridStyle}
                >
                  <AgGridReact<PositionRow>
                    columnDefs={positionColumnDefs}
                    defaultColDef={defaultColDef}
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
                    rowHeight={30}
                    headerHeight={30}
                    autoSizeStrategy={autoSizeStrategy}
                    statusBar={statusBar}
                    rowBuffer={20}
                  />
                </div>
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
                <div
                  className="ag-theme-quartz h-[220px] w-full overflow-hidden border-t"
                  style={compactSideGridStyle}
                >
                  <AgGridReact<TapeRow>
                    columnDefs={tapeColumnDefs}
                    defaultColDef={defaultColDef}
                    rowData={tapeRows}
                    animateRows
                    rowBuffer={40}
                    suppressAggFuncInHeader
                    getRowId={(params) => params.data?.id ?? Math.random().toString(36)}
                    ref={(ref) => {
                      tapeGridApiRef.current = ref?.api ?? null
                    }}
                    rowHeight={30}
                    headerHeight={30}
                    autoSizeStrategy={autoSizeStrategy}
                    onFirstDataRendered={(event) =>
                      event.api.ensureIndexVisible(event.api.getDisplayedRowCount() - 1)
                    }
                  />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Market Pulse</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ChartContainer
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
                  className="h-[180px]"
                >
                  <AreaChart data={metricsChartData}>
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
                    <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} />
                    <XAxis
                      dataKey="timestamp"
                      tickFormatter={(value) => timestampFormatter(value)}
                      tick={{ fontSize: 10 }}
                    />
                    <YAxis
                      yAxisId="left"
                      tickFormatter={(value) => `${value.toFixed(1)}bps`}
                      width={46}
                      tick={{ fontSize: 10 }}
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      tickFormatter={(value) => `${Math.round(value)}ms`}
                      width={38}
                      tick={{ fontSize: 10 }}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
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
                  </AreaChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PageTemplate>
  )
}

