/* eslint-disable @next/next/no-img-element */
"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import LoginModal from "./LoginModal";

const ButtonSignin = ({ text = "Get started", extraStyle }) => {
  const { data: session, status } = useSession();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Show welcome message when authenticated
  if (status === "authenticated") {
    return (
      <span className="text-base-content">
        Welcome, {session.user?.name || session.user?.email || "User"}
      </span>
    );
  }

  // Show login button and modal when not authenticated
  return (
    <>
      <button
        className={`btn ${extraStyle ? extraStyle : ""}`}
        onClick={() => setIsModalOpen(true)}
      >
        {text}
      </button>
      {isModalOpen && <LoginModal isAutoOpen={true} />}
    </>
  );
};

export default ButtonSignin;
