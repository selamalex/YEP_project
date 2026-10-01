import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Props = {
  to: string;
  children: ReactNode;
  variant?: "primary" | "outline";
  className?: string;
  withArrow?: boolean;
};

export function CTA({ to, children, variant = "primary", className, withArrow = true }: Props) {
  return (
    <Link
      to={to}
      className={cn(
        "group inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        variant === "primary"
          ? "bg-gradient-brand text-primary-foreground shadow-soft hover:-translate-y-0.5 hover:shadow-lift"
          : "border border-border bg-card text-foreground hover:border-primary hover:text-primary",
        className,
      )}
    >
      {children}
      {withArrow && (
        <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
      )}
    </Link>
  );
}

export function PathwayDivider() {
  return (
    <div aria-hidden className="container-yep">
      <svg viewBox="0 0 1200 60" className="h-12 w-full text-primary/35" fill="none">
        <path
          d="M0 40 C 200 0, 320 60, 520 30 S 900 0, 1200 34"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeDasharray="6 8"
        />
        <circle cx="120" cy="22" r="4" fill="currentColor" />
        <circle cx="520" cy="30" r="4" fill="currentColor" />
        <circle cx="900" cy="14" r="4" fill="currentColor" />
      </svg>
    </div>
  );
}
