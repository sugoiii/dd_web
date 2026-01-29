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
    title: "Common",
    key: "common",
    icon: LayoutGrid,
    description: "Shared layouts and reusable grid-based templates.",
    children: [
      {
        title: "Position",
        key: "common-grid-panels",
        path: "/common",
        icon: LayoutGrid,
        description: "Compact sheet-style panels for allocation and limits.",
      },
    ],
  },
  {
    title: "Market Monitor",
    key: "market-monitor",
    icon: Activity,
    description: "Streaming market microstructure, basis, and alert supervision.",
    children: [
      {
        title: "Overview",
        key: "market-monitor-overview",
        path: "/market-monitor",
        icon: Activity,
        description: "Live market monitoring with basis, positions, and alert panels.",
      },
    ],
  },
];
