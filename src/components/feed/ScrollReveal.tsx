import { useEffect, useRef } from "react";
import type { ReactNode } from "react";

export function ScrollReveal({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ref.current;

    if (!node || !("IntersectionObserver" in window)) return;

    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    );

    if (reduced.matches) return;

    const show = () => {
      node.classList.remove("feed-scroll-ready");
      node.classList.add("feed-scroll-visible");
    };

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          show();
          observer.disconnect();
        }
      },
      {
        threshold: 0,
        rootMargin: "0px 0px 40px 0px",
      },
    );

    node.classList.add("feed-scroll-ready");
    observer.observe(node);

    const onPreference = () => {
      if (reduced.matches) {
        show();
        observer.disconnect();
      }
    };

    reduced.addEventListener("change", onPreference);
    node.addEventListener("focusin", show);

    return () => {
      observer.disconnect();
      reduced.removeEventListener("change", onPreference);
      node.removeEventListener("focusin", show);
      node.classList.remove("feed-scroll-ready");
    };
  }, []);

  return (
    <div ref={ref} className="feed-scroll-post">
      {children}
    </div>
  );
}