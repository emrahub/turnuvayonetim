'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import {
  Menu,
  X,
  Home,
  Trophy,
  Users,
  BarChart3,
  Settings,
  Bell,
  User,
  Grid3X3
} from 'lucide-react';
import { BRAND } from '../lib/brand';

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigation = [
    { name: 'Dashboard', href: '/', icon: Home },
    { name: 'Tournaments', href: '/templates', icon: Trophy },
    { name: 'Seating', href: '/seating', icon: Grid3X3 },
    { name: 'Players', href: '/players', icon: Users },
    { name: 'Analytics', href: '/dashboard', icon: BarChart3 },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-700/50 bg-slate-900/95 backdrop-blur-xl shadow-lg shadow-black/10">
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-18 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center transition-smooth hover:opacity-90 hover:glow-brand-sm">
              <Image
                src="/rangenex-logo.svg"
                alt="RangeNex - Professional Tournament Management"
                width={220}
                height={55}
                className="h-14 w-auto"
                priority
              />
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex md:items-center md:gap-6">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="flex items-center gap-2 text-sm font-medium text-slate-300 transition-smooth hover:text-brand-400"
              >
                <item.icon className="icon-md" />
                {item.name}
              </Link>
            ))}
          </div>

          {/* User Menu */}
          <div className="flex items-center gap-3">
            <button
              className="rounded-lg p-2 text-slate-400 transition-smooth hover:bg-slate-800 hover:text-slate-200"
              aria-label="Notifications"
            >
              <Bell className="icon-md" />
            </button>

            <button
              className="rounded-lg p-2 text-slate-400 transition-smooth hover:bg-slate-800 hover:text-slate-200"
              aria-label="User menu"
            >
              <User className="icon-md" />
            </button>

            <Link
              href="/settings"
              className="hidden rounded-lg p-2 text-slate-400 transition-smooth hover:bg-slate-800 hover:text-slate-200 md:block"
              aria-label="Settings"
            >
              <Settings className="icon-md" />
            </Link>

            {/* Mobile menu button */}
            <button
              type="button"
              className="rounded-lg p-2 text-slate-400 transition-smooth hover:bg-slate-800 hover:text-slate-200 md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <X className="icon-lg" />
              ) : (
                <Menu className="icon-lg" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="border-t border-slate-700/50 py-4 md:hidden">
            <div className="flex flex-col gap-2">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-300 transition-smooth hover:bg-slate-800 hover:text-brand-400"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <item.icon className="icon-md" />
                  {item.name}
                </Link>
              ))}
              <Link
                href="/settings"
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-300 transition-smooth hover:bg-slate-800 hover:text-brand-400"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Settings className="icon-md" />
                Settings
              </Link>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
