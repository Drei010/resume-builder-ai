import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

type Animation = <T extends HTMLElement>(root: T, reducedMotion: boolean) => void;

export function useGsap<T extends HTMLElement>(animate: Animation, dependencies: readonly unknown[] = []) {
  const root = useRef<T>(null);
  const animation = useRef(animate);
  animation.current = animate;

  useLayoutEffect(() => {
    const element = root.current;
    if (!element) return;

    let media: ReturnType<typeof gsap.matchMedia> | undefined;
    const context = gsap.context(() => {
      media = gsap.matchMedia();
      media.add("(prefers-reduced-motion: reduce)", () => animation.current(element, true));
      media.add("(prefers-reduced-motion: no-preference)", () => animation.current(element, false));
    }, element);

    return () => { media?.revert(); context.revert(); };
    // The ref keeps the latest callback without retriggering animations on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies);

  return root;
}
