'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '../../providers/AuthProvider';
import { NotificationBell } from './NotificationBell';
import { Droplet, LogOut, User, Activity, Building, ShieldAlert, Heart } from 'lucide-react';
import { UserRole } from '@bloodconnect/shared';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();

  const getDashboardPath = () => {
    if (!user) return '/';
    switch (user.role) {
      case UserRole.DONOR:
        return '/donor';
      case UserRole.HOSPITAL:
        return '/hospital';
      case UserRole.BLOOD_CENTRE:
        return '/centre';
      case UserRole.NGO:
        return '/ngo';
      case UserRole.ADMIN:
        return '/admin';
      default:
        return '/';
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href={getDashboardPath()} className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-red-600 flex items-center justify-center text-white shadow-md shadow-red-200">
              <Droplet className="h-5 w-5 fill-current" />
            </div>
            <div>
              <div className="text-base font-extrabold tracking-tight text-slate-900 leading-none">
                BLOOD<span className="text-red-600">CONNECT</span>
              </div>
              <div className="text-[10px] font-semibold text-slate-400 tracking-wider uppercase mt-0.5">
                Emergency Coordination
              </div>
            </div>
          </Link>

          {/* User Nav */}
          {user ? (
            <div className="flex items-center gap-3">
              <Link
                href={getDashboardPath()}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
              >
                Dashboard
              </Link>

              {user.role === UserRole.DONOR && (
                <Link
                  href="/donor/requests"
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors"
                >
                  <Heart className="h-3.5 w-3.5 fill-red-100" />
                  <span>My Alerts</span>
                </Link>
              )}

              <NotificationBell />

              <div className="h-5 w-px bg-slate-200" />

              <div className="flex items-center gap-2">
                <div className="text-right hidden sm:block">
                  <div className="text-xs font-bold text-slate-900 leading-tight">
                    {user.fullName}
                  </div>
                  <div className="text-[10px] font-semibold text-red-600 uppercase tracking-wider">
                    {user.organizationName || user.role.replace('_', ' ')}
                  </div>
                </div>

                <button
                  onClick={logout}
                  className="p-2 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                  title="Log out"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
              >
                Log In
              </Link>
              <Link
                href="/register"
                className="px-4 py-2 rounded-lg text-xs font-bold text-white bg-red-600 hover:bg-red-700 shadow-sm transition-colors"
              >
                Register as Donor
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
