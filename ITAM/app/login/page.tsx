"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ArrowRight, ShieldCheck } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("Invalid email or password");
    } else {
      router.push("/dashboard");
      router.refresh();
    }
  }

  return (
    <div className="flex min-h-full flex-col bg-[#F5F6F9]">
      {/* Top bar */}
      <div className="w-full border-b border-[#E8E8E8] bg-white px-4 py-4 sm:px-6">
        <Link href="/" className="inline-flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1A50A3]">
            <span className="text-sm font-bold text-white">EF</span>
          </div>
          <span className="text-lg font-bold text-[#212427]">
            Expertflow <span className="text-[#1A50A3]">ITAM</span>
          </span>
        </Link>
      </div>

      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {/* Card */}
          <div className="rounded-2xl bg-white p-8 shadow-lg shadow-black/5">
            <div className="mb-6 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#1A50A3]/10">
                <ShieldCheck className="h-7 w-7 text-[#1A50A3]" />
              </div>
              <h1 className="text-2xl font-bold text-[#212427]">
                Welcome Back
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Sign in to access the ITAM portal
              </p>
            </div>

            {error && (
              <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[#212427]">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@expertflow.com"
                  required
                  className="w-full rounded-xl border border-[#E8E8E8] bg-white px-4 py-3 text-sm text-[#212427] placeholder:text-gray-400 outline-none transition-all focus:border-[#1A50A3] focus:ring-2 focus:ring-[#1A50A3]/20"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[#212427]">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full rounded-xl border border-[#E8E8E8] bg-white px-4 py-3 text-sm text-[#212427] placeholder:text-gray-400 outline-none transition-all focus:border-[#1A50A3] focus:ring-2 focus:ring-[#1A50A3]/20"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#1A50A3] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-[#1A50A3]/25 transition-all hover:bg-[#153d80] hover:shadow-xl disabled:opacity-50"
              >
                {loading ? "Signing in..." : "Sign In"}
                {!loading && <ArrowRight className="h-4 w-4" />}
              </button>
            </form>

            <div className="mt-6 rounded-xl bg-[#F5F6F9] p-4">
              <p className="mb-2 text-xs font-semibold text-[#212427]">
                Demo Accounts
              </p>
              <div className="space-y-1 text-xs text-gray-500">
                <p><span className="font-medium text-[#1A50A3]">employee@expertflow.com</span> (password123)</p>
                <p><span className="font-medium text-[#1A50A3]">depthead@expertflow.com</span> (password123)</p>
                <p><span className="font-medium text-[#1A50A3]">itops@expertflow.com</span> (password123)</p>
                <p><span className="font-medium text-[#1A50A3]">assetmgr@expertflow.com</span> (password123)</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
