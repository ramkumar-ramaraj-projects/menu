import { useLayoutEffect, useRef, useState, type RefObject } from 'react';

export function useMeasuredHeight<T extends HTMLElement>(): [RefObject<T | null>, number | undefined] {
  const ref = useRef<T>(null);
  const [height, setHeight] = useState<number>();

  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new ResizeObserver(([entry]) => {
      const next = entry?.contentRect.height ?? element.offsetHeight;
      if (next > 0) setHeight(next);
    });

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return [ref, height];
}
