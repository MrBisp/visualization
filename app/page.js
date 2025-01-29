'use client';
import { useSession } from "next-auth/react";
import Hero from "@/components/Hero";
import Header from "@/components/Header";
import FeaturesAccordion from "@/components/FeaturesAccordion";
import FeaturesGrid from "@/components/FeaturesGrid";
export default function Page() {
  const { status } = useSession();

  return (
    <div className="h-screen w-full">
      <Header />
      <Hero />
      <FeaturesAccordion />
      <FeaturesGrid />
    </div>
  );
}
