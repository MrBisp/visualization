'use client';
import { useSession } from "next-auth/react";
import Hero from "@/components/Hero";
import Header from "@/components/Header";
import FeaturesAccordion from "@/components/FeaturesAccordion";
import FeaturesGrid from "@/components/FeaturesGrid";
import Pricing from "@/components/Pricing";
import FAQ from "@/components/FAQ";
export default function Page() {
  const { status } = useSession();

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
