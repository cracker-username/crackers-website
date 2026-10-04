"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/Button";
import {
  Users,
  Plus,
  KeyRound,
  CheckCircle2,
  X,
  Lock,
  Unlock,
} from "lucide-react";
import { formatToKolkataTime } from "@/lib/utils/dates";
import { Role } from "@prisma/client";

interface UserItem {
  id: string;
  email: string;
  name: string;
  role: Role;
  isActive: boolean;
  mustChangePassword: boolean;
  failedLogins: number;
  lockedUntil?: Date | string | null;
  lastLoginAt?: Date | string | null;
  createdAt: Date | string;
}

interface UsersClientProps {
  initialUsers: UserItem[];
  currentUserId: string;
}

export function UsersClient({ initialUsers, currentUserId }: UsersClientProps) {
  const [users, setUsers] = useState<UserItem[]>(initialUsers);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);

  // Create form
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("STAFF");
  const [password, setPassword] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  // Reset password form
  const [newPassword, setNewPassword] = useState("");
  const [isResetting, setIsResetting] = useState(false);

  const [feedback, setFeedback] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/admin/users");
      const json = await res.json();
      if (json.ok) setUsers(json.data);
    } catch {}
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 10) {
      setErrorMsg("Password must be at least 10 characters.");
      return;
    }

    setIsCreating(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, role, password }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.message || "Failed to create user");
      }

      setFeedback(`User "${name}" created successfully.`);
      setTimeout(() => setFeedback(null), 3000);
      setIsCreateModalOpen(false);
      setName("");
      setEmail("");
      setPassword("");
      await fetchUsers();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Error creating user");
    } finally {
      setIsCreating(false);
    }
  };

  const handleToggleActive = async (user: UserItem) => {
    if (user.id === currentUserId && user.isActive) {
      alert("You cannot deactivate your own logged-in account.");
      return;
    }

    const nextActive = !user.isActive;
    if (!confirm(`Are you sure you want to ${nextActive ? "activate" : "deactivate"} ${user.name}?`)) return;

    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: nextActive }),
      });
      const json = await res.json();
      if (json.ok) {
        setFeedback(`User ${user.name} is now ${nextActive ? "Active" : "Deactivated"}.`);
        setTimeout(() => setFeedback(null), 3000);
        await fetchUsers();
      } else {
        alert(json.message || "Failed to update user status");
      }
    } catch {
      alert("Network error updating status");
    }
  };

  const handleUnlock = async (user: UserItem) => {
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ unlockAccount: true }),
      });
      const json = await res.json();
      if (json.ok) {
        setFeedback(`Account ${user.name} unlocked successfully.`);
        setTimeout(() => setFeedback(null), 3000);
        await fetchUsers();
      }
    } catch {
      alert("Network error unlocking account");
    }
  };

  const openResetModal = (user: UserItem) => {
    setSelectedUser(user);
    setNewPassword("");
    setIsResetModalOpen(true);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    if (newPassword.length < 10) {
      alert("Password must be at least 10 characters.");
      return;
    }

    setIsResetting(true);
    try {
      const res = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resetPassword: newPassword }),
      });
      const json = await res.json();
      if (json.ok) {
        setFeedback(`Password reset for ${selectedUser.name}. They must change it on next login.`);
        setTimeout(() => setFeedback(null), 3500);
        setIsResetModalOpen(false);
        await fetchUsers();
      } else {
        alert(json.message || "Failed to reset password");
      }
    } catch {
      alert("Network error resetting password");
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-brand-gold" />
            Operations Staff & Admin Access
          </h1>
          <p className="text-xs text-brand-muted mt-1">
            Manage administrative team members, assign operational roles, reset credentials, and monitor lockout security.
          </p>
        </div>

        <Button
          onClick={() => {
            setErrorMsg(null);
            setIsCreateModalOpen(true);
          }}
          className="bg-brand-primary text-white text-xs font-bold flex items-center gap-2 h-9"
        >
          <Plus className="w-4 h-4" />
          Create New Staff User
        </Button>
      </div>

      {feedback && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          {feedback}
        </div>
      )}

      {/* Users Table */}
      <div className="bg-brand-bg-1/80 border border-white/10 rounded-2xl overflow-hidden shadow-xl">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-brand-bg-0/60 text-brand-muted uppercase text-[10px] font-bold border-b border-white/10">
            <tr>
              <th className="p-4">Name & Email</th>
              <th className="p-4">Role</th>
              <th className="p-4">Status</th>
              <th className="p-4">Failed Logins</th>
              <th className="p-4">Last Login</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {users.map((u) => {
              const isLocked = u.lockedUntil && new Date(u.lockedUntil) > new Date();

              return (
                <tr key={u.id} className="hover:bg-white/[0.02]">
                  <td className="p-4">
                    <div className="font-bold text-white flex items-center gap-2">
                      {u.name}
                      {u.id === currentUserId && (
                        <span className="px-1.5 py-0.2 rounded text-[10px] bg-white/10 text-white font-mono">
                          You
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-brand-muted font-mono">{u.email}</div>
                  </td>

                  <td className="p-4">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                        u.role === "SUPER_ADMIN"
                          ? "bg-purple-500/10 text-purple-300 border-purple-500/30"
                          : "bg-blue-500/10 text-blue-300 border-blue-500/30"
                      }`}
                    >
                      {u.role}
                    </span>
                  </td>

                  <td className="p-4">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        u.isActive
                          ? "bg-emerald-500/10 text-emerald-400"
                          : "bg-red-500/10 text-red-400"
                      }`}
                    >
                      {u.isActive ? "Active" : "Deactivated"}
                    </span>
                  </td>

                  <td className="p-4">
                    {isLocked ? (
                      <span className="text-rose-400 font-bold flex items-center gap-1">
                        <Lock className="w-3.5 h-3.5" /> Locked (15m)
                      </span>
                    ) : (
                      <span className="font-mono text-brand-muted">{u.failedLogins}</span>
                    )}
                  </td>

                  <td className="p-4 text-brand-muted">
                    {u.lastLoginAt ? formatToKolkataTime(u.lastLoginAt) : "Never"}
                  </td>

                  <td className="p-4 text-right space-x-2">
                    {isLocked && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleUnlock(u)}
                        className="h-7 text-xs px-2.5 text-amber-300 border-amber-500/30 hover:bg-amber-500/10"
                      >
                        <Unlock className="w-3 h-3 mr-1" /> Unlock
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openResetModal(u)}
                      className="h-7 text-xs px-2.5"
                    >
                      <KeyRound className="w-3 h-3 mr-1" /> Reset Pwd
                    </Button>
                    {u.id !== currentUserId && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleToggleActive(u)}
                        className={`h-7 text-xs px-2.5 ${
                          u.isActive
                            ? "text-red-400 border-red-500/20 hover:bg-red-500/10"
                            : "text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/10"
                        }`}
                      >
                        {u.isActive ? "Deactivate" : "Activate"}
                      </Button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Create Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-brand-bg-1 border border-white/20 rounded-2xl w-full max-w-md p-6 relative">
            <button
              onClick={() => setIsCreateModalOpen(false)}
              className="absolute top-4 right-4 text-brand-muted hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-white mb-1">Create Staff User</h3>
            <p className="text-xs text-brand-muted mb-4">
              Password must be at least 10 characters. User must change password on first login.
            </p>

            {errorMsg && (
              <div className="mb-3 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-brand-muted uppercase mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Ramesh Kumar"
                  className="w-full bg-brand-bg-0 border border-white/10 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-brand-muted uppercase mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. ramesh@crackers.local"
                  className="w-full bg-brand-bg-0 border border-white/10 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-brand-muted uppercase mb-1">Role *</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as Role)}
                  className="w-full bg-brand-bg-0 border border-white/10 rounded-xl px-3 py-2 text-white"
                >
                  <option value="STAFF">STAFF (Enquiries & Catalogue view)</option>
                  <option value="SUPER_ADMIN">SUPER_ADMIN (Full system access)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-brand-muted uppercase mb-1">
                  Initial Password (min 10 chars) *
                </label>
                <input
                  type="password"
                  required
                  minLength={10}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 10 characters"
                  className="w-full bg-brand-bg-0 border border-white/10 rounded-xl px-3 py-2 text-white font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-white/10">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isCreating}
                  className="bg-brand-primary text-white"
                >
                  {isCreating ? "Creating..." : "Create User"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {isResetModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-brand-bg-1 border border-white/20 rounded-2xl w-full max-w-md p-6 relative">
            <button
              onClick={() => setIsResetModalOpen(false)}
              className="absolute top-4 right-4 text-brand-muted hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-white mb-1">Reset Password</h3>
            <p className="text-xs text-brand-muted mb-4">
              Enter a new temporary password for <span className="text-white font-bold">{selectedUser.name}</span>. Existing sessions will be invalidated.
            </p>

            <form onSubmit={handleResetPassword} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-brand-muted uppercase mb-1">
                  New Password (min 10 chars) *
                </label>
                <input
                  type="password"
                  required
                  minLength={10}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 10 characters"
                  className="w-full bg-brand-bg-0 border border-white/10 rounded-xl px-3 py-2 text-white font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-white/10">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsResetModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isResetting}
                  className="bg-brand-primary text-white"
                >
                  {isResetting ? "Resetting..." : "Confirm Reset"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
