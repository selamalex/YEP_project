import { Link } from "@tanstack/react-router";
import { Mail, Send, Linkedin, Music2 } from "lucide-react";
import { navLinks, socials } from "@/lib/site-data";
import { Logo } from "./Logo";

export function Footer() {
  return (
    <footer className="border-t border-border bg-surface">
      <div className="container-yep grid gap-12 py-16 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <Logo />
          <p className="mt-6 max-w-sm text-sm leading-relaxed text-muted-foreground">
            Making international education more accessible to Ethiopian students.
          </p>
          <p className="text-gradient mt-4 text-lg font-bold">YEP to Success</p>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-foreground">
            Explore
          </h3>
          <ul className="mt-5 grid gap-2.5">
            {navLinks
              .filter((l) => l.to !== "/")
              .map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="text-sm text-muted-foreground transition-colors hover:text-primary"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-foreground">
            Connect
          </h3>
          <ul className="mt-5 grid gap-3 text-sm text-muted-foreground">
            <li className="flex items-center gap-2">
              <Send className="size-4 text-primary" /> {socials.telegram}
            </li>
            <li className="flex items-center gap-2">
              <Music2 className="size-4 text-primary" /> {socials.tiktok}
            </li>
            <li className="flex items-center gap-2">
              <Linkedin className="size-4 text-primary" /> {socials.linkedin}
            </li>
            <li className="flex items-center gap-2">
              <Mail className="size-4 text-primary" />
              <a
                href={`mailto:${socials.email}`}
                className="transition-colors hover:text-primary"
              >
                {socials.email}
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-border">
        <div className="container-yep flex flex-col items-center justify-between gap-2 py-6 text-xs text-muted-foreground md:flex-row">
          <p>© 2026 YEP Initiative. All rights reserved.</p>
          <p>Yael Educational Pathway · Founded 2024</p>
        </div>
      </div>
    </footer>
  );
}
