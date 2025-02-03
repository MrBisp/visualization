'use client';

import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Header from "@/components/Header";
import LeftNavbar from "@/components/LeftNavbar";
import { useState } from 'react';

export default function RootLayoutContent({ children }) {
    const pathname = usePathname();
    const { data: session } = useSession();
    const isDashboard = pathname?.startsWith('/dashboard');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const closeMobileMenu = () => setIsMobileMenuOpen(false);

    // For dashboard routes or logged-in users
    if (isDashboard || session?.user) {
        return (
            <div className="min-h-screen">
                {/* Desktop Sidebar */}
                <div className="hidden md:block fixed top-0 left-0 h-full" style={{ zIndex: 100 }}>
                    <LeftNavbar onLinkClick={closeMobileMenu} />
                </div>

                {/* Mobile Menu Button */}
                <button 
                    className="md:hidden fixed top-4 left-4 z-50 btn btn-circle btn-ghost"
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                    </svg>
                </button>

                {/* Mobile Menu */}
                <div className={`md:hidden fixed inset-y-0 left-0 transform ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} z-40 w-64 transition-transform duration-300 ease-in-out`}>
                    <LeftNavbar onLinkClick={closeMobileMenu} />
                </div>

                {/* Backdrop */}
                {isMobileMenuOpen && (
                    <div 
                        className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
                        onClick={closeMobileMenu}
                    />
                )}

                {/* Main Content */}
                <main className="w-full md:pl-64">
                    <div className="max-w-7xl mx-auto px-4 pt-16 pb-8 md:p-8">
                        {children}
                    </div>
                </main>
            </div>
        );
    }

    // For public routes (not logged in)
    return (
        <>
            <Header />
            <main className="w-full">
                <div className="max-w-8xl mx-auto px-4 py-8 md:p-8">
                    {children}
                </div>
            </main>
        </>
    );
} 