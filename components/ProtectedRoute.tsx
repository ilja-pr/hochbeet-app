"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { subscribeToAuth } from "@/lib/auth";
import type { User } from "firebase/auth";

export default function ProtectedRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [user, setUser] = useState<User | null | undefined>(undefined);

  useEffect(() => {
    const unsub = subscribeToAuth((nextUser) => {
      setUser(nextUser);
      if (!nextUser) {
        router.replace("/login");
      }
    });

    return unsub;
  }, [router]);

  if (user === undefined) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        Lade Anmeldung ...
      </div>
    );
  }

  if (!user) return null;

  return <>{children}</>;
}