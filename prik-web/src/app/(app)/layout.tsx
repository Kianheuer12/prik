"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignOutButton, useUser } from "@clerk/nextjs";

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/log", label: "Log Reading" },
  { href: "/history", label: "History" },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user } = useUser();

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar — desktop */}
      <aside className="hidden md:flex flex-col fixed left-0 top-0 h-full w-56 bg-white border-r border-slate-200 z-20">
        <div className="px-5 py-6 border-b border-slate-100">
          <span className="text-2xl font-black text-[#2E86AB]">Prik</span>
          <p className="text-xs text-slate-400 mt-0.5">Glucose tracker</p>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`block px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                pathname === href
                  ? "bg-[#2E86AB] text-white"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              {label}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-100 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#2E86AB] flex items-center justify-center text-white text-sm font-bold shrink-0">
              {user?.firstName?.[0] ?? "?"}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-900 truncate">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-slate-400 truncate">
                {user?.primaryEmailAddress?.emailAddress}
              </p>
            </div>
          </div>
          <SignOutButton>
            <button className="w-full text-sm text-slate-500 hover:text-red-500 text-left px-1 py-1 transition-colors">
              Sign out
            </button>
          </SignOutButton>
        </div>
      </aside>

      {/* Top bar — mobile */}
      <header className="md:hidden fixed top-0 inset-x-0 z-20 bg-white border-b border-slate-200">
        <div className="flex items-center justify-between px-4 h-14">
          <span className="text-xl font-black text-[#2E86AB]">Prik</span>
          <nav className="flex items-center gap-1">
            {navItems.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  pathname === href
                    ? "bg-[#2E86AB] text-white"
                    : "text-slate-500 hover:bg-slate-100"
                }`}
              >
                {label}
              </Link>
            ))}
          </nav>
          <SignOutButton>
            <button className="text-xs text-slate-400 hover:text-red-400 transition-colors">
              Sign out
            </button>
          </SignOutButton>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 md:ml-56 pt-14 md:pt-0">
        {children}
      </main>
    </div>
  );
}
