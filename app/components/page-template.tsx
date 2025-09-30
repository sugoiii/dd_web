import type { PropsWithChildren, ReactNode } from "react";

export type PageTemplateProps = PropsWithChildren<{
  title: string;
  description?: string;
  actions?: ReactNode;
  fullWidth?: boolean;
}>;

export function PageTemplate({
  title,
  description,
  actions,
  children,
  fullWidth = false,
}: PageTemplateProps) {
  const containerClass = fullWidth
    ? "mx-0 flex w-full flex-1 flex-col gap-4 px-2 py-4 sm:px-4 lg:px-6"
    : "mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8";
  const bodyClass = fullWidth ? "flex flex-1 flex-col gap-4 pb-4" : "flex flex-col gap-6 pb-8";

  return (
    <main className="flex flex-1 flex-col overflow-auto">
      <div className={containerClass}>
        <header
          className={
            fullWidth
              ? "flex flex-col gap-2 border-b pb-3 sm:flex-row sm:items-end sm:justify-between"
              : "flex flex-col gap-3 border-b pb-4 sm:flex-row sm:items-end sm:justify-between"
          }
        >
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">{title}</h1>
            {description ? <p className="text-sm text-muted-foreground sm:text-base">{description}</p> : null}
          </div>
          {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
        </header>
        <div className={bodyClass}>{children}</div>
      </div>
    </main>
  );
}
