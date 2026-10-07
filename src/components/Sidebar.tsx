"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard, Receipt, Repeat, Tags, Settings as SettingsIcon,
  Wallet, LogOut, Menu, X,
} from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import { logoutAction } from "@/actions/auth";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/transactions", label: "Daily Log", icon: Receipt },
  { href: "/recurring", label: "Recurring & SIPs", icon: Repeat },
  { href: "/categories", label: "Categories", icon: Tags },
  { href: "/settings", label: "Settings", icon: SettingsIcon },
];

function NavItems({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-1">
      {NAV.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(href + "/");
        return (
          <Link key={href} href={href} onClick={onNavigate} className={`nav-link ${active ? "active" : ""}`}>
            <Icon size={18} />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function Brand() {
  return (
    <div className="flex items-center gap-2.5 px-2 py-1">
      <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl"
        style={{ background: "var(--accent-weak)", color: "var(--accent-2)" }}>
        <Wallet size={20} />
      </span>
      <div>
        <div className="font-bold leading-tight">Budget Tracker</div>
        <div className="muted text-[11px]">50 / 30 / 20</div>
      </div>
    </div>
  );
}

function Footer({ userEmail }: { userEmail: string | null }) {
  return (
    <div className="mt-auto space-y-2 pt-3" style={{ borderTop: "1px solid var(--border)" }}>
      <ThemeToggle />
      <form action={logoutAction}>
        <button type="submit" className="btn btn-ghost w-full justify-start">
          <LogOut size={16} /> <span>Logout</span>
        </button>
      </form>
      {userEmail && <div className="muted text-[11px] truncate px-2 pt-1">{userEmail}</div>}
    </div>
  );
}

export default function Sidebar({ userEmail }: { userEmail: string | null; userName: string | null }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex fixed inset-y-0 left-0 w-64 flex-col gap-4 p-4"
        style={{ background: "var(--panel)", borderRight: "1px solid var(--border)" }}>
        <Brand />
        <NavItems />
        <Footer userEmail={userEmail} />
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden sticky top-0 z-30 flex items-center justify-between px-4 h-14"
        style={{ background: "var(--panel)", borderBottom: "1px solid var(--border)" }}>
        <Brand />
        <button className="btn btn-ghost" onClick={() => setOpen(true)} aria-label="Open menu">
          <Menu size={20} />
        </button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="md:hidden fixed inset-0 z-40">
          <div className="absolute inset-0" style={{ background: "rgba(0,0,0,.5)" }} onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-64 flex flex-col gap-4 p-4"
            style={{ background: "var(--panel)", borderRight: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between">
              <Brand />
              <button className="btn btn-ghost" onClick={() => setOpen(false)} aria-label="Close menu"><X size={18} /></button>
            </div>
            <NavItems onNavigate={() => setOpen(false)} />
            <Footer userEmail={userEmail} />
          </aside>
        </div>
      )}
    </>
  );
}
