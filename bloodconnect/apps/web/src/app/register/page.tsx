'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../providers/AuthProvider';
import { api } from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Card, CardContent } from '../../components/ui/Card';
import { LocationPicker } from '../../components/shared/LocationPicker';
import { DisclaimerBanner } from '../../components/ui/DisclaimerBanner';
import { BloodGroup } from '@bloodconnect/shared';
import { Droplet, Heart, Shield } from 'lucide-react';

export default function RegisterDonorPage() {
  const { login } = useAuth();
  const router = useRouter();

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    phone: '',
    bloodGroup: BloodGroup.O_POS,
    city: 'Bengaluru',
    area: 'Shivajinagar / Central',
    approxLat: 12.98,
    approxLng: 77.60,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const bloodGroupOptions = Object.values(BloodGroup).map((bg) => ({
    value: bg,
    label: bg.replace('_', ' '),
  }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const data = await api.post('/auth/register/donor', formData);
      login(data);
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto py-10 px-4 sm:px-6">
      <div className="text-center mb-6">
        <div className="w-12 h-12 rounded-2xl bg-red-600 flex items-center justify-center text-white mx-auto shadow-lg shadow-red-200 mb-3">
          <Heart className="h-6 w-6 fill-current" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900">Voluntary Donor Registration</h2>
        <p className="text-xs text-slate-500 mt-1">
          Join the emergency notification network to help local hospitals when acute shortages arise.
        </p>
      </div>

      <div className="mb-6">
        <DisclaimerBanner message="PRIVACY & MEDICAL NOTICE: Exact home addresses are NEVER requested or stored. Your registration registers you as a potential voluntary donor. Actual screening and eligibility decisions are made solely by authorized blood centres." />
      </div>

      <Card>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-red-50 text-red-700 text-xs font-medium border border-red-200">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Full Name"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                placeholder="Rahul Sharma"
                required
              />

              <Select
                label="Self-Reported Blood Group"
                value={formData.bloodGroup}
                onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value as BloodGroup })}
                options={bloodGroupOptions}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Official Email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="rahul@example.com"
                required
              />

              <Input
                label="Mobile Number (Confidential)"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+91 98860 12345"
                required
              />
            </div>

            <Input
              label="Password (min 8 characters)"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="••••••••"
              required
            />

            {/* Approximate Location Component */}
            <div className="pt-2">
              <LocationPicker
                city={formData.city}
                area={formData.area}
                approxLat={formData.approxLat}
                approxLng={formData.approxLng}
                onChange={(loc) =>
                  setFormData({
                    ...formData,
                    city: loc.city,
                    area: loc.area,
                    approxLat: loc.approxLat,
                    approxLng: loc.approxLng,
                  })
                }
              />
            </div>

            <Button type="submit" className="w-full mt-4" isLoading={isLoading}>
              Complete Donor Registration
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="text-center mt-6 text-xs text-slate-500">
        Already registered?{' '}
        <Link href="/login" className="font-semibold text-red-600 hover:text-red-700">
          Sign In
        </Link>
      </div>
    </div>
  );
}
