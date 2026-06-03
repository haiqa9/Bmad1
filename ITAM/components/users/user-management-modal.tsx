"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Users, Plus, Pencil, Trash2, Search } from "lucide-react";

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  department: string;
  createdAt: string;
  updatedAt: string;
}

const ROLES = ["EMPLOYEE", "DEPT_HEAD", "IT_OPS", "IT_ASSET_MANAGER"];

export function UserManagementModal() {
  const [open, setOpen] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  // Form state
  const [formOpen, setFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "EMPLOYEE",
    department: "General",
  });
  const [saving, setSaving] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/users");
      if (!res.ok) throw new Error("Failed to fetch users");
      const json = await res.json();
      setUsers(json.users || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) fetchUsers();
  }, [open, fetchUsers]);

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      password: "",
      role: "EMPLOYEE",
      department: "General",
    });
    setEditingUser(null);
    setError("");
  };

  const openAdd = () => {
    resetForm();
    setFormOpen(true);
  };

  const openEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: "",
      role: user.role,
      department: user.department,
    });
    setFormOpen(true);
  };

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      if (editingUser) {
        const payload: Record<string, any> = {
          name: formData.name,
          role: formData.role,
          department: formData.department,
        };
        if (formData.password) payload.password = formData.password;

        const res = await fetch(`/api/users/${editingUser.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const json = await res.json().catch(() => ({}));
          throw new Error(json.error || "Failed to update user");
        }
      } else {
        const res = await fetch("/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        if (!res.ok) {
          const json = await res.json().catch(() => ({}));
          throw new Error(json.error || "Failed to create user");
        }
      }

      setFormOpen(false);
      resetForm();
      fetchUsers();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(userId: string) {
    if (!confirm("Are you sure you want to delete this user?")) return;
    try {
      const res = await fetch(`/api/users/${userId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete user");
      fetchUsers();
    } catch (err: any) {
      setError(err.message);
    }
  }

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.role.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <button className="group relative overflow-hidden rounded-2xl bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg text-left">
            <div className="flex items-start justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#1A50A3]/10">
                <Users className="h-6 w-6 text-[#1A50A3]" />
              </div>
            </div>
            <div className="mt-4">
              <h3 className="text-lg font-semibold text-[#212427]">User Management</h3>
              <p className="mt-1 text-sm text-gray-500">Create and manage users &amp; roles</p>
            </div>
            <div className="absolute bottom-0 left-0 h-1 w-full bg-[#1A50A3] opacity-0 transition-opacity group-hover:opacity-100" />
          </button>
        }
      />
      <DialogContent className="max-h-[85vh] overflow-y-auto max-w-3xl">
        <DialogHeader>
          <DialogTitle>User Management</DialogTitle>
        </DialogHeader>

        {error && !formOpen && (
          <p className="text-sm text-red-600">{error}</p>
        )}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <Input
              placeholder="Search users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button
            onClick={openAdd}
            className="gap-2 bg-[#1A50A3] hover:bg-[#153d80]"
          >
            <Plus className="h-4 w-4" />
            Add User
          </Button>
        </div>

        {formOpen && (
          <form onSubmit={handleSave} className="rounded-lg border border-zinc-200 p-4 space-y-3">
            <h4 className="font-semibold text-sm">
              {editingUser ? "Edit User" : "New User"}
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="um-name">Name</Label>
                <Input
                  id="um-name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="Full name"
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="um-email">Email</Label>
                <Input
                  id="um-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, email: e.target.value }))
                  }
                  placeholder="email@expertflow.com"
                  disabled={!!editingUser}
                  required={!editingUser}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="um-dept">Department</Label>
                <Input
                  id="um-dept"
                  value={formData.department}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, department: e.target.value }))
                  }
                  placeholder="Department"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="um-role">Role</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, role: value || "EMPLOYEE" }))
                  }
                >
                  <SelectTrigger id="um-role" className="w-full">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLES.map((r) => (
                      <SelectItem key={r} value={r}>
                        {r.replace("_", " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="um-password">
                  {editingUser ? "New Password (leave blank to keep)" : "Password"}
                </Label>
                <Input
                  id="um-password"
                  type="password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, password: e.target.value }))
                  }
                  placeholder={editingUser ? "••••••••" : "Password"}
                  required={!editingUser}
                />
              </div>
            </div>
            {error && formOpen && (
              <p className="text-sm text-red-600">{error}</p>
            )}
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setFormOpen(false);
                  resetForm();
                }}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="bg-[#1A50A3] hover:bg-[#153d80]"
              >
                {saving ? "Saving..." : editingUser ? "Update User" : "Create User"}
              </Button>
            </div>
          </form>
        )}

        <div className="rounded-lg border border-zinc-200 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Department</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-6">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-6 text-zinc-500">
                    No users found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.name}</TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center rounded-full bg-[#1A50A3]/10 px-2 py-0.5 text-xs font-medium text-[#1A50A3]">
                        {u.role.replace("_", " ")}
                      </span>
                    </TableCell>
                    <TableCell>{u.department}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          onClick={() => openEdit(u)}
                          className="text-gray-500 hover:text-[#1A50A3]"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          onClick={() => handleDelete(u.id)}
                          className="text-gray-500 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  );
}
