import { Sparkles } from "lucide-react";

import { ThemeToggle } from "@/components/theme-toggle";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-4 md:px-6">
        <a
          href="/"
          aria-label="PostPolish home"
          className="group flex items-center gap-2.5"
        >
          <span className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground shadow-sm shadow-primary/30 transition-transform group-hover:scale-105 group-hover:rotate-12">
            <Sparkles className="size-3.5" strokeWidth={2.25} />
          </span>
          <span className="text-[15px] font-semibold leading-none tracking-tight text-foreground">
            PostPolish
          </span>
        </a>
        <ThemeToggle />
      </div>
    </header>
  );
}
