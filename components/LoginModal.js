"use client";

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import Modal from "@/components/Modal";
import { useRouter, useSearchParams } from 'next/navigation';
import Image from "next/image";

const LoginModal = ({ isAutoOpen = false }) => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const inviteCode = searchParams.get('invite');

    return (
        <Modal
            isOpen={isAutoOpen}
            setIsOpen={() => { }} // Keep modal open since we want users to sign up/login
            title="Welcome to [App Name]!"
        >
            <div className="space-y-6 py-4">
                {inviteCode && (
                    <div className="text-center bg-gray-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-600">
                            Someone invited you to join! Sign up to connect with them.
                        </p>
                    </div>
                )}

                <div className="space-y-4">
                    {/* Google Sign In */}
                    <button
                        onClick={() => signIn('google')}
                        className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 rounded-lg px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                        <div className="w-5 h-5 relative">
                            <Image
                                src="https://www.google.com/favicon.ico"
                                alt="Google"
                                width={20}
                                height={20}
                                className="object-contain"
                            />
                        </div>
                        Continue with Google
                    </button>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-200"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-white text-gray-500">or</span>
                        </div>
                    </div>

                    {/* Email Sign Up/Login */}
                    <button
                        onClick={() => router.push(`/auth/signup${inviteCode ? `?invite=${inviteCode}` : ''}`)}
                        className="w-full bg-black text-white rounded-lg px-4 py-2 hover:bg-gray-800 transition-colors"
                    >
                        Sign up with email
                    </button>

                    <div className="text-center">
                        <p className="text-sm text-gray-600">
                            Already have an account?{' '}
                            <button
                                onClick={() => router.push('/auth/login')}
                                className="text-black hover:underline font-medium"
                            >
                                Log in
                            </button>
                        </p>
                    </div>
                </div>

                <div className="text-center text-xs text-gray-500">
                    <p>
                        By signing up, you agree to our{' '}
                        <a href="/terms" className="underline hover:text-gray-700">Terms</a>
                        {' '}and{' '}
                        <a href="/privacy" className="underline hover:text-gray-700">Privacy Policy</a>
                    </p>
                </div>
            </div>
        </Modal>
    );
};

export default LoginModal;