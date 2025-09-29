"use client";

import * as React from "react";
import { ChevronRight } from "lucide-react";
import { Link, useLocation } from "react-router";

import type { NavItem } from "~/config/navigation";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "~/components/ui/collapsible";
import { SidebarMenuButton, SidebarMenuItem, SidebarMenuSub } from "~/components/ui/sidebar";

function matchesPath(item: NavItem, pathname: string): boolean {
  const normalizedPath = item.path?.replace(/\/$/, "");
  const normalizedLocation = pathname.replace(/\/$/, "") || "/";

  if (normalizedPath) {
    if (normalizedPath === "/") {
      if (normalizedLocation === "/") {
        return true;
      }
    } else if (normalizedLocation === normalizedPath || normalizedLocation.startsWith(`${normalizedPath}/`)) {
      return true;
    }
  }

  return item.children?.some((child) => matchesPath(child, normalizedLocation)) ?? false;
}

export function SidebarMenuTree({ item }: { item: NavItem }) {
  const location = useLocation();
  const pathname = location.pathname;
  const hasChildren = Boolean(item.children?.length);

  const isActive = React.useMemo(() => matchesPath(item, pathname), [item, pathname]);
  const [isOpen, setIsOpen] = React.useState(isActive);

  React.useEffect(() => {
    if (isActive) {
      setIsOpen(true);
    }
  }, [isActive]);

  if (!hasChildren) {
    const targetPath = item.path ?? "#";

    return (
      <SidebarMenuItem>
        <SidebarMenuButton asChild isActive={isActive} tooltip={item.description ?? item.title}>
          <Link to={targetPath}>
            {item.icon && <item.icon className="size-4 shrink-0" />}
            <span className="truncate">{item.title}</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  }

  return (
    <Collapsible asChild open={isOpen} onOpenChange={setIsOpen}>
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton isActive={isActive} tooltip={item.description ?? item.title}>
            {item.icon && <item.icon className="size-4 shrink-0" />}
            <span className="truncate">{item.title}</span>
            <ChevronRight className="ml-auto size-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub>
            {item.children?.map((child) => (
              <SidebarMenuTree item={child} key={child.key} />
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  );
}
