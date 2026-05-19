"use client";

import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const COLORS = ["#1A50A3", "#00BD82", "#F47C22", "#2491E5", "#8B5CF6", "#F6BF2C"];

interface ChartData {
  name: string;
  value: number;
}

interface ComplianceChartsProps {
  assetsByType: ChartData[];
  assetsByStatus: ChartData[];
  assetsByDepartment: ChartData[];
  costByDepartment: ChartData[];
}

export function ComplianceCharts({
  assetsByType,
  assetsByStatus,
  assetsByDepartment,
  costByDepartment,
}: ComplianceChartsProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Assets by Type - Pie */}
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-sm font-semibold text-[#212427]">Assets by Type</h3>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={assetsByType}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={4}
              dataKey="value"
              label={({ name, percent }) =>
                `${name}: ${((percent || 0) * 100).toFixed(0)}%`
              }
            >
              {assetsByType.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Assets by Status - Donut */}
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-sm font-semibold text-[#212427]">Assets by Status</h3>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={assetsByStatus}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={4}
              dataKey="value"
              label={({ name, percent }) =>
                `${name}: ${((percent || 0) * 100).toFixed(0)}%`
              }
            >
              {assetsByStatus.map((_, index) => (
                <Cell key={`cell-status-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Assets by Department - Bar */}
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-sm font-semibold text-[#212427]">Assets by Department</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={assetsByDepartment}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E8E8E8" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Bar dataKey="value" fill="#1A50A3" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Cost by Department - Bar */}
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-sm font-semibold text-[#212427]">Asset Count by Cost Center</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={costByDepartment}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E8E8E8" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Bar dataKey="value" fill="#00BD82" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
