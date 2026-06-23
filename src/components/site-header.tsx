import Image from "next/image";

import { ThemeToggle } from "@/components/theme-toggle";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-4 md:px-6">
        <a
          href="/"
          aria-label="PostPolish home"
          className="group flex items-center gap-1"
        >
          <span className="flex size-7 items-center justify-center rounded-md text-primary-foreground transition-transform group-hover:scale-105 group-hover:rotate-12">
            <Image
              src="/polish.png"
              alt=""
              width={14}
              height={14}
              className="size-5"
            />
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
