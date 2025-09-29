// import { ColorSwitcher } from "~/components/color-switcher";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "~/components/ui/breadcrumb";
import { Button } from "~/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuTrigger } from "~/components/ui/dropdown-menu";
import { Separator } from "~/components/ui/separator";
import { SidebarTrigger } from "~/components/ui/sidebar";
import { Switch } from "~/components/ui/switch";
// import { menuMap } from "~/routes";
// import { useLocaleStore, useThemeStore } from "~/store/index";
import React from "react";
import { useLocation } from "react-router";
export function SiteHeader() {
  const location = useLocation();
  const pathname: string = location.pathname;
  const mode = "dark";
  // const titles: string[] = menuMap.get(pathname) ?? [];
  const titles = ["TestTitle"];
  return (
    <header className="sticky top-0 z-50 bg-background flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mx-2 data-[orientation=vertical]:h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            {titles.map((title, index) => (
              <React.Fragment key={index}>
                <BreadcrumbItem>
                  <BreadcrumbLink>{title}</BreadcrumbLink>
                </BreadcrumbItem>
                {index !== titles.length - 1 && <BreadcrumbSeparator />}
              </React.Fragment>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
        <div className="ml-auto flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-15 h-7">
                demo
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuRadioGroup value="en">
                <DropdownMenuRadioItem value="zh">中文</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="en">EN</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
          <Switch
            id="airplane-mode"
            checked={mode === "dark"}
            // className="bg-white dark:bg-white data-[state=checked]:bg-black"
            // onCheckedChange={(checked) => setMode(checked ? "dark" : "light")}
          />
          <Button variant="ghost" asChild size="sm" className="hidden sm:flex" title="code">
            <a href="" rel="noopener noreferrer" target="_blank" className="dark:text-foreground">
              GitHub
            </a>
          </Button>
        </div>
      </div>
    </header>
  );
}
