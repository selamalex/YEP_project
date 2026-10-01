import { createFileRoute } from "@tanstack/react-router";
import { Linkedin, Mail, Music2, Send } from "lucide-react";
import { useState, type FormEvent } from "react";
import { PageHero } from "@/components/site/PageHero";
import { socials } from "@/lib/site-data";
import { pageMeta } from "@/lib/seo";

export const Route = createFileRoute("/contact")({
  head: () =>
    pageMeta(
      "Contact",
      "Get in touch with YEP Initiative by email, Telegram, TikTok or LinkedIn.",
    ),
  component: ContactPage,
});

const channels = [
  { icon: Mail, label: "Email", value: socials.email, href: `mailto:${socials.email}` },
  { icon: Send, label: "Telegram", value: socials.telegram, href: `https://t.me/${socials.telegram.replace("@", "")}` },
  { icon: Music2, label: "TikTok", value: socials.tiktok, href: `https://www.tiktok.com/${socials.tiktok}` },
  { icon: Linkedin, label: "LinkedIn", value: socials.linkedin, href: "https://www.linkedin.com/search/results/all/?keywords=YEP%20Initiative" },
];

const field =
  "mt-2 w-full rounded-xl border border-input bg-background px-4 py-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

function ContactPage() {
  const [form, setForm] = useState({ name: "", subject: "", message: "" });

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const body = `${form.message}\n\n— ${form.name}`;
    window.location.href = `mailto:${socials.email}?subject=${encodeURIComponent(form.subject)}&body=${encodeURIComponent(body)}`;
  };

  return (
    <>
      <PageHero
        eyebrow="Contact"
        title="Let's talk about your pathway."
        description="Questions about programs, partnerships or events? Reach out — we usually reply within a few days."
      />
      <section className="section-pad">
        <div className="container-yep grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <ul className="space-y-4">
            {channels.map((c) => (
              <li key={c.label}>
                <a
                  href={c.href}
                  target={c.href.startsWith("http") ? "_blank" : undefined}
                  rel="noreferrer"
                  className="surface-card flex items-center gap-4 p-5 transition-colors hover:border-primary"
                >
                  <c.icon className="size-6 text-primary" />
                  <span>
                    <span className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">{c.label}</span>
                    <span className="font-semibold">{c.value}</span>
                  </span>
                </a>
              </li>
            ))}
          </ul>
          <form onSubmit={onSubmit} className="surface-card space-y-5 p-8">
            <label className="block text-sm font-semibold">
              Your name
              <input required maxLength={100} className={field} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </label>
            <label className="block text-sm font-semibold">
              Subject
              <input required maxLength={150} className={field} value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
            </label>
            <label className="block text-sm font-semibold">
              Message
              <textarea required maxLength={2000} rows={6} className={field} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
            </label>
            <button type="submit" className="bg-gradient-brand rounded-full px-6 py-3 text-sm font-semibold text-primary-foreground shadow-soft">
              Send Message
            </button>
          </form>
        </div>
      </section>
    </>
  );
}
