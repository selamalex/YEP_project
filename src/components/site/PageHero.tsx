import type { ReactNode } from "react";
import { Reveal } from "./Reveal";
import { BackButton } from "./BackButton";

export function PageHero({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  children?: ReactNode;
}) {
  return (
    <section className="relative overflow-hidden border-b border-border bg-surface">
      <div
        aria-hidden
        className="bg-gradient-brand animate-drift pointer-events-none absolute -top-40 right-[-10%] size-[32rem] rounded-full opacity-[0.16] blur-3xl"
      />
      <div className="container-yep relative py-20 md:py-28">
        <BackButton />
        <Reveal>
          {eyebrow && (
            <span className="inline-flex items-center rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              {eyebrow}
            </span>
          )}
          <h1 className="mt-5 max-w-4xl text-4xl font-extrabold leading-[1.08] md:text-6xl">
            {title}
          </h1>
          {description && (
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
              {description}
            </p>
          )}
          {children && <div className="mt-8">{children}</div>}
        </Reveal>
      </div>
    </section>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  center = false,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  center?: boolean;
}) {
  return (
    <Reveal className={center ? "text-center" : undefined}>
      {eyebrow && (
        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          {eyebrow}
        </span>
      )}
      <h2 className="mt-3 text-3xl font-extrabold leading-tight md:text-4xl">{title}</h2>
      {description && (
        <p
          className={`mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground ${center ? "mx-auto" : ""}`}
        >
          {description}
        </p>
      )}
    </Reveal>
  );
}
