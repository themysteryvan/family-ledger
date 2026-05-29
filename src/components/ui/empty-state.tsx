import { Plus } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface Props {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: string;
  onAction?: () => void;
}

export function EmptyState({ icon: Icon, title, description, action, onAction }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
        style={{ background: "var(--bg-elevated)" }}
      >
        <Icon size={22} style={{ color: "var(--text-muted)" }} />
      </div>
      <h3 className="text-sm font-semibold mb-1" style={{ color: "var(--text-primary)" }}>
        {title}
      </h3>
      <p className="text-sm max-w-xs" style={{ color: "var(--text-muted)" }}>
        {description}
      </p>
      {action && onAction && (
        <button
          onClick={onAction}
          className="mt-5 flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
          style={{ background: "var(--accent-blue)", color: "#fff" }}
        >
          <Plus size={14} />
          {action}
        </button>
      )}
    </div>
  );
}
