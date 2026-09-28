import React, { useEffect, useState, useRef } from 'react';

export interface AnimatedCounterProps {
  end: number;
  start?: number;
  duration?: number; // In seconds (e.g. 1.8) or milliseconds (e.g. 1800)
  prefix?: string;
  suffix?: string;
  decimals?: number;
  className?: string;
  trigger?: boolean; // When provided, starts counting when trigger becomes true
  threshold?: number; // IntersectionObserver threshold (0.3 to 0.5, default 0.35)
}

/**
 * AnimatedCounter
 * Smooth, scroll-triggered number counting animation using IntersectionObserver
 * and requestAnimationFrame.
 * - Animates only once when entering viewport (or on external trigger).
 * - Respects prefers-reduced-motion.
 * - Accessible via aria-label with hidden intermediate frames.
 * - Zero layout shift with tabular-nums.
 */
export const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
  end,
  start = 0,
  duration = 1.8,
  prefix = '',
  suffix = '',
  decimals = 0,
  className = '',
  trigger,
  threshold = 0.35,
}) => {
  const [count, setCount] = useState<number>(start);
  const [hasTriggered, setHasTriggered] = useState<boolean>(false);
  const elementRef = useRef<HTMLSpanElement>(null);

  // Normalize duration: if duration <= 10, treat as seconds, otherwise ms
  const durationMs = duration <= 10 ? duration * 1000 : duration;

  // Viewport detection (when trigger prop is not provided externally)
  useEffect(() => {
    // If trigger prop is explicitly provided, obey the trigger
    if (trigger !== undefined) {
      if (trigger && !hasTriggered) {
        setHasTriggered(true);
      }
      return;
    }

    // Otherwise use self IntersectionObserver
    const el = elementRef.current;
    if (!el || hasTriggered) return;

    // Check reduced motion
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      setHasTriggered(true);
      setCount(end);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHasTriggered(true);
          observer.disconnect(); // Animate only once
        }
      },
      { threshold: Math.min(Math.max(threshold, 0.1), 1.0) }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [trigger, hasTriggered, threshold, end]);

  // Handle animation when triggered
  useEffect(() => {
    if (!hasTriggered) return;

    // Check reduced motion preference
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      setCount(end);
      return;
    }

    let startTimestamp: number | null = null;
    let animationFrameId: number;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const elapsed = timestamp - startTimestamp;
      const progress = Math.min(elapsed / durationMs, 1);

      // Smooth ease-out cubic curve: 1 - (1 - progress)^3
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const currentVal = start + easeProgress * (end - start);

      setCount(currentVal);

      if (progress < 1) {
        animationFrameId = window.requestAnimationFrame(step);
      } else {
        setCount(end);
      }
    };

    animationFrameId = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(animationFrameId);
  }, [hasTriggered, end, start, durationMs]);

  // Update count directly if end value changes after animation has finished
  useEffect(() => {
    if (hasTriggered) {
      setCount(end);
    }
  }, [end, hasTriggered]);

  // Format number
  const formatNumber = (val: number): string => {
    if (decimals > 0) {
      return val.toLocaleString(undefined, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      });
    }
    return Math.floor(val).toLocaleString();
  };

  const finalFormatted = `${prefix}${decimals > 0 ? end.toFixed(decimals) : end.toLocaleString()}${suffix}`;
  const displayVal = hasTriggered
    ? count >= end
      ? formatNumber(end)
      : formatNumber(count)
    : formatNumber(start);

  return (
    <span
      ref={elementRef}
      className={`inline-block tabular-nums select-none ${className}`}
      style={{ fontVariantNumeric: 'tabular-nums' }}
      role="text"
      aria-label={finalFormatted}
    >
      <span aria-hidden="true">
        {prefix}
        {displayVal}
        {suffix}
      </span>
    </span>
  );
};
