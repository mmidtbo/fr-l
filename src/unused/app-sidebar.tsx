import { Frame, LifeBuoy, PieChart, Send } from "lucide-react";
import * as React from "react";

import { NavMain } from "@/components/navbar/nav-main";
import { NavProjects } from "@/components/navbar/nav-projects";
import { NavSecondary } from "@/components/navbar/nav-secondary";
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
} from "@tabler/icons-react";

const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
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
  ],
  navSecondary: [
    {
      title: "Support",
      url: "/reports",
      icon: LifeBuoy,
    },
    {
      title: "Feedback",
      url: "#",
      icon: Send,
    },
  ],
  projects: [
    {
      name: "Reports",
      url: "/reports",
      icon: Frame,
    },
    {
      name: "Settings",
      url: "/settings",
      icon: PieChart,
    },
    // {
    //   name: "Travel",
    //   url: "#",
    //   icon: Map,
    // },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
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
        <NavMain items={data.navMain} />
        <NavProjects projects={data.projects} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
