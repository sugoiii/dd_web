import { useEffect, useMemo, useState } from "react"

import {
  demoSheetSnapshot,
  fetchSheetSnapshot,
  openSheetSocket,
  type AllocationRow,
  type LimitRow,
  type SheetConnectionState,
  type SheetSnapshot,
  type SheetSnapshotParams,
  type SheetStreamMessage,
} from "../api/common"

export type CommonSheetRequestState = {
  allocationRows: AllocationRow[]
  limitRows: LimitRow[]
  isLoading: boolean
  error: string | null
  connectionState: SheetConnectionState
}

const mergeRows = <T extends Record<string, string>>(
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

const normalizeSnapshot = (snapshot: SheetSnapshot): SheetSnapshot => ({
  allocations: snapshot.allocations ?? demoSheetSnapshot.allocations,
  limits: snapshot.limits ?? demoSheetSnapshot.limits,
})

const parseStreamMessage = (payload: unknown): SheetStreamMessage | null => {
  if (!payload || typeof payload !== "object") {
    return null
  }

  return payload as SheetStreamMessage
}

export const useCommonSheetRequest = (
  params: SheetSnapshotParams & { enableStream?: boolean } = {},
): CommonSheetRequestState => {
  const { enableStream = true, view } = params
  const [allocationRows, setAllocationRows] = useState<AllocationRow[]>(
    demoSheetSnapshot.allocations,
  )
  const [limitRows, setLimitRows] = useState<LimitRow[]>(
    demoSheetSnapshot.limits,
  )
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [connectionState, setConnectionState] = useState<SheetConnectionState>(
    "closed",
  )

  useEffect(() => {
    let isActive = true

    const load = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const snapshot = normalizeSnapshot(
          await fetchSheetSnapshot({ view }),
        )
        if (!isActive) {
          return
        }
        setAllocationRows(snapshot.allocations)
        setLimitRows(snapshot.limits)
      } catch (err) {
        if (!isActive) {
          return
        }
        setError(err instanceof Error ? err.message : "Unable to load data")
        setAllocationRows(demoSheetSnapshot.allocations)
        setLimitRows(demoSheetSnapshot.limits)
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
  }, [view])

  useEffect(() => {
    if (!enableStream) {
      setConnectionState("closed")
      return
    }

    const socket = openSheetSocket()
    if (!socket) {
      setConnectionState("mock")
      return
    }

    setConnectionState("connecting")

    const handleSnapshot = (snapshot: SheetSnapshot) => {
      const normalized = normalizeSnapshot(snapshot)
      setAllocationRows(normalized.allocations)
      setLimitRows(normalized.limits)
    }

    const handleAllocationUpdate = (rows: AllocationRow[]) => {
      setAllocationRows((current) => mergeRows(current, rows, "sleeve"))
    }

    const handleLimitUpdate = (rows: LimitRow[]) => {
      setLimitRows((current) => mergeRows(current, rows, "limit"))
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
        if (message.type === "allocation") {
          handleAllocationUpdate([message.row])
          return
        }
        if (message.type === "limit") {
          handleLimitUpdate([message.row])
          return
        }
      }

      if (message.allocations) {
        handleAllocationUpdate(message.allocations)
      }
      if (message.limits) {
        handleLimitUpdate(message.limits)
      }
    })

    return () => {
      socket.close()
    }
  }, [enableStream])

  return useMemo(
    () => ({
      allocationRows,
      limitRows,
      isLoading,
      error,
      connectionState,
    }),
    [allocationRows, connectionState, error, isLoading, limitRows],
  )
}
