import { createFileRoute } from "@tanstack/react-router";
import { Heart, Megaphone, UserPlus, Users } from "lucide-react";
import { CTA } from "@/components/site/CTA";
import { PageHero } from "@/components/site/PageHero";
import { Reveal } from "@/components/site/Reveal";
import { socials } from "@/lib/site-data";
import { pageMeta } from "@/lib/seo";

export const Route = createFileRoute("/get-involved")({
  head: () =>
    pageMeta(
      "Get Involved",
      "Join the YEP community, become a mentor, volunteer or partner to help Ethiopian students reach global education.",
    ),
  component: GetInvolvedPage,
});

const ways = [
  { icon: Users, title: "Join the community", text: `Follow us on Telegram ${socials.telegram} for opportunities, resources and event announcements.`, href: `https://t.me/${socials.telegram.replace("@", "")}`, cta: "Open Telegram" },
  { icon: UserPlus, title: "Become a mentor", text: "Studied abroad or working internationally? Guide the next generation of applicants.", href: `mailto:${socials.email}?subject=Mentor%20application`, cta: "Apply as mentor" },
  { icon: Heart, title: "Volunteer", text: "Help with content, events, design, outreach and community moderation.", href: `mailto:${socials.email}?subject=Volunteer%20with%20YEP`, cta: "Volunteer" },
  { icon: Megaphone, title: "Spread the word", text: `Share our content on TikTok ${socials.tiktok} and LinkedIn with students who need it.`, href: `https://www.tiktok.com/${socials.tiktok}`, cta: "Visit TikTok" },
];

function GetInvolvedPage() {
  return (
    <>
      <PageHero
        eyebrow="Get involved"
        title="There's a place for you on the pathway."
        description="Students, mentors, volunteers and supporters — every contribution helps another student reach their goals."
      />
      <section className="section-pad">
        <div className="container-yep grid gap-6 md:grid-cols-2">
          {ways.map((w, i) => (
            <Reveal key={w.title} delay={i * 60}>
              <div className="surface-card flex h-full flex-col p-8">
                <w.icon className="size-8 text-primary" />
                <h2 className="mt-4 text-xl font-bold">{w.title}</h2>
                <p className="mt-2 flex-1 text-muted-foreground">{w.text}</p>
                <a
                  href={w.href}
                  target={w.href.startsWith("http") ? "_blank" : undefined}
                  rel="noreferrer"
                  className="mt-6 inline-flex w-fit rounded-full border border-border px-5 py-2.5 text-sm font-semibold transition-colors hover:border-primary hover:text-primary"
                >
                  {w.cta}
                </a>
              </div>
            </Reveal>
          ))}
        </div>
        <div className="container-yep mt-12">
          <CTA to="/partners" variant="outline">Partner as an Organization</CTA>
        </div>
      </section>
    </>
  );
}
