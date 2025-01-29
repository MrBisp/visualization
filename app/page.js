'use client';
import LoginModal from "@/components/LoginModal";
import { useSession } from "next-auth/react";

export default function Page() {
  const { status } = useSession();

  return (
    <div className="h-screen w-full">
      {status === 'unauthenticated' && <LoginModal isAutoOpen={true} />}
      <h1>Hello</h1>
    </div>
  );
}
