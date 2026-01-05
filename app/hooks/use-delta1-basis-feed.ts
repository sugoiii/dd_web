import { useCallback, useEffect, useMemo, useRef, useState } from "react"

import {
  type BasisMessage,
  type ConnectionState,
  type EventPayload,
  type LegType,
  type PositionPayload,
  type QuotePayload,
  type SocketMessage,
  type TheoreticalPayload,
  type TradePayload,
  openDelta1BasisSocket,
} from "../api/delta1"

export type { ConnectionState } from "../api/delta1"

export interface Delta1BasisSnapshot {
  instrumentId: string
  symbol: string
  cashBid: number | null
  cashAsk: number | null
  futuresBid: number | null
  futuresAsk: number | null
  cashMid: number | null
  futuresMid: number | null
  basisBps: number | null
  theoreticalBasisBps: number | null
  theoreticalFutures: number | null
  theoreticalEdgeBps: number | null
  netPosition: number
  cashPosition: number
  futuresPosition: number
  carryPnL: number
  carryDaily: number
  hedgeSuggestion: string
  predictedHedgeFill: number | null
  lastQuoteTimestamp: number | null
  lastTradeTimestamp: number | null
  lastEventTimestamp: number | null
  lastUpdated: number
}

export interface PositionStackRow {
  id: string
  instrumentId: string
  symbol: string
  book: string
  strategy: string
  cashPosition: number
  futuresPosition: number
  netDelta: number
  carryDecay: number
  autoHedge: boolean
  lastUpdated: number
}

export interface NormalizedTrade {
  id: string
  instrumentId: string
  symbol: string
  leg: LegType
  price: number
  size: number
  side: "buy" | "sell"
  venue?: string
  timestamp: number
}

export interface NormalizedEvent {
  id: string
  instrumentId: string
  symbol: string
  level: "info" | "warning" | "critical"
  message: string
  timestamp: number
}

export interface FeedMetrics {
  basisVolatility: number
  avgLatencyMs: number
  updatedAt: number
}

export interface MetricsPoint {
  timestamp: number
  basisVolatility: number
  latencyMs: number
}

interface FeedState {
  connectionState: ConnectionState
  isPaused: boolean
  search: string
  setSearch: (value: string) => void
  snapshots: Delta1BasisSnapshot[]
  positionStack: PositionStackRow[]
  tradeTape: NormalizedTrade[]
  eventTape: NormalizedEvent[]
  metrics: FeedMetrics
  metricsHistory: MetricsPoint[]
  pause: () => void
  resume: () => void
  reset: () => void
}

const MAX_TAPE_LENGTH = 250
const HISTORY_LENGTH = 120
const CARRY_NOTIONAL_PER_LOT = 100000

const MOCK_SYMBOLS = [
  {
    instrumentId: "KRX-FUT-1",
    symbol: "KRX F1",
    book: "Delta1",
    strategy: "Calendar Basis",
    baseCash: 271.5,
    baseFutures: 271.3,
  },
  {
    instrumentId: "KRX-FUT-2",
    symbol: "KRX F2",
    book: "Delta1",
    strategy: "Calendar Basis",
    baseCash: 274.2,
    baseFutures: 274.0,
  },
  {
    instrumentId: "SGX-NK-F",
    symbol: "NK F",
    book: "SGX",
    strategy: "Japan Basis",
    baseCash: 39250,
    baseFutures: 39220,
  },
  {
    instrumentId: "CME-ES",
    symbol: "ES",
    book: "US",
    strategy: "S&P Basis",
    baseCash: 5205.5,
    baseFutures: 5206.25,
  },
]

const basisHistoryStdDev = (values: number[]) => {
  if (!values.length) {
    return 0
  }
  const mean = values.reduce((acc, value) => acc + value, 0) / values.length
  const variance =
    values.reduce((acc, value) => acc + (value - mean) * (value - mean), 0) /
    values.length
  return Math.sqrt(variance)
}

const computeHedgeSuggestion = (
  netPosition: number,
  theoreticalEdgeBps: number | null,
): string => {
  if (!theoreticalEdgeBps || Math.abs(theoreticalEdgeBps) < 1) {
    if (Math.abs(netPosition) < 1) {
      return "Hold"
    }
    return netPosition > 0 ? "Monitor Long" : "Monitor Short"
  }

  if (netPosition > 0) {
    return theoreticalEdgeBps < 0 ? "Sell Futures" : "Take Profit"
  }
  if (netPosition < 0) {
    return theoreticalEdgeBps > 0 ? "Buy Futures" : "Reduce Short"
  }
  return theoreticalEdgeBps > 0 ? "Lean Long" : "Lean Short"
}

const createEmptySnapshot = (
  instrumentId: string,
  symbol: string,
): Delta1BasisSnapshot => ({
  instrumentId,
  symbol,
  cashBid: null,
  cashAsk: null,
  futuresBid: null,
  futuresAsk: null,
  cashMid: null,
  futuresMid: null,
  basisBps: null,
  theoreticalBasisBps: null,
  theoreticalFutures: null,
  theoreticalEdgeBps: null,
  netPosition: 0,
  cashPosition: 0,
  futuresPosition: 0,
  carryPnL: 0,
  carryDaily: 0,
  hedgeSuggestion: "Hold",
  predictedHedgeFill: null,
  lastQuoteTimestamp: null,
  lastTradeTimestamp: null,
  lastEventTimestamp: null,
  lastUpdated: Date.now(),
})

const finalizeSnapshot = (
  snapshot: Delta1BasisSnapshot,
  timestamp: number,
): Delta1BasisSnapshot => {
  const cashMid =
    snapshot.cashBid !== null && snapshot.cashAsk !== null
      ? (snapshot.cashBid + snapshot.cashAsk) / 2
      : snapshot.cashMid

  const futuresMid =
    snapshot.futuresBid !== null && snapshot.futuresAsk !== null
      ? (snapshot.futuresBid + snapshot.futuresAsk) / 2
      : snapshot.futuresMid

  let basisBps: number | null = null
  if (cashMid !== null && futuresMid !== null && futuresMid !== 0) {
    basisBps = ((cashMid - futuresMid) / futuresMid) * 10000
  }

  const theoreticalEdgeBps =
    basisBps !== null && snapshot.theoreticalBasisBps !== null
      ? basisBps - snapshot.theoreticalBasisBps
      : snapshot.theoreticalEdgeBps

  const netPosition = snapshot.cashPosition + snapshot.futuresPosition
  const carryPnL =
    basisBps !== null
      ? (netPosition * CARRY_NOTIONAL_PER_LOT * basisBps) / 10000
      : snapshot.carryPnL

  const predictedHedgeFill =
    futuresMid !== null && theoreticalEdgeBps !== null
      ? futuresMid + (theoreticalEdgeBps / 10000) * futuresMid
      : snapshot.predictedHedgeFill

  return {
    ...snapshot,
    cashMid,
    futuresMid,
    basisBps,
    theoreticalEdgeBps,
    netPosition,
    carryPnL,
    carryDaily: snapshot.carryDaily,
    hedgeSuggestion: computeHedgeSuggestion(netPosition, theoreticalEdgeBps),
    predictedHedgeFill,
    lastUpdated: timestamp,
  }
}

const clampArray = <T,>(entries: T[], limit: number) =>
  entries.length > limit ? entries.slice(0, limit) : entries

const clampTape = <T,>(entries: T[]) => clampArray(entries, MAX_TAPE_LENGTH)

export function useDelta1BasisFeed(): FeedState {
  const [connectionState, setConnectionState] = useState<ConnectionState>(
    "connecting",
  )
  const [isPaused, setIsPaused] = useState(false)
  const [search, setSearch] = useState("")
  const [version, setVersion] = useState(0)

  const [tradeTape, setTradeTape] = useState<NormalizedTrade[]>([])
  const [eventTape, setEventTape] = useState<NormalizedEvent[]>([])
  const [metrics, setMetrics] = useState<FeedMetrics>({
    basisVolatility: 0,
    avgLatencyMs: 0,
    updatedAt: Date.now(),
  })
  const [metricsHistory, setMetricsHistory] = useState<MetricsPoint[]>([])

  const snapshotsRef = useRef<Map<string, Delta1BasisSnapshot>>(new Map())
  const positionsRef = useRef<Map<string, PositionStackRow>>(new Map())
  const basisHistoryRef = useRef<number[]>([])
  const latencyHistoryRef = useRef<number[]>([])
  const metricsHistoryRef = useRef<MetricsPoint[]>([])

  const socketRef = useRef<WebSocket | null>(null)
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const mockIntervalsRef = useRef<Array<ReturnType<typeof setInterval>>>([])
  const isMountedRef = useRef(false)
  const isPausedRef = useRef(false)

  const getSymbol = useCallback((payload: SocketMessage) => {
    if (payload.symbol) return payload.symbol
    const existing = snapshotsRef.current.get(payload.instrumentId)
    if (existing) return existing.symbol
    const mockConfig = MOCK_SYMBOLS.find(
      (item) => item.instrumentId === payload.instrumentId,
    )
    return mockConfig?.symbol ?? payload.instrumentId
  }, [])

  const emitMetrics = useCallback(() => {
    const basisVol = basisHistoryStdDev(basisHistoryRef.current)
    const latencies = latencyHistoryRef.current
    const avgLatency = latencies.length
      ? latencies.reduce((acc, value) => acc + value, 0) / latencies.length
      : 0

    const nextMetrics = {
      basisVolatility: Number.isFinite(basisVol) ? basisVol : 0,
      avgLatencyMs: Number.isFinite(avgLatency) ? avgLatency : 0,
      updatedAt: Date.now(),
    }

    setMetrics(nextMetrics)

    const historyPoint: MetricsPoint = {
      timestamp: nextMetrics.updatedAt,
      basisVolatility: nextMetrics.basisVolatility,
      latencyMs: nextMetrics.avgLatencyMs,
    }
    metricsHistoryRef.current = clampArray([
      historyPoint,
      ...metricsHistoryRef.current,
    ], HISTORY_LENGTH)
    setMetricsHistory(metricsHistoryRef.current)
  }, [])

  const updateSnapshot = useCallback(
    (
      instrumentId: string,
      symbolHint: string,
      updater: (snapshot: Delta1BasisSnapshot) => Delta1BasisSnapshot,
    ) => {
      const existing = snapshotsRef.current.get(instrumentId)
      const base = existing ?? createEmptySnapshot(instrumentId, symbolHint)
      const next = updater(base)
      snapshotsRef.current.set(instrumentId, next)
      setVersion((value) => value + 1)
    },
    [],
  )

  const upsertPosition = useCallback(
    (payload: PositionPayload) => {
      const id = `${payload.book}:${payload.strategy}:${payload.instrumentId}`
      const existing = positionsRef.current.get(id)
      const netDelta = payload.cashPosition + payload.futuresPosition
      const row: PositionStackRow = {
        id,
        instrumentId: payload.instrumentId,
        symbol: getSymbol(payload),
        book: payload.book,
        strategy: payload.strategy,
        cashPosition: payload.cashPosition,
        futuresPosition: payload.futuresPosition,
        netDelta,
        carryDecay: payload.carry,
        autoHedge: payload.autoHedge ?? existing?.autoHedge ?? false,
        lastUpdated: payload.timestamp,
      }
      positionsRef.current.set(id, row)
    },
    [getSymbol],
  )

  const recordLatency = useCallback((timestamp: number | undefined) => {
    if (!timestamp) return
    const latency = Date.now() - timestamp
    latencyHistoryRef.current = clampArray(
      [latency, ...latencyHistoryRef.current],
      HISTORY_LENGTH,
    )
  }, [])

  const processQuote = useCallback(
    (payload: QuotePayload) => {
      const symbol = getSymbol(payload)
      recordLatency(payload.timestamp)
      updateSnapshot(payload.instrumentId, symbol, (snapshot) => {
        const next: Delta1BasisSnapshot = {
          ...snapshot,
          symbol,
          lastQuoteTimestamp: payload.timestamp,
        }
        if (payload.leg === "cash") {
          next.cashBid = payload.bid
          next.cashAsk = payload.ask
        } else {
          next.futuresBid = payload.bid
          next.futuresAsk = payload.ask
        }
        return finalizeSnapshot(next, payload.timestamp)
      })
    },
    [getSymbol, recordLatency, updateSnapshot],
  )

  const processTrade = useCallback(
    (payload: TradePayload) => {
      const symbol = getSymbol(payload)
      recordLatency(payload.timestamp)
      const trade: NormalizedTrade = {
        id: payload.id ?? `${payload.instrumentId}-${payload.timestamp}`,
        instrumentId: payload.instrumentId,
        symbol,
        leg: payload.leg,
        price: payload.price,
        size: payload.size,
        side: payload.side,
        venue: payload.venue,
        timestamp: payload.timestamp,
      }
      setTradeTape((prev) => clampTape([trade, ...prev]))
      updateSnapshot(payload.instrumentId, symbol, (snapshot) =>
        finalizeSnapshot(
          {
            ...snapshot,
            symbol,
            lastTradeTimestamp: payload.timestamp,
          },
          payload.timestamp,
        ),
      )
    },
    [getSymbol, recordLatency, updateSnapshot],
  )

  const processEvent = useCallback(
    (payload: EventPayload) => {
      const symbol = getSymbol(payload)
      recordLatency(payload.timestamp)
      const event: NormalizedEvent = {
        id: `${payload.instrumentId}-${payload.timestamp}-${payload.level}`,
        instrumentId: payload.instrumentId,
        symbol,
        level: payload.level,
        message: payload.message,
        timestamp: payload.timestamp,
      }
      setEventTape((prev) => clampTape([event, ...prev]))
      updateSnapshot(payload.instrumentId, symbol, (snapshot) =>
        finalizeSnapshot(
          {
            ...snapshot,
            symbol,
            lastEventTimestamp: payload.timestamp,
          },
          payload.timestamp,
        ),
      )
    },
    [getSymbol, recordLatency, updateSnapshot],
  )

  const processPosition = useCallback(
    (payload: PositionPayload) => {
      const symbol = getSymbol(payload)
      recordLatency(payload.timestamp)
      upsertPosition(payload)
      updateSnapshot(payload.instrumentId, symbol, (snapshot) =>
        finalizeSnapshot(
          {
            ...snapshot,
            symbol,
            cashPosition: payload.cashPosition,
            futuresPosition: payload.futuresPosition,
            carryPnL: payload.carry,
            carryDaily: payload.carry / 260,
          },
          payload.timestamp,
        ),
      )
    },
    [getSymbol, recordLatency, updateSnapshot, upsertPosition],
  )

  const processTheoretical = useCallback(
    (payload: TheoreticalPayload) => {
      const symbol = getSymbol(payload)
      recordLatency(payload.timestamp)
      updateSnapshot(payload.instrumentId, symbol, (snapshot) =>
        finalizeSnapshot(
          {
            ...snapshot,
            symbol,
            theoreticalBasisBps: payload.theoreticalBasisBps,
            theoreticalFutures: payload.theoreticalFutures,
          },
          payload.timestamp,
        ),
      )
    },
    [getSymbol, recordLatency, updateSnapshot],
  )

  const handleMessage = useCallback(
    (message: BasisMessage) => {
      const messages = Array.isArray(message) ? message : [message]
      const processedBasisValues: number[] = []
      messages.forEach((payload) => {
        if (isPausedRef.current) {
          return
        }
        switch (payload.type) {
          case "quote":
            processQuote(payload)
            break
          case "trade":
            processTrade(payload)
            break
          case "event":
            processEvent(payload)
            break
          case "position":
            processPosition(payload)
            break
          case "theoreticalPrice":
            processTheoretical(payload)
            break
          default:
            break
        }
        const snapshot = snapshotsRef.current.get(payload.instrumentId)
        if (snapshot?.basisBps !== null && snapshot?.basisBps !== undefined) {
          processedBasisValues.push(snapshot.basisBps)
        }
      })
      if (processedBasisValues.length) {
        const averageBasis =
          processedBasisValues.reduce((acc, value) => acc + value, 0) /
          processedBasisValues.length
        basisHistoryRef.current = clampArray(
          [averageBasis, ...basisHistoryRef.current],
          HISTORY_LENGTH,
        )
        emitMetrics()
      }
    },
    [emitMetrics, processEvent, processPosition, processQuote, processTheoretical, processTrade],
  )

  const clearMockIntervals = useCallback(() => {
    mockIntervalsRef.current.forEach((interval) => clearInterval(interval))
    mockIntervalsRef.current = []
  }, [])

  const startMockFeed = useCallback(() => {
    if (mockIntervalsRef.current.length) {
      return
    }
    setConnectionState("mock")
    const tick = () => {
      if (isPausedRef.current) return
      MOCK_SYMBOLS.forEach((symbolConfig) => {
        const now = Date.now()
        const existing = snapshotsRef.current.get(symbolConfig.instrumentId)
        const baseCash = existing?.cashMid ?? symbolConfig.baseCash
        const baseFutures = existing?.futuresMid ?? symbolConfig.baseFutures
        const cashDrift = (Math.random() - 0.5) * 0.4
        const futuresDrift = (Math.random() - 0.5) * 0.35
        const cashMid = baseCash * (1 + cashDrift / 100)
        const futuresMid = baseFutures * (1 + futuresDrift / 100)
        const spread = Math.max(0.01, Math.abs(cashMid) * 0.0004)
        const futureSpread = Math.max(0.01, Math.abs(futuresMid) * 0.00035)

        const quoteCash: QuotePayload = {
          type: "quote",
          instrumentId: symbolConfig.instrumentId,
          symbol: symbolConfig.symbol,
          leg: "cash",
          bid: Number((cashMid - spread / 2).toFixed(4)),
          ask: Number((cashMid + spread / 2).toFixed(4)),
          timestamp: now,
        }
        const quoteFutures: QuotePayload = {
          type: "quote",
          instrumentId: symbolConfig.instrumentId,
          symbol: symbolConfig.symbol,
          leg: "futures",
          bid: Number((futuresMid - futureSpread / 2).toFixed(4)),
          ask: Number((futuresMid + futureSpread / 2).toFixed(4)),
          timestamp: now,
        }
        handleMessage([quoteCash, quoteFutures])

        if (Math.random() > 0.7) {
          const trade: TradePayload = {
            type: "trade",
            instrumentId: symbolConfig.instrumentId,
            symbol: symbolConfig.symbol,
            leg: Math.random() > 0.5 ? "cash" : "futures",
            price: Number((futuresMid + (Math.random() - 0.5) * 0.1).toFixed(4)),
            size: Math.floor(Math.random() * 35 + 5),
            side: Math.random() > 0.5 ? "buy" : "sell",
            venue: "SIM",
            timestamp: now + 5,
          }
          handleMessage(trade)
        }

        if (Math.random() > 0.92) {
          const event: EventPayload = {
            type: "event",
            instrumentId: symbolConfig.instrumentId,
            symbol: symbolConfig.symbol,
            level: Math.random() > 0.5 ? "warning" : "info",
            message:
              Math.random() > 0.5
                ? "Repo funding tightened 2bps"
                : "Borrow inventory refreshed",
            timestamp: now + 10,
          }
          handleMessage(event)
        }

        const theoretical: TheoreticalPayload = {
          type: "theoreticalPrice",
          instrumentId: symbolConfig.instrumentId,
          symbol: symbolConfig.symbol,
          theoreticalBasisBps: Number((Math.random() * 6 - 3).toFixed(2)),
          theoreticalFutures: Number(
            (futuresMid + (Math.random() - 0.5) * 0.25).toFixed(4),
          ),
          timestamp: now + 15,
        }
        handleMessage(theoretical)

        const position: PositionPayload = {
          type: "position",
          instrumentId: symbolConfig.instrumentId,
          symbol: symbolConfig.symbol,
          book: symbolConfig.book,
          strategy: symbolConfig.strategy,
          cashPosition:
            (existing?.cashPosition ?? Math.floor(Math.random() * 30 - 15)) +
            Math.floor(Math.random() * 4 - 2),
          futuresPosition:
            (existing?.futuresPosition ?? Math.floor(Math.random() * 30 - 15)) +
            Math.floor(Math.random() * 3 - 1),
          carry: Number((Math.random() * 2500 - 1250).toFixed(2)),
          autoHedge:
            existing
              ? positionsRef.current.get(
                  `${symbolConfig.book}:${symbolConfig.strategy}:${symbolConfig.instrumentId}`,
                )?.autoHedge ?? false
              : Math.random() > 0.5,
          timestamp: now + 20,
        }
        handleMessage(position)
      })
    }

    const interval = setInterval(tick, 1500)
    mockIntervalsRef.current.push(interval)
    tick()
  }, [handleMessage])

  const stopMockFeed = useCallback(() => {
    clearMockIntervals()
  }, [clearMockIntervals])

  const connectSocket = useCallback(() => {
    const socket = openDelta1BasisSocket()
    if (!socket) {
      startMockFeed()
      return
    }
    try {
      setConnectionState("connecting")
      socketRef.current = socket

      socket.onopen = () => {
        stopMockFeed()
        setConnectionState("open")
      }

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as BasisMessage
          handleMessage(data)
        } catch (error) {
          console.error("Failed to parse delta1 basis message", error)
        }
      }

      socket.onerror = () => {
        socket.close()
      }

      socket.onclose = () => {
        if (!isMountedRef.current) {
          return
        }
        setConnectionState((current) =>
          current === "mock" ? current : "closed",
        )
        stopMockFeed()
        reconnectTimerRef.current = setTimeout(() => {
          connectSocket()
        }, 4000)
      }
    } catch (error) {
      console.error("Failed to connect websocket", error)
      startMockFeed()
    }
  }, [handleMessage, startMockFeed, stopMockFeed])

  useEffect(() => {
    if (typeof window === "undefined") {
      setConnectionState("mock")
      return
    }
    isMountedRef.current = true
    connectSocket()
    return () => {
      isMountedRef.current = false
      socketRef.current?.close()
      socketRef.current = null
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current)
        reconnectTimerRef.current = null
      }
      stopMockFeed()
    }
  }, [connectSocket, stopMockFeed])

  const pause = useCallback(() => {
    setIsPaused(true)
    isPausedRef.current = true
  }, [])

  const resume = useCallback(() => {
    setIsPaused(false)
    isPausedRef.current = false
    if (connectionState === "closed") {
      connectSocket()
    }
  }, [connectSocket, connectionState])

  const reset = useCallback(() => {
    snapshotsRef.current.clear()
    positionsRef.current.clear()
    basisHistoryRef.current = []
    latencyHistoryRef.current = []
    metricsHistoryRef.current = []
    setTradeTape([])
    setEventTape([])
    setMetrics({ basisVolatility: 0, avgLatencyMs: 0, updatedAt: Date.now() })
    setMetricsHistory([])
    setVersion((value) => value + 1)
  }, [])

  useEffect(() => {
    isPausedRef.current = isPaused
    if (isPaused) {
      stopMockFeed()
    } else if (connectionState === "mock") {
      startMockFeed()
    }
  }, [connectionState, isPaused, startMockFeed, stopMockFeed])

  const snapshots = useMemo(() => {
    void version
    return Array.from(snapshotsRef.current.values()).sort((a, b) =>
      a.symbol.localeCompare(b.symbol),
    )
  }, [version])

  const positionStack = useMemo(() => {
    void version
    return Array.from(positionsRef.current.values()).sort(
      (a, b) => b.lastUpdated - a.lastUpdated,
    )
  }, [version])

  return {
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
  }
}
