"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { flushSync } from "react-dom";

import { Button } from "@/components/ui/button";

type DocumentWithViewTransitions = Document & {
  startViewTransition?: (cb: () => void | Promise<void>) => {
    ready: Promise<void>;
    finished: Promise<void>;
    updateCallbackDone: Promise<void>;
    skipTransition(): void;
  };
};

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const isDark = mounted && resolvedTheme === "dark";

  const handleToggle = (event: React.MouseEvent<HTMLButtonElement>) => {
    const next = isDark ? "light" : "dark";
    const doc =
      typeof document !== "undefined"
        ? (document as DocumentWithViewTransitions)
        : null;

    if (!doc?.startViewTransition) {
      setTheme(next);
      return;
    }

    // Origin of the circular reveal — the toggle button's center.
    const x = event.clientX;
    const y = event.clientY;

    const transition = doc.startViewTransition(() => {
      flushSync(() => setTheme(next));
    });

    transition.ready.then(() => {
      // Reach the farthest corner so the circle covers the whole viewport.
      const endRadius = Math.hypot(
        Math.max(x, window.innerWidth - x),
        Math.max(y, window.innerHeight - y)
      );
      doc.documentElement.animate(
        {
          clipPath: [
            `circle(0px at ${x}px ${y}px)`,
            `circle(${endRadius}px at ${x}px ${y}px)`,
          ],
        },
        {
          duration: 450,
          easing: "ease-in-out",
          pseudoElement: "::view-transition-new(root)",
        }
      );
    });
  };

  return (
    <Button
      variant="outline"
      size="icon"
      aria-label="Toggle theme"
      onClick={handleToggle}
      className="rounded-full bg-background/80 backdrop-blur"
    >
      <Sun className="size-[1.1rem] scale-100 rotate-0 dark:scale-0 dark:-rotate-90" />
      <Moon className="absolute size-[1.1rem] scale-0 rotate-90 dark:scale-100 dark:rotate-0" />
    </Button>
  );
}
