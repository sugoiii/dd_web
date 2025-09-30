"use client";

import * as React from "react";
import { Activity, Bot, LineChart, Sparkles } from "lucide-react";

import { NavMain } from "./nav-main";
import { navigationItems } from "~/config/navigation";
import type { NavItem } from "~/config/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInput,
  SidebarRail,
} from "~/components/ui/sidebar";

const managementItems: NavItem[] = [
  {
    title: "Liquidity Buffer",
    key: "management-liquidity",
    description: "Capital usage across coverage pods.",
    icon: Activity,
  },
  {
    title: "Funding Cost",
    key: "management-funding",
    description: "Blended desk funding rate evolution.",
    icon: LineChart,
  },
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const sidebarItems = React.useMemo(() => navigationItems, []);

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="gap-3 border-b border-sidebar-border/60 bg-sidebar/95 px-2 pb-5 pt-6">
        <div className="relative overflow-hidden rounded-xl border border-sidebar-border/70 bg-gradient-to-br from-sidebar/70 via-sidebar to-sidebar-primary/10 p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-sidebar-primary/15 p-2 text-sidebar-primary">
                <Bot className="size-5" />
              </div>
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wide text-sidebar-foreground/70">Desk Command</p>
                <p className="text-base font-semibold text-sidebar-foreground">Desk Design</p>
              </div>
            </div>
            <Badge variant="outline" className="border-sidebar-border/70 bg-sidebar-primary/15 text-[11px] font-semibold uppercase tracking-wide text-sidebar-primary">
              Live
            </Badge>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-sidebar-foreground/70">
            Intraday control tower orchestrating research, execution, and operational governance across the desk.
          </p>
          <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-sidebar-foreground/80">
            <div className="rounded-lg border border-sidebar-border/70 bg-background/60 p-3">
              <p className="text-[11px] uppercase tracking-wide text-sidebar-foreground/60">Net Exposure</p>
              <p className="mt-1 text-sm font-semibold text-sidebar-foreground">$2.4B</p>
              <span className="text-[11px] font-medium text-sidebar-primary">+1.2% vs. prev.</span>
            </div>
            <div className="rounded-lg border border-sidebar-border/70 bg-background/60 p-3">
              <p className="text-[11px] uppercase tracking-wide text-sidebar-foreground/60">Alerts</p>
              <p className="mt-1 text-sm font-semibold text-sidebar-foreground">5 open</p>
              <span className="text-[11px] font-medium text-amber-600 dark:text-amber-300">2 critical</span>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {managementItems.map((item) => (
              <div
                key={item.key}
                className="flex items-center gap-2 rounded-full border border-sidebar-border/70 bg-background/60 px-3 py-1 text-xs text-sidebar-foreground/80"
              >
                {item.icon && <item.icon className="size-3.5 text-sidebar-primary" />}
                <span className="truncate">{item.title}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2 px-2">
          <SidebarInput
            placeholder="Search navigation or datasets"
            className="h-9 border-sidebar-border/70 bg-background/70 text-sm placeholder:text-sidebar-foreground/50"
          />
          <Button size="sm" variant="outline" className="h-9 gap-1 border-sidebar-border/70 bg-background/60 text-xs font-medium text-sidebar-foreground">
            <Sparkles className="size-3.5" />
            Quick Brief
          </Button>
        </div>
      </SidebarHeader>
      <SidebarContent className="px-1 py-4">
        <NavMain items={sidebarItems} />
      </SidebarContent>
      <SidebarFooter className="mt-auto border-t border-sidebar-border/60 bg-sidebar/90 px-3 py-4">
        <div className="flex items-center gap-3 rounded-xl border border-sidebar-border/70 bg-background/70 p-3 shadow-sm">
          <Avatar className="size-11 border border-sidebar-border/70">
            <AvatarImage src="https://i.pravatar.cc/160?img=5" alt="Avery Harper" />
            <AvatarFallback>AH</AvatarFallback>
          </Avatar>
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-sm font-semibold text-sidebar-foreground">Avery Harper</span>
            <span className="truncate text-xs text-sidebar-foreground/70">Desk Supervisor</span>
          </div>
          <Button size="sm" variant="outline" className="h-8 border-sidebar-border/70 text-xs font-medium text-sidebar-foreground">
            Manage
          </Button>
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
