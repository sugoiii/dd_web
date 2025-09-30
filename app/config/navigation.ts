import type { LucideIcon } from "lucide-react";
import {
  Activity,
  BarChart3,
  CandlestickChart,
  Boxes,
  Briefcase,
  FileText,
  LayoutDashboard,
  LineChart,
  Settings2,
  ShieldCheck,
  SlidersHorizontal,
  Users,
  Workflow,
} from "lucide-react";

export type NavItem = {
  title: string;
  key: string;
  path?: string;
  icon?: LucideIcon;
  description?: string;
  children?: NavItem[];
};

export const navigationItems: NavItem[] = [
  {
    title: "Desk Dashboard",
    key: "dashboard",
    path: "/",
    icon: LayoutDashboard,
    description: "Unified landing page for desk metrics and updates.",
  },
  {
    title: "Management",
    key: "management",
    icon: Briefcase,
    description: "Control oversight, reconciliation tooling, and policy reviews.",
    children: [
      {
        title: "Oversight Dashboard",
        key: "management-overview",
        path: "/management",
        description: "Daily certification status across reconciliation scopes.",
      },
      {
        title: "Cash Control",
        key: "management-cash-control",
        path: "/management/cash-control",
        description: "Book vs bank breaks, liquidity buffer, and feed health.",
      },
      {
        title: "Fees & Adjustments",
        key: "management-fees-adjustments",
        path: "/management/fees-adjustments",
        description: "Non-trade cost approvals and exception handling.",
      },
      {
        title: "Middle-Level P&L",
        key: "management-middle-level-pnl",
        path: "/management/middle-level-pnl",
        description: "Team roll-up with fund drilldowns and constituent drivers.",
      },
      {
        title: "Reconciliation Workbench",
        key: "management-reconciliation-workbench",
        path: "/management/reconciliation-workbench",
        description: "Break triage workspace with ownership workflow.",
      },
      {
        title: "Valuation Oversight",
        key: "management-valuation-oversight",
        path: "/management/valuation-oversight",
        description: "Model reserves, calibration tasks, and sign-off cadence.",
      },
    ],
  },
  {
    title: "ETN",
    key: "etn",
    icon: LineChart,
    description: "Monitor ETN products, exposures, and intraday performance.",
    children: [
      {
        title: "Overview",
        key: "etn-overview",
        path: "/etn",
        icon: BarChart3,
        description: "Summary of exposure, hedges, and coverage ratios.",
      },
      {
        title: "P&L Summary",
        key: "etn-pnl",
        path: "/etn/pnl",
        icon: LineChart,
        description: "Attribution of daily P&L and scenario projections.",
      },
      {
        title: "Realtime Monitor",
        key: "etn-realtime",
        path: "/etn/realtime",
        icon: Activity,
        description: "Streaming quotes and alerts for the ETN book.",
      },
      {
        title: "Holdings",
        key: "etn-holdings",
        path: "/etn/holdings",
        icon: Boxes,
        description: "Constituent holdings and rebalance planning.",
      },
    ],
  },
  {
    title: "Research",
    key: "research",
    icon: FileText,
    description: "Market intelligence and systematic studies.",
    children: [
      {
        title: "Market Overview",
        key: "research-market-overview",
        path: "/research/market-overview",
        icon: BarChart3,
        description: "Daily narrative across macro and factor themes.",
      },
      {
        title: "Signal Library",
        key: "research-signals",
        path: "/research/signals",
        icon: Workflow,
        description: "Prototype trading signals with model diagnostics.",
      },
    ],
  },
  {
    title: "Operations",
    key: "operations",
    icon: Settings2,
    description: "Desk governance, workflows, and controls.",
    children: [
      {
        title: "Risk Controls",
        key: "operations-risk",
        path: "/operations/risk",
        icon: ShieldCheck,
        description: "Limit monitoring and breach escalation paths.",
      },
      {
        title: "Trade Blotter",
        key: "operations-blotter",
        path: "/operations/blotter",
        icon: FileText,
        description: "Intraday trade capture and allocations.",
      },
      {
        title: "Team Management",
        key: "operations-team",
        path: "/operations/team",
        icon: Users,
        description: "User access, roles, and coverage scheduling.",
      },
      {
        title: "Preferences",
        key: "operations-preferences",
        path: "/operations/preferences",
        icon: SlidersHorizontal,
        description: "Workspace customization and notification rules.",
      },
    ],
  },
  {
    title: "Options Trading",
    key: "options-trading",
    icon: CandlestickChart,
    description: "Integrated visibility into option risk, surfaces, and execution.",
    children: [
      {
        title: "Live Monitor",
        key: "options-trading-live-monitor",
        path: "/options/realtime",
        icon: Activity,
        description: "One-view dashboard for Greeks, flows, and hedges.",
      },
      {
        title: "Risk Dashboard",
        key: "options-trading-risk-dashboard",
        path: "/options/risk-dashboard",
        icon: ShieldCheck,
        description: "Limit usage, stress paths, and mitigation workflow.",
      },
      {
        title: "Strategy Lab",
        key: "options-trading-strategy-lab",
        path: "/options/strategy-lab",
        icon: Workflow,
        description: "Scenario testing and structuring workspace for the desk.",
      },
    ],
  },
  {
    title: "Realtime Monitoring",
    key: "realtime-monitoring",
    icon: Activity,
    description:
      "Equity options command center to track each underlying's live state.",
    children: [
      {
        title: "Underlying Pulse",
        key: "realtime-monitoring-underlying-pulse",
        path: "/realtime-monitoring",
        icon: Activity,
        description:
          "Live quotes, Greeks, and market microstructure per core underlying.",
      },
      {
        title: "Volatility Surface",
        key: "realtime-monitoring-vol-surface",
        path: "/realtime-monitoring/volatility-surface",
        icon: LineChart,
        description:
          "Surface shifts, skew tracking, and realized vs implied dispersion.",
      },
      {
        title: "Order Flow Radar",
        key: "realtime-monitoring-order-flow",
        path: "/realtime-monitoring/order-flow",
        icon: Workflow,
        description:
          "Sweep detection, block tape, and liquidity tiers across venues.",
      },
      {
        title: "Risk & Alerts",
        key: "realtime-monitoring-risk-alerts",
        path: "/realtime-monitoring/risk-alerts",
        icon: ShieldCheck,
        description:
          "Dynamic limits, stress shocks, and escalation trails in one view.",
      },
    ],
  },
  {
    title: "Market Making",
    key: "market-making",
    icon: Activity,
    description: "Realtime quoting, hedging, and anomaly intelligence.",
    children: [
      {
        title: "Command Center",
        key: "market-making-monitor",
        path: "/market-making/monitor",
        icon: Activity,
        description: "Realtime monitor for quotes, hedges, and execution flows.",
      },
    ],
  },
];
