import { useCallback } from 'react';

/**
 * useAnime — Thin wrapper around Anime.js (v3) with async dynamic import.
 *
 * All methods are async because Anime.js is loaded lazily on first call
 * to keep the initial JS bundle smaller.
 */
export function useAnime() {
  /**
   * Stagger-animate a set of elements upward from opacity 0.
   * @param targets CSS selector or HTMLElement array
   * @param delayBetween ms between each element (default 80)
   */
  const staggerIn = useCallback(async (
    targets: string | Element[] | NodeList,
    options?: { delayBetween?: number; duration?: number; fromY?: number }
  ) => {
    try {
      const anime = (await import('animejs')).default;
      anime({
        targets,
        translateY: [options?.fromY ?? 28, 0],
        opacity: [0, 1],
        scale: [0.96, 1],
        delay: anime.stagger(options?.delayBetween ?? 80),
        duration: options?.duration ?? 650,
        easing: 'easeOutExpo',
      });
    } catch { /* anime not loaded yet */ }
  }, []);

  /**
   * Animate a numeric value from 0 to `to` and update textContent.
   * @param el Element whose textContent gets updated
   * @param to  Target number
   * @param suffix Optional suffix appended (e.g. "%")
   */
  const countUp = useCallback(async (
    el: HTMLElement | null,
    to: number,
    options?: { duration?: number; suffix?: string; round?: boolean }
  ) => {
    if (!el) return;
    try {
      const anime = (await import('animejs')).default;
      const obj = { value: 0 };
      anime({
        targets: obj,
        value: to,
        duration: options?.duration ?? 1400,
        easing: 'easeOutExpo',
        round: options?.round !== false ? 1 : 0,
        update() {
          el.textContent = Math.round(obj.value).toString() + (options?.suffix ?? '');
        },
      });
    } catch { /* anime not loaded yet */ }
  }, []);

  /**
   * Animate a container into view on page enter.
   * @param target CSS selector or Element
   */
  const pageEnter = useCallback(async (target: string | Element) => {
    try {
      const anime = (await import('animejs')).default;
      anime({
        targets: target,
        translateY: [16, 0],
        opacity: [0, 1],
        duration: 700,
        easing: 'easeOutExpo',
      });
    } catch { /* anime not loaded yet */ }
  }, []);

  /**
   * Ripple effect on a button click.
   * @param el The button element
   * @param event Mouse/Pointer event to get click position
   */
  const ripple = useCallback(async (el: HTMLElement, event: MouseEvent | React.MouseEvent) => {
    try {
      const anime = (await import('animejs')).default;
      const rect = el.getBoundingClientRect();
      const rippleEl = document.createElement('span');
      const size = Math.max(rect.width, rect.height);
      const x = (event as MouseEvent).clientX - rect.left - size / 2;
      const y = (event as MouseEvent).clientY - rect.top - size / 2;

      Object.assign(rippleEl.style, {
        position: 'absolute',
        width: `${size}px`,
        height: `${size}px`,
        left: `${x}px`,
        top: `${y}px`,
        borderRadius: '50%',
        background: 'rgba(255,255,255,0.25)',
        pointerEvents: 'none',
        transform: 'scale(0)',
        opacity: '0.8',
      });

      el.style.position = 'relative';
      el.style.overflow = 'hidden';
      el.appendChild(rippleEl);

      anime({
        targets: rippleEl,
        scale: [0, 2.5],
        opacity: [0.8, 0],
        duration: 600,
        easing: 'easeOutExpo',
        complete: () => rippleEl.remove(),
      });
    } catch { /* anime not loaded yet */ }
  }, []);

  /**
   * Animate progress bar width.
   * @param el The bar inner element
   * @param toPercent Target width percentage
   */
  const fillBar = useCallback(async (el: HTMLElement | null, toPercent: number) => {
    if (!el) return;
    try {
      const anime = (await import('animejs')).default;
      anime({
        targets: el,
        width: [`0%`, `${toPercent}%`],
        duration: 1200,
        easing: 'easeOutExpo',
        delay: 200,
      });
    } catch { /* anime not loaded yet */ }
  }, []);

  return { staggerIn, countUp, pageEnter, ripple, fillBar };
}
