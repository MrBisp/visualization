import Link from "next/link";
import { useEffect, useRef } from "react";

const Hero = () => {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = 2.0;
      videoRef.current.currentTime = 2.0;
    }
  }, []);

  return (
    <section className="max-w-7xl mx-auto bg-base-100 flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-20 px-4 sm:px-8 py-8 lg:py-20" style={{ backgroundColor: "transparent" }}>
      <div className="flex flex-col gap-6 lg:gap-14 items-center lg:items-start max-w-2xl">
        <h1 className="font-extrabold text-3xl sm:text-4xl lg:text-6xl tracking-tight text-center lg:text-left">
          Rewire Your Mind for Success in Just 17 Minutes a Day
        </h1>
        <p className="text-base sm:text-lg opacity-80 leading-relaxed text-center lg:text-left">
          AI-guided visualizations that sharpen focus, boost confidence, and accelerate performance—backed by <a href="#backed-by-neuroscience" className="underline decoration-dashed">neuroscience</a>.
        </p>
        <Link href="/getting-started" className="w-full sm:w-auto">
          <button className="btn btn-primary w-full sm:w-auto">
            Create your first visualization
          </button>
        </Link>
        <p className="text-sm sm:text-base space-y-1 text-center lg:text-left">
          <span className="block">✅ No sign-up required</span>
          <span className="block">✅ Free preview of 1 visualization</span>
          <span className="block">✅ No credit card required</span>
        </p>
      </div>
      <div className="w-full lg:w-auto flex items-center justify-center">
        <video
          ref={videoRef}
          src="/hero.webm"
          autoPlay
          loop
          muted
          playsInline
          style={{
            width: "100%",
            maxWidth: "none",
            height: "auto",
            border: "1px solid rgba(0, 0, 0, 0.1)",
            borderRadius: "10px",
            boxShadow: "0 0 10px 0px rgba(0, 0, 0, 0.1)",
            overflow: "hidden",
          }}
        />
      </div>
    </section>
  );
};

export default Hero;
