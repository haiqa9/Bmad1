"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Loader2, X } from "lucide-react";
import Link from "next/link";

interface Employee {
  id: string;
  email: string;
  name: string;
  department: string;
  role: string;
}

interface RequestFormProps {
  userEmail: string;
  userDepartment: string;
  userRole: string;
}

export function RequestForm({ userEmail, userDepartment, userRole }: RequestFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [type, setType] = useState<string | null>("HARDWARE");
  const [urgency, setUrgency] = useState<string | null>("MEDIUM");

  const isManager = userRole === "IT_ASSET_MANAGER";
  const [employees, setEmployees] = useState<Employee[]>([]);

  // Searchable "on behalf of" state
  const [search, setSearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [customEmail, setCustomEmail] = useState("");
  const [customDepartment, setCustomDepartment] = useState("");
  const searchRef = useRef<HTMLDivElement>(null);

  // Fetch employees for IT_ASSET_MANAGER
  useEffect(() => {
    if (!isManager) return;
    fetch("/api/users")
      .then((res) => res.json())
      .then((json) => {
        if (json.users) {
          setEmployees(json.users);
        }
      })
      .catch(() => {
        // silently fail
      });
  }, [isManager]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredEmployees = employees.filter(
    (emp) =>
      emp.name.toLowerCase().includes(search.toLowerCase()) ||
      emp.email.toLowerCase().includes(search.toLowerCase()) ||
      emp.department.toLowerCase().includes(search.toLowerCase())
  );

  function selectEmployee(emp: Employee) {
    setSelectedEmployee(emp);
    setCustomEmail(emp.email);
    setCustomDepartment(emp.department);
    setSearch(`${emp.name} (${emp.email})`);
    setShowDropdown(false);
  }

  function clearSelection() {
    setSelectedEmployee(null);
    setCustomEmail("");
    setCustomDepartment("");
    setSearch("");
    setShowDropdown(false);
  }

  const effectiveEmail = selectedEmployee?.email || customEmail || userEmail;
  const effectiveDepartment = selectedEmployee?.department || customDepartment || userDepartment;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const data = {
      title: formData.get("title") as string,
      type: type || "HARDWARE",
      justification: formData.get("justification") as string,
      urgency: urgency || "MEDIUM",
      requestedBy: effectiveEmail,
      requestedByName: selectedEmployee?.name || customEmail || null,
      department: effectiveDepartment,
    };

    try {
      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const json = await res.json();

      if (!res.ok) {
        setError(json.error || "Failed to submit request");
        return;
      }

      router.push("/dashboard/requests");
      router.refresh();
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
      <div className="flex items-center gap-2">
        <Link
          href="/dashboard/requests"
          className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Requests
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
          Request New Asset
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400">
          Submit a request for a new IT asset
        </p>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="title">Asset Title *</Label>
          <Input
            id="title"
            name="title"
            placeholder="e.g. Dell XPS 15 Laptop"
            required
          />
        </div>

        <div className="space-y-2">
          <Label>Asset Type *</Label>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="HARDWARE">Hardware</SelectItem>
              <SelectItem value="SOFTWARE">Software</SelectItem>
              <SelectItem value="CLOUD">Cloud</SelectItem>
              <SelectItem value="PERIPHERAL">Peripheral</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Urgency *</Label>
          <Select value={urgency} onValueChange={setUrgency}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="LOW">Low</SelectItem>
              <SelectItem value="MEDIUM">Medium</SelectItem>
              <SelectItem value="HIGH">High</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isManager && (
          <>
            <div className="space-y-2 md:col-span-2" ref={searchRef}>
              <Label>Request On Behalf Of</Label>
              <div className="relative">
                <Input
                  placeholder="Type name or email to search..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setCustomEmail(e.target.value);
                    setShowDropdown(true);
                    if (selectedEmployee) {
                      setSelectedEmployee(null);
                      setCustomDepartment("");
                    }
                  }}
                  onFocus={() => setShowDropdown(true)}
                />
                {selectedEmployee && (
                  <button
                    type="button"
                    onClick={clearSelection}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
                {showDropdown && filteredEmployees.length > 0 && (
                  <div className="absolute z-10 mt-1 w-full rounded-md border border-zinc-200 bg-white shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
                    {filteredEmployees.map((emp) => (
                      <button
                        key={emp.id}
                        type="button"
                        onClick={() => selectEmployee(emp)}
                        className="flex w-full flex-col items-start px-3 py-2 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800"
                      >
                        <span className="font-medium">{emp.name}</span>
                        <span className="text-xs text-zinc-500">
                          {emp.email} — {emp.department}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {selectedEmployee ? (
                <p className="text-xs text-zinc-500">
                  Request will be submitted for:{" "}
                  <strong>{selectedEmployee.name}</strong> ({selectedEmployee.email}) —{" "}
                  {selectedEmployee.department}
                </p>
              ) : customEmail ? (
                <p className="text-xs text-zinc-500">
                  Request will be submitted for:{" "}
                  <strong>{customEmail}</strong> — department will default to{" "}
                  {userDepartment}
                </p>
              ) : null}
            </div>

            {/* Show department override when typing a custom email not in system */}
            {!selectedEmployee && customEmail && (
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="customDepartment">Department</Label>
                <Input
                  id="customDepartment"
                  placeholder="Enter department"
                  value={customDepartment}
                  onChange={(e) => setCustomDepartment(e.target.value)}
                />
              </div>
            )}
          </>
        )}

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="justification">Justification *</Label>
          <Textarea
            id="justification"
            name="justification"
            placeholder="Explain why this asset is needed..."
            rows={4}
            required
          />
        </div>
      </div>

      <div className="flex items-center gap-3 pt-4">
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Submit Request
        </Button>
        <Link href="/dashboard/requests">
          <Button type="button" variant="outline">
            Cancel
          </Button>
        </Link>
      </div>
    </form>
  );
}
