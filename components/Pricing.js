import ButtonCheckoutFakeDoor from "./ButtonCheckoutFakeDoor";

const plans = [
  {
    name: "Starter Pack",
    description: "Perfect for trying out our AI visualizations",
    price: 10,
    priceId: "starter-10",
    features: [
      { name: "10 AI-generated visualization audio files" },
      { name: "High-quality audio generation" },
      { name: "Access to all visualization types" },
      { name: "Download your audio files" },
      { name: "Valid for 1 year" },
    ],
  },
  {
    name: "Pro Pack",
    description: "Best value for serious users",
    price: 50,
    priceId: "pro-50",
    isFeatured: true,
    features: [
      { name: "100 AI-generated visualization audio files" },
      { name: "High-quality audio generation" },
      { name: "Access to all visualization types" },
      { name: "Download your audio files" },
      { name: "Priority support" },
      { name: "Valid for 1 year" },
    ],
  },
];

// <Pricing/> displays the pricing plans for your app
// It's your Stripe config in config.js.stripe.plans[] that will be used to display the plans
// <ButtonCheckoutFakeDoor /> renders a button that will show an email collection form when clicked

const Pricing = () => {
  return (
    <section className="" id="pricing" style={{ backgroundColor: "rgba(0, 0, 0, 0.05)" }}>
      <div className="py-24 px-8 max-w-5xl mx-auto">
        <div className="flex flex-col text-center w-full mb-20">
          <p className="font-medium text-primary mb-8">Pricing</p>
          <h2 className="font-bold text-3xl lg:text-5xl tracking-tight">
            Choose Your Visualization Package
          </h2>
          <p className="mt-4 text-xl text-base-content/80">
            Get started with our affordable plans and transform your mindset
          </p>
        </div>

        <div className="relative flex justify-center flex-col lg:flex-row items-center lg:items-stretch gap-8">
          {plans.map((plan) => (
            <div key={plan.priceId} className="relative w-full max-w-lg">
              {plan.isFeatured && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
                  <span
                    className={`badge text-xs text-primary-content font-semibold border-0 bg-primary`}
                  >
                    BEST VALUE
                  </span>
                </div>
              )}

              {plan.isFeatured && (
                <div
                  className={`absolute -inset-[1px] rounded-[9px] bg-primary z-10`}
                ></div>
              )}

              <div className="relative flex flex-col h-full gap-5 lg:gap-8 z-10 bg-base-100 p-8 rounded-lg">
                <div className="flex justify-between items-center gap-4">
                  <div>
                    <p className="text-lg lg:text-xl font-bold">{plan.name}</p>
                    {plan.description && (
                      <p className="text-base-content/80 mt-2">
                        {plan.description}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-end gap-2">
                  <p className={`text-5xl tracking-tight font-extrabold`}>
                    ${plan.price}
                  </p>
                  <div className="flex flex-col justify-end mb-2">
                    <p className="text-xs text-base-content/60 uppercase font-semibold">
                      USD
                    </p>
                  </div>
                </div>
                {plan.features && (
                  <ul className="space-y-2.5 leading-relaxed text-base flex-1">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          className="w-[18px] h-[18px] opacity-80 shrink-0"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span>{feature.name}</span>
                      </li>
                    ))}
                  </ul>
                )}
                <div className="space-y-2">
                  <ButtonCheckoutFakeDoor 
                    priceId={plan.priceId} 
                    planName={plan.name}
                    price={plan.price}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Pricing;
