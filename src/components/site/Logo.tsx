import { Link } from "@tanstack/react-router";
import logoAsset from "@/assets/yep-logo.png.asset.json";

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link
      to="/"
      className="group flex items-center rounded-xl transition-transform duration-500 hover:scale-[1.03] dark:bg-foreground dark:px-2 dark:py-1"
      aria-label="Yael Educational Pathway — home"
    >
      <img
        src={logoAsset.url}
        alt="Yael Educational Pathway"
        className={compact ? "h-9 w-auto" : "h-11 w-auto md:h-12"}
      />
    </Link>
  );
}
