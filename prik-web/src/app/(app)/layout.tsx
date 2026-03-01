"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignOutButton, useUser } from "@clerk/nextjs";
import { useTheme } from "next-themes";
import { useState, useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Menu, X, Home, PlusCircle, Clock, Sun, Moon, Monitor } from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/log", label: "Log Reading", icon: PlusCircle },
  { href: "/history", label: "History", icon: Clock },
];

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="h-7" />;
  const next = theme === "system" ? "light" : theme === "light" ? "dark" : "system";
  const Icon = theme === "dark" ? Moon : theme === "light" ? Sun : Monitor;
  return (
    <button
      onClick={() => setTheme(next)}
      title={`Theme: ${theme}`}
      className="flex items-center gap-2 px-1 py-1 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
    >
      <Icon size={15} />
      <span className="capitalize">{theme}</span>
    </button>
  );
}

function SidebarContent({ pathname, onClose }: { pathname: string; onClose?: () => void }) {
  const { user } = useUser();
  return (
    <>
      <div className="px-5 py-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <div>
          <span className="text-2xl font-black text-[#2E86AB]">Prik</span>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Glucose tracker</p>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
            <X size={20} />
          </button>
        )}
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            onClick={onClose}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              pathname === href
                ? "bg-[#2E86AB] text-white"
                : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100"
            }`}
          >
            <Icon size={16} />
            {label}
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#2E86AB] flex items-center justify-center text-white text-sm font-bold shrink-0">
            {user?.firstName?.[0] ?? "?"}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500 truncate">
              {user?.primaryEmailAddress?.emailAddress}
            </p>
          </div>
        </div>
        <ThemeToggle />
        <SignOutButton>
          <button className="w-full text-sm text-slate-500 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 text-left px-1 py-1 transition-colors">
            Sign out
          </button>
        </SignOutButton>
      </div>
    </>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user } = useUser();
  const upsertUser = useMutation(api.users.upsertUser);

  useEffect(() => {
    if (!user) return;
    upsertUser({
      clerkId: user.id,
      email: user.primaryEmailAddress?.emailAddress ?? "",
      name: user.fullName ?? undefined,
    });
  }, [user?.id]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col fixed left-0 top-0 h-full w-56 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 z-20">
        <SidebarContent pathname={pathname} />
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-black/40" onClick={() => setMobileOpen(false)}>
          <aside
            className="absolute left-0 top-0 h-full w-64 bg-white dark:bg-slate-900 flex flex-col shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <SidebarContent pathname={pathname} onClose={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      {/* Mobile top bar */}
      <header className="md:hidden fixed top-0 inset-x-0 z-30 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center px-4 h-14 gap-4">
          <button
            onClick={() => setMobileOpen(true)}
            className="text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
            aria-label="Open menu"
          >
            <Menu size={22} />
          </button>
          <span className="text-xl font-black text-[#2E86AB]">Prik</span>
        </div>
      </header>

      <main className="flex-1 md:ml-56 pt-14 md:pt-0">
        {children}
      </main>
    </div>
  );
}
