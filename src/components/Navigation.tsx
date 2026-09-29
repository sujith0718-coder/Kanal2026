'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Sparkles,
  LayoutDashboard,
  CalendarDays,
  BookOpen,
  ShieldAlert,
  Inbox,
  AlertTriangle,
  Settings,
} from 'lucide-react';

export default function Navigation() {
  const pathname = usePathname();

  const navItems = [
    { label: 'Today', href: '/', icon: LayoutDashboard },
    { label: 'Plan', href: '/plan', icon: CalendarDays },
    { label: 'Subjects', href: '/subjects', icon: BookOpen },
    { label: 'Risk Radar', href: '/risk', icon: ShieldAlert },
    { label: 'Inbox', href: '/inbox', icon: Inbox },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-[#090d16]/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        {/* Brand Logo & Tagline */}
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-500 to-cyan-400 text-white shadow-lg shadow-blue-500/25">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 font-bold tracking-tight text-white text-lg">
              StudyAI <span className="rounded bg-blue-500/20 px-1.5 py-0.5 text-xs text-blue-400 border border-blue-500/30">Planner</span>
            </div>
            <p className="text-[10px] text-gray-400 hidden sm:block">Adaptive Academic System</p>
          </div>
        </Link>

        {/* Primary Navigation Links */}
        <nav className="flex items-center gap-1 rounded-full border border-white/10 bg-slate-900/60 p-1 backdrop-blur-md">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs sm:text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden md:inline">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right CTA Actions: Rescue Mode Button & Settings */}
        <div className="flex items-center gap-2">
          <Link
            href="/rescue"
            className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-red-600 to-amber-600 px-3 py-1.5 text-xs font-semibold text-white shadow-lg shadow-red-500/20 hover:from-red-500 hover:to-amber-500 transition-all active:scale-95"
          >
            <AlertTriangle className="h-3.5 w-3.5 animate-pulse text-amber-200" />
            <span>Rescue Schedule</span>
          </Link>
          <Link
            href="/settings"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-slate-800/60 text-gray-400 hover:bg-white/10 hover:text-white transition-all"
            title="Settings & Availability"
          >
            <Settings className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </header>
  );
}
