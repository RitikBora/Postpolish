import { Hero } from "@/components/hero";
import { SiteFooter } from "@/components/site-footer";
import { ThemeToggle } from "@/components/theme-toggle";
import { Workspace } from "@/components/workspace";

export default function Home() {
  return (
    <div className="relative isolate flex min-h-screen flex-col overflow-hidden bg-background">
      {/* Floating theme toggle in lieu of an app bar */}
      <div className="absolute right-4 top-4 z-20 md:right-6 md:top-6">
        <ThemeToggle />
      </div>

      <Hero />
      <Workspace />
      <SiteFooter />
    </div>
  );
}
