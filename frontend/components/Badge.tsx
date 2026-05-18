/** Generic pill badge component. */
import React from "react";

type BadgeVariant = "default" | "success" | "warning" | "danger" | "info";

const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  default: "bg-slate-700/60 text-slate-300 border-slate-600",
  success: "bg-green-900/40 text-green-300 border-green-700",
  warning: "bg-amber-900/40 text-amber-300 border-amber-700",
  danger:  "bg-red-900/40 text-red-300 border-red-700",
  info:    "bg-blue-900/40 text-blue-300 border-blue-700",
};

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

export default function Badge({ children, variant = "default", className = "" }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full border ${VARIANT_CLASSES[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
