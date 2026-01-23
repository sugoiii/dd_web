"use client";

import * as React from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "~/components/ui/breadcrumb";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Input } from "~/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Separator } from "~/components/ui/separator";
import { SidebarTrigger } from "~/components/ui/sidebar";
import { cn } from "~/lib/utils";
import {
  THEME_CHANGE_EVENT,
  applyThemeToDocument,
  getStoredTheme,
  storeTheme,
} from "~/lib/theme";
import type { ThemeMode } from "~/lib/theme";
import { navigationItems } from "~/config/navigation";
import type { NavItem } from "~/config/navigation";
import { Github, Globe, Moon, Search, Sparkles, SunMedium } from "lucide-react";
import { Link, useLocation } from "react-router";

type BreadcrumbEntry = {
  title: string;
  path?: string;
};

function normalizePath(value?: string | null): string | undefined {
  if (!value) {
    return undefined;
  }

  if (value === "/") {
    return "/";
  }

  return value.replace(/\/+$/, "");
}

function formatSegment(segment: string): string {
  return segment
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function findBreadcrumbTrail(items: NavItem[], targetPath: string, parents: NavItem[] = []): NavItem[] | null {
  for (const item of items) {
    const currentTrail = [...parents, item];
    const normalizedItemPath = normalizePath(item.path);

    if (normalizedItemPath) {
      if (targetPath === normalizedItemPath) {
        return currentTrail;
      }

      if (targetPath.startsWith(`${normalizedItemPath}/`)) {
        if (item.children?.length) {
          const childMatch = findBreadcrumbTrail(item.children, targetPath, currentTrail);
          if (childMatch) {
            return childMatch;
          }
        }

        return currentTrail;
      }
    }

    if (item.children?.length) {
      const childMatch = findBreadcrumbTrail(item.children, targetPath, currentTrail);
      if (childMatch) {
        return childMatch;
      }
    }
  }

  return null;
}

function buildBreadcrumbs(pathname: string): BreadcrumbEntry[] {
  const normalizedLocation = normalizePath(pathname) ?? "/";
  const trail = findBreadcrumbTrail(navigationItems, normalizedLocation);

  if (trail?.length) {
    return trail.map((item) => ({
      title: item.title,
      path: item.path,
    }));
  }

  const segments = normalizedLocation === "/" ? [] : normalizedLocation.split("/").filter(Boolean);

  if (!segments.length) {
    return [
      {
        title: "Desk Dashboard",
        path: "/",
      },
    ];
  }

  const breadcrumbs: BreadcrumbEntry[] = [];
  let accumulated = "";

  segments.forEach((segment, index) => {
    accumulated += `/${segment}`;
    const partialTrail = findBreadcrumbTrail(navigationItems, accumulated);
    if (partialTrail?.length) {
      partialTrail.forEach((item) => {
        const exists = breadcrumbs.some((crumb) => crumb.title === item.title);
        if (!exists) {
          breadcrumbs.push({ title: item.title, path: item.path });
        }
      });
    } else {
      breadcrumbs.push({
        title: formatSegment(segment),
        path: index === segments.length - 1 ? accumulated : accumulated,
      });
    }
  });

  return breadcrumbs;
}

export function SiteHeader() {
  const location = useLocation();
  const pathname = location.pathname;
  const breadcrumbs = React.useMemo(() => buildBreadcrumbs(pathname), [pathname]);

  const [theme, setTheme] = React.useState<ThemeMode>("light");

  React.useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const stored = getStoredTheme();
    if (stored) {
      setTheme(stored);
      return;
    }

    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    setTheme(prefersDark ? "dark" : "light");
  }, []);

  React.useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    applyThemeToDocument(theme);
    storeTheme(theme);
    window.dispatchEvent(new CustomEvent(THEME_CHANGE_EVENT, { detail: theme }));
  }, [theme]);

  const toggleTheme = React.useCallback(() => {
    setTheme((previous) => (previous === "dark" ? "light" : "dark"));
  }, []);

  return (
    <header className="sticky top-0 z-50 flex h-(--header-height) shrink-0 items-center border-b bg-background/95 backdrop-blur transition-[width,height] ease-linear supports-[backdrop-filter]:bg-background/80 group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full flex-wrap items-center gap-3 px-4 py-2 lg:gap-4 lg:px-6">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="h-8 w-px bg-border" />
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground/80 dark:text-slate-300/80">
              Currently viewing
            </p>
            <Breadcrumb>
              <BreadcrumbList className="mt-1">
                {breadcrumbs.map((breadcrumb, index) => {
                  const isLast = index === breadcrumbs.length - 1;
                  const key = `${breadcrumb.title}-${breadcrumb.path ?? index}`;

                  return (
                    <React.Fragment key={key}>
                      <BreadcrumbItem>
                        {isLast ? (
                          <BreadcrumbPage className="text-sm font-semibold text-foreground/90 dark:text-slate-100">
                            {breadcrumb.title}
                          </BreadcrumbPage>
                        ) : breadcrumb.path ? (
                          <BreadcrumbLink asChild className="text-sm text-foreground/80 dark:text-slate-200">
                            <Link to={breadcrumb.path}>{breadcrumb.title}</Link>
                          </BreadcrumbLink>
                        ) : (
                          <BreadcrumbLink className="text-sm text-foreground/80 dark:text-slate-200">
                            {breadcrumb.title}
                          </BreadcrumbLink>
                        )}
                      </BreadcrumbItem>
                      {!isLast && <BreadcrumbSeparator />}
                    </React.Fragment>
                  );
                })}
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <div className="relative hidden min-w-[200px] max-w-sm flex-1 items-center sm:flex">
            <Search className="pointer-events-none absolute left-3 size-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search tickers, playbooks, or briefs"
              className="h-9 w-full rounded-lg bg-muted/40 pl-9 text-sm shadow-none focus-visible:ring-0"
            />
          </div>
        </div>
        <div className="flex flex-1 items-center justify-end gap-2 sm:flex-none">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 gap-2 rounded-lg border-border/70 text-xs font-medium">
                <Globe className="size-4" />
                English
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuLabel>Workspace language</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuRadioGroup value="en">
                <DropdownMenuRadioItem value="en">English</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="zh">中文</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="es">Español</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="outline" size="sm" className="hidden h-9 gap-2 rounded-lg border-border/70 text-xs font-medium sm:inline-flex">
            <Sparkles className="size-4" />
            New briefing
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={toggleTheme}
            className="relative h-9 w-9 rounded-lg border-border/70"
          >
            <SunMedium className={cn("size-4 transition-all", theme === "dark" ? "rotate-90 scale-0" : "rotate-0 scale-100")}
 />
            <Moon className={cn("absolute size-4 transition-all", theme === "dark" ? "rotate-0 scale-100" : "-rotate-90 scale-0")}
 />
            <span className="sr-only">Toggle theme</span>
          </Button>
          <Separator orientation="vertical" className="mx-1 hidden h-6 w-px bg-border sm:block" />
          <Button variant="ghost" size="icon" asChild className="hidden h-9 w-9 rounded-lg sm:flex">
            <a href="https://github.com/desk-design" target="_blank" rel="noreferrer">
              <Github className="size-4" />
              <span className="sr-only">GitHub</span>
            </a>
          </Button>
          <div className="flex items-center gap-2 rounded-xl border border-border/70 bg-muted/40 px-3 py-1.5">
            <div className="flex flex-col leading-tight">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground/70">Status</span>
              <span className="text-sm font-medium text-foreground">Markets open</span>
            </div>
            <Avatar className="size-9 border border-border/60">
              <AvatarImage src="https://i.pravatar.cc/160?img=12" alt="User" />
              <AvatarFallback>CM</AvatarFallback>
            </Avatar>
          </div>
        </div>
      </div>
    </header>
  );
}
