import { createFileRoute } from "@tanstack/react-router";
import { Building2, GraduationCap, Handshake, School } from "lucide-react";
import { CTA } from "@/components/site/CTA";
import { PageHero } from "@/components/site/PageHero";
import { Reveal } from "@/components/site/Reveal";
import { pageMeta } from "@/lib/seo";

export const Route = createFileRoute("/partners")({
  head: () =>
    pageMeta(
      "Partners",
      "Partner with YEP Initiative — universities, schools, organizations and professionals widening access to global education.",
    ),
  component: PartnersPage,
});

const types = [
  { icon: GraduationCap, title: "Universities & Institutions", text: "Reach motivated Ethiopian applicants through info sessions and webinars." },
  { icon: School, title: "Schools & Counselors", text: "Strengthen student support with training for teachers and counselors." },
  { icon: Building2, title: "Organizations & Sponsors", text: "Fund cohorts, resources, and events that expand access." },
  { icon: Handshake, title: "Alumni & Professionals", text: "Share your experience as a mentor or guest speaker." },
];

function PartnersPage() {
  return (
    <>
      <PageHero
        eyebrow="Partners"
        title="Widening access, together."
        description="We collaborate with institutions, schools, and professionals who share our belief that opportunity shouldn't depend on connections."
      />
      <section className="section-pad">
        <div className="container-yep grid gap-6 md:grid-cols-2">
          {types.map((t, i) => (
            <Reveal key={t.title} delay={i * 60}>
              <div className="surface-card flex h-full gap-5 p-8">
                <span className="bg-gradient-brand inline-flex size-12 shrink-0 items-center justify-center rounded-2xl text-primary-foreground">
                  <t.icon className="size-6" />
                </span>
                <div>
                  <h2 className="text-xl font-bold">{t.title}</h2>
                  <p className="mt-2 text-muted-foreground">{t.text}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
        <div className="container-yep mt-12">
          <CTA to="/contact">Become a Partner</CTA>
        </div>
      </section>
    </>
  );
}
