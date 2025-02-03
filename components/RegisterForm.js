"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";
import PropTypes from 'prop-types';

const RegisterForm = ({ shouldRedirect = true, onSuccess }) => {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [formData, setFormData] = useState({
        email: "",
        password: "",
        name: "",
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            // Register the user
            const registerResponse = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            const registerData = await registerResponse.json();

            if (!registerResponse.ok) {
                throw new Error(registerData.error || 'Failed to register');
            }

            toast.success("Account created successfully!");

            // Sign in the user
            const result = await signIn('credentials', {
                email: formData.email,
                password: formData.password,
                redirect: false,
            });

            if (result?.error) {
                throw new Error(result.error);
            }

            // Call onSuccess if provided
            if (onSuccess) {
                try {
                    await onSuccess();
                    toast.success("Visualization saved to your account!");
                } catch (err) {
                    console.error('Error in onSuccess:', err);
                    toast.error("Account created but failed to save visualization. Please try again later.");
                }
            }

            // Redirect if needed
            if (shouldRedirect) {
                router.push('/dashboard');
            } else {
                setIsSuccess(true);
                // Reset form
                setFormData({
                    email: "",
                    password: "",
                    name: "",
                });
            }
        } catch (err) {
            console.error('Registration error:', err);
            toast.error(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    if (isSuccess && !shouldRedirect) {
        return (
            <div className="text-center p-6 bg-success/10 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-success mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <h3 className="text-lg font-semibold text-success mb-2">Account Created Successfully!</h3>
                <p className="text-gray-600">You can now use your account to save and access your visualizations.</p>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="label">
                    <span className="label-text">Name</span>
                </label>
                <input
                    type="text"
                    className="input input-bordered w-full"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
            </div>

            <div>
                <label className="label">
                    <span className="label-text">Email</span>
                </label>
                <input
                    type="email"
                    className="input input-bordered w-full"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                />
            </div>

            <div>
                <label className="label">
                    <span className="label-text">Password</span>
                </label>
                <input
                    type="password"
                    className="input input-bordered w-full"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                />
            </div>

            <button
                type="submit"
                className="btn btn-primary w-full"
                disabled={isLoading}
            >
                {isLoading ? (
                    <span className="loading loading-spinner loading-sm"></span>
                ) : (
                    "Register"
                )}
            </button>

            {/*<div className="divider">OR</div>

            <button
                type="button"
                className="btn btn-outline w-full"
                onClick={() => signIn("google")}
            >
                Continue with Google
            </button>*/}
        </form>
    );
};

RegisterForm.propTypes = {
    shouldRedirect: PropTypes.bool,
    onSuccess: PropTypes.func
};

export default RegisterForm;