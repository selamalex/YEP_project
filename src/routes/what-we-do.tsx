import { createFileRoute } from "@tanstack/react-router";
import * as Icons from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { CTA } from "@/components/site/CTA";
import { PageHero } from "@/components/site/PageHero";
import { Reveal } from "@/components/site/Reveal";
import { services } from "@/lib/site-data";
import { pageMeta } from "@/lib/seo";

export const Route = createFileRoute("/what-we-do")({
  head: () =>
    pageMeta(
      "What We Do",
      "Scholarship guidance, training, mentorship, resources, community and school support for Ethiopian students.",
    ),
  component: WhatWeDoPage,
});

function WhatWeDoPage() {
  return (
    <>
      <PageHero
        eyebrow="What we do"
        title="Six ways we support every student's journey."
        description="From your first question about scholarships to submitting your final application, YEP walks alongside you."
      />
      <section className="section-pad">
        <div className="container-yep grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {services.map((s, i) => {
            const Icon = (Icons as unknown as Record<string, LucideIcon>)[s.icon] ?? Icons.Circle;
            return (
              <Reveal key={s.title} delay={i * 60}>
                <article className="surface-card h-full p-8">
                  <span className="bg-gradient-brand inline-flex size-12 items-center justify-center rounded-2xl text-primary-foreground">
                    <Icon className="size-6" />
                  </span>
                  <h2 className="mt-5 text-xl font-bold">{s.title}</h2>
                  <p className="mt-3 leading-relaxed text-muted-foreground">{s.description}</p>
                </article>
              </Reveal>
            );
          })}
        </div>
        <div className="container-yep mt-12 flex flex-wrap gap-3">
          <CTA to="/programs">See Our Programs</CTA>
          <CTA to="/contact" variant="outline">Ask a Question</CTA>
        </div>
      </section>
    </>
  );
}
