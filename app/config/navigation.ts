import type { LucideIcon } from "lucide-react";
import { Activity, BarChart3, Boxes, LayoutDashboard, LayoutGrid, LineChart, Workflow } from "lucide-react";

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
    title: "Strategy",
    key: "strategy",
    icon: Workflow,
    description: "Pair-trading controls and execution parameter governance.",
    children: [
      {
        title: "Delta-1 Basis Monitor",
        key: "strategy-delta1-basis",
        path: "/strategy/delta1-basis",
        icon: LineChart,
        description: "Realtime cash-futures alignment, basis edge, and hedge automation control.",
      },
      {
        title: "Realtime Management",
        key: "strategy-realtime-management",
        path: "/strategy/realtime-management",
        icon: Activity,
        description: "Legacy control tower for systematic strategy allocation.",
      },
      {
        title: "Equity Hedge Cockpit",
        key: "strategy-equity-hedge-cockpit",
        path: "/strategy/equity-hedge-cockpit",
        icon: Workflow,
        description: "High-density management view for pair-hedged equity futures.",
      },
    ],
  },
  {
    title: "Common",
    key: "common",
    icon: LayoutGrid,
    description: "Shared layouts and reusable grid-based templates.",
    children: [
      {
        title: "Grid Panels",
        key: "common-grid-panels",
        path: "/common",
        icon: LayoutGrid,
        description: "Compact sheet-style panels for allocation and limits.",
      },
    ],
  },
];
