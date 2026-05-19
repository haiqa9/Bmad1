import { getCurrentUser } from "@/lib/session";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowRight, ShieldCheck, BarChart3, Users, Zap } from "lucide-react";

export default async function Home() {
  const user = await getCurrentUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="flex flex-col min-h-full">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 w-full border-b border-[#E8E8E8] bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1A50A3]">
              <span className="text-sm font-bold text-white">EF</span>
            </div>
            <span className="text-xl font-bold text-[#212427]">
              Expertflow <span className="text-[#1A50A3]">ITAM</span>
            </span>
          </div>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-lg bg-[#1A50A3] px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-[#153d80] hover:shadow-lg"
          >
            Sign In
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-white">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(26,80,163,0.08)_0%,_transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_rgba(0,189,130,0.06)_0%,_transparent_50%)]" />
        
        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8 lg:py-32">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#1A50A3]/20 bg-[#1A50A3]/5 px-4 py-1.5 text-sm font-medium text-[#1A50A3]">
              <Zap className="h-4 w-4" />
              Enterprise IT Asset Management
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight text-[#212427] sm:text-5xl lg:text-6xl">
              Manage IT Assets{" "}
              <span className="text-[#1A50A3]">Smarter</span>
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-600 sm:text-xl">
              Streamline the lifecycle of your hardware, software, and cloud assets. 
              From procurement to retirement, gain full visibility and control.
            </p>
            <div className="mt-10 flex items-center justify-center gap-4">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-xl bg-[#1A50A3] px-8 py-4 text-base font-semibold text-white shadow-lg shadow-[#1A50A3]/25 transition-all hover:bg-[#153d80] hover:shadow-xl"
              >
                Get Started
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                href="/api/health"
                className="inline-flex items-center gap-2 rounded-xl border-2 border-[#E8E8E8] bg-white px-8 py-4 text-base font-semibold text-[#212427] transition-all hover:border-[#1A50A3]/30 hover:bg-[#F5F6F9]"
              >
                System Status
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-[#F5F6F9] py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-[#212427] sm:text-4xl">
              Everything You Need
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              A complete solution for IT asset lifecycle management
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: <ShieldCheck className="h-7 w-7" />,
                title: "Asset Inventory",
                desc: "Centralized CMDB with full visibility across all asset types.",
                color: "bg-[#1A50A3]/10 text-[#1A50A3]",
              },
              {
                icon: <Users className="h-7 w-7" />,
                title: "Request Portal",
                desc: "Streamlined approval workflows for new asset requests.",
                color: "bg-[#00BD82]/10 text-[#00BD82]",
              },
              {
                icon: <BarChart3 className="h-7 w-7" />,
                title: "Compliance",
                desc: "Track license utilization, aging, and renewal dates.",
                color: "bg-[#F47C22]/10 text-[#F47C22]",
              },
              {
                icon: <Zap className="h-7 w-7" />,
                title: "Lifecycle Control",
                desc: "Manage assets from request through deployment to retirement.",
                color: "bg-[#2491E5]/10 text-[#2491E5]",
              },
            ].map((feature, i) => (
              <div
                key={i}
                className="group rounded-2xl bg-white p-8 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg"
              >
                <div
                  className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl ${feature.color}`}
                >
                  {feature.icon}
                </div>
                <h3 className="mb-2 text-lg font-semibold text-[#212427]">
                  {feature.title}
                </h3>
                <p className="text-sm leading-relaxed text-gray-500">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-[#E8E8E8] bg-white py-8">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <p className="text-sm text-gray-500">
            &copy; {new Date().getFullYear()} Expertflow. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
