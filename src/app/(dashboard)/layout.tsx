import { Sidebar } from "@/components/sidebar";
import { AuthProvider } from "@/components/auth-provider";
import { DashboardHeader } from "@/components/dashboard-header";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <div className="flex h-full" style={{ background: "var(--bg-base)" }}>
        <Sidebar />
        <main className="flex-1 overflow-y-auto flex flex-col">
          <DashboardHeader />
          <div className="max-w-7xl mx-auto px-6 py-8 w-full">{children}</div>
        </main>
      </div>
    </AuthProvider>
  );
}
