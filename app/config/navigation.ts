import type { LucideIcon } from "lucide-react";
import {
  Activity,
  BarChart3,
  Boxes,
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
    title: "Dashboard",
    key: "dashboard",
    path: "/",
    icon: LayoutDashboard,
    description: "High-level snapshot of the trading desk.",
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
