'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../../../lib/api';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Card, CardContent } from '../../../components/ui/Card';
import { LocationPicker } from '../../../components/shared/LocationPicker';
import { DisclaimerBanner } from '../../../components/ui/DisclaimerBanner';
import { BloodGroup, BloodComponent, Urgency } from '@bloodconnect/shared';
import { PlusCircle, ArrowLeft, ShieldAlert } from 'lucide-react';
import Link from 'next/link';

export default function NewEmergencyRequestPage() {
  const router = useRouter();

  const [centres, setCentres] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    bloodCentreId: '',
    bloodGroup: BloodGroup.O_POS,
    component: BloodComponent.WHOLE_BLOOD,
    unitsNeeded: 2,
    urgency: Urgency.CRITICAL,
    requiredBy: new Date(Date.now() + 4 * 3600 * 1000).toISOString().slice(0, 16),
    clinicalNotes: '',
    city: 'Bengaluru',
    area: 'Kalasipalya / Fort',
    approxLat: 12.96,
    approxLng: 77.58,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCentres = async () => {
      try {
        const data = await api.get('/organizations/blood-centres');
        setCentres(data);
        if (data.length > 0) {
          setFormData((f) => ({ ...f, bloodCentreId: data[0].id }));
        }
      } catch {}
    };
    fetchCentres();
  }, []);

  const bloodGroupOptions = Object.values(BloodGroup).map((bg) => ({
    value: bg,
    label: bg.replace('_', ' '),
  }));

  const componentOptions = Object.values(BloodComponent).map((c) => ({
    value: c,
    label: c.replace(/_/g, ' '),
  }));

  const urgencyOptions = [
    { value: Urgency.CRITICAL, label: 'CRITICAL (Immediate Trauma / OT)' },
    { value: Urgency.HIGH, label: 'HIGH (ICU / Oncology / 2-6 Hours)' },
    { value: Urgency.MEDIUM, label: 'MEDIUM (Planned / 6-12 Hours)' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await api.post('/requests', {
        ...formData,
        unitsNeeded: Number(formData.unitsNeeded),
        requiredBy: new Date(formData.requiredBy).toISOString(),
      });
      router.push('/hospital');
    } catch (err: any) {
      setError(err.message || 'Failed to submit emergency request');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 sm:px-6 space-y-6">
      <Link href="/hospital" className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 transition-colors">
        <ArrowLeft className="h-4 w-4" />
        <span>Back to Hospital Dashboard</span>
      </Link>

      <DisclaimerBanner message="SAFETY MANDATE: Do NOT include patient identifiable information (patient name, Aadhaar, MRN). Mention only clinical department (e.g. ICU Bed 4, OT Trauma). Requests are verified and stock shortages confirmed by the authorized blood centre before voluntary donor mobilization." />

      <div className="text-center">
        <h2 className="text-2xl font-bold text-slate-900">Create Emergency Blood Request</h2>
        <p className="text-xs text-slate-500 mt-1">
          Dispatched directly to the designated regional blood transfusion centre
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

            <Select
              label="Designated Authorized Blood Centre"
              value={formData.bloodCentreId}
              onChange={(e) => setFormData({ ...formData, bloodCentreId: e.target.value })}
              options={centres.map((c) => ({
                value: c.id,
                label: `${c.name} (${c.area})`,
              }))}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="Required Blood Group"
                value={formData.bloodGroup}
                onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value as BloodGroup })}
                options={bloodGroupOptions}
              />

              <Select
                label="Component Needed"
                value={formData.component}
                onChange={(e) => setFormData({ ...formData, component: e.target.value as BloodComponent })}
                options={componentOptions}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Units Needed (1 - 50)"
                type="number"
                min={1}
                max={50}
                value={formData.unitsNeeded}
                onChange={(e) => setFormData({ ...formData, unitsNeeded: Number(e.target.value) })}
                required
              />

              <Select
                label="Clinical Urgency"
                value={formData.urgency}
                onChange={(e) => setFormData({ ...formData, urgency: e.target.value as Urgency })}
                options={urgencyOptions}
              />
            </div>

            <Input
              label="Required By (Clinical Deadline)"
              type="datetime-local"
              value={formData.requiredBy}
              onChange={(e) => setFormData({ ...formData, requiredBy: e.target.value })}
              required
            />

            <Input
              label="Clinical Ward Notes (No Patient Identifiers)"
              value={formData.clinicalNotes}
              onChange={(e) => setFormData({ ...formData, clinicalNotes: e.target.value })}
              placeholder="e.g. ICU Cardiac Surgery Unit, acute blood loss protocol"
            />

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
              Submit to Regional Blood Centre
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
