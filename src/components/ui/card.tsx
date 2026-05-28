"use client";

import { cn } from "@/lib/utils";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function Card({ className, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border p-5",
        className
      )}
      style={{
        background: "var(--bg-surface)",
        borderColor: "var(--border)",
      }}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className, children, ...props }: CardProps) {
  return (
    <div className={cn("mb-4", className)} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ className, children, ...props }: CardProps) {
  return (
    <h3
      className={cn("text-sm font-medium", className)}
      style={{ color: "var(--text-secondary)" }}
      {...props}
    >
      {children}
    </h3>
  );
}

export function CardValue({ className, children, ...props }: CardProps) {
  return (
    <p
      className={cn("text-2xl font-semibold tracking-tight mt-1", className)}
      style={{ color: "var(--text-primary)" }}
      {...props}
    >
      {children}
    </p>
  );
}
