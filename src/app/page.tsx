import { Hero } from "@/components/hero";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Workspace } from "@/components/workspace";

export default function Home() {
  return (
    <div className="relative isolate flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <Hero />
      <Workspace />
      <SiteFooter />
    </div>
  );
}
