"use client";

import { SidebarMenuTree } from "./sidebar-menutree";
import { SidebarGroup, SidebarGroupLabel, SidebarMenu } from "~/components/ui/sidebar";
import { type NavItem } from "~/routes";
export function NavMain({ items }: { items: NavItem[] }) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>Menu</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item, index) => (
          <SidebarMenuTree item={item} key={index}></SidebarMenuTree>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
