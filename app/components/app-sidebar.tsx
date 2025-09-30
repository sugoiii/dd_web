"use client";

import * as React from "react";
import { Bot, Briefcase } from "lucide-react";

import { NavMain } from "./nav-main";
import { navigationItems } from "~/config/navigation";
import type { NavItem } from "~/config/navigation";
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarRail } from "~/components/ui/sidebar";

const managementNavigation: NavItem = {
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
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const sidebarItems = React.useMemo(() => [...navigationItems, managementNavigation], []);

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-4">
          <Bot className="size-5" />
          <span className="font-semibold tracking-tight">Desk Design</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={sidebarItems} />
      </SidebarContent>
      <SidebarFooter />
      <SidebarRail />
    </Sidebar>
  );
}
