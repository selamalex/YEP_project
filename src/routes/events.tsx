import { createFileRoute } from "@tanstack/react-router";
import { CalendarDays, MapPin } from "lucide-react";
import { CTA } from "@/components/site/CTA";
import { PageHero, SectionHeading } from "@/components/site/PageHero";
import { Reveal } from "@/components/site/Reveal";
import { pastEvents, socials, upcomingEvents, type YepEvent } from "@/lib/site-data";
import { pageMeta } from "@/lib/seo";

export const Route = createFileRoute("/events")({
  head: () =>
    pageMeta(
      "Events",
      "Upcoming and past YEP Initiative webinars, bootcamps and information sessions for Ethiopian students.",
    ),
  component: EventsPage,
});

function EventCard({ e, upcoming }: { e: YepEvent; upcoming: boolean }) {
  return (
    <article className="surface-card h-full p-7">
      <h3 className="text-xl font-bold">{e.name}</h3>
      <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
        <CalendarDays className="size-4 text-primary" /> {e.date} · {e.time}
      </p>
      <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
        <MapPin className="size-4 text-primary" /> {e.venue}
      </p>
      <p className="mt-4 leading-relaxed text-muted-foreground">{e.description}</p>
      {upcoming && e.registerUrl && (
        <a
          href={e.registerUrl}
          target="_blank"
          rel="noreferrer"
          className="bg-gradient-brand mt-6 inline-flex rounded-full px-5 py-2.5 text-sm font-semibold text-primary-foreground"
        >
          Register
        </a>
      )}
    </article>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="surface-card mt-8 p-10 text-center text-muted-foreground">{text}</div>
  );
}

function EventsPage() {
  return (
    <>
      <PageHero
        eyebrow="Events"
        title="Learn live with the YEP community."
        description="Webinars, bootcamps and information sessions with alumni, mentors and partner institutions."
      />
      <section className="section-pad">
        <div className="container-yep">
          <SectionHeading title="Upcoming events" />
          {upcomingEvents.length ? (
            <div className="mt-8 grid gap-6 md:grid-cols-2">
              {upcomingEvents.map((e, i) => (
                <Reveal key={e.id} delay={i * 60}>
                  <EventCard e={e} upcoming />
                </Reveal>
              ))}
            </div>
          ) : (
            <EmptyState
              text={`New events are announced first on our Telegram channel ${socials.telegram}. Check back soon!`}
            />
          )}
        </div>
      </section>
      <section className="section-pad bg-surface">
        <div className="container-yep">
          <SectionHeading title="Past events" />
          {pastEvents.length ? (
            <div className="mt-8 grid gap-6 md:grid-cols-2">
              {pastEvents.map((e) => (
                <EventCard key={e.id} e={e} upcoming={false} />
              ))}
            </div>
          ) : (
            <EmptyState text="Our event archive is coming soon." />
          )}
          <div className="mt-10">
            <CTA to="/contact" variant="outline">Host an Event With Us</CTA>
          </div>
        </div>
      </section>
    </>
  );
}
