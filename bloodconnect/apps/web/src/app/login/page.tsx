'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../../providers/AuthProvider';
import { api } from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Droplet, Shield, KeyRound, Building, Heart, Users } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const data = await api.post('/auth/login', { email, password });
      login(data);
    } catch (err: any) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setIsLoading(true);
    setError(null);
    api.post('/auth/login', { email: demoEmail, password: demoPass })
      .then(login)
      .catch((err: any) => setError(err.message || 'Login failed'))
      .finally(() => setIsLoading(false));
  };

  return (
    <div className="max-w-md mx-auto py-12 px-4 sm:px-6">
      <div className="text-center mb-8">
        <div className="w-12 h-12 rounded-2xl bg-red-600 flex items-center justify-center text-white mx-auto shadow-lg shadow-red-200 mb-3">
          <Droplet className="h-6 w-6 fill-current" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900">Sign in to BloodConnect</h2>
        <p className="text-xs text-slate-500 mt-1">
          Access your emergency coordination dashboard or donor portal
        </p>
      </div>

      <Card>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-red-50 text-red-700 text-xs font-medium border border-red-200">
                {error}
              </div>
            )}

            <Input
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. user@bloodconnect.org"
              required
            />

            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />

            <Button type="submit" className="w-full" isLoading={isLoading}>
              Sign In
            </Button>
          </form>

          {/* Quick Demo Logins for Viva & Evaluation */}
          <div className="mt-8 pt-6 border-t border-slate-100">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
              <KeyRound className="h-3.5 w-3.5 text-red-600" />
              <span>1-Click Viva Demonstration Logins</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleQuickLogin('donor@bloodconnect.org', 'Password@123')}
                className="p-2.5 rounded-lg border border-slate-200 hover:border-red-400 hover:bg-red-50/40 text-left transition-colors flex items-center gap-2"
              >
                <Heart className="h-4 w-4 text-red-500" />
                <div>
                  <div className="font-semibold text-slate-900">Voluntary Donor</div>
                  <div className="text-[10px] text-slate-400">O+ Bangalore Central</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('hospital.victoria@bloodconnect.org', 'Password@123')}
                className="p-2.5 rounded-lg border border-slate-200 hover:border-red-400 hover:bg-red-50/40 text-left transition-colors flex items-center gap-2"
              >
                <Building className="h-4 w-4 text-blue-500" />
                <div>
                  <div className="font-semibold text-slate-900">Victoria Hospital</div>
                  <div className="text-[10px] text-slate-400">Hospital Requester</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('centre.redcross@bloodconnect.org', 'Password@123')}
                className="p-2.5 rounded-lg border border-slate-200 hover:border-red-400 hover:bg-red-50/40 text-left transition-colors flex items-center gap-2"
              >
                <Shield className="h-4 w-4 text-emerald-500" />
                <div>
                  <div className="font-semibold text-slate-900">Red Cross Centre</div>
                  <div className="text-[10px] text-slate-400">Blood Centre Operator</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('ngo.lions@bloodconnect.org', 'Password@123')}
                className="p-2.5 rounded-lg border border-slate-200 hover:border-red-400 hover:bg-red-50/40 text-left transition-colors flex items-center gap-2"
              >
                <Users className="h-4 w-4 text-purple-500" />
                <div>
                  <div className="font-semibold text-slate-900">Lions NGO</div>
                  <div className="text-[10px] text-slate-400">Volunteer Network</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('admin@bloodconnect.org', 'Admin@12345')}
                className="sm:col-span-2 p-2.5 rounded-lg border border-slate-200 hover:border-red-400 hover:bg-red-50/40 text-left transition-colors flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-slate-700" />
                  <div>
                    <div className="font-semibold text-slate-900">System Administrator</div>
                    <div className="text-[10px] text-slate-400">Full Analytics, Verification, & Audit Access</div>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-red-600 font-bold bg-red-50 px-2 py-0.5 rounded">ADMIN</span>
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="text-center mt-6 text-xs text-slate-500 space-y-2">
        <div>
          Don&apos;t have an account?{' '}
          <Link href="/register" className="font-semibold text-red-600 hover:text-red-700">
            Register as Voluntary Donor
          </Link>
        </div>
        <div>
          Hospital or Blood Centre?{' '}
          <Link href="/register/organization" className="font-semibold text-slate-700 hover:text-slate-900">
            Register Organization
          </Link>
        </div>
      </div>
    </div>
  );
}
