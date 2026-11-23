'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { DisclaimerBanner } from '../../components/ui/DisclaimerBanner';
import { CaseTimeline } from '../../components/shared/CaseTimeline';
import { PlusCircle, Building2, Clock, Users, CheckCircle, AlertTriangle, Eye } from 'lucide-react';

export default function HospitalDashboard() {
  const [requests, setRequests] = useState<any[]>([]);
  const [cases, setCases] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const reqList = await api.get('/requests');
        setRequests(reqList);
        const caseList = await api.get('/cases');
        setCases(caseList);
      } catch (err) {
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <DisclaimerBanner message="HOSPITAL CLINICAL STATEMENT: Requests are verified, screened and fulfilled exclusively by the authorized regional blood centre. Hospital view displays aggregate progress indicators only to safeguard voluntary donor privacy." />

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Hospital Emergency Dispatch Dashboard</h1>
          <p className="text-xs text-slate-500 mt-1">
            Submit acute emergency blood shortage requirements and monitor multi-stage coordination in real time.
          </p>
        </div>

        <Link href="/hospital/new-request">
          <Button variant="primary" className="flex items-center gap-2">
            <PlusCircle className="h-4 w-4" />
            <span>Create Emergency Request</span>
          </Button>
        </Link>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Emergency Requests</div>
          <div className="text-2xl font-black text-slate-900 mt-1">{requests.length}</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs font-semibold text-amber-600 uppercase tracking-wider">Active Coordination Cases</div>
          <div className="text-2xl font-black text-amber-600 mt-1">
            {cases.filter(c => c.status?.startsWith('ACTIVE') || c.status === 'NGO_ACTIVATED').length}
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Fulfilled Emergency Cases</div>
          <div className="text-2xl font-black text-emerald-600 mt-1">
            {cases.filter(c => c.status === 'FULFILLED' || c.status === 'CLOSED').length}
          </div>
        </div>
      </div>

      {/* Active Requests & Aggregate Status */}
      <Card>
        <CardHeader>
          <CardTitle>My Emergency Requests & Live Progress</CardTitle>
        </CardHeader>
        <CardContent>
          {requests.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-sm">
              No emergency blood requests created yet. Click above to dispatch a request.
            </div>
          ) : (
            <div className="space-y-6">
              {requests.map((r) => {
                const linkedCase = cases.find(c => c.requestId === r.id);

                return (
                  <div key={r.id} className="p-5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-black text-slate-900">
                            {r.bloodGroup?.replace('_', ' ')} {r.component?.replace(/_/g, ' ')}
                          </span>
                          <span className="text-xs font-bold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                            {r.unitsNeeded} Units Needed
                          </span>
                          <StatusBadge status={r.status} />
                          <StatusBadge status={r.urgency} />
                        </div>
                        <div className="text-xs text-slate-500 mt-1">
                          Assigned Blood Centre: <strong>{r.bloodCentreId}</strong> &bull; Created at {new Date(r.createdAt).toLocaleTimeString()}
                        </div>
                      </div>

                      {linkedCase && (
                        <div className="flex items-center gap-4 text-xs font-semibold bg-white p-2.5 rounded-lg border border-slate-200">
                          <div>
                            <span className="text-slate-400 block text-[10px] uppercase">Mobilized</span>
                            <span className="text-slate-900 font-bold">{linkedCase.potentialDonorsMobilizedCount} Donors</span>
                          </div>
                          <div className="h-6 w-px bg-slate-200" />
                          <div>
                            <span className="text-slate-400 block text-[10px] uppercase">Willing</span>
                            <span className="text-emerald-700 font-bold">{linkedCase.willingResponsesCount} Responded</span>
                          </div>
                          <div className="h-6 w-px bg-slate-200" />
                          <div>
                            <span className="text-slate-400 block text-[10px] uppercase">Fulfilled</span>
                            <span className="text-red-600 font-bold">{linkedCase.unitsFulfilled} Units</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Progress Timeline */}
                    <CaseTimeline
                      currentStatus={linkedCase ? linkedCase.status : r.status}
                      currentStageNumber={linkedCase?.currentStageNumber || 1}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
