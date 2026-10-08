'use client';
import { useEffect, useRef } from 'react';
import { formatoNarrativo } from '@/lib/domain/presentacion';
import { useIntroMotion } from './motion-context';

/** Solo la copia visual anima. La cifra accesible permanece estable y no anuncia cada frame. */
export function AnimatedNumber({
  value,
  decimals = 0,
  suffix = '',
}: {
  value: number | null;
  decimals?: number;
  suffix?: string;
}) {
  const visual = useRef<HTMLSpanElement>(null);
  const played = useRef(false);
  const animate = useIntroMotion();
  const final = formatoNarrativo(value, decimals) + (value === null ? '' : suffix);
  useEffect(() => {
    const element = visual.current;
    if (!element) return;
    element.textContent = final;
    if (!animate || played.current || value === null || !window.IntersectionObserver) return;
    let raf = 0;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting) || played.current) return;
        played.current = true;
        const start = performance.now();
        const tick = (now: number) => {
          const progress = Math.min(1, (now - start) / 950);
          element.textContent =
            formatoNarrativo(value * (1 - (1 - progress) ** 3), decimals) + suffix;
          if (progress < 1 && !document.hidden) raf = requestAnimationFrame(tick);
          else element.textContent = final;
        };
        raf = requestAnimationFrame(tick);
        observer.disconnect();
      },
      { threshold: 0.35 },
    );
    observer.observe(element);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(raf);
      element.textContent = final;
    };
  }, [animate, value, decimals, suffix, final]);
  return (
    <span className="intro-number" data-value={value ?? 'no-consta'}>
      <span className="sr-only">{final}</span>
      <span ref={visual} aria-hidden="true">
        {final}
      </span>
    </span>
  );
}
