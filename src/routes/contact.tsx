import { createFileRoute } from "@tanstack/react-router";
import {
  Linkedin,
  Mail,
  Music2,
  Send,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { useState, type FormEvent } from "react";
import { PageHero } from "@/components/site/PageHero";
import { socials } from "@/lib/site-data";
import { pageMeta } from "@/lib/seo";
import { submitContactMessage } from "@/lib/supabase";

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
  {
    icon: Send,
    label: "Telegram",
    value: socials.telegram,
    href: `https://t.me/${socials.telegram.replace("@", "")}`,
  },
  {
    icon: Music2,
    label: "TikTok",
    value: socials.tiktok,
    href: `https://www.tiktok.com/${socials.tiktok}`,
  },
  {
    icon: Linkedin,
    label: "LinkedIn",
    value: socials.linkedin,
    href: "https://www.linkedin.com/search/results/all/?keywords=YEP%20Initiative",
  },
];

const field =
  "mt-2 w-full rounded-xl border border-input bg-background px-4 py-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 transition-colors";

function ContactPage() {
  const [form, setForm] = useState({ name: "", subject: "", message: "", honeypot: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Spam honeypot detection: bots fill hidden inputs
    if (form.honeypot) {
      // Fake success for bots
      setSuccess("Your message has been received.");
      return;
    }

    const trimmedName = form.name.trim();
    const trimmedSubject = form.subject.trim();
    const trimmedMessage = form.message.trim();

    if (!trimmedName || trimmedName.length > 100) {
      setError("Please provide your name (up to 100 characters).");
      return;
    }
    if (!trimmedSubject || trimmedSubject.length > 150) {
      setError("Please provide a subject (up to 150 characters).");
      return;
    }
    if (!trimmedMessage || trimmedMessage.length > 2000) {
      setError("Please provide a message (up to 2000 characters).");
      return;
    }

    // Cooldown check (prevent repeated spam clicks)
    const lastSent = sessionStorage.getItem("yep_last_contact_sent");
    if (lastSent && Date.now() - Number(lastSent) < 15000) {
      setError("Please wait a few seconds before sending another message.");
      return;
    }

    setIsSubmitting(true);

    try {
      await submitContactMessage({
        name: trimmedName,
        subject: trimmedSubject,
        message: trimmedMessage,
      });

      sessionStorage.setItem("yep_last_contact_sent", String(Date.now()));
      setSuccess(
        `Thank you, ${trimmedName}! Your message has been sent successfully. Our team will review it and get back to you soon.`,
      );
      setForm({ name: "", subject: "", message: "", honeypot: "" });
    } catch (err: unknown) {
      console.error("Submission failed:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Unable to send your message. Please try again or reach out directly on Telegram or Email.",
      );
    } finally {
      setIsSubmitting(false);
    }
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
                    <span className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {c.label}
                    </span>
                    <span className="font-semibold">{c.value}</span>
                  </span>
                </a>
              </li>
            ))}
          </ul>

          <form onSubmit={onSubmit} className="surface-card space-y-5 p-8">
            {/* Honeypot field for bot suppression */}
            <div className="hidden" aria-hidden="true" style={{ display: "none" }}>
              <label>
                Leave this empty
                <input
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                  value={form.honeypot}
                  onChange={(e) => setForm({ ...form, honeypot: e.target.value })}
                />
              </label>
            </div>

            {success && (
              <div className="flex items-start gap-3 rounded-xl border border-primary/40 bg-primary/10 p-4 text-sm text-foreground">
                <CheckCircle2 className="size-5 shrink-0 text-primary mt-0.5" />
                <p>{success}</p>
              </div>
            )}

            {error && (
              <div className="flex items-start gap-3 rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-foreground">
                <AlertCircle className="size-5 shrink-0 text-destructive mt-0.5" />
                <p>{error}</p>
              </div>
            )}

            <label className="block text-sm font-semibold">
              Your name
              <input
                required
                disabled={isSubmitting}
                maxLength={100}
                placeholder="e.g. Abebe Bikila"
                className={field}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </label>

            <label className="block text-sm font-semibold">
              Subject
              <input
                required
                disabled={isSubmitting}
                maxLength={150}
                placeholder="e.g. Inquiry about Master's Pathway"
                className={field}
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
              />
            </label>

            <label className="block text-sm font-semibold">
              Message
              <textarea
                required
                disabled={isSubmitting}
                maxLength={2000}
                rows={6}
                placeholder="Write your message here..."
                className={field}
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
              />
            </label>

            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-muted-foreground">
                {form.message.length}/2000 characters
              </span>

              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-gradient-brand inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-primary-foreground shadow-soft transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 disabled:hover:translate-y-0"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  "Send Message"
                )}
              </button>
            </div>
          </form>
        </div>
      </section>
    </>
  );
}
