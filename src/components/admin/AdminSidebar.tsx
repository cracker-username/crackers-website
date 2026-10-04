"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  ClipboardList,
  Package,
  Layers,
  Sparkles,
  FileText,
  Settings,
  Users,
  Truck,
  ShieldCheck,
  Bell,
  LogOut,
  KeyRound,
  Menu,
  X,
} from "lucide-react";
import { Role } from "@prisma/client";
import { ChangePasswordModal } from "./ChangePasswordModal";

interface AdminSidebarProps {
  user: {
    id: string;
    name: string;
    email: string;
    role: Role;
    mustChangePassword: boolean;
  };
}

export function AdminSidebar({ user }: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const [isOpenMobile, setIsOpenMobile] = useState(false);
  const [newEnquiriesCount, setNewEnquiriesCount] = useState<number>(0);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(user.mustChangePassword);

  // Poll new enquiries count every 30 seconds
  useEffect(() => {
    let isMounted = true;

    async function fetchCounts() {
      try {
        const res = await fetch("/api/admin/enquiries/count");
        const json = await res.json();
        if (isMounted && json.ok && typeof json.data?.newCount === "number") {
          setNewEnquiriesCount(json.data.newCount);
        }
      } catch {
        // Silent polling failure
      }
    }

    fetchCounts();
    const interval = setInterval(fetchCounts, 30000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/admin/auth/logout", { method: "POST" });
      router.push("/admin/login");
      router.refresh();
    } catch {
      router.push("/admin/login");
    }
  };

  const isSuperAdmin = user.role === "SUPER_ADMIN";

  const navLinks = [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
    {
      href: "/admin/enquiries",
      label: "Enquiries",
      icon: ClipboardList,
      badge: newEnquiriesCount > 0 ? newEnquiriesCount : null,
    },
    { href: "/admin/products", label: "Products", icon: Package },
    { href: "/admin/categories", label: "Categories", icon: Layers },
    { href: "/admin/combos", label: "Combos", icon: Sparkles },
    { href: "/admin/content", label: "Content", icon: FileText },
    ...(isSuperAdmin
      ? [
          { href: "/admin/delivery-rules", label: "Delivery Rules", icon: Truck },
          { href: "/admin/settings", label: "Settings", icon: Settings },
          { href: "/admin/users", label: "Staff Users", icon: Users },
          { href: "/admin/audit", label: "Audit Log", icon: ShieldCheck },
        ]
      : []),
    { href: "/admin/notifications", label: "Notifications", icon: Bell },
  ];

  return (
    <>
      {/* Mobile Top Header */}
      <div className="lg:hidden flex items-center justify-between p-4 bg-surface-1 border-b border-border sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-accent-magenta to-accent-orange flex items-center justify-center text-white font-bold text-xs">
            SS
          </div>
          <span className="font-heading font-bold text-sm text-text">Sivakasi Admin</span>
        </div>

        <button
          type="button"
          onClick={() => setIsOpenMobile(!isOpenMobile)}
          className="p-2 rounded-lg bg-surface-2 text-text"
        >
          {isOpenMobile ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Sidebar Drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-surface-1 border-r border-border flex flex-col transition-transform duration-300 lg:static lg:translate-x-0 ${
          isOpenMobile ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand / Logo */}
        <div className="p-6 border-b border-border flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-accent-magenta to-accent-orange flex items-center justify-center text-white font-bold text-sm shadow-md">
            SS
          </div>
          <div>
            <h2 className="font-heading font-black text-sm text-text leading-tight">
              Sivakasi Sparklers
            </h2>
            <p className="text-[10px] text-muted font-semibold uppercase tracking-wider">
              Operations Desk
            </p>
          </div>
        </div>

        {/* Navigation links */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {navLinks.map((link) => {
            const isActive = pathname === link.href || (link.href !== "/admin" && pathname.startsWith(link.href));
            const Icon = link.icon;

            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsOpenMobile(false)}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
                  isActive
                    ? "bg-accent-gold/15 text-accent-gold font-bold"
                    : "text-muted hover:text-text hover:bg-surface-2"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? "text-accent-gold" : "text-muted"}`} />
                  <span>{link.label}</span>
                </div>

                {link.badge !== null && link.badge !== undefined && (
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-accent-orange text-white shadow-sm">
                    {link.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Card & Actions */}
        <div className="p-4 border-t border-border bg-surface-2/40 space-y-3">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-xs font-bold text-text truncate">{user.name}</p>
              <p className="text-[10px] text-muted truncate">{user.email}</p>
            </div>
            <span
              className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${
                isSuperAdmin
                  ? "bg-accent-gold/20 text-accent-gold border border-accent-gold/30"
                  : "bg-blue-500/20 text-blue-300 border border-blue-500/30"
              }`}
            >
              {user.role}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-border/50">
            <button
              type="button"
              onClick={() => setIsPasswordModalOpen(true)}
              className="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-surface-2 hover:bg-surface-1 text-muted hover:text-text text-[11px] font-medium transition-colors cursor-pointer"
              title="Change Password"
            >
              <KeyRound className="w-3.5 h-3.5 text-accent-gold" />
              <span>Password</span>
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-surface-2 hover:bg-red-500/10 text-muted hover:text-red-400 text-[11px] font-medium transition-colors cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Backdrop for mobile */}
      {isOpenMobile && (
        <div
          onClick={() => setIsOpenMobile(false)}
          className="fixed inset-0 bg-black/60 z-30 lg:hidden"
        />
      )}

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        isForced={user.mustChangePassword}
      />
    </>
  );
}
