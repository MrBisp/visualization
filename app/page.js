'use client';
import Hero from "@/components/Hero";
import FeaturesAccordion from "@/components/FeaturesAccordion";
import FeaturesGrid from "@/components/FeaturesGrid";
import Pricing from "@/components/Pricing";
import FAQ from "@/components/FAQ";

export default function Page() {
  return (
    <div className="h-screen w-full">
      <Hero />
      <FeaturesAccordion />
      <FeaturesGrid />
      <Pricing />
      <FAQ />
    </div>
  );
}
