"use client";

import { motion } from "motion/react";

const FADE_UP = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
};
const EASE = [0.16, 1, 0.3, 1] as const;

export function Hero() {
  return (
    <section className="relative w-full pt-20 pb-10 md:pt-28 md:pb-14">
      <div className="mx-auto max-w-5xl px-4 md:px-6">
        <div className="flex flex-col items-center text-center">
          <motion.h1
            {...FADE_UP}
            transition={{ duration: 0.45, ease: EASE }}
            className="bg-gradient-to-br from-foreground via-foreground/90 to-foreground/70 bg-clip-text text-3xl font-bold tracking-tight text-transparent sm:text-4xl md:text-5xl lg:text-6xl"
          >
            Polish <span className="font-extrabold">Every</span>{" "}
            <span className="relative inline-block">
              <span
                aria-hidden
                className="absolute -inset-2 rounded-2xl bg-primary/15 blur-2xl opacity-80"
              />
              <span className="relative text-primary">LinkedIn</span>
            </span>{" "}
            Post Before You{" "}
            <span className="font-serif font-light italic text-foreground/80">
              Publish.
            </span>
          </motion.h1>

          <motion.p
            {...FADE_UP}
            transition={{ duration: 0.45, ease: EASE, delay: 0.1 }}
            className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-muted-foreground md:mt-7 md:text-lg"
          >
            Turn plain text into clean, engaging LinkedIn posts with rich
            formatting and a real-time preview.
          </motion.p>
        </div>
      </div>
    </section>
  );
}
