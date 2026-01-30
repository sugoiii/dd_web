import { createWebSocket } from "./client";
import {
  createMarketMonitorMockStream,
  type MarketMonitorFixtureMode,
  type MarketMonitorMockStream,
} from "~/fixtures/market-monitor";

export type MarketMonitorConnectionState = "connecting" | "open" | "closed" | "mock";

export type MarketMonitorStreamCommand = { type: "reconnect" } | { type: "snapshot" };

const mockFlag = import.meta.env.VITE_USE_MOCK_DATA;
export const isMarketMonitorMockEnabled = mockFlag === "true" || mockFlag === "1";

export type MarketMonitorStreamHandle = (WebSocket | MarketMonitorMockStream) & {
  send?: (data: string) => void;
};

export type MarketMonitorStreamMessage =
  | { type: "snapshot"; snapshot: unknown }
  | { type: "topOfBook"; rows: unknown }
  | { type: "derivBasis"; rows: unknown }
  | { type: "positions"; rows: unknown }
  | { type: "alerts"; rows: unknown }
  | { type: "control"; action: string };

export type MarketMonitorStreamListenerOptions = {
  onOpen?: () => void;
  onClose?: () => void;
  onError?: () => void;
  onMessage?: (payload: MarketMonitorStreamMessage) => void;
  onParseError?: (error: Error) => void;
};

export const connectMarketMonitorStream = (
  mode?: MarketMonitorFixtureMode,
): MarketMonitorStreamHandle => {
  if (isMarketMonitorMockEnabled) {
    return createMarketMonitorMockStream({ mode });
  }

  const wsUrl = import.meta.env.VITE_MARKET_MONITOR_WS_URL ?? "";
  if (!wsUrl) {
    return null;
  }

  return createWebSocket(wsUrl);
};

export const sendMarketMonitorCommand = (
  stream: MarketMonitorStreamHandle | null,
  command: MarketMonitorStreamCommand,
) => {
  if (!stream?.send) {
    return;
  }
  stream.send(JSON.stringify(command));
};

export const listenMarketMonitorStream = (
  stream: MarketMonitorStreamHandle | null,
  {
    onOpen,
    onClose,
    onError,
    onMessage,
    onParseError,
  }: MarketMonitorStreamListenerOptions,
): (() => void) => {
  if (!stream) {
    return () => undefined;
  }

  const handleOpen = () => onOpen?.();
  const handleClose = () => onClose?.();
  const handleError = () => onError?.();
  const handleMessage = (event: MessageEvent) => {
    let payload: unknown = null;
    try {
      payload = JSON.parse(event.data);
    } catch (err) {
      onParseError?.(err instanceof Error ? err : new Error("Unable to parse stream payload"));
      return;
    }
    if (!payload || typeof payload !== "object") {
      return;
    }
    onMessage?.(payload as MarketMonitorStreamMessage);
  };

  stream.addEventListener("open", handleOpen);
  stream.addEventListener("close", handleClose);
  stream.addEventListener("error", handleError);
  stream.addEventListener("message", handleMessage);

  return () => {
    stream.removeEventListener("open", handleOpen);
    stream.removeEventListener("close", handleClose);
    stream.removeEventListener("error", handleError);
    stream.removeEventListener("message", handleMessage);
  };
};
