"use client";

import * as React from "react";
import { NavMain } from "./nav-main";
import { navigationItems } from "~/config/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import { Sidebar, SidebarContent, SidebarFooter, SidebarRail } from "~/components/ui/sidebar";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const sidebarItems = React.useMemo(() => navigationItems, []);

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarContent className="space-y-4 px-3 py-5">
        <div className="rounded-lg border border-sidebar-border/60 bg-background/70 p-4 text-sm text-sidebar-foreground group-data-[collapsible=icon]:hidden">
          <p className="font-semibold text-sidebar-foreground">Welcome back.</p>
          <p className="mt-1 text-[13px] text-sidebar-foreground/70">
            Choose a section to dive into today&apos;s desk updates and workflows.
          </p>
        </div>
        <NavMain items={sidebarItems} />
      </SidebarContent>
      <SidebarFooter className="mt-auto border-t border-sidebar-border/60 bg-sidebar/90 px-3 py-4 group-data-[collapsible=icon]:hidden">
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
