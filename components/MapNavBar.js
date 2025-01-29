"use client";

import { useSession } from "next-auth/react";
import { signOut } from "next-auth/react";
import Link from "next/link";
import ProfileImage from '@/components/ProfileImage';

const MapNavBar = () => {
    const { data: session, status } = useSession();

    if (status !== "authenticated") {
        return null;
    }

    return (
        <div id="bottom-navbar" className="fixed bottom-0 left-0 right-0 bg-base-100 shadow-lg">
            <div className="flex justify-around items-center p-4">
                <a href="/" className="flex flex-col items-center">
                    🗺️
                    <span className="text-xs mt-1">Explore</span>
                </a>

                <a href="/dashboard/profile/friends" className="flex flex-col items-center">
                    👥
                    <span className="text-xs mt-1">Friends</span>
                </a>

                <a href="/dashboard/profile/reviews/new" className="flex flex-col items-center">
                    📝
                    <span className="text-xs mt-1">Add</span>
                </a>

                <Link href="/dashboard/profile" className="flex flex-col items-center">
                    <ProfileImage
                        user={session.user}
                        size="sm"
                    />
                    <span className="text-xs mt-1">Me</span>
                </Link>
            </div>
        </div>
    );
};

export default MapNavBar;