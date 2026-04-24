"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { logout, subscribeToAuth } from "@/lib/auth";
import type { User } from "firebase/auth";

export default function AuthButton() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    return subscribeToAuth(setUser);
  }, []);

  async function handleLogout() {
    await logout();
  }

  if (!user) {
    return (
      <Link
        href="/login"
        className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
      >
        Anmelden
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <Link
        href="/settings"
        className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
      >
        Einstellungen
      </Link>
      <button
        onClick={handleLogout}
        className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
      >
        Abmelden
      </button>
    </div>
  );
}