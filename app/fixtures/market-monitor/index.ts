export type MarketMonitorFixtureMode = "standard" | "empty" | "outage";

const baseTimestamp = 1720000000000;

export const marketMonitorSnapshot = {
  topOfBookRows: [
    {
      symbol: "ESU4",
      venue: "CME",
      bid: 5198.25,
      bidSize: 42,
      ask: 5198.5,
      askSize: 38,
      updatedAt: baseTimestamp - 5000,
    },
    {
      symbol: "NQU4",
      venue: "CME",
      bid: 18210.0,
      bidSize: 20,
      ask: 18210.5,
      askSize: 18,
      updatedAt: baseTimestamp - 3200,
    },
    {
      symbol: "FGBL Sep24",
      venue: "Eurex",
      bid: 130.22,
      bidSize: 55,
      ask: 130.24,
      askSize: 50,
      updatedAt: baseTimestamp - 2500,
    },
  ],
  derivBasisRows: [
    {
      contract: "ESU4",
      spot: "S&P 500",
      futures: 5198.5,
      fairValue: 5196.25,
      basisBps: 4.2,
      expiry: "Sep 20",
    },
    {
      contract: "NQU4",
      spot: "Nasdaq 100",
      futures: 18210.5,
      fairValue: 18205.75,
      basisBps: 2.6,
      expiry: "Sep 20",
    },
    {
      contract: "FGBL Sep24",
      spot: "Bund",
      futures: 130.24,
      fairValue: 130.18,
      basisBps: -0.8,
      expiry: "Sep 10",
    },
  ],
  positionRows: [
    {
      strategy: "Equity Macro",
      symbol: "ESU4",
      net: 145,
      avgPx: 5192.1,
      unrealizedPnl: 128000,
      limitUtilization: 0.62,
    },
    {
      strategy: "Vol Systematic",
      symbol: "NQU4",
      net: -80,
      avgPx: 18222.5,
      unrealizedPnl: -54000,
      limitUtilization: 0.48,
    },
    {
      strategy: "Rates RV",
      symbol: "FGBL Sep24",
      net: 210,
      avgPx: 129.98,
      unrealizedPnl: 18400,
      limitUtilization: 0.71,
    },
  ],
  alertRows: [
    {
      time: baseTimestamp - 720000,
      level: "Medium",
      message: "Top of book widened beyond 2 ticks.",
      source: "ESU4",
      status: "Review",
    },
    {
      time: baseTimestamp - 480000,
      level: "High",
      message: "Basis divergence > 5 bps vs fair value.",
      source: "NQU4",
      status: "Investigate",
    },
    {
      time: baseTimestamp - 120000,
      level: "Low",
      message: "Position net shifted 15% from target.",
      source: "FGBL Sep24",
      status: "Monitor",
    },
  ],
};

export const marketMonitorEmptySnapshot = {
  topOfBookRows: [],
  derivBasisRows: [],
  positionRows: [],
  alertRows: [],
};

const marketMonitorStreamUpdates = [
  {
    type: "topOfBook",
    rows: [
      {
        symbol: "ESU4",
        bid: 5198.0,
        bidSize: 48,
        ask: 5198.25,
        askSize: 40,
        updatedAt: baseTimestamp + 12000,
      },
    ],
  },
  {
    type: "derivBasis",
    rows: [
      {
        contract: "NQU4",
        futures: 18211.25,
        fairValue: 18206.5,
        basisBps: 2.9,
        expiry: "Sep 20",
      },
    ],
  },
  {
    type: "positions",
    rows: [
      {
        strategy: "Equity Macro",
        symbol: "ESU4",
        net: 152,
        unrealizedPnl: 132800,
        limitUtilization: 0.65,
      },
    ],
  },
  {
    type: "alerts",
    rows: [
      {
        time: baseTimestamp + 180000,
        level: "High",
        message: "Alert volume spike from CME venues.",
        source: "ESU4",
        status: "Investigate",
      },
    ],
  },
];

export const getMarketMonitorSnapshotFixture = (mode: MarketMonitorFixtureMode = "standard") => {
  if (mode === "empty") {
    return marketMonitorEmptySnapshot;
  }

  return marketMonitorSnapshot;
};

type MarketMonitorListener = (event: Event) => void;

export type MarketMonitorMockStream = {
  addEventListener: (type: "open" | "message" | "close" | "error", listener: MarketMonitorListener) => void;
  removeEventListener: (type: "open" | "message" | "close" | "error", listener: MarketMonitorListener) => void;
  close: () => void;
  send: (data: string) => void;
  readyState: number;
};

export const createMarketMonitorMockStream = ({
  mode = "standard",
  intervalMs = 2400,
}: {
  mode?: MarketMonitorFixtureMode;
  intervalMs?: number;
}): MarketMonitorMockStream | null => {
  if (mode === "outage") {
    return null;
  }

  const updates = mode === "empty" ? [] : marketMonitorStreamUpdates;
  const listeners: Record<string, Set<MarketMonitorListener>> = {
    open: new Set(),
    message: new Set(),
    close: new Set(),
    error: new Set(),
  };

  let isClosed = false;
  let messageIndex = 0;
  let intervalId: number | null = null;

  const emit = (type: "open" | "message" | "close" | "error", event: Event) => {
    listeners[type].forEach((listener) => listener(event));
  };

  const sendSnapshot = () => {
    if (isClosed) {
      return;
    }
    const snapshotPayload = {
      type: "snapshot",
      snapshot: getMarketMonitorSnapshotFixture(mode),
    };
    emit("message", new MessageEvent("message", { data: JSON.stringify(snapshotPayload) }));
  };

  const start = () => {
    if (!updates.length) {
      return;
    }

    intervalId = window.setInterval(() => {
      if (isClosed) {
        return;
      }

      const payload = updates[messageIndex];
      messageIndex = (messageIndex + 1) % updates.length;
      emit("message", new MessageEvent("message", { data: JSON.stringify(payload) }));
    }, intervalMs);
  };

  window.setTimeout(() => {
    if (isClosed) {
      return;
    }
    emit("open", new Event("open"));
    sendSnapshot();
    start();
  }, 0);

  return {
    readyState: 1,
    addEventListener(type, listener) {
      listeners[type].add(listener);
    },
    removeEventListener(type, listener) {
      listeners[type].delete(listener);
    },
    close() {
      if (isClosed) {
        return;
      }
      isClosed = true;
      if (intervalId !== null) {
        window.clearInterval(intervalId);
      }
      emit("close", new CloseEvent("close"));
    },
    send(data) {
      let payload: unknown = null;
      try {
        payload = JSON.parse(data);
      } catch (err) {
        emit("error", new Event("error"));
        return;
      }
      if (!payload || typeof payload !== "object") {
        return;
      }
      const message = payload as { type?: string };
      if (message.type === "reconnect" || message.type === "snapshot") {
        sendSnapshot();
      }
    },
  };
};
