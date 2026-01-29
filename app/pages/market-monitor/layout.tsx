import { Outlet } from "react-router";

export default function MarketMonitorLayout() {
  return (
    <div className="flex flex-col gap-6">
      <div className="px-6 pb-6">
        <Outlet />
      </div>
    </div>
  );
}
