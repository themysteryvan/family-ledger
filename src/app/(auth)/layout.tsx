export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="min-h-full flex items-center justify-center px-4"
      style={{ background: "var(--bg-base)" }}
    >
      {children}
    </div>
  );
}
