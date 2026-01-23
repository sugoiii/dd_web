import { createWebSocket, getApiBaseUrl } from "./client"

export type AllocationRow = {
  sleeve: string
  target: string
  actual: string
  drift: string
}

export type LimitRow = {
  limit: string
  value: string
  status: string
}

export type SheetSnapshot = {
  allocations: AllocationRow[]
  limits: LimitRow[]
}

export type SheetSnapshotParams = {
  view?: string
  scope?: string
  asOf?: string
}

export type SheetConnectionState = "connecting" | "open" | "closed" | "mock"

export type SheetStreamMessage =
  | {
      type: "snapshot"
      allocations: AllocationRow[]
      limits: LimitRow[]
    }
  | {
      type: "allocation"
      row: AllocationRow
    }
  | {
      type: "limit"
      row: LimitRow
    }
  | {
      allocations?: AllocationRow[]
      limits?: LimitRow[]
    }

export const fetchSheetSnapshot = async (
  params: SheetSnapshotParams = {},
): Promise<SheetSnapshot> => {
  const baseUrl = getApiBaseUrl()
  if (!baseUrl) {
    throw new Error("API base URL is not configured")
  }

  const url = new URL("/common/sheet-snapshot", baseUrl)
  if (params.view) {
    url.searchParams.set("view", params.view)
  }
  if (params.scope) {
    url.searchParams.set("scope", params.scope)
  }
  if (params.asOf) {
    url.searchParams.set("asOf", params.asOf)
  }

  const response = await fetch(url.toString())
  if (!response.ok) {
    throw new Error("Failed to fetch sheet snapshot")
  }

  return (await response.json()) as SheetSnapshot
}

export const openSheetSocket = () => {
  const wsUrl = import.meta.env.VITE_COMMON_SHEET_WS_URL ?? ""
  if (!wsUrl) {
    return null
  }
  return createWebSocket(wsUrl)
}
