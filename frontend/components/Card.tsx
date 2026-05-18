/** Reusable card container matching ClearPath dark theme. */
import React from "react";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: "sm" | "md" | "lg" | "none";
}

const PAD_MAP = { sm: "p-3", md: "p-5", lg: "p-8", none: "" };

export default function Card({ children, className = "", padding = "md" }: CardProps) {
  return (
    <div
      className={`bg-slate-900 rounded-xl border border-slate-800 ${PAD_MAP[padding]} ${className}`}
    >
      {children}
    </div>
  );
}
