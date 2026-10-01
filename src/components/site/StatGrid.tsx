import { useEffect, useRef, useState } from "react";
import { Reveal } from "./Reveal";

export type Stat = { value: number; suffix?: string; label: string };

export const yepStats: Stat[] = [
  { value: 60000, suffix: "+", label: "Community Members" },
  { value: 300, suffix: "+", label: "Students Trained" },
  { value: 50, suffix: "+", label: "Success Stories" },
  { value: 700, suffix: "+", label: "Educational Contents" },
  { value: 320, suffix: "+", label: "Scholarship Topics" },
];

function useCountUp(target: number) {
  const ref = useRef<HTMLSpanElement>(null);
  const [value, setValue] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver((entries) => {
      if (!entries[0]?.isIntersecting) return;
      observer.disconnect();
      const duration = 1600;
      const start = performance.now();
      const tick = (now: number) => {
        const p = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        setValue(Math.round(target * eased));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [target]);

  return { ref, value };
}

function StatItem({ stat, index }: { stat: Stat; index: number }) {
  const { ref, value } = useCountUp(stat.value);
  return (
    <Reveal delay={index * 80}>
      <div className="surface-card h-full p-6 text-center md:p-8">
        <span
          ref={ref}
          className="text-gradient block text-4xl font-extrabold tabular-nums md:text-5xl"
        >
          {value.toLocaleString()}
          {stat.suffix}
        </span>
        <span className="mt-3 block text-sm font-medium text-muted-foreground">{stat.label}</span>
      </div>
    </Reveal>
  );
}

export function StatGrid({ stats = yepStats }: { stats?: Stat[] }) {
  return (
    <div className="grid grid-cols-2 gap-4 md:gap-6 lg:grid-cols-5">
      {stats.map((stat, i) => (
        <StatItem key={stat.label} stat={stat} index={i} />
      ))}
    </div>
  );
}
