import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  connectMarketMonitorStream,
  isMarketMonitorMockEnabled,
  listenMarketMonitorStream,
  sendMarketMonitorCommand,
  type MarketMonitorConnectionState,
  type MarketMonitorStreamMessage,
} from "~/api/market-monitor";
import type { MarketMonitorFixtureMode } from "~/fixtures/market-monitor";
import type { AlertRow, DerivBasisRow, PositionRow, TopOfBookRow } from "~/pages/market-monitor/types";

type MarketMonitorSnapshot = {
  topOfBookRows: TopOfBookRow[];
  derivBasisRows: DerivBasisRow[];
  positionRows: PositionRow[];
  alertRows: AlertRow[];
};

type MarketMonitorStreamState = {
  topOfBookRows: TopOfBookRow[];
  derivBasisRows: DerivBasisRow[];
  positionRows: PositionRow[];
  alertRows: AlertRow[];
  isLoading: boolean;
  error: string | null;
  connectionState: MarketMonitorConnectionState;
  refresh: () => void;
};

const mergeRowsBy = <T,>(existing: T[], updates: T[], getKey: (row: T) => string): T[] => {
  if (!updates.length) {
    return existing;
  }

  const map = new Map(existing.map((row) => [getKey(row), row]));
  updates.forEach((update) => {
    const key = getKey(update);
    const previous = map.get(key);
    map.set(key, previous ? { ...previous, ...update } : update);
  });

  return Array.from(map.values());
};

const normalizeSnapshot = (snapshot: unknown): MarketMonitorSnapshot => {
  const payload = snapshot && typeof snapshot === "object" ? (snapshot as Partial<MarketMonitorSnapshot>) : {};

  return {
    topOfBookRows: Array.isArray(payload.topOfBookRows) ? payload.topOfBookRows : [],
    derivBasisRows: Array.isArray(payload.derivBasisRows) ? payload.derivBasisRows : [],
    positionRows: Array.isArray(payload.positionRows) ? payload.positionRows : [],
    alertRows: Array.isArray(payload.alertRows) ? payload.alertRows : [],
  };
};

const parseStreamMessage = (payload: unknown): MarketMonitorStreamMessage | null => {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  return payload as MarketMonitorStreamMessage;
};

const normalizeRows = <T,>(rows: unknown): T[] => (Array.isArray(rows) ? (rows as T[]) : []);

export const useMarketMonitorStream = ({
  mode = "standard",
  enableStream = true,
}: {
  mode?: MarketMonitorFixtureMode;
  enableStream?: boolean;
} = {}): MarketMonitorStreamState => {
  const [topOfBookRows, setTopOfBookRows] = useState<TopOfBookRow[]>([]);
  const [derivBasisRows, setDerivBasisRows] = useState<DerivBasisRow[]>([]);
  const [positionRows, setPositionRows] = useState<PositionRow[]>([]);
  const [alertRows, setAlertRows] = useState<AlertRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connectionState, setConnectionState] = useState<MarketMonitorConnectionState>("closed");
  const streamRef = useRef<ReturnType<typeof connectMarketMonitorStream> | null>(null);

  const refresh = useCallback(() => {
    if (streamRef.current) {
      sendMarketMonitorCommand(streamRef.current, { type: "reconnect" });
    }
  }, []);

  useEffect(() => {
    if (!enableStream || mode === "outage") {
      setConnectionState("closed");
      setIsLoading(false);
      return;
    }

    const stream = connectMarketMonitorStream(mode);
    if (!stream) {
      setConnectionState(isMarketMonitorMockEnabled ? "mock" : "closed");
      setIsLoading(false);
      return;
    }

    streamRef.current = stream;
    setConnectionState(isMarketMonitorMockEnabled ? "mock" : "connecting");
    setIsLoading(true);

    const handleSnapshot = (snapshot: MarketMonitorSnapshot) => {
      const normalized = normalizeSnapshot(snapshot);
      setTopOfBookRows(normalized.topOfBookRows);
      setDerivBasisRows(normalized.derivBasisRows);
      setPositionRows(normalized.positionRows);
      setAlertRows(normalized.alertRows);
      setIsLoading(false);
    };

    const handleTopOfBookUpdate = (rows: TopOfBookRow[]) => {
      setTopOfBookRows((current) => mergeRowsBy(current, rows, (row) => row.symbol));
    };

    const handleBasisUpdate = (rows: DerivBasisRow[]) => {
      setDerivBasisRows((current) => mergeRowsBy(current, rows, (row) => row.contract));
    };

    const handlePositionUpdate = (rows: PositionRow[]) => {
      setPositionRows((current) =>
        mergeRowsBy(current, rows, (row) => `${row.strategy}-${row.symbol}`),
      );
    };

    const handleAlertUpdate = (rows: AlertRow[]) => {
      setAlertRows((current) =>
        mergeRowsBy(current, rows, (row) => `${row.time}-${row.source}`),
      );
    };

    const unsubscribe = listenMarketMonitorStream(stream, {
      onOpen: () => {
        if (!isMarketMonitorMockEnabled) {
          setConnectionState("open");
        }
        sendMarketMonitorCommand(stream, { type: "snapshot" });
      },
      onClose: () => setConnectionState("closed"),
      onError: () => {
        setConnectionState("closed");
        setError("Market monitor stream error");
        setIsLoading(false);
      },
      onParseError: () => {
        setError("Market monitor stream parse error");
        setIsLoading(false);
      },
      onMessage: (payload) => {
        const message = parseStreamMessage(payload);
        if (!message) {
          return;
        }

        if (message.type === "snapshot") {
          handleSnapshot(normalizeSnapshot(message.snapshot));
        } else if (message.type === "topOfBook") {
          handleTopOfBookUpdate(normalizeRows<TopOfBookRow>(message.rows));
        } else if (message.type === "derivBasis") {
          handleBasisUpdate(normalizeRows<DerivBasisRow>(message.rows));
        } else if (message.type === "positions") {
          handlePositionUpdate(normalizeRows<PositionRow>(message.rows));
        } else if (message.type === "alerts") {
          handleAlertUpdate(normalizeRows<AlertRow>(message.rows));
        } else if (message.type === "control") {
          setError(`Market monitor control: ${message.action}`);
          setIsLoading(false);
        }
      },
    });

    return () => {
      unsubscribe();
      stream.close();
      streamRef.current = null;
    };
  }, [enableStream, mode]);

  return useMemo(
    () => ({
      topOfBookRows,
      derivBasisRows,
      positionRows,
      alertRows,
      isLoading,
      error,
      connectionState,
      refresh,
    }),
    [topOfBookRows, derivBasisRows, positionRows, alertRows, isLoading, error, connectionState, refresh],
  );
};
