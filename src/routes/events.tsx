import { createFileRoute } from "@tanstack/react-router";
import { CalendarDays, MapPin, AlertCircle, RefreshCw } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { CTA } from "@/components/site/CTA";
import { PageHero, SectionHeading } from "@/components/site/PageHero";
import { Reveal } from "@/components/site/Reveal";
import { socials } from "@/lib/site-data";
import { pageMeta } from "@/lib/seo";
import { getPublishedEvents, type DatabaseEvent } from "@/lib/supabase";
import { ResponsiveImage } from "@/components/site/ResponsiveImage";
import { formatEventDateTime } from "@/lib/date-utils";

export const Route = createFileRoute("/events")({
  head: () =>
    pageMeta(
      "Events",
      "Upcoming and past YEP Initiative webinars, bootcamps and information sessions for Ethiopian students.",
    ),
  component: EventsPage,
});

function EventCard({ e, upcoming }: { e: DatabaseEvent; upcoming: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const hasLongDescription =
    Boolean(e.short_description && e.full_description) ||
    e.full_description.length > 220;

  return (
    <article className="surface-card flex h-full flex-col justify-between p-7">
      <div>
        {e.cover_image && (
          <div className="relative mb-5 aspect-video w-full overflow-hidden rounded-xl border border-border/50 bg-muted">
            <ResponsiveImage
              src={e.cover_image}
              alt={e.title}
              className="transition-transform duration-500 hover:scale-[1.02]"
              loading="lazy"
            />
          </div>
        )}

        <h3 className="text-xl font-bold tracking-tight text-foreground">{e.title}</h3>

        <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
          <CalendarDays className="size-4 shrink-0 text-primary" />
          <span>{formatEventDateTime(e.start_date, e.end_date)}</span>
        </p>

        <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="size-4 shrink-0 text-primary" />
          <span>{e.venue}</span>
        </p>

        <p className="mt-4 leading-relaxed text-muted-foreground">
          {expanded
            ? e.full_description
            : e.short_description || e.full_description}
        </p>

        {hasLongDescription && (
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="mt-2 text-xs font-semibold text-primary hover:underline"
          >
            {expanded ? "Show less" : "Read full description"}
          </button>
        )}
      </div>

      {upcoming && e.registration_link && (
        <div className="mt-6 pt-2">
          <a
            href={e.registration_link}
            target="_blank"
            rel="noreferrer"
            className="bg-gradient-brand inline-flex rounded-full px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-soft transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Register
          </a>
        </div>
      )}
    </article>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="surface-card mt-8 p-10 text-center text-muted-foreground">{text}</div>
  );
}

function EventCardSkeleton() {
  return (
    <div className="surface-card flex h-72 flex-col justify-between p-7 animate-pulse">
      <div>
        <div className="h-6 w-3/4 rounded-md bg-muted" />
        <div className="mt-4 h-4 w-1/2 rounded bg-muted" />
        <div className="mt-2 h-4 w-1/3 rounded bg-muted" />
        <div className="mt-5 space-y-2">
          <div className="h-3 w-full rounded bg-muted" />
          <div className="h-3 w-5/6 rounded bg-muted" />
        </div>
      </div>
      <div className="h-9 w-28 rounded-full bg-muted" />
    </div>
  );
}

function EventsPage() {
  const [events, setEvents] = useState<DatabaseEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadEvents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getPublishedEvents();
      setEvents(data);
    } catch (err: unknown) {
      console.error(err);
      setError(
        err instanceof Error ? err.message : "Unable to load events at this moment.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  // Classification: an event is upcoming if its end_date (or start_date) is >= now
  const now = new Date();
  const upcomingEvents = events
    .filter((e) => {
      const cutoff = e.end_date ? new Date(e.end_date) : new Date(e.start_date);
      return cutoff >= now;
    })
    .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());

  const pastEvents = events
    .filter((e) => {
      const cutoff = e.end_date ? new Date(e.end_date) : new Date(e.start_date);
      return cutoff < now;
    })
    .sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime());

  return (
    <>
      <PageHero
        eyebrow="Events"
        title="Learn live with the YEP community."
        description="Webinars, bootcamps and information sessions with alumni, mentors and partner institutions."
      />

      {error && (
        <section className="section-pad pt-6 pb-0">
          <div className="container-yep">
            <div className="surface-card flex items-center justify-between border-destructive/40 bg-destructive/10 p-6 text-foreground">
              <div className="flex items-center gap-3">
                <AlertCircle className="size-5 text-destructive shrink-0" />
                <p className="text-sm font-medium">{error}</p>
              </div>
              <button
                onClick={loadEvents}
                type="button"
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-4 py-2 text-xs font-semibold hover:border-primary"
              >
                <RefreshCw className="size-3.5" /> Retry
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Upcoming events section */}
      <section className="section-pad">
        <div className="container-yep">
          <SectionHeading title="Upcoming events" />

          {loading ? (
            <div className="mt-8 grid gap-6 md:grid-cols-2">
              <EventCardSkeleton />
              <EventCardSkeleton />
            </div>
          ) : upcomingEvents.length ? (
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

      {/* Past events section */}
      <section className="section-pad bg-surface">
        <div className="container-yep">
          <SectionHeading title="Past events" />

          {loading ? (
            <div className="mt-8 grid gap-6 md:grid-cols-2">
              <EventCardSkeleton />
              <EventCardSkeleton />
            </div>
          ) : pastEvents.length ? (
            <div className="mt-8 grid gap-6 md:grid-cols-2">
              {pastEvents.map((e) => (
                <EventCard key={e.id} e={e} upcoming={false} />
              ))}
            </div>
          ) : (
            <EmptyState text="Our event archive is coming soon." />
          )}

          <div className="mt-10">
            <CTA to="/contact" variant="outline">
              Host an Event With Us
            </CTA>
          </div>
        </div>
      </section>
    </>
  );
}
