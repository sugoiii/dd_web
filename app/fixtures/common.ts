export const commonSheetSnapshot = {
  allocations: [
    { sleeve: "Core", target: "50%", actual: "49%", drift: "-1%" },
  ],
  limits: [{ limit: "Gross", value: "$1.0B", status: "Within" }],
}

export const holidaySeeds = [
  { month: 0, day: 1, label: "New Year's Day", region: "Global", impact: "Closed" },
  { month: 6, day: 4, label: "Independence Day", region: "US", impact: "Partial" },
  { month: 11, day: 25, label: "Christmas Day", region: "Global", impact: "Closed" },
]

export const departmentPnls = [
  { department: "Index Arbitrage", pnl: 1.08, planVariance: 0.18 },
  { department: "Systematic Macro", pnl: -0.32, planVariance: -0.1 },
  { department: "Options Desk", pnl: 0.52, planVariance: 0.08 },
]

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
]
