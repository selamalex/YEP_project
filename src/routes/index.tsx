import { createFileRoute } from "@tanstack/react-router";
import * as Icons from "lucide-react";
import heroImage from "@/assets/pathway-hero.jpg";
import { CTA, PathwayDivider } from "@/components/site/CTA";
import { PageHero, SectionHeading } from "@/components/site/PageHero";
import { Reveal } from "@/components/site/Reveal";
import { StatGrid } from "@/components/site/StatGrid";
import { services, timeline } from "@/lib/site-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "YEP Initiative — Your Pathway to Global Education" },
      {
        name: "description",
        content:
          "Youth-led guidance, training, mentorship, resources and community helping Ethiopian students navigate international education opportunities.",
      },
      { property: "og:title", content: "YEP Initiative — Your Pathway to Global Education" },
      {
        property: "og:description",
        content:
          "Youth-led guidance, training, mentorship, resources and community for Ethiopian students pursuing international education.",
      },
    ],
  }),
  component: Index,
});

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden
        className="bg-gradient-brand animate-drift pointer-events-none absolute -left-40 -top-56 size-[42rem] rounded-full opacity-[0.14] blur-3xl"
      />
      <div className="container-yep relative grid items-center gap-14 py-20 md:py-28 lg:grid-cols-[1.05fr_0.95fr]">
        <div>
          <Reveal>
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              <Icons.Sparkles className="size-3.5" /> Founded in 2024
            </span>
          </Reveal>
          <Reveal delay={80}>
            <h1 className="mt-6 text-4xl font-extrabold leading-[1.05] md:text-6xl lg:text-[4.25rem]">
              Your Pathway to <span className="text-gradient">Global Education.</span>
            </h1>
          </Reveal>
          <Reveal delay={160}>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
              YEP Initiative is a youth-led educational platform helping Ethiopian students
              navigate international education opportunities through customized guidance,
              practical resources, training, mentorship, and community support.
            </p>
          </Reveal>
          <Reveal delay={240}>
            <div className="mt-9 flex flex-wrap gap-3">
              <CTA to="/programs">Explore Our Programs</CTA>
              <CTA to="/get-involved" variant="outline">
                Join the YEP Community
              </CTA>
            </div>
          </Reveal>
          <Reveal delay={320}>
            <dl className="mt-12 grid max-w-xl grid-cols-3 gap-6 border-t border-border pt-8">
              {[
                ["2024", "Founded in"],
                ["60,000+", "Community Members"],
                ["300+", "Students Trained"],
              ].map(([value, label]) => (
                <div key={label}>
                  <dt className="text-2xl font-extrabold md:text-3xl">{value}</dt>
                  <dd className="mt-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {label}
                  </dd>
                </div>
              ))}
            </dl>
          </Reveal>
        </div>

        <Reveal delay={200}>
          <div className="relative">
            <div className="animate-float overflow-hidden rounded-[2rem] border border-border shadow-lift">
              <img
                src={heroImage}
                alt="Abstract pathway illustration representing a student's journey to global education"
                width={1600}
                height={1200}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="surface-card absolute -bottom-6 left-4 hidden gap-3 p-4 sm:flex md:left-8">
              {["Aspiration", "Guidance", "Opportunity", "Success"].map((step, i) => (
                <div key={step} className="flex items-center gap-2">
                  <span className="bg-gradient-brand size-2 rounded-full" />
                  <span className="text-xs font-semibold text-muted-foreground">{step}</span>
                  {i < 3 && <Icons.ChevronRight className="size-3 text-primary/60" />}
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function Index() {
  return (
    <>
      <Hero />
      <PathwayDivider />

      <section className="section-pad bg-surface">
        <div className="container-yep">
          <SectionHeading
            center
            eyebrow="YEP at a glance"
            title="Growing reach, measurable support"
          />
          <div className="mt-12">
            <StatGrid />
          </div>
        </div>
      </section>

      <section className="section-pad">
        <div className="container-yep grid items-center gap-14 lg:grid-cols-2">
          <Reveal>
            <div className="relative overflow-hidden rounded-[2rem] border border-border bg-surface p-10 shadow-soft">
              <div
                aria-hidden
                className="bg-gradient-brand absolute -right-16 -top-16 size-56 rounded-full opacity-20 blur-2xl"
              />
              <ol className="relative grid gap-6">
                {["Aspiration", "Guidance", "Skills", "Opportunity", "Success"].map((s, i) => (
                  <li key={s} className="flex items-center gap-4">
                    <span className="bg-gradient-brand grid size-9 shrink-0 place-items-center rounded-full text-xs font-bold text-primary-foreground">
                      {i + 1}
                    </span>
                    <span className="text-lg font-semibold">{s}</span>
                  </li>
                ))}
              </ol>
            </div>
          </Reveal>
          <div>
            <SectionHeading
              eyebrow="Who we are"
              title="Education opportunities should not depend on who you know."
            />
            <div className="mt-6 grid gap-4 text-base leading-relaxed text-muted-foreground">
              <p>
                YEP Initiative, short for Yael Educational Pathway, was born out of empathy and a
                desire to support our community.
              </p>
              <p>
                Founded in 2024, YEP works to make international education opportunities more
                accessible to Ethiopian students by providing reliable information, practical
                guidance, training, mentorship, and resources.
              </p>
              <p>
                We support students in understanding opportunities and navigating applications
                independently, while working toward a broader goal of strengthening the systems
                that support students along the way.
              </p>
            </div>
            <div className="mt-8">
              <CTA to="/about">Learn More About YEP</CTA>
            </div>
          </div>
        </div>
      </section>

      <section className="section-pad bg-surface">
        <div className="container-yep">
          <SectionHeading
            center
            eyebrow="What we do"
            title="From information to action."
            description="YEP brings together the guidance, skills, resources, and community students need to navigate international education."
          />
          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {services.map((service, i) => {
              const Icon = (Icons[service.icon as keyof typeof Icons] ??
                Icons.Sparkles) as Icons.LucideIcon;
              return (
                <Reveal key={service.title} delay={i * 70}>
                  <article className="surface-card h-full p-7">
                    <span className="grid size-12 place-items-center rounded-2xl bg-accent text-accent-foreground">
                      <Icon className="size-5" />
                    </span>
                    <h3 className="mt-5 text-lg font-bold">{service.title}</h3>
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                      {service.description}
                    </p>
                  </article>
                </Reveal>
              );
            })}
          </div>
          <Reveal className="mt-10 text-center">
            <CTA to="/what-we-do" variant="outline">
              See how we work
            </CTA>
          </Reveal>
        </div>
      </section>

      <section className="section-pad">
        <div className="container-yep">
          <SectionHeading eyebrow="Journey" title="How YEP has grown" />
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {timeline.map((item, i) => (
              <Reveal key={item.year} delay={i * 90}>
                <div className="surface-card h-full p-7">
                  <span className="text-gradient text-3xl font-extrabold">{item.year}</span>
                  <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{item.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section-pad bg-surface">
        <div className="container-yep">
          <Reveal>
            <div className="bg-gradient-brand animate-drift relative overflow-hidden rounded-[2rem] px-8 py-16 text-center text-primary-foreground md:px-16">
              <h2 className="mx-auto max-w-3xl text-3xl font-extrabold leading-tight md:text-4xl">
                Be part of the pathway.
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed opacity-90">
                Join as a student, mentor, volunteer, educator, or partner organization and help
                expand educational access.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <CTA
                  to="/get-involved"
                  variant="outline"
                  className="border-transparent bg-card text-foreground"
                >
                  Get Involved
                </CTA>
                <CTA
                  to="/contact"
                  variant="outline"
                  className="border-current bg-transparent text-primary-foreground hover:text-primary-foreground"
                >
                  Contact Us
                </CTA>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
