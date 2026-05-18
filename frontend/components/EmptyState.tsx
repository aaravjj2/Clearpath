/**
 * Generic empty-state component for ClearPath panels.
 */
import React from "react";

interface EmptyStateProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  action?: React.ReactNode;
  iconClass?: string;
}

export default function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  iconClass = "w-10 h-10 text-slate-600",
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <Icon className={iconClass} aria-hidden="true" />
      <p className="mt-3 font-medium text-slate-300">{title}</p>
      {description && <p className="mt-1 text-sm text-slate-500 max-w-xs">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
