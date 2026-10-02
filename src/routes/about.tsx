import { createFileRoute } from "@tanstack/react-router";
import { CTA } from "@/components/site/CTA";
import { PageHero, SectionHeading } from "@/components/site/PageHero";
import { Reveal } from "@/components/site/Reveal";
import { pathwaySteps, timeline, values } from "@/lib/site-data";
import { pageMeta } from "@/lib/seo";

export const Route = createFileRoute("/about")({
  head: () =>
    pageMeta(
      "About Us",
      "Learn about YEP Initiative, the youth-led platform founded in 2024 to help Ethiopian students reach international education.",
    ),
  component: AboutPage,
});

function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="About YEP"
        title="Born out of empathy. Built for access."
        description="YEP Initiative, short for Yael Educational Pathway, is a youth-led educational initiative founded in 2024 to help Ethiopian students access and navigate international education opportunities.
YEP was created in response to a simple reality: many capable students have the ambition to pursue education opportunities but do not always have access to reliable information, practical guidance, mentorship, or supportive systems.
Our work focuses on closing these gaps.
We provide structured educational guidance, training, mentorship, resources, and community support while promoting independent application as an important part of the student journey.
"
      />
      <section className="section-pad">
        <div className="container-yep grid gap-10 md:grid-cols-2">
          <Reveal>
            <div className="surface-card h-full p-8">
              <h2 className="text-2xl font-extrabold">Our Mission</h2>
              <p className="mt-4 leading-relaxed text-muted-foreground">
                To equip Ethiopian students with the guidance, training, mentorship, resources,
                and community they need to confidently pursue international education on their own.
              </p>
            </div>
          </Reveal>
          <Reveal delay={80}>
            <div className="surface-card h-full p-8">
              <h2 className="text-2xl font-extrabold">Our Vision</h2>
              <p className="mt-4 leading-relaxed text-muted-foreground">
                A generation of Ethiopian students with equal access to global education — and the
                skills to bring that knowledge back to their communities.
              </p>
            </div>
          </Reveal>
        </div>
      </section>
      <section className="section-pad bg-surface">
        <div className="container-yep">
          <SectionHeading eyebrow="What guides us" title="Our values" />
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {values.map((v, i) => (
              <Reveal key={v.name} delay={i * 60}>
                <div className="surface-card h-full p-7">
                  <h3 className="text-lg font-bold text-primary">{v.name}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{v.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
      <section className="section-pad">
        <div className="container-yep">
          <SectionHeading eyebrow="The YEP pathway" title="From information to independence" />
          <ol className="mt-10 flex flex-wrap gap-3">
            {pathwaySteps.map((s, i) => (
              <li key={s} className="rounded-full border border-border bg-card px-5 py-2.5 text-sm font-semibold">
                <span className="mr-2 text-primary">{String(i + 1).padStart(2, "0")}</span>
                {s}
              </li>
            ))}
          </ol>
        </div>
      </section>
      <section className="section-pad bg-surface">
        <div className="container-yep">
          <SectionHeading eyebrow="Our journey" title="Milestones" />
          <div className="mt-10 space-y-5">
            {timeline.map((t, i) => (
              <Reveal key={t.year} delay={i * 80}>
                <div className="surface-card flex gap-6 p-6">
                  <span className="text-gradient text-2xl font-extrabold">{t.year}</span>
                  <p className="text-muted-foreground">{t.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
          <div className="mt-10">
            <CTA to="/get-involved">Join the YEP Community</CTA>
          </div>
        </div>
      </section>
    </>
  );
}
