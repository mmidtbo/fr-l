import * as React from "react";

import { NavMain } from "@/components/navbar/nav-main";
import { NavUser } from "@/components/navbar/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  IconDashboard,
  IconListDetails,
  IconUsersGroup,
  IconWashMachine,
  IconSettings,
  IconReportAnalytics,
} from "@tabler/icons-react";
import { useAuth } from "@/hooks/useAuth";

const data = {
  navMain: [
    {
      title: "Dashboard",
      url: "/",
      icon: IconDashboard,
    },
    {
      title: "Pesanan",
      url: "/orders",
      icon: IconListDetails,
    },
    {
      title: "Pelanggan",
      url: "/customers",
      icon: IconUsersGroup,
    },
    {
      title: "Laporan",
      url: "/reports",
      icon: IconReportAnalytics,
      ownerOnly: true,
    },
    {
      title: "Pengaturan",
      url: "/settings",
      icon: IconSettings,
      ownerOnly: true,
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useAuth();
  const isOwner = user?.role === "owner";
  const navItems = data.navMain.filter((item) => !item.ownerOnly || isOwner);
  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild tooltip="Gresik Laundry">
              <div className="flex items-center gap-3 cursor-default select-none">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <IconWashMachine className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">Gresik Laundry</span>
                  <span className="truncate text-xs text-muted-foreground">
                    Sistem Manajemen
                  </span>
                </div>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navItems} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
