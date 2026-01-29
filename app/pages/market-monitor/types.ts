export type TopOfBookRow = {
  symbol: string;
  venue: string;
  bid: number;
  bidSize: number;
  ask: number;
  askSize: number;
  updatedAt: number;
};

export type DerivBasisRow = {
  contract: string;
  spot: string;
  futures: number;
  fairValue: number;
  basisBps: number;
  expiry: string;
};

export type PositionRow = {
  strategy: string;
  symbol: string;
  net: number;
  avgPx: number;
  unrealizedPnl: number;
  limitUtilization: number;
};

export type AlertRow = {
  time: number;
  level: string;
  message: string;
  source: string;
  status: string;
};
