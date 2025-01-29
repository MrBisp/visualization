'use client';

import { useState, useEffect, Suspense } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from "react-hot-toast";

function SignupContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const inviteCode = searchParams.get('invite');
    const [isLoading, setIsLoading] = useState(false);
    const [inviter, setInviter] = useState(null);
    const [formData, setFormData] = useState({
        email: "",
        password: "",
        name: "",
    });
    const [error, setError] = useState(null);
    const { data: session } = useSession();

    // Validate invite code if present
    useEffect(() => {
        const validateInvite = async () => {
            if (!inviteCode) return;

            try {
                const response = await fetch('/api/invites/validate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ code: inviteCode }),
                });

                const data = await response.json();
                if (response.ok) {
                    setInviter(data.inviter);
                }
            } catch (error) {
                console.error('Error validating invite:', error);
            }
        };

        validateInvite();
    }, [inviteCode]);

    useEffect(() => {
        // Redirect to signup page with invite code
        if (inviteCode) {
            router.push(`/auth/signup?invite=${inviteCode}`);
        } else {
            router.push('/auth/signup');
        }
    }, [inviteCode, router]);

    // Redirect to onboarding if already logged in
    useEffect(() => {
        if (session?.user) {
            if (session.user.hasCompletedOnboarding) {
                router.push('/');
            } else {
                router.push('/onboarding');
            }
        }
    }, [session, router]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            // Register new user
            const registerResponse = await fetch("/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...formData,
                    inviteCode
                }),
            });

            if (!registerResponse.ok) {
                const error = await registerResponse.json();
                setError(error.error);
            }

            // Sign in the user
            const result = await signIn("credentials", {
                email: formData.email,
                password: formData.password,
                redirect: false,
            });

            if (result?.error) {
                throw new Error(result.error);
            }

            toast.success("Welcome to [App Name]!");
            router.push('/onboarding');
        } catch (error) {
            toast.error(error.message);
            setError(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
            <div className="max-w-md w-full space-y-8">
                <div className="text-center">
                    {inviter ? (
                        <>
                            <h2 className="text-3xl font-bold text-gray-900">
                                Join {inviter.name} on [App Name]
                            </h2>
                            <p className="mt-2 text-sm text-gray-600">
                                Create your account to connect
                            </p>
                        </>
                    ) : (
                        <>
                            <h2 className="text-3xl font-bold text-gray-900">
                                Create your account
                            </h2>
                            <p className="mt-2 text-sm text-gray-600">
                                Start sharing your favorite places
                            </p>
                        </>
                    )}
                </div>

                <form onSubmit={handleSubmit} className="mt-8 space-y-6">
                    <div className="rounded-md shadow-sm space-y-4">
                        <div>
                            <label htmlFor="name" className="sr-only">
                                Name
                            </label>
                            <input
                                id="name"
                                name="name"
                                type="text"
                                required
                                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                                placeholder="Name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                        <div>
                            <label htmlFor="email-address" className="sr-only">
                                Email address
                            </label>
                            <input
                                id="email-address"
                                name="email"
                                type="email"
                                required
                                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                                placeholder="Email address"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>
                        <div>
                            <label htmlFor="password" className="sr-only">
                                Password
                            </label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                required
                                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                                placeholder="Password"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            />
                        </div>
                    </div>

                    <div>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            {isLoading && (
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3.148 7.935l3.801-3.801zm1.414 1.414l-3.801 3.801A7.962 7.962 0 0112 20h.008c.079 0 .153.026.224.062l3.801-3.801z"></path>
                                </svg>
                            )}
                            {isLoading ? (
                                "Signing up..."
                            ) : (
                                "Sign Up"
                            )}
                        </button>
                        {error && <p className="text-red-500 mt-2 text-sm">{error}</p>}
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function SignupPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
        }>
            <SignupContent />
        </Suspense>
    );
} 