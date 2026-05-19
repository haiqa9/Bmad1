"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

export function LogoutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/login" })}
      className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-gray-500 transition-all hover:bg-red-50 hover:text-red-600"
    >
      <LogOut className="h-[18px] w-[18px]" />
      Sign Out
    </button>
  );
}
