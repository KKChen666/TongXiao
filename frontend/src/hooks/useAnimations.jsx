import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

export function useStaggerEntrance(items, options = {}) {
  const containerRef = useRef(null);
  const { stagger = 0.06, y = 24, duration = 0.5, ease = 'power2.out' } = options;

  useGSAP(() => {
    const children = containerRef.current?.children;
    if (!children?.length) return;
    gsap.from(children, {
      opacity: 0,
      y,
      duration,
      stagger,
      ease,
    });
  }, { scope: containerRef, dependencies: [items?.length] });

  return containerRef;
}

export function useCountUp(value, options = {}) {
  const ref = useRef(null);
  const { duration = 1.5, ease = 'power2.out' } = options;

  useGSAP(() => {
    if (value == null) return;
    const obj = { val: 0 };
    gsap.to(obj, {
      val: value,
      duration,
      ease,
      onUpdate: () => {
        if (ref.current) ref.current.textContent = Math.round(obj.val);
      },
    });
  }, { dependencies: [value] });

  return ref;
}

export function useSlideIn(options = {}) {
  const ref = useRef(null);
  const { y = 30, duration = 0.6, ease = 'power3.out', delay = 0 } = options;

  useGSAP(() => {
    gsap.from(ref.current, {
      opacity: 0,
      y,
      duration,
      ease,
      delay,
    });
  }, { scope: undefined });

  return ref;
}
