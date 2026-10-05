"use client";

import React, { useState } from "react";
import { Lock, AlertCircle, CheckCircle2, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  isForced?: boolean;
}

export function ChangePasswordModal({ isOpen, onClose, isForced = false }: ChangePasswordModalProps) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 10) {
      setError("New password must be at least 10 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/admin/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const json = await res.json();

      if (!res.ok || !json.ok) {
        setError(json.message || "Failed to update password.");
        setIsLoading(false);
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        onClose();
        setSuccess(false);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }, 1500);
    } catch (err) {
      console.error("Change password error:", err);
      setError("Network error updating password. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-md bg-surface-1 border border-border rounded-2xl p-6 shadow-2xl relative">
        {!isForced && (
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 text-muted hover:text-text transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-accent-gold/10 text-accent-gold flex items-center justify-center">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-lg font-heading text-text">
              {isForced ? "Password Change Required" : "Change Admin Password"}
            </h3>
            <p className="text-xs text-muted">
              {isForced
                ? "First login detected. Please create a secure password (minimum 10 characters)."
                : "Enter current and new password."}
            </p>
          </div>
        </div>

        {success ? (
          <div className="py-6 text-center space-y-2">
            <CheckCircle2 className="w-10 h-10 text-green-400 mx-auto" />
            <p className="text-sm font-bold text-text">Password Updated Successfully!</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-white/90 mb-1">
                Current Password
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg bg-bg-0 border border-white/20 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-accent-gold focus:ring-1 focus:ring-accent-gold font-medium"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-white/90 mb-1">
                New Password (minimum 10 characters)
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg bg-bg-0 border border-white/20 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-accent-gold focus:ring-1 focus:ring-accent-gold font-medium"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-white/90 mb-1">
                Confirm New Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg bg-bg-0 border border-white/20 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-accent-gold focus:ring-1 focus:ring-accent-gold font-medium"
                required
              />
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-200 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              className="w-full justify-center text-sm py-2"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Updating Password...
                </>
              ) : (
                "Save New Password"
              )}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
