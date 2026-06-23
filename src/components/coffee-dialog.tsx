"use client";

import { Coffee } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface CoffeeDialogProps {
  trigger: ReactNode;
}

export function CoffeeDialog({ trigger }: CoffeeDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="gap-5 p-8 sm:max-w-md">
        <DialogTitle className="text-2xl font-semibold leading-snug tracking-tight">
          PostPolish is{" "}
          <span className="text-primary">free, forever</span>.
        </DialogTitle>

        <DialogDescription className="text-[15px] leading-relaxed text-foreground/80">
          If it saved you ten minutes of fiddling with bold characters, a small
          tip helps me keep building things like this.
        </DialogDescription>

        {/* Bypass DialogFooter's default flex layout — two equal columns with
            wider buttons and roomier gap. */}
        <div className="mt-2 grid grid-cols-2 gap-4">
          <DialogClose asChild>
            <Button
              type="button"
              variant="ghost"
              className="w-full transition-transform duration-150 ease-out hover:scale-[1.02] active:scale-[0.98]"
            >
              Maybe later
            </Button>
          </DialogClose>
          <Button

            className="w-full gap-1.5 transition-transform duration-150 ease-out hover:scale-[1.02] active:scale-[0.98]"
          >
            <a
              href="https://buymeacoffee.com/ritikbora"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1"
            >
              Buy me a
              <Coffee className="size-4 mb-0.25" />
            </a>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
