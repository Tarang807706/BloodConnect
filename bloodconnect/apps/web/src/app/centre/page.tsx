'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { DisclaimerBanner } from '../../components/ui/DisclaimerBanner';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { StageCountdown } from '../../components/shared/StageCountdown';
import { ShieldCheck, Clock, AlertTriangle, ArrowRight, CheckCircle2, Play, Users } from 'lucide-react';
import { RequestStatus } from '@bloodconnect/shared';

export default function BloodCentreDashboard() {
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [cases, setCases] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Verification modal state
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [availableUnits, setAvailableUnits] = useState(0);
  const [verificationNotes, setVerificationNotes] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isActivating, setIsActivating] = useState(false);

  const fetchData = async () => {
    try {
      const pending = await api.get('/requests/centre/pending');
      setPendingRequests(pending);
      const activeCases = await api.get('/cases');
      setCases(activeCases);
    } catch {}
    finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleVerify = async () => {
    if (!selectedRequest) return;
    setIsVerifying(true);
    try {
      const res = await api.post(`/requests/${selectedRequest.id}/verify`, {
        unitsAvailableAtCentre: Number(availableUnits),
        verificationNotes,
      });

      if (res.canActivateCoordination) {
        // Automatically prompt to activate coordination case
        if (confirm(`Shortage of ${res.verification.shortageUnits} units confirmed. Activate emergency donor mobilization case now?`)) {
          await api.post(`/cases/requests/${selectedRequest.id}/activate`, {
            notes: 'Activated from verification queue',
          });
        }
      }
      setSelectedRequest(null);
      await fetchData();
    } catch (err: any) {
      alert(err.message || 'Verification failed');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleQuickActivate = async (requestId: string) => {
    setIsActivating(true);
    try {
      await api.post(`/cases/requests/${requestId}/activate`, {
        notes: 'Emergency coordination activated by blood centre officer',
      });
      await fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to activate coordination');
    } finally {
      setIsActivating(false);
    }
  };

  if (isLoading) {
    return <div className="max-w-7xl mx-auto px-4 py-12 text-center text-slate-400">Loading Blood Centre Command...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <DisclaimerBanner message="AUTHORIZATION NOTICE: As the authorized regional blood centre, you hold sole clinical responsibility for stock verification, medical screening of potential donors, infectious marker testing, component separation, and issue of blood products." />

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Blood Centre Emergency Command & Verification</h1>
          <p className="text-xs text-slate-500 mt-1">
            Verify hospital shortage requirements, activate multi-stage donor coordination, and record clinical outcomes.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-emerald-50 px-3.5 py-1.5 rounded-xl border border-emerald-200 text-xs font-semibold text-emerald-800">
          <ShieldCheck className="h-4 w-4 text-emerald-600" />
          <span>Authorized Regional Centre</span>
        </div>
      </div>

      {/* Verification Queue Card */}
      <Card>
        <CardHeader className="flex items-center justify-between bg-amber-50/40">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            <CardTitle>Hospital Verification Queue (Pending Shortage Confirmation)</CardTitle>
          </div>
          <span className="text-xs font-bold text-amber-700 bg-amber-100 px-2.5 py-0.5 rounded-full">
            {pendingRequests.length} Pending
          </span>
        </CardHeader>
        <CardContent>
          {pendingRequests.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-400">
              No hospital requests pending verification. All emergency requests processed.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {pendingRequests.map((r) => (
                <div key={r.id} className="py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-slate-900 text-base">
                        {r.bloodGroup?.replace('_', ' ')} {r.component?.replace(/_/g, ' ')}
                      </span>
                      <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                        {r.unitsNeeded} Units Requested
                      </span>
                      <StatusBadge status={r.status} />
                      <StatusBadge status={r.urgency} />
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      Hospital: <strong>{r.hospitalId}</strong> &bull; Required By: {new Date(r.requiredBy).toLocaleTimeString()}
                    </div>
                    {r.clinicalNotes && (
                      <div className="text-xs text-slate-600 italic mt-0.5">&ldquo;{r.clinicalNotes}&rdquo;</div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => {
                        setSelectedRequest(r);
                        setAvailableUnits(0);
                      }}
                    >
                      Verify Stock & Shortage
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Active Coordination Cases Command View */}
      <Card>
        <CardHeader className="flex items-center justify-between">
          <CardTitle>Active Emergency Coordination Cases</CardTitle>
          <span className="text-xs text-slate-500">{cases.length} Total Managed Cases</span>
        </CardHeader>
        <CardContent>
          {cases.length === 0 ? (
            <div className="text-center py-10 text-xs text-slate-400">
              No active coordination cases. Verify an incoming shortage request to launch coordination.
            </div>
          ) : (
            <div className="space-y-4">
              {cases.map((c) => (
                <div key={c.id} className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-slate-900 text-base">
                        {c.bloodGroup?.replace('_', ' ')} {c.component?.replace(/_/g, ' ')}
                      </span>
                      <StatusBadge status={c.status} />
                      <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded">
                        Shortage: {c.shortageUnits} Units
                      </span>
                    </div>

                    <div className="text-xs text-slate-600 flex items-center gap-3">
                      <span>Mobilized: <strong>{c.potentialDonorsMobilizedCount} Donors</strong></span>
                      <span className="text-slate-300">&bull;</span>
                      <span>Willing: <strong className="text-emerald-700">{c.willingResponsesCount} Responded</strong></span>
                      <span className="text-slate-300">&bull;</span>
                      <span>Collected: <strong className="text-blue-700">{c.unitsFulfilled} Units</strong></span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {c.nextStageDueAt && !['FULFILLED', 'CLOSED', 'CANCELLED'].includes(c.status) && (
                      <StageCountdown dueAt={c.nextStageDueAt} />
                    )}

                    <Link href={`/centre/cases/${c.id}`}>
                      <Button size="sm" variant="secondary" className="flex items-center gap-1.5">
                        <span>Command Center</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Shortage Verification Modal */}
      {selectedRequest && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedRequest(null)}
          title="Verify Blood Centre Stock & Confirm Shortage"
        >
          <div className="space-y-4 text-xs">
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <div>Requested: <strong>{selectedRequest.unitsNeeded} Units</strong> of <strong>{selectedRequest.bloodGroup} {selectedRequest.component}</strong></div>
              <div className="text-slate-500 mt-1">Urgency: {selectedRequest.urgency}</div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-900 mb-1">
                Units Currently Available at Centre Cold Storage:
              </label>
              <Input
                type="number"
                min={0}
                max={selectedRequest.unitsNeeded}
                value={availableUnits}
                onChange={(e) => setAvailableUnits(Number(e.target.value))}
              />
            </div>

            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-950 font-bold flex items-center justify-between">
              <span>Calculated Acute Shortage:</span>
              <span className="text-base text-red-600">
                {Math.max(0, selectedRequest.unitsNeeded - availableUnits)} Units
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-900 mb-1">
                Verification Notes / Batch Allocation:
              </label>
              <Input
                value={verificationNotes}
                onChange={(e) => setVerificationNotes(e.target.value)}
                placeholder="Confirmed zero reserve units in blood bank refrigerator."
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <Button variant="ghost" size="sm" onClick={() => setSelectedRequest(null)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" isLoading={isVerifying} onClick={handleVerify}>
                Confirm Verification
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
