'use client';

import { useState } from "react";
import { toast } from "react-hot-toast";
import apiClient from "@/libs/api";
import Link from "next/link";
import { useSearchParams } from 'next/navigation';

export default function SignupPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const searchParams = useSearchParams();

  const planId = searchParams.get('plan');
  const planName = searchParams.get('name');
  const planPrice = searchParams.get('price');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Get UTM parameters and other metadata
      const metadata = {
        utm_source: searchParams.get('utm_source'),
        utm_medium: searchParams.get('utm_medium'),
        utm_campaign: searchParams.get('utm_campaign'),
        referrer: document.referrer,
        plan: {
          id: planId,
          name: planName,
          price: planPrice
        }
      };

      await apiClient.post("/waitlist/join", { 
        email,
        metadata
      });
      setIsSubmitted(true);
    } catch (error) {
      console.error(error);
      if (error.response?.status === 409) {
        toast.error("You're already on the waitlist! We'll notify you when we launch.");
      } else {
        toast.error("Something went wrong. Please try again.");
      }
    }

    setIsLoading(false);
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md w-full space-y-8 text-center">
          <div className="space-y-4">
            <h1 className="text-3xl font-bold">Thanks for your interest!</h1>
            <p className="text-lg text-base-content/80">
              We&apos;ll notify you as soon as the pro plan launches in a few days.
            </p>
            {planName && (
              <p className="text-base-content/80">
                We&apos;ll make sure to reserve your {planName} (${planPrice}) package!
              </p>
            )}
            <Link href="/" className="btn btn-primary">
              Return Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold">Coming Soon!</h1>
          <p className="text-lg text-base-content/80">
            The pro plan has not yet been implemented. Want to get an email once we launch? It&apos;s expected to happen within a few days.
          </p>
          {planName && (
            <div className="mt-4 p-4 bg-base-200 rounded-lg">
              <p className="font-semibold">Selected Package:</p>
              <p className="text-xl">{planName}</p>
              <p className="text-primary font-bold">${planPrice}</p>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div>
            <label htmlFor="email" className="sr-only">
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input input-bordered w-full"
              placeholder="Enter your email"
            />
          </div>
          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="loading loading-spinner loading-xs"></span>
            ) : (
              "Notify me at launch"
            )}
          </button>
          <div className="text-center">
            <Link href="/" className="btn btn-ghost btn-sm">
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
} 