'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { api } from '../../../lib/api';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Card, CardContent } from '../../../components/ui/Card';
import { LocationPicker } from '../../../components/shared/LocationPicker';
import { DisclaimerBanner } from '../../../components/ui/DisclaimerBanner';
import { OrganizationType } from '@bloodconnect/shared';
import { Building2, CheckCircle2 } from 'lucide-react';

export default function RegisterOrganizationPage() {
  const [formData, setFormData] = useState({
    name: '',
    type: OrganizationType.HOSPITAL,
    licenseNumber: '',
    contactEmail: '',
    contactPhone: '',
    city: 'Bengaluru',
    area: 'Shivajinagar / Central',
    approxLat: 12.98,
    approxLng: 77.60,
    adminFullName: '',
    adminEmail: '',
    adminPassword: '',
    emergencyHelpline: '108',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const orgTypes = [
    { value: OrganizationType.HOSPITAL, label: 'Hospital (Emergency Requester)' },
    { value: OrganizationType.BLOOD_CENTRE, label: 'Blood Centre (Verifying & Screening Authority)' },
    { value: OrganizationType.NGO, label: 'NGO (Emergency Volunteer Mobilizer)' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await api.post('/organizations/register', formData);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Organization registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-md mx-auto py-16 px-4 text-center">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="h-8 w-8" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900">Registration Submitted</h2>
        <p className="mt-2 text-sm text-slate-600 leading-relaxed">
          Your organization account has been submitted and is currently in <strong>PENDING_APPROVAL</strong> status. A platform administrator will verify your official health department license before account activation.
        </p>
        <div className="mt-6">
          <Link href="/login">
            <Button variant="secondary">Return to Login</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-10 px-4 sm:px-6">
      <div className="text-center mb-6">
        <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center text-white mx-auto shadow-lg mb-3">
          <Building2 className="h-6 w-6" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900">Organization Onboarding</h2>
        <p className="text-xs text-slate-500 mt-1">
          Hospitals, authorized blood centres, and partner NGOs
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="Organization Type"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as OrganizationType })}
                options={orgTypes}
              />

              <Input
                label="Official Organization Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Apollo Hospital Bannerghatta"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="Govt License Number"
                value={formData.licenseNumber}
                onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                placeholder="KA-HOSP-2024-XXXX"
                required
              />

              <Input
                label="Official Contact Email"
                type="email"
                value={formData.contactEmail}
                onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                placeholder="contact@hospital.org"
                required
              />

              <Input
                label="Helpline / Phone"
                value={formData.contactPhone}
                onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                placeholder="+91 80 2600 0000"
                required
              />
            </div>

            <div className="pt-2 border-t border-slate-100">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
                Authorized Lead Administrator Details
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Input
                  label="Admin Name"
                  value={formData.adminFullName}
                  onChange={(e) => setFormData({ ...formData, adminFullName: e.target.value })}
                  placeholder="Dr. Rajesh Rao"
                  required
                />
                <Input
                  label="Admin Email (Login)"
                  type="email"
                  value={formData.adminEmail}
                  onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
                  placeholder="rajesh@hospital.org"
                  required
                />
                <Input
                  label="Password"
                  type="password"
                  value={formData.adminPassword}
                  onChange={(e) => setFormData({ ...formData, adminPassword: e.target.value })}
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

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
              Submit Organization for Approval
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="text-center mt-6 text-xs text-slate-500">
        Already verified?{' '}
        <Link href="/login" className="font-semibold text-red-600 hover:text-red-700">
          Sign In
        </Link>
      </div>
    </div>
  );
}
