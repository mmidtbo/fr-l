import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ModeToggle } from "../mode-toggle";
import { useLocation } from "react-router-dom";
import { NavUser } from "./nav-user-site-header";

const PAGE_TITLES: Record<string, string> = {
  "/": "Dashboard",
  "/orders": "Pesanan",
  "/customers": "Pelanggan",
  "/reports": "Laporan",
  "/settings": "Pengaturan",
};

export function SiteHeader() {
  const location = useLocation();

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" />
        <h1 className="text-base font-medium">
          {PAGE_TITLES[location.pathname] ?? "Dashboard"}
        </h1>
        <div className="ml-auto flex items-center gap-2">
          <ModeToggle />
          <NavUser />
        </div>
      </div>
    </header>
  );
}
