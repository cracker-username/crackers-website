import React from "react";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "success" | "warning" | "danger" | "discount" | "gradient";
  colorFrom?: string;
  colorTo?: string;
}

export function Badge({
  children,
  variant = "default",
  colorFrom,
  colorTo,
  className = "",
  style = {},
  ...props
}: BadgeProps) {
  const baseStyles =
    "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold select-none transition-colors";

  const variantStyles = {
    default: "bg-white/10 text-foreground border border-white/15",
    success: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30",
    warning: "bg-amber-500/20 text-amber-300 border border-amber-500/30",
    danger: "bg-rose-500/20 text-rose-400 border border-rose-500/30",
    discount: "bg-accent-lime/20 text-accent-lime font-bold border border-accent-lime/30",
    gradient: "text-white shadow-sm font-semibold",
  };

  const dynamicStyle =
    variant === "gradient" && colorFrom && colorTo
      ? {
          background: `linear-gradient(135deg, ${colorFrom}, ${colorTo})`,
          ...style,
        }
      : style;

  return (
    <span
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
      style={dynamicStyle}
      {...props}
    >
      {children}
    </span>
  );
}
