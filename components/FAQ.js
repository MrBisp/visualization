"use client";

import { useRef, useState } from "react";

// <FAQ> component is a lsit of <Item> component
// Just import the FAQ & add your FAQ content to the const faqList

const faqList = [
  {
    question: "How does the AI visualization generator work?",
    answer: (
      <div className="space-y-2 leading-relaxed">
        <p>Our app works in 4 simple steps:</p>
        <ol className="list-decimal pl-4 space-y-1">
          <li>You set your intention and choose what you want to focus on (e.g., productivity, relaxation, motivation)</li>
          <li>Our AI generates a personalized audio journey based on your specific needs</li>
          <li>You listen and immerse yourself in your custom visualization</li>
          <li>You can refine your preferences and create new visualizations anytime</li>
        </ol>
      </div>
    ),
  },
  {
    question: "What's included in the free version?",
    answer: (
      <div className="space-y-2 leading-relaxed">
        <p>With the free version, you can:</p>
        <ul className="list-disc pl-4">
          <li>Generate preview visualizations</li>
          <li>Access temporary visualizations that expire after 1 hour</li>
          <li>Try out the core features of our platform</li>
        </ul>
        <p>Sign up for a full account to save your visualizations permanently and access all features!</p>
      </div>
    ),
  },
  {
    question: "How long should I use the visualizations?",
    answer: (
      <div className="space-y-2 leading-relaxed">
        Just a few minutes a day can make a noticeable difference in your mindset and performance. You can listen to your visualizations anywhere, anytime - during workouts, before meetings, or as part of your daily routine. Our method is backed by neuroscience and is proven to enhance focus, reduce stress, and improve outcomes.
      </div>
    ),
  },
  {
    question: "Can I get a refund?",
    answer: (
      <p>
        Yes! You can request a refund within 7 days of your purchase. Please reach out to us by email and we&apos;ll be happy to help.
      </p>
    ),
  },
  {
    question: "Can I generate multiple visualizations?",
    answer: (
      <div className="space-y-2 leading-relaxed">
        Yes, you can generate multiple visualizations based on different goals and needs. However, please note that audio generation is resource-intensive, so there are some limitations in place to prevent excessive generation. Each visualization is carefully crafted to be unique and personalized to your specific needs.
      </div>
    ),
  },
  {
    question: "How do I access my saved visualizations?",
    answer: (
      <div className="space-y-2 leading-relaxed">
        When you sign up for a full account, your visualizations are securely stored and can be accessed at any time through your dashboard. We use private storage to ensure your visualizations remain secure and accessible only to you through authenticated access.
      </div>
    ),
  },
];

const Item = ({ item }) => {
  const accordion = useRef(null);
  const [isOpen, setIsOpen] = useState(false);

  return (
    <li>
      <button
        className="relative flex gap-2 items-center w-full py-5 text-base font-semibold text-left border-t md:text-lg border-base-content/10"
        onClick={(e) => {
          e.preventDefault();
          setIsOpen(!isOpen);
        }}
        aria-expanded={isOpen}
      >
        <span
          className={`flex-1 text-base-content ${isOpen ? "text-primary" : ""}`}
        >
          {item?.question}
        </span>
        <svg
          className={`flex-shrink-0 w-4 h-4 ml-auto fill-current`}
          viewBox="0 0 16 16"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect
            y="7"
            width="16"
            height="2"
            rx="1"
            className={`transform origin-center transition duration-200 ease-out ${
              isOpen && "rotate-180"
            }`}
          />
          <rect
            y="7"
            width="16"
            height="2"
            rx="1"
            className={`transform origin-center rotate-90 transition duration-200 ease-out ${
              isOpen && "rotate-180 hidden"
            }`}
          />
        </svg>
      </button>

      <div
        ref={accordion}
        className={`transition-all duration-300 ease-in-out opacity-80 overflow-hidden`}
        style={
          isOpen
            ? { maxHeight: accordion?.current?.scrollHeight, opacity: 1 }
            : { maxHeight: 0, opacity: 0 }
        }
      >
        <div className="pb-5 leading-relaxed">{item?.answer}</div>
      </div>
    </li>
  );
};

const FAQ = () => {
  return (
    <section className="" id="faq" style={{ backgroundColor: "rgba(0, 0, 0, 0.05)" }}>
      <div className="py-24 px-8 max-w-7xl mx-auto flex flex-col md:flex-row gap-12">
        <div className="flex flex-col text-left basis-1/2">
          <p className="inline-block font-semibold text-primary mb-4">FAQ</p>
          <p className="sm:text-4xl text-3xl font-extrabold text-base-content">
            Frequently Asked Questions
          </p>
        </div>

        <ul className="basis-1/2">
          {faqList.map((item, i) => (
            <Item key={i} item={item} />
          ))}
        </ul>
      </div>
    </section>
  );
};

export default FAQ;
