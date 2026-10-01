import { createFileRoute } from "@tanstack/react-router";
import { CTA } from "@/components/site/CTA";
import { PageHero, SectionHeading } from "@/components/site/PageHero";
import { Reveal } from "@/components/site/Reveal";
import { StatGrid } from "@/components/site/StatGrid";
import { timeline } from "@/lib/site-data";
import { pageMeta } from "@/lib/seo";

export const Route = createFileRoute("/impact")({
  head: () =>
    pageMeta(
      "Our Impact",
      "60,000+ community members, 300+ students trained and 50+ success stories — see YEP Initiative's impact.",
    ),
  component: ImpactPage,
});

function ImpactPage() {
  return (
    <>
      <PageHero
        eyebrow="Impact"
        title="Growing opportunity, one student at a time."
        description="Since 2024, the YEP community has grown into one of the largest networks of Ethiopian students pursuing international education."
      />
      <section className="section-pad">
        <div className="container-yep">
          <StatGrid />
        </div>
      </section>
      <section className="section-pad bg-surface">
        <div className="container-yep">
          <SectionHeading eyebrow="Growth" title="How we've grown" />
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {timeline.map((t, i) => (
              <Reveal key={t.year} delay={i * 80}>
                <div className="surface-card h-full p-7">
                  <span className="text-gradient text-3xl font-extrabold">{t.year}</span>
                  <p className="mt-3 text-muted-foreground">{t.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
          <div className="mt-12">
            <CTA to="/partners">Partner With Us</CTA>
          </div>
        </div>
      </section>
    </>
  );
}
