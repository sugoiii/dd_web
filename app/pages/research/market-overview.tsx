import { PageTemplate } from "~/components/page-template";
import { SummaryCard } from "~/components/summary-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";

const overviewMetrics = [
  { title: "Global PMI", value: "52.1", trend: { value: "+0.6 m/m", direction: "up" as const } },
  { title: "Credit Spreads", value: "89 bps", trend: { value: "-4 bps w/w", direction: "up" as const } },
  { title: "USD Momentum", value: "-0.8 σ", trend: { value: "Weaker", direction: "down" as const } },
  { title: "Volatility", value: "17.4", trend: { value: "VIX", direction: "flat" as const } },
];

const themes = [
  {
    title: "AI Capex Still Accelerating",
    body: "Hyperscaler guidance suggests another 20% step-up in 2H spend with supply chains finally normalized.",
  },
  {
    title: "Europe Macro Surprise",
    body: "Eurozone leading indicators turned positive for the first time in six quarters, supporting cyclical re-rating trades.",
  },
  {
    title: "Commodities Rotation",
    body: "Energy curves steepened as OPEC compliance improved, while base metals remain supported by restocking.",
  },
];

const crossAssetMoves = [
  { asset: "Equities", move: "+1.2%", detail: "US tech leadership extends" },
  { asset: "Rates", move: "-6 bps", detail: "UST rally led by belly" },
  { asset: "Credit", move: "-3 bps", detail: "IG spreads retrace widening" },
  { asset: "FX", move: "-0.5%", detail: "USD weakens on dovish data" },
];

export default function MarketOverviewPage() {
  return (
    <PageTemplate title="Market Overview" description="Daily snapshot of the macro narrative and cross-asset positioning.">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {overviewMetrics.map((metric) => (
          <SummaryCard key={metric.title} {...metric} />
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Key Themes</CardTitle>
          <CardDescription>Talking points prepared for the morning meeting.</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-4">
            {themes.map((theme) => (
              <li key={theme.title} className="rounded-md border bg-muted/30 p-4">
                <h3 className="text-base font-semibold">{theme.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{theme.body}</p>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cross-Asset Moves</CardTitle>
          <CardDescription>24-hour percent change across major sleeves.</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[24rem] table-fixed text-sm">
            <thead>
              <tr className="text-muted-foreground">
                <th className="py-2 text-left font-medium">Asset Class</th>
                <th className="py-2 text-left font-medium">Move</th>
                <th className="py-2 text-left font-medium">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {crossAssetMoves.map((item) => (
                <tr key={item.asset}>
                  <td className="py-2 font-medium">{item.asset}</td>
                  <td className="py-2 text-muted-foreground">{item.move}</td>
                  <td className="py-2 text-muted-foreground">{item.detail}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </PageTemplate>
  );
}
