export const bookSnapshot = {
  priceRows: [{ symbol: "A005930", name: "삼성", type: "주식", price: 15000, price_theo: 15000, dividend: 100 }],
  positionRows: [{ symbol: "A005930", name: "삼성", type: "주식", quantity: 200, price: 15000, amount: 3000000 }],
};

export const holidaySeeds = [
  { month: 0, day: 1, label: "New Year's Day", region: "Global", impact: "Closed" },
  { month: 6, day: 4, label: "Independence Day", region: "US", impact: "Partial" },
  { month: 11, day: 25, label: "Christmas Day", region: "Global", impact: "Closed" },
];

export const departmentPnls = [
  { department: "Index Arbitrage", pnl: 1.08, planVariance: 0.18 },
  { department: "Systematic Macro", pnl: -0.32, planVariance: -0.1 },
  { department: "Options Desk", pnl: 0.52, planVariance: 0.08 },
];

export const usefulLinks = [
  {
    title: "Strategy Delta-1 Basis Monitor",
    href: "/strategy/delta1-basis",
    description: "Cash-futures basis oversight with automation controls.",
  },
  {
    title: "Strategy Realtime Management",
    href: "/strategy/realtime-management",
    description: "Central control tower for systematic allocation workflows.",
  },
];
