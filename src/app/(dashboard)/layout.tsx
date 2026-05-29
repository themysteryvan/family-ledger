import { Sidebar } from "@/components/sidebar";
import { AuthProvider } from "@/components/auth-provider";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <div className="flex h-full" style={{ background: "var(--bg-base)" }}>
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-6 py-8">{children}</div>
        </main>
      </div>
    </AuthProvider>
  );
}
