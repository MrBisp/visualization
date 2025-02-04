"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import logo from "@/app/icon.png";
import config from "@/config";

export default function LeftNavbar({ onLinkClick }) {
  const { data: session } = useSession();

  const navigationItems = [
    {
      name: "My Visualizations",
      href: "/dashboard/visualizations",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
        </svg>
      ),
    }
  ];

  return (
    <div className="flex flex-col h-screen bg-base-200 w-64 px-4 py-8" style={{ backgroundColor: "rgba(247, 228, 210, 0.5)" }}>
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2 mb-8 mt-6" onClick={onLinkClick}>
        <Image
          src={logo}
          alt={`${config.appName} logo`}
          className="w-8"
          width={32}
          height={32}
        />
        <span className="font-extrabold text-lg">{config.appName}</span>
      </Link>

      {/* Navigation Links */}
      <nav className="flex-1">
        <ul className="space-y-2">
          {navigationItems.map((item) => (
            <li key={item.name}>
              <Link
                href={item.href}
                className="flex items-center gap-3 px-4 py-2 rounded-lg transition-colors"
                style={{ backgroundColor: "#f7e4d2" }}
                onClick={onLinkClick}
              >
                {item.icon}
                <span>{item.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* User Profile Section */}
      {session && (
        <div className="border-t border-base-300 pt-4">
          <div className="flex items-center gap-3 px-4 py-2">
            {session.user?.image ? (
              <Image
                src={session.user.image}
                alt={session.user.name || "User"}
                width={40}
                height={40}
                className="rounded-full"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-content">
                {session.user?.name?.[0] || "U"}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {session.user?.name || "User"}
              </p>
              <p className="text-xs text-base-content/70 truncate">
                {session.user?.email}
              </p>
              <div className="flex items-center gap-1 mt-1">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-yellow-500">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.732 6.232a2.5 2.5 0 013.536 0 .75.75 0 101.06-1.06A4 4 0 006.5 8v.165c0 .364.034.728.1 1.085h-.35a.75.75 0 000 1.5h.737a5.25 5.25 0 01-.367 3.072l-.055.123a.75.75 0 00.848 1.037l1.272-.283a3.493 3.493 0 011.604.021 4.992 4.992 0 002.422 0l.97-.242a.75.75 0 00-.363-1.456l-.971.243a3.491 3.491 0 01-1.694 0 4.992 4.992 0 00-2.258-.038c.19-.811.227-1.651.111-2.477h.292a.75.75 0 000-1.5H8.824c-.059-.313-.09-.630-.09-.949v-.165z" clipRule="evenodd" />
                </svg>
                <span className="text-xs font-medium">{session.user?.credits || 0} credits</span>
              </div>
            </div>
          </div>
          <button
            onClick={() => {
              onLinkClick?.();
              signOut();
            }}
            className="w-full mt-2 flex items-center gap-3 px-4 py-2 text-error rounded-lg transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
            </svg>
            Sign out
          </button>
        </div>
      )}
    </div>
  );
} 