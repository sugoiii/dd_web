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
];
