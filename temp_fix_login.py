import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect("192.168.1.38", username="root", password="ExpertFlow123", timeout=30)

new_content = '''"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, ShieldCheck } from "lucide-react";
import Link from "next/link";

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

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
      router.push(callbackUrl);
      router.refresh();
    }
  }

  async function handleGoogleSignIn() {
    setError("");
    await signIn("google", { callbackUrl });
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

            <button
              onClick={handleGoogleSignIn}
              className="flex w-full items-center justify-center gap-3 rounded-xl border border-[#E8E8E8] bg-white px-4 py-3 text-sm font-medium text-[#212427] shadow-sm transition-all hover:bg-[#F5F6F9] hover:shadow-md"
            >
              <GoogleIcon className="h-5 w-5" />
              Sign in with Google
            </button>

            <div className="my-6 flex items-center gap-3">
              <div className="h-px flex-1 bg-[#E8E8E8]" />
              <span className="text-xs font-medium text-gray-400">or</span>
              <div className="h-px flex-1 bg-[#E8E8E8]" />
            </div>

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

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-[#F5F6F9]">
        <div className="text-[#1A50A3] font-medium">Loading...</div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
'''

# Write the file
sftp = client.open_sftp()
with sftp.file('/opt/itam/app/login/page.tsx', 'w') as f:
    f.write(new_content)
sftp.close()

# Verify
stdin, stdout, stderr = client.exec_command('cat /opt/itam/app/login/page.tsx')
out = stdout.read().decode()
print("File updated. First 20 lines:")
print('\\n'.join(out.split('\\n')[:20]))
print("...")
print("Last 10 lines:")
print('\\n'.join(out.split('\\n')[-10:]))

client.close()
