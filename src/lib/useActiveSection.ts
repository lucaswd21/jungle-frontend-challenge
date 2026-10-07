import { useEffect, useState } from "react";

/** Reflect scrolling as well as hash links, without adding scroll events to router history. */
export function useActiveSection(pathname: string, hash: string) {
  const [section, setSection] = useState("home");
  useEffect(() => {
    if (pathname !== "/") return;
    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const learn = document.getElementById("learn");
        const catalog = document.getElementById("catalog");
        const creators = document.getElementById("creators");
        // The last section may not reach the top in a tall viewport.
        const atBottom =
          window.scrollY + window.innerHeight >=
          document.documentElement.scrollHeight - 2;
        setSection(
          learn &&
            (learn.getBoundingClientRect().top <= 160 ||
              (atBottom &&
                learn.getBoundingClientRect().top < window.innerHeight))
            ? "learn"
            : creators && creators.getBoundingClientRect().top <= 160
              ? "creators"
              : catalog && catalog.getBoundingClientRect().top <= 160
                ? "catalog"
                : "home",
        );
      });
    };
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    const observer = new ResizeObserver(update);
    observer.observe(document.body);
    update();
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [pathname, hash]);
  return section;
}
