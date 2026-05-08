import * as React from "react";
import {
  SidebarProvider,
  SidebarTrigger,
  SidebarInset,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { AppSidebar } from "@/components/AppSidebar";
import { LoginPage } from "@/pages/LoginPage";
import { DashboardPage } from "@/pages/DashboardPage";
import { OrdersPage } from "@/pages/OrdersPage";
import { CustomersPage } from "@/pages/CustomersPage";
import { ReportsPage } from "@/pages/ReportsPage";
import { SettingsPage } from "@/pages/SettingsPage";

type PageName = "dashboard" | "orders" | "customers" | "reports" | "settings";

const PAGE_TITLES: Record<PageName, string> = {
  dashboard: "Dashboard",
  orders: "Pesanan",
  customers: "Pelanggan",
  reports: "Laporan",
  settings: "Pengaturan",
};

function AppContent() {
  const { user, loading } = useAuth();
  const [currentPage, setCurrentPage] = React.useState<PageName>("dashboard");

  if (loading) {
    return (
      <div className="min-h-svh flex items-center justify-center bg-muted/30">
        <div className="text-center space-y-3">
          <Skeleton className="h-12 w-12 rounded-xl mx-auto" />
          <Skeleton className="h-4 w-36 mx-auto" />
          <Skeleton className="h-3 w-28 mx-auto" />
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case "dashboard":
        return (
          <DashboardPage onNavigateOrders={() => setCurrentPage("orders")} />
        );
      case "orders":
        return <OrdersPage />;
      case "customers":
        return <CustomersPage />;
      case "reports":
        return <ReportsPage />;
      case "settings":
        return <SettingsPage />;
    }
  };

  return (
    <SidebarProvider>
      <AppSidebar currentPage={currentPage} onNavigate={setCurrentPage} />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4 sticky top-0 bg-background z-10">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="h-4" />
          <h2 className="text-sm font-medium text-foreground">
            {PAGE_TITLES[currentPage]}
          </h2>
        </header>
        <main className="flex-1 overflow-auto p-6">{renderPage()}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}

export function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
