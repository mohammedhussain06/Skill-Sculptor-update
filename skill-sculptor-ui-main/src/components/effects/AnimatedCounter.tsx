import { useEffect, useRef } from 'react';
import { useAnime } from '@/hooks/useAnime';
import { cn } from '@/lib/utils';

interface AnimatedCounterProps {
  /** The target number to count up to */
  value: number;
  /** Optional suffix appended after the number (e.g. "%", " XP") */
  suffix?: string;
  /** Animation duration in ms (default 1400) */
  duration?: number;
  /** CSS class names for the span element */
  className?: string;
  /** Delay before animation starts in ms (default 0) */
  delay?: number;
}

/**
 * AnimatedCounter — Renders a `<span>` that counts up from 0 to `value`
 * using Anime.js when the element enters the viewport.
 *
 * Usage:
 * ```tsx
 * <AnimatedCounter value={2847} suffix=" XP" className="text-4xl font-bold" />
 * ```
 */
export function AnimatedCounter({
  value,
  suffix = '',
  duration = 1400,
  className,
  delay = 0,
}: AnimatedCounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const hasAnimated = useRef(false);
  const { countUp } = useAnime();

  useEffect(() => {
    if (!ref.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;

          setTimeout(() => {
            countUp(ref.current, value, { duration, suffix });
          }, delay);

          observer.disconnect();
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [value, duration, suffix, delay, countUp]);

  return (
    <span ref={ref} className={cn('tabular-nums', className)}>
      0{suffix}
    </span>
  );
}
