import { createFileRoute } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { CTA } from "@/components/site/CTA";
import { PageHero } from "@/components/site/PageHero";
import { Reveal } from "@/components/site/Reveal";
import { programs } from "@/lib/site-data";
import { pageMeta } from "@/lib/seo";

export const Route = createFileRoute("/programs")({
  head: () =>
    pageMeta(
      "Programs",
      "Bachelor's and Master's pathways, training cohorts, webinars and mentorship programs from YEP Initiative.",
    ),
  component: ProgramsPage,
});

function ProgramsPage() {
  return (
    <>
      <PageHero
        eyebrow="Programs"
        title="Structured pathways for every stage."
        description="Whether you're finishing high school or planning a Master's, there's a YEP program built for where you are."
      />
      <section className="section-pad">
        <div className="container-yep grid gap-6 lg:grid-cols-2">
          {programs.map((p, i) => (
            <Reveal key={p.name} delay={i * 60}>
              <article className="surface-card h-full p-8">
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                  Program {String(i + 1).padStart(2, "0")}
                </span>
                <h2 className="mt-3 text-2xl font-extrabold">{p.name}</h2>
                <p className="mt-3 leading-relaxed text-muted-foreground">{p.description}</p>
                {p.audience.length > 0 && (
                  <>
                    <h3 className="mt-6 text-sm font-bold">Who it's for</h3>
                    <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                      {p.audience.map((a) => (
                        <li key={a} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <Check className="mt-0.5 size-4 shrink-0 text-primary" /> {a}
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </article>
            </Reveal>
          ))}
        </div>
        <div className="container-yep mt-12 flex flex-wrap gap-3">
          <CTA to="/get-involved">Apply to Join</CTA>
          <CTA to="/events" variant="outline">Upcoming Events</CTA>
        </div>
      </section>
    </>
  );
}
