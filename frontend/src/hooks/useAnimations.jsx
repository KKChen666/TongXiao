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

// Removed useCountUp and useSlideIn as they are unused
// ProfilePage uses its own AnimatedNumber component
