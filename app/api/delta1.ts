import { createWebSocket, getDelta1BasisWsUrl } from "./client"

export type ConnectionState = "connecting" | "open" | "closed" | "mock"

export type LegType = "cash" | "futures"

export type QuotePayload = {
  type: "quote"
  instrumentId: string
  symbol?: string
  leg: LegType
  bid: number | null
  ask: number | null
  timestamp: number
}

export type TradePayload = {
  type: "trade"
  instrumentId: string
  symbol?: string
  leg: LegType
  price: number
  size: number
  side: "buy" | "sell"
  venue?: string
  id?: string
  timestamp: number
}

export type EventPayload = {
  type: "event"
  instrumentId: string
  symbol?: string
  level: "info" | "warning" | "critical"
  message: string
  timestamp: number
}

export type PositionPayload = {
  type: "position"
  instrumentId: string
  symbol?: string
  book: string
  strategy: string
  cashPosition: number
  futuresPosition: number
  carry: number
  autoHedge?: boolean
  timestamp: number
}

export type TheoreticalPayload = {
  type: "theoreticalPrice"
  instrumentId: string
  symbol?: string
  theoreticalBasisBps: number
  theoreticalFutures: number
  timestamp: number
}

export type SocketMessage =
  | QuotePayload
  | TradePayload
  | EventPayload
  | PositionPayload
  | TheoreticalPayload

export type BasisMessage = SocketMessage | SocketMessage[]

export const openDelta1BasisSocket = () => {
  const wsUrl = getDelta1BasisWsUrl()
  if (!wsUrl) {
    return null
  }
  return createWebSocket(wsUrl)
}
