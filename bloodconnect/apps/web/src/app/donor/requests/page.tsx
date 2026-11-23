'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '../../../lib/api';
import { Button } from '../../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { DisclaimerBanner } from '../../../components/ui/DisclaimerBanner';
import { Heart, MapPin, Clock, CheckCircle, ArrowLeft, Bell } from 'lucide-react';

export default function DonorRequestsListPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const data = await api.get('/donors/me/requests');
        setRequests(data);
      } catch (err) {
      } finally {
        setIsLoading(false);
      }
    };
    fetchRequests();
  }, []);

  if (isLoading) {
    return <div className="max-w-4xl mx-auto px-4 py-12 text-center text-slate-400">Loading received alerts...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <Link href="/donor" className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 transition-colors">
        <ArrowLeft className="h-4 w-4" />
        <span>Back to Donor Dashboard</span>
      </Link>

      <DisclaimerBanner message="VOLUNTARY MOBILIZATION NOTICE: You are notified because your registered blood group matches the acute emergency shortage confirmed by the blood centre. Your response indicates willingness only. Medical screening is conducted upon arrival." />

      <Card>
        <CardHeader className="flex items-center justify-between">
          <div>
            <CardTitle>Emergency Blood Coordination Alerts</CardTitle>
            <p className="text-xs text-slate-500 mt-0.5">
              Targeted requests dispatched by regional blood centres within your travel perimeter.
            </p>
          </div>
          <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
            {requests.length} Alerts
          </span>
        </CardHeader>

        <CardContent>
          {requests.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-sm">
              No emergency alerts found for your profile. When a nearby hospital experiences an acute shortage of your blood group, alerts will appear here.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {requests.map((r) => (
                <div key={r.caseId} className="py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-black text-slate-900">
                        {r.bloodGroup?.replace('_', ' ')} {r.component?.replace(/_/g, ' ')}
                      </span>
                      <StatusBadge status={r.caseStatus} />
                      <StatusBadge status={r.urgency} />
                    </div>

                    <div className="text-xs text-slate-600 flex items-center gap-3">
                      <span>Blood Centre: <strong>{r.bloodCentreName}</strong> ({r.bloodCentreArea})</span>
                      <span className="text-slate-300">&bull;</span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-red-500" />
                        <span>Approx {r.approxDistanceKm?.toFixed(1)} km away</span>
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-400">
                      Notified: {new Date(r.notifiedAt).toLocaleString()}
                    </div>

                    {r.myResponse && (
                      <div className="text-xs text-emerald-700 font-semibold flex items-center gap-1 pt-1">
                        <CheckCircle className="h-3.5 w-3.5" />
                        <span>Your Response: {r.myResponse.response?.replace(/_/g, ' ')} ({new Date(r.myResponse.respondedAt).toLocaleTimeString()})</span>
                      </div>
                    )}
                  </div>

                  <Link href={`/donor/requests/${r.caseId}`}>
                    <Button size="sm" variant={r.myResponse ? 'outline' : 'primary'}>
                      {r.myResponse ? 'View / Update' : 'Respond Now'}
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
