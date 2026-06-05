import { AuthProvider } from "@/components/auth-provider";
import { NavShell } from "@/components/nav-shell";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <NavShell>{children}</NavShell>
    </AuthProvider>
  );
}
