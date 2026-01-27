import type { PropsWithChildren, ReactNode } from "react";

import { cn } from "~/lib/utils";

export type PageTemplateProps = PropsWithChildren<{
  title: string;
  description?: string;
  actions?: ReactNode;
  fullWidth?: boolean;
  headingVariant?: "default" | "compact";
}>;

export function PageTemplate({ title, description, actions, children, fullWidth = true, headingVariant = "default" }: PageTemplateProps) {
  const containerClass = fullWidth ? "mx-0 flex w-full flex-1 flex-col gap-4 px-2 py-4 sm:px-4 lg:px-6" : "mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8";
  const bodyClass = fullWidth ? "flex flex-1 flex-col gap-4 pb-4" : "flex flex-col gap-6 pb-8";
  const headerClass = fullWidth
    ? cn("flex flex-col border-b sm:flex-row sm:items-end sm:justify-between", headingVariant === "compact" ? "gap-1.5 pb-2" : "gap-2 pb-3")
    : cn("flex flex-col border-b sm:flex-row sm:items-end sm:justify-between", headingVariant === "compact" ? "gap-2 pb-3" : "gap-3 pb-4");
  const titleClass = headingVariant === "compact" ? "text-xl font-semibold tracking-tight text-foreground sm:text-2xl" : "text-2xl font-semibold tracking-tight text-foreground sm:text-3xl";
  const descriptionClass = headingVariant === "compact" ? "text-xs text-muted-foreground sm:text-sm" : "text-sm text-muted-foreground sm:text-base";

  return (
    <main className="flex flex-1 flex-col overflow-auto">
      <div className={containerClass}>
        <header className={headerClass}>
          <div className="flex flex-col gap-1">
            <h1 className={titleClass}>{title}</h1>
            {description ? <p className={descriptionClass}>{description}</p> : null}
          </div>
          {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
        </header>
        <div className={bodyClass}>{children}</div>
      </div>
    </main>
  );
}
