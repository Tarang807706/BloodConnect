'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '../../../lib/api';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { LocationPicker } from '../../../components/shared/LocationPicker';
import { DisclaimerBanner } from '../../../components/ui/DisclaimerBanner';
import { BloodGroup, BloodComponent, NotificationChannel } from '@bloodconnect/shared';
import { User, Shield, Clock, MapPin, Heart, ArrowLeft, CheckCircle } from 'lucide-react';

export default function DonorProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('Bengaluru');
  const [area, setArea] = useState('Shivajinagar / Central');
  const [approxLat, setApproxLat] = useState(12.98);
  const [approxLng, setApproxLng] = useState(77.60);
  const [bloodGroup, setBloodGroup] = useState<BloodGroup>(BloodGroup.O_POS);
  const [isAvailable, setIsAvailable] = useState(true);
  const [unavailableUntil, setUnavailableUntil] = useState('');
  const [maxTravelKm, setMaxTravelKm] = useState(15);
  const [quietHoursStart, setQuietHoursStart] = useState('22:00');
  const [quietHoursEnd, setQuietHoursEnd] = useState('07:00');

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await api.get('/donors/me');
        setProfile(data);
        setFullName(data.fullName || '');
        setPhone(data.phone || '');
        setCity(data.city || 'Bengaluru');
        setArea(data.area || '');
        setApproxLat(data.approxLat || 12.98);
        setApproxLng(data.approxLng || 77.60);
        setBloodGroup(data.bloodGroup || BloodGroup.O_POS);
        setIsAvailable(data.isAvailable);
        setUnavailableUntil(data.unavailableUntil ? data.unavailableUntil.slice(0, 16) : '');
        setMaxTravelKm(data.maxTravelKm || 15);
        setQuietHoursStart(data.quietHoursStart || '22:00');
        setQuietHoursEnd(data.quietHoursEnd || '07:00');
      } catch (err) {
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      await api.put('/donors/me', {
        fullName,
        phone,
        city,
        area,
        approxLat,
        approxLng,
        bloodGroup,
      });

      await api.patch('/donors/me/availability', {
        isAvailable,
        unavailableUntil: unavailableUntil ? new Date(unavailableUntil).toISOString() : null,
      });

      await api.put('/donors/me/preferences', {
        maxTravelKm: Number(maxTravelKm),
        preferredComponents: [BloodComponent.WHOLE_BLOOD],
        allowedChannels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
        quietHoursStart,
        quietHoursEnd,
      });

      setSaveSuccess(true);
    } catch (err: any) {
      alert(err.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="max-w-3xl mx-auto px-4 py-12 text-center text-slate-400">Loading donor profile...</div>;
  }

  const bloodGroupOptions = Object.values(BloodGroup).map((bg) => ({
    value: bg,
    label: bg.replace('_', ' '),
  }));

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <Link href="/donor" className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 transition-colors">
        <ArrowLeft className="h-4 w-4" />
        <span>Back to Donor Dashboard</span>
      </Link>

      <DisclaimerBanner message="PRIVACY MANDATE: Your exact home address is never collected or stored. All geolocation coordinates are strictly rounded to ~1.1 km grid cells. Phone numbers are stored confidentially and only made available to authorized blood centres for verified cases." />

      {saveSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-medium border border-emerald-200 flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-emerald-600 flex-shrink-0" />
          <span>Your donor profile, availability status, and notification preferences were updated successfully.</span>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Donor Profile & Coordination Preferences</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Full Name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />

              <Select
                label="Self-Reported Blood Group"
                value={bloodGroup}
                onChange={(e) => setBloodGroup(e.target.value as BloodGroup)}
                options={bloodGroupOptions}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Confidential Phone Number"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />

              <Input
                label="Maximum Travel Willingness (km)"
                type="number"
                min={1}
                max={50}
                value={maxTravelKm}
                onChange={(e) => setMaxTravelKm(Number(e.target.value))}
                helperText="Mobilization matching will not notify you for cases beyond this distance."
              />
            </div>

            {/* Availability & Snooze */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-800 block">
                    Emergency Availability Status
                  </span>
                  <span className="text-xs text-slate-500">
                    When active, you can be matched for urgent nearby hospital blood shortages.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAvailable(!isAvailable)}
                  className={`px-4 py-2 rounded-lg text-xs font-bold border transition-colors ${
                    isAvailable
                      ? 'bg-emerald-600 text-white border-emerald-700'
                      : 'bg-slate-200 text-slate-700 border-slate-300'
                  }`}
                >
                  {isAvailable ? 'Available' : 'Paused / Snoozed'}
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Temporary Snooze Until (Optional):
                </label>
                <Input
                  type="datetime-local"
                  value={unavailableUntil}
                  onChange={(e) => setUnavailableUntil(e.target.value)}
                  helperText="You will not receive mobilization alerts until this date/time."
                />
              </div>
            </div>

            {/* Quiet Hours */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Quiet Hours Start (e.g. 22:00)"
                value={quietHoursStart}
                onChange={(e) => setQuietHoursStart(e.target.value)}
                placeholder="22:00"
              />
              <Input
                label="Quiet Hours End (e.g. 07:00)"
                value={quietHoursEnd}
                onChange={(e) => setQuietHoursEnd(e.target.value)}
                placeholder="07:00"
              />
            </div>

            {/* Location Picker */}
            <div className="pt-2">
              <LocationPicker
                city={city}
                area={area}
                approxLat={approxLat}
                approxLng={approxLng}
                onChange={(loc) => {
                  setCity(loc.city);
                  setArea(loc.area);
                  setApproxLat(loc.approxLat);
                  setApproxLng(loc.approxLng);
                }}
              />
            </div>

            <Button type="submit" className="w-full mt-4" isLoading={isSaving}>
              Save Profile Preferences
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
