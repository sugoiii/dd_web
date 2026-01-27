import { format } from "date-fns";
import { createWebSocket, getApiBaseUrl } from "./client"


export type PriceRow = {
  symbol: string
  name: string
  type: string
  price: number
  price_theo: number
  dividend: number
}

export type PositionRow = {
  symbol: string
  name: string
  type: string
  quantity: number
  price: number
  amount: number
}

export type BookSnapshot = {
  priceRows: PriceRow[]
  positionRows: PositionRow[]
}

export type BookSnapshotParams = {
  asOfDate?: Date
  fund?: string
}

export type SheetConnectionState = "connecting" | "open" | "closed" | "mock"

export type BookStreamMessage =
  | {
      type: "snapshot"
      priceRows: PriceRow[]
      positionRows: PositionRow[]
    }
  | {
      type: "price"
      row: PriceRow
    }
  | {
      type: "position"
      row: PositionRow
    }
  | {
      prices?: PriceRow[]
      positions?: PositionRow[]
    }

export const fetchSheetSnapshot = async (
  params: BookSnapshotParams = {},
): Promise<BookSnapshot> => {
  const baseUrl = getApiBaseUrl()
  if (!baseUrl) {
    throw new Error("API base URL is not configured")
  }

  const url = new URL("/common/sheet-snapshot", baseUrl)
  if (params.asOfDate) {
    url.searchParams.set("as_of_date", format(params.asOfDate, "yyyy-MM-dd"));
  }
  if (params.fund) {
    url.searchParams.set("fund", params.fund)
  }

  const response = await fetch(url.toString())
  if (!response.ok) {
    throw new Error("Failed to fetch sheet snapshot")
  }

  return (await response.json()) as BookSnapshot
}

export const openSheetSocket = () => {
  const wsUrl = import.meta.env.VITE_COMMON_SHEET_WS_URL ?? ""
  if (!wsUrl) {
    return null
  }
  return createWebSocket(wsUrl)
}
