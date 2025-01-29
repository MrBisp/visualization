'use client';

import { Suspense } from 'react';

function LoginContent() {
    // Your existing component code here
    // Move everything from the current LoginPage component here
}

export default function LoginPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
        }>
            <LoginContent />
        </Suspense>
    );
}