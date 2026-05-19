import { getCurrentUser } from "@/lib/session";
import { redirect } from "next/navigation";
import { KpiCard } from "@/components/compliance/kpi-card";
import { ComplianceCharts } from "@/components/compliance/charts";
import {
  Package,
  FileText,
  ShieldCheck,
  AlertTriangle,
} from "lucide-react";

interface ComplianceData {
  kpis: {
    totalActiveAssets: number;
    pendingApprovals: number;
    licenseCompliance: number;
    expiringSoon: number;
    expiringWarranty: number;
    expiringLicenses: number;
  };
  charts: {
    assetsByType: { name: string; value: number }[];
    assetsByStatus: { name: string; value: number }[];
    assetsByDepartment: { name: string; value: number }[];
    costByDepartment: { name: string; value: number }[];
  };
}

async function getComplianceData(): Promise<ComplianceData> {
  const res = await fetch("http://localhost:3000/api/compliance", {
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to fetch compliance data");
  return res.json();
}

export default async function CompliancePage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const data = await getComplianceData();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#212427]">Compliance Dashboard</h1>
        <p className="text-gray-500">Overview of IT asset health and compliance metrics</p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Active Assets"
          value={data.kpis.totalActiveAssets}
          subtitle="Excluding retired"
          icon={<Package className="h-6 w-6 text-[#1A50A3]" />}
          color="bg-[#1A50A3]/10"
          href="/dashboard/assets"
        />
        <KpiCard
          title="Pending Approvals"
          value={data.kpis.pendingApprovals}
          subtitle="All stages"
          icon={<FileText className="h-6 w-6 text-[#F47C22]" />}
          color="bg-[#F47C22]/10"
          href="/dashboard/approvals"
        />
        <KpiCard
          title="License Compliance"
          value={`${data.kpis.licenseCompliance}%`}
          subtitle="Seats utilized"
          icon={<ShieldCheck className="h-6 w-6 text-[#00BD82]" />}
          color="bg-[#00BD82]/10"
        />
        <KpiCard
          title="Expiring Soon"
          value={data.kpis.expiringSoon}
          subtitle={`${data.kpis.expiringWarranty} warranty, ${data.kpis.expiringLicenses} licenses`}
          icon={<AlertTriangle className="h-6 w-6 text-red-500" />}
          color="bg-red-50"
        />
      </div>

      {/* Charts */}
      <ComplianceCharts
        assetsByType={data.charts.assetsByType}
        assetsByStatus={data.charts.assetsByStatus}
        assetsByDepartment={data.charts.assetsByDepartment}
        costByDepartment={data.charts.costByDepartment}
      />
    </div>
  );
}
