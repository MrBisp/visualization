import Image from "next/image";
import config from "@/config";
import Link from "next/link";
const Hero = () => {
  return (
    <section className="max-w-7xl mx-auto bg-base-100 flex flex-col lg:flex-row items-center justify-center gap-16 lg:gap-20 px-8 py-8 lg:py-20">
      <div className="flex flex-col gap-10 lg:gap-14 items-center justify-center text-center lg:text-left lg:items-start">
        <h1 className="font-extrabold text-4xl lg:text-6xl tracking-tight md:-mb-4">
          Rewire Your Mind for Success in Just 17 Minutes a Day
        </h1>
        <p className="text-lg opacity-80 leading-relaxed">
          AI-guided visualizations that sharpen focus, boost confidence, and accelerate performance—backed by <a href="#backed-by-neuroscience" className="underline decoration-dashed">neuroscience</a>.
        </p>
        <button className="btn btn-primary btn-wide mb-0">
          <Link href="/getting-started">Create your first visualization</Link>
        </button>
        <p className="">
        ✅ No sign-up required<br/>
        ✅ Your first visualization is free<br/>
        ✅ No credit card required
        </p>
      </div>
      <div className="flex flex-col gap-10 lg:gap-14 items-center justify-center text-center lg:text-left lg:items-start">
        <p>Hero image</p>
      </div>
    </section>
  );
};

export default Hero;
