"use client";

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "~/components/ui/collapsible";
import { SidebarMenuButton, SidebarMenuItem, SidebarMenuSub } from "~/components/ui/sidebar";
import { type NavItem } from "~/routes";
import { ChevronRight } from "lucide-react";
import { Link, useLocation } from "react-router";
export function SidebarMenuTree({ item }: { item: NavItem }) {
  const location = useLocation();

  function checkIsActive(href: string) {
    return location.pathname.startsWith("/" + href);
  }
  return (
    <Collapsible
      key={item.title}
      asChild
      // defaultOpen={item.isActive}
      className="group/collapsible"
    >
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          {item.children ? (
            <SidebarMenuButton
              className="data-[active=true]:text-sidebar-active-foreground data-[active=true]:bg-sidebar hover:bg-sidebar hover:text-sidebar-active-foreground data-[state=open]:hover:bg-sidebar data-[state=open]:hover:text-sidebar-active-foreground"
              isActive={checkIsActive(item.keys?.join("/") ?? "")}
              tooltip={item.title}
            >
              {item.icon && <item.icon />}
              <span>{item.title}</span>
              {item.children && <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />}
            </SidebarMenuButton>
          ) : (
            <Link
              to={{
                pathname: "/" + item.keys?.join("/"),
              }}
            >
              <SidebarMenuButton
                className="data-[active=true]:bg-sidebar-active hover:bg-sidebar hover:text-sidebar-active-foreground data-[state=open]:hover:bg-sidebar data-[state=open]:hover:text-sidebar-active-foreground"
                isActive={checkIsActive(item.keys?.join("/") ?? "")}
                tooltip={item.title}
              >
                {item.icon && <item.icon />}
                <span>{item.title}</span>
                {item.children && <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />}
              </SidebarMenuButton>
            </Link>
          )}
        </CollapsibleTrigger>
        {item.children && (
          <CollapsibleContent>
            <SidebarMenuSub>
              {item.children?.map((subItem, index) => (
                <SidebarMenuTree item={subItem} key={index}></SidebarMenuTree>

                // <SidebarMenuSubItem key={subItem.title}>
                //   <SidebarMenuSubButton asChild
                //   // isActive={checkIsActive(href, subItem)}
                //   >
                //     <a href={subItem.url}>
                //       <span>{subItem.title}</span>
                //     </a>
                //   </SidebarMenuSubButton>
                // </SidebarMenuSubItem>
              ))}
            </SidebarMenuSub>
          </CollapsibleContent>
        )}
      </SidebarMenuItem>
    </Collapsible>
  );
}
