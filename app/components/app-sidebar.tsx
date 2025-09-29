"use client";

import * as React from "react";
import { NavMain } from "./nav-main";
import { type NavItem } from "~/routes";
import { Bot } from "lucide-react";

import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarRail } from "~/components/ui/sidebar";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const items: NavItem[] = [
    {
      title: "ETN",
      key: "test",
      icon: Bot,
      children: [
        { title: "손익", key: "pnl", icon: Bot, keys: ["etn", "pnl"] },
        { title: "Realtime", key: "realtime", icon: Bot, keys: ["etn", "realtime"] },
      ],
    },
    {
      title: "test",
      key: "test",
      icon: Bot,
      children: [
        { title: "test2", key: "test2", icon: Bot, keys: ["test", "test2"] },
        { title: "test2", key: "test2", icon: Bot, keys: ["test", "test2"] },
        { title: "test2", key: "test2", icon: Bot, keys: ["test", "test2"] },
      ],
    },
  ];
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader></SidebarHeader>
      <SidebarContent>
        <NavMain items={items} />
      </SidebarContent>
      <SidebarFooter>{/* <NavUser /> */}</SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
