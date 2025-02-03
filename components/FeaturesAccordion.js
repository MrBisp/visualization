"use client";

import { useState, useRef } from "react";
import Image from "next/image";

// The features array is a list of features that will be displayed in the accordion.
// - title: The title of the feature
// - description: The description of the feature (when clicked)
// - type: The type of media (video or image)
// - path: The path to the media (for better SEO, try to use a local path)
// - format: The format of the media (if type is 'video')
// - alt: The alt text of the image (if type is 'image')
const features = [
  {
    title: "Personalized Visualizations",
    description: 
      "Get AI-generated guided visualizations tailored to your specific goals, whether it's peak performance, stress reduction, or mental preparation for important events",
    type: "image",
    path: "/customize.png",
    alt: "Personalized Visualizations",
    svg: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className="w-6 h-6"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"
        />
      </svg>
    )
  },
  {
    title: "AI Voice Customization",
    description:
      "Choose from multiple AI voices or customize the perfect voice for your guided sessions. Adjust tone, pace, and background ambiance for the optimal experience",
    type: "image",
    path: "/voice.png",
    alt: "AI Voice Customization",
    svg: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className="w-6 h-6"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z"
        />
      </svg>
    )
  },
  {
    title: "For any goal",
    description: "Whether it's a big event, a new job, or a personal challenge, our AI can help you visualize success and achieve your goals",
    type: "image",
    path: "/goal.png",
    alt: "For any goal",
    svg: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className="w-6 h-6"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
      </svg>
    )
  }
];

// Updated Item component with better responsive classes
const Item = ({ feature, isOpen, setFeatureSelected }) => {
  const accordion = useRef(null);
  const { title, description, svg } = feature;

  return (
    <li className="border-b border-base-200 last:border-none">
      <button
        className="relative flex gap-2 items-center w-full py-4 sm:py-5 text-left"
        onClick={(e) => {
          e.preventDefault();
          setFeatureSelected();
        }}
        aria-expanded={isOpen}
      >
        <span className={`duration-100 flex-shrink-0`} style={{ color: isOpen ? "#cc6a4c" : "" }}>
          {svg}
        </span>
        <span
            className={`flex-1 text-sm sm:text-base md:text-lg`}
            style={{ color: isOpen ? "#cc6a4c" : "" }}
        >
          <h3 className="inline">{title}</h3>
        </span>
      </button>

      <div
        ref={accordion}
        className={`transition-all duration-300 ease-in-out text-base-content-secondary overflow-hidden`}
        style={
          isOpen
            ? { maxHeight: accordion?.current?.scrollHeight, opacity: 1 }
            : { maxHeight: 0, opacity: 0 }
        }
      >
        <div className="pb-4 sm:pb-5 pl-8 text-sm sm:text-base leading-relaxed">{description}</div>
      </div>
    </li>
  );
};

// Updated Media component with better responsive sizing
const Media = ({ feature }) => {
  const { type, path, format, alt, svg } = feature;
  const style = "rounded-2xl aspect-square w-full max-w-md mx-auto lg:max-w-lg";
  const size = {
    width: 500,
    height: 500,
  };

  if (type === "video") {
    return (
      <video
        className={style}
        autoPlay
        muted
        loop
        playsInline
        controls
        width={size.width}
        height={size.height}
      >
        <source src={path} type={format} />
      </video>
    );
  } else if (type === "image") {
    return (
      <Image
        src={path}
        alt={alt}
        className={`${style} object-contain object-top`}
        width={size.width}
        height={size.height}
      />
    );
  } else if (type === "svg") {
    return (
      <div className={`${style} !border-none bg-base-200 flex items-center justify-center`}>
        {svg}
      </div>
    );
  } else {
    return <div className={`${style} !border-none bg-base-200`}></div>;
  }
};

// A component to display 2 to 5 features in an accordion.
// By default, the first feature is selected. When a feature is clicked, the others are closed.
const FeaturesAccordion = () => {
  const [featureSelected, setFeatureSelected] = useState(0);

  return (
    <section
      className="py-12 sm:py-16 lg:py-20 space-y-12 sm:space-y-16 lg:space-y-20 max-w-7xl mx-auto bg-base-100"
      id="features"
      style={{ backgroundColor: "transparent" }}
    >
      <div className="px-4 sm:px-8">
        <h2 className="font-extrabold text-2xl sm:text-3xl lg:text-5xl tracking-tight mb-8 sm:mb-12 lg:mb-16">
          All you need to train your mind like a pro
          <span className="bg-neutral text-neutral-content px-2 sm:px-3 ml-1 sm:ml-2 leading-relaxed inline-block sm:inline" style={{ backgroundColor: "#cc6a4c" }}>
            and get results
          </span>
        </h2>
        
        <div className="flex flex-col lg:flex-row gap-8 sm:gap-12 lg:gap-20">
          <div className="grid grid-cols-1 items-start gap-8 sm:gap-12 lg:grid-cols-2 lg:gap-16 w-full">
            <ul className="w-full divide-y divide-base-200">
              {features.map((feature, i) => (
                <Item
                  key={feature.title}
                  index={i}
                  feature={feature}
                  isOpen={featureSelected === i}
                  setFeatureSelected={() => setFeatureSelected(i)}
                />
              ))}
            </ul>

            <div className="hidden lg:block sticky top-8">
              <Media feature={features[featureSelected]} key={featureSelected} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturesAccordion;
