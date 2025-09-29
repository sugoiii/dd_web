"use client";

import { SidebarGroup, SidebarGroupLabel, SidebarMenu } from "~/components/ui/sidebar";
import { SidebarMenuTree } from "./sidebar-menutree";
import type { NavItem } from "~/config/navigation";

export function NavMain({ items }: { items: NavItem[] }) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>Menu</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => (
          <SidebarMenuTree item={item} key={item.key} />
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
