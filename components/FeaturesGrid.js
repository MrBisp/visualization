/* eslint-disable @next/next/no-img-element */
import React from "react";

const studies = [
  {
    title: "Best Practices for Mental Training",
    description:
      "Systematic review shows optimal results come from <strong>17 minutes per sessions, 3 times per week</strong>. Even <strong>5 minutes daily</strong> can be effective when practice includes physical, environmental, and emotional elements.",
    citation: "Schuster et al., 2011",
    link: "https://bmcmedicine.biomedcentral.com/articles/10.1186/1741-7015-9-75",
    styles: "bg-base-200",
  },
  {
    title: "Mental Imagery Modifies Mood & Cognition",
    description: 
      "Research shows positive mental imagery generation <strong>alters mood and cognitive processing</strong> in adolescents, with effects enhanced by first-person perspective visualization.",
    citation: "Burnett Heyes et al., 2016",
    link: "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC5306169/",
    styles: "bg-base-200",
  },
  {
    title: "Visualization Enhances Athletic Performance",
    description:
      "<strong>Elite athletes</strong> across multiple sports use visualization to improve <strong>motor skills, increase strength, boost confidence, enhance attention, and reduce anxiety</strong>. Mental rehearsal fires the same neurons as physical practice.",
    citation: "Predoiu et al., 2020",
    link: "https://discobolulunefs.ro/media/September2020.4.pdf",
    styles: "bg-base-200", 
  },
  {
    title: "Imagination Reduces Threat Response",
    description:
      "Imagined exposure to threatening stimuli is <strong>as effective as real exposure</strong> in reducing threat-related neural patterns and physiological responses, engaging the brain's ventromedial prefrontal cortex.",
    citation: "Reddan et al., 2018",
    link: "https://www.cell.com/neuron/fulltext/S0896-6273(18)30955-3",
    styles: "bg-base-200",
  },
  {
    title: "Memory Powers Future Imagination",
    description:
      "Research reveals <strong>striking similarities</strong> between remembering the past and imagining the future. A common brain network underlies both processes, allowing us to use memories adaptively to simulate future scenarios.",
    citation: "Schacter et al., 2012",
    link: "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC3815616/",
    styles: "bg-base-200",
  },
  {
    title: "First-Person Visualization Boosts Health Intentions",
    description:
      "Research shows visualization combined with health information leads to <strong>significantly stronger intentions to adopt healthy behaviors</strong>. First-person perspective visualization was found to be <strong>more effective than third-person</strong>, increasing both self-efficacy and action planning.",
    citation: "Rennie et al., 2014",
    link: "https://pubmed.ncbi.nlm.nih.gov/24124985/",
    styles: "bg-base-200",
  },
  {
    title: "Sleep Enhances Visualization Learning",
    description:
      "Studies reveal that <strong>sleep plays a crucial role</strong> in strengthening visualization practice. A night of sleep after visualization training leads to <strong>significant performance improvements</strong>, with continued benefits across multiple nights.",
    citation: "Walker et al., 2003",
    link: "https://pmc.ncbi.nlm.nih.gov/articles/PMC202318/",
    styles: "bg-base-200",
  }
];

const FeaturesGrid = () => {
  return (
    <section className="py-20 bg-base-100" id="backed-by-neuroscience">
      <div className="flex flex-col max-w-[82rem] gap-16 md:gap-20 px-4 mx-auto">
        <h2 className="max-w-3xl font-black text-4xl md:text-6xl tracking-[-0.01em] text-base-content">
          Visualization is backed <br /> by {" "}
          <span className="underline decoration-dashed underline-offset-8 decoration-base-300">
            neuroscience
          </span>
        </h2>
        <div className="flex flex-col w-full h-fit gap-4 lg:gap-10 text-text-default max-w-[82rem]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-10">
            {studies.map((study) => (
              <a
                href={study.link}
                target="_blank"
                rel="noopener noreferrer" 
                key={study.title}
                className={`
                  ${study.styles} 
                  rounded-3xl flex flex-col gap-6 w-full h-fit p-6 
                  hover:bg-base-300 transition-all duration-300
                  group border border-base-300
                `}
              >
                <div className="space-y-4">
                  <h3 className="font-bold text-xl lg:text-2xl tracking-tight text-base-content">
                    {study.title}
                  </h3>
                  <p 
                    className="text-sm lg:text-base text-base-content/50 group-hover:text-base-content/90 transition-opacity duration-300"
                    dangerouslySetInnerHTML={{ 
                      __html: study.description 
                    }}
                  />
                  <p className="text-sm text-base-content/40 pt-2 group-hover:text-base-content/70 transition-opacity duration-300">
                    {study.citation}
                  </p>
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturesGrid;
