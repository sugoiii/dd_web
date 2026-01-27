import { NavLink, Outlet } from "react-router";

import { cn } from "~/lib/utils";

const navItems = [{ label: "Overview", to: ".", end: true }];

export default function CommonLayout() {
  return (
    <div className="flex flex-col gap-6">
      <div className="px-6 pb-6">
        <Outlet />
      </div>
    </div>
  );
}
