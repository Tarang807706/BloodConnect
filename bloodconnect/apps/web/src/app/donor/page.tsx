'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../../providers/AuthProvider';
import { api } from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { DisclaimerBanner } from '../../components/ui/DisclaimerBanner';
import { Heart, Bell, Clock, ShieldCheck, MapPin, CheckCircle, ArrowRight } from 'lucide-react';

export default function DonorDashboard() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [requests, setRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const p = await api.get('/donors/me');
        setProfile(p);
        const reqs = await api.get('/donors/me/requests');
        setRequests(reqs);
      } catch (err) {
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleToggleAvailability = async () => {
    if (!profile) return;
    try {
      const updated = await api.patch('/donors/me/availability', {
        isAvailable: !profile.isAvailable,
      });
      setProfile({ ...profile, isAvailable: updated.isAvailable });
    } catch {}
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 text-center text-slate-400">
        Loading donor portal...
      </div>
    );
  }

  const activeAlerts = requests.filter(r => r.caseStatus?.startsWith('ACTIVE') || r.caseStatus === 'NGO_ACTIVATED');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Banner */}
      <DisclaimerBanner message="VOLUNTARY PARTICIPATION NOTICE: Your responses on BloodConnect indicate willingness only. All medical testing, compatibility verification, and final collection are conducted exclusively at the authorized blood centre." />

      {/* Header and Quick Stats */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-red-600 text-white flex items-center justify-center text-xl font-black shadow-md shadow-red-200">
            {profile?.bloodGroup?.replace('_', ' ') || 'O+'}
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">{profile?.fullName}</h1>
            <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
              <MapPin className="h-3.5 w-3.5 text-slate-400" />
              <span>{profile?.area}, {profile?.city}</span>
              <span className="text-slate-300">&bull;</span>
              <span className="font-mono text-slate-400">{profile?.gridCell}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-xs font-semibold text-slate-700">Availability Status</div>
            <div className="text-[11px] text-slate-400">
              {profile?.isAvailable ? 'Ready for emergency alerts' : 'Currently snoozed / paused'}
            </div>
          </div>
          <button
            onClick={handleToggleAvailability}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
              profile?.isAvailable
                ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                : 'bg-slate-100 text-slate-600 border-slate-300 hover:bg-slate-200'
            }`}
          >
            {profile?.isAvailable ? 'Available (Active)' : 'Unavailable'}
          </button>
        </div>
      </div>

      {/* Active Alerts Banner if any */}
      {activeAlerts.length > 0 && (
        <div className="p-4 bg-red-600 text-white rounded-2xl shadow-lg shadow-red-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl">
              <Bell className="h-6 w-6 animate-bounce" />
            </div>
            <div>
              <div className="font-bold text-sm">
                Active Emergency Blood Coordination in Progress!
              </div>
              <div className="text-xs text-red-100 mt-0.5">
                {activeAlerts.length} nearby case(s) requiring your blood group ({profile?.bloodGroup?.replace('_', ' ')})
              </div>
            </div>
          </div>
          <Link href={`/donor/requests/${activeAlerts[0].caseId}`}>
            <Button variant="secondary" size="sm" className="bg-white text-red-700 hover:bg-red-50">
              Respond Now &rarr;
            </Button>
          </Link>
        </div>
      )}

      {/* Emergency Requests List */}
      <Card>
        <CardHeader className="flex items-center justify-between">
          <CardTitle>Nearby Emergency Requests</CardTitle>
          <span className="text-xs text-slate-500">{requests.length} Total Alerts Received</span>
        </CardHeader>
        <CardContent>
          {requests.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-sm">
              No active emergency requests in your vicinity right now.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {requests.map((req) => (
                <div key={req.caseId} className="py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-slate-900 text-base">
                        {req.bloodGroup?.replace('_', ' ')} {req.component?.replace(/_/g, ' ')}
                      </span>
                      <StatusBadge status={req.caseStatus} />
                      <StatusBadge status={req.urgency} />
                    </div>
                    <div className="text-xs text-slate-600 flex items-center gap-2">
                      <span>Blood Centre: <strong>{req.bloodCentreName}</strong></span>
                      <span className="text-slate-300">&bull;</span>
                      <span>Approx {req.approxDistanceKm?.toFixed(1)} km away</span>
                    </div>
                    {req.myResponse && (
                      <div className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
                        <CheckCircle className="h-3.5 w-3.5" />
                        <span>You responded: {req.myResponse.response?.replace(/_/g, ' ')}</span>
                      </div>
                    )}
                  </div>

                  <Link href={`/donor/requests/${req.caseId}`}>
                    <Button size="sm" variant={req.myResponse ? 'outline' : 'primary'}>
                      {req.myResponse ? 'Update Response' : 'View & Respond'}
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
