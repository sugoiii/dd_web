import { useCallback, useEffect, useMemo, useState } from "react"

import {
  fetchSheetSnapshot,
  isMockDataEnabled,
  openSheetSocket,
  type PositionRow,
  type PriceRow,
  type SheetConnectionState,
  type BookSnapshot,
  type BookSnapshotParams,
  type BookStreamMessage,
} from "../api/common"

export type BookSnapshotRequestState = {
  priceRows: PriceRow[]
  positionRows: PositionRow[]
  isLoading: boolean
  error: string | null
  connectionState: SheetConnectionState
  refresh: () => void
}

const mergeRows = <T extends Record<string, string|number>>(
  existing: T[],
  updates: T[],
  key: keyof T,
): T[] => {
  if (!updates.length) {
    return existing
  }

  const map = new Map(existing.map((row) => [row[key], row]))
  updates.forEach((update) => {
    const previous = map.get(update[key])
    map.set(update[key], previous ? { ...previous, ...update } : update)
  })

  return Array.from(map.values())
}

const normalizeSnapshot = (snapshot: BookSnapshot): BookSnapshot => ({
  priceRows: snapshot.priceRows ?? [],
  positionRows: snapshot.positionRows ?? [],
})

const parseStreamMessage = (payload: unknown): BookStreamMessage | null => {
  if (!payload || typeof payload !== "object") {
    return null
  }

  return payload as BookStreamMessage
}

export const useBookSnapshotRequest = (
  params: BookSnapshotParams & { enableStream?: boolean } = {},
): BookSnapshotRequestState => {
  const { enableStream = true, asOfDate, fund } = params
  const [priceRows, setPriceRows] = useState<PriceRow[]>([])
  const [positionRows, setPositionRows] = useState<PositionRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [connectionState, setConnectionState] = useState<SheetConnectionState>(
    "closed",
  )
  const [refreshIndex, setRefreshIndex] = useState(0)

  const refresh = useCallback(() => {
    setRefreshIndex((current) => current + 1)
  }, [])

  useEffect(() => {
    let isActive = true

    const load = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const snapshot = normalizeSnapshot(
          await fetchSheetSnapshot({ asOfDate, fund }),
        )
        if (!isActive) {
          return
        }
        setPriceRows(snapshot.priceRows)
        setPositionRows(snapshot.positionRows)
      } catch (err) {
        if (!isActive) {
          return
        }
        setError(err instanceof Error ? err.message : "Unable to load data")
        setPriceRows([])
        setPositionRows([])
      } finally {
        if (isActive) {
          setIsLoading(false)
        }
      }
    }

    load()

    return () => {
      isActive = false
    }
  }, [asOfDate, fund, refreshIndex])

  useEffect(() => {
    if (!enableStream) {
      setConnectionState("closed")
      return
    }

    const socket = openSheetSocket()
    if (!socket) {
      setConnectionState(isMockDataEnabled ? "mock" : "closed")
      return
    }

    setConnectionState("connecting")

    const handleSnapshot = (snapshot: BookSnapshot) => {
      const normalized = normalizeSnapshot(snapshot)
      setPriceRows(normalized.priceRows)
      setPositionRows(normalized.positionRows)
    }

    const handlePriceUpdate = (rows: PriceRow[]) => {
      setPriceRows((current) => mergeRows(current, rows, "symbol"))
    }

    const handlePositionUpdate = (rows: PositionRow[]) => {
      setPositionRows((current) => mergeRows(current, rows, "symbol"))
    }

    socket.addEventListener("open", () => setConnectionState("open"))
    socket.addEventListener("close", () => setConnectionState("closed"))
    socket.addEventListener("error", () => {
      setConnectionState("closed")
      setError("Sheet stream error")
    })
    socket.addEventListener("message", (event) => {
      let payload: unknown = null
      try {
        payload = JSON.parse(event.data)
      } catch (err) {
        setError("Sheet stream parse error")
        return
      }

      const message = parseStreamMessage(payload)
      if (!message) {
        return
      }

      if ("type" in message) {
        if (message.type === "snapshot") {
          handleSnapshot(message)
          return
        }
        if (message.type === "price") {
          handlePriceUpdate([message.row])
          return
        }
        if (message.type === "position") {
          handlePositionUpdate([message.row])
          return
        }
      }

      if (message.prices) {
        handlePriceUpdate(message.prices)
      }
      if (message.positions) {
        handlePositionUpdate(message.positions)
      }
    })

    return () => {
      socket.close()
    }
  }, [enableStream])

  return useMemo(
    () => ({
      priceRows,
      positionRows,
      isLoading,
      error,
      connectionState,
      refresh,
    }),
    [priceRows, positionRows, connectionState, error, isLoading, refresh],
  )
}
