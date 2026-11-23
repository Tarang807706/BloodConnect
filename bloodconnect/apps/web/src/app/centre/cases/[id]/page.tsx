'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '../../../../lib/api';
import { Button } from '../../../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/Card';
import { StatusBadge } from '../../../../components/ui/StatusBadge';
import { DisclaimerBanner } from '../../../../components/ui/DisclaimerBanner';
import { StageCountdown } from '../../../../components/shared/StageCountdown';
import { CaseTimeline } from '../../../../components/shared/CaseTimeline';
import { Modal } from '../../../../components/ui/Modal';
import { Input } from '../../../../components/ui/Input';
import { Select } from '../../../../components/ui/Select';
import { DonationOutcomeType, CaseStatus } from '@bloodconnect/shared';
import {
  ArrowLeft,
  FastForward,
  Pause,
  Play,
  XCircle,
  CheckCircle2,
  Phone,
  UserCheck,
  AlertCircle,
  FileCheck2,
} from 'lucide-react';
import Link from 'next/link';

export default function CaseCommandCenterPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();

  const [theCase, setTheCase] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Outcome modal state
  const [outcomeDonorId, setOutcomeDonorId] = useState<string | null>(null);
  const [outcomeType, setOutcomeType] = useState<DonationOutcomeType>(DonationOutcomeType.DONATED);
  const [unitsCollected, setUnitsCollected] = useState(1);
  const [deferralReason, setDeferralReason] = useState('');
  const [clinicalNotes, setClinicalNotes] = useState('');

  // Pause / Cancel modal
  const [reasonModalType, setReasonModalType] = useState<'pause' | 'cancel' | 'close' | 'escalate' | null>(null);
  const [reasonText, setReasonText] = useState('');

  const fetchCase = async () => {
    try {
      const data = await api.get(`/cases/${id}`);
      setTheCase(data);
    } catch (err: any) {
      alert(err.message || 'Failed to load case');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCase();
    const interval = setInterval(fetchCase, 15000); // Polling sync
    return () => clearInterval(interval);
  }, [id]);

  const handleAction = async (action: 'escalate' | 'pause' | 'resume' | 'cancel' | 'close') => {
    setActionLoading(true);
    try {
      if (action === 'resume') {
        await api.post(`/cases/${id}/resume`);
      } else {
        await api.post(`/cases/${id}/${action}`, {
          reason: reasonText,
          closingNotes: reasonText,
        });
      }
      setReasonModalType(null);
      setReasonText('');
      await fetchCase();
    } catch (err: any) {
      alert(err.message || `Failed to ${action} case`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRecordOutcome = async () => {
    if (!outcomeDonorId) return;
    setActionLoading(true);
    try {
      await api.post(`/cases/${id}/outcomes`, {
        donorProfileId: outcomeDonorId,
        outcome: outcomeType,
        unitsCollected: outcomeType === DonationOutcomeType.DONATED ? Number(unitsCollected) : 0,
        deferralReason: outcomeType === DonationOutcomeType.DEFERRED ? deferralReason : undefined,
        clinicalNotes,
      });
      setOutcomeDonorId(null);
      await fetchCase();
    } catch (err: any) {
      alert(err.message || 'Failed to record donation outcome');
    } finally {
      setActionLoading(false);
    }
  };

  if (isLoading || !theCase) {
    return <div className="max-w-7xl mx-auto px-4 py-12 text-center text-slate-400">Loading Case Command View...</div>;
  }

  const isTerminal = [CaseStatus.CLOSED, CaseStatus.CANCELLED, CaseStatus.EXPIRED].includes(theCase.status);
  const isPaused = theCase.status === CaseStatus.PAUSED;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <Link href="/centre" className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 transition-colors">
        <ArrowLeft className="h-4 w-4" />
        <span>Back to Blood Centre Dashboard</span>
      </Link>

      <DisclaimerBanner message="AUTHORITY NOTICE: All registered donors below have expressed willingness only. You must conduct full hemoglobin screening, infectious markers rapid testing (HIV, HBV, HCV, Syphilis, Malaria), and blood typing prior to phlebotomy collection." />

      {/* Case Header Card */}
      <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-slate-900">
                Case {theCase.id.slice(0, 8)}: {theCase.request?.bloodGroup} {theCase.request?.component?.replace(/_/g, ' ')}
              </h1>
              <StatusBadge status={theCase.status} />
              <StatusBadge status={theCase.request?.urgency || 'CRITICAL'} />
            </div>
            <div className="text-xs text-slate-500 mt-1">
              Shortage: <strong>{theCase.shortageUnits} Units</strong> &bull; Hospital: <strong>{theCase.request?.hospitalId}</strong>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isTerminal && theCase.nextStageDueAt && !isPaused && (
              <StageCountdown dueAt={theCase.nextStageDueAt} onTimeout={fetchCase} />
            )}

            {!isTerminal && (
              <div className="flex items-center gap-1.5">
                {!isPaused ? (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs"
                      onClick={() => setReasonModalType('escalate')}
                    >
                      <FastForward className="h-3.5 w-3.5 mr-1" />
                      Manual Escalate
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs text-yellow-700"
                      onClick={() => setReasonModalType('pause')}
                    >
                      <Pause className="h-3.5 w-3.5 mr-1" />
                      Pause
                    </Button>
                  </>
                ) : (
                  <Button
                    size="sm"
                    variant="primary"
                    className="text-xs bg-yellow-600 hover:bg-yellow-700"
                    onClick={() => handleAction('resume')}
                  >
                    <Play className="h-3.5 w-3.5 mr-1" />
                    Resume Case
                  </Button>
                )}

                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs text-rose-700"
                  onClick={() => setReasonModalType('cancel')}
                >
                  <XCircle className="h-3.5 w-3.5 mr-1" />
                  Cancel
                </Button>

                <Button
                  size="sm"
                  variant="secondary"
                  className="text-xs"
                  onClick={() => setReasonModalType('close')}
                >
                  <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                  Close Case
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Coordination Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-slate-100 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-slate-400 block uppercase text-[10px]">Shortage Needed</span>
            <span className="text-lg font-black text-slate-900">{theCase.shortageUnits} Units</span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-slate-400 block uppercase text-[10px]">Potential Donors Mobilized</span>
            <span className="text-lg font-black text-blue-700">{theCase.stats?.totalMobilizedCount || 0}</span>
          </div>

          <div className="p-3 bg-emerald-50 rounded-xl">
            <span className="text-emerald-700 block uppercase text-[10px]">Willing Donors (Pending Screening)</span>
            <span className="text-lg font-black text-emerald-800">{theCase.stats?.willingResponsesCount || 0}</span>
          </div>

          <div className="p-3 bg-red-50 rounded-xl">
            <span className="text-red-700 block uppercase text-[10px]">Actual Units Collected</span>
            <span className="text-lg font-black text-red-800">{theCase.unitsFulfilled} / {theCase.shortageUnits}</span>
          </div>
        </div>
      </div>

      {/* Willing Potential Donors Table */}
      <Card>
        <CardHeader className="flex items-center justify-between">
          <div>
            <CardTitle>Willing Registered Potential Donors (Awaiting Physical Screening)</CardTitle>
            <p className="text-xs text-slate-500 mt-0.5">
              Contact information revealed exclusively to blood centre staff for clinical coordination.
            </p>
          </div>
          <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full">
            {theCase.willingDonors?.length || 0} Available
          </span>
        </CardHeader>

        <CardContent>
          {!theCase.willingDonors || theCase.willingDonors.length === 0 ? (
            <div className="text-center py-10 text-xs text-slate-400">
              No donors have responded yet for this stage. Timers are monitoring responses.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-2.5 px-4">Donor Name</th>
                    <th className="py-2.5 px-4">Self Blood Group</th>
                    <th className="py-2.5 px-4">Phone / Contact</th>
                    <th className="py-2.5 px-4">Proximity</th>
                    <th className="py-2.5 px-4">Est. Arrival</th>
                    <th className="py-2.5 px-4">Status</th>
                    <th className="py-2.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {theCase.willingDonors.map((d: any) => (
                    <tr key={d.donorProfileId} className="hover:bg-slate-50/50">
                      <td className="py-3 px-4 font-bold text-slate-900">{d.fullName}</td>
                      <td className="py-3 px-4 font-bold text-red-600">{d.bloodGroup}</td>
                      <td className="py-3 px-4 font-mono font-medium text-slate-700">{d.phone}</td>
                      <td className="py-3 px-4 text-slate-600">{d.area} (~{d.approxDistanceKm?.toFixed(1)} km)</td>
                      <td className="py-3 px-4 font-medium text-slate-900">
                        {d.estimatedArrivalMinutes ? `~${d.estimatedArrivalMinutes} min` : 'Unspecified'}
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                          {d.statusLabel}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {!isTerminal && (
                          <Button
                            size="sm"
                            variant="primary"
                            className="text-xs"
                            onClick={() => {
                              setOutcomeDonorId(d.donorProfileId);
                              setOutcomeType(DonationOutcomeType.DONATED);
                              setUnitsCollected(1);
                            }}
                          >
                            Record Clinical Outcome
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* State Machine Transition Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Case Status & Stage Progression History</CardTitle>
        </CardHeader>
        <CardContent>
          <CaseTimeline
            currentStatus={theCase.status}
            currentStageNumber={theCase.currentStageNumber}
            history={theCase.statusHistory}
          />
        </CardContent>
      </Card>

      {/* Record Outcome Modal */}
      {outcomeDonorId && (
        <Modal
          isOpen={true}
          onClose={() => setOutcomeDonorId(null)}
          title="Record Clinical Screening & Donation Outcome"
        >
          <div className="space-y-4 text-xs">
            <DisclaimerBanner message="LEGAL LEDGER ENTRY: Only authorized blood centres record clinical donation outcomes. If the donor is medically deferred, record the deferral reason for statutory NBTC records." />

            <div>
              <label className="block text-xs font-semibold text-slate-900 mb-1">
                Clinical Outcome Determination:
              </label>
              <Select
                value={outcomeType}
                onChange={(e) => setOutcomeType(e.target.value as DonationOutcomeType)}
                options={[
                  { value: DonationOutcomeType.DONATED, label: 'DONATED (Screened, Tested & Collected)' },
                  { value: DonationOutcomeType.DEFERRED, label: 'DEFERRED (Temporary / Permanent Clinical Deferral)' },
                  { value: DonationOutcomeType.NOT_ATTENDED, label: 'NOT_ATTENDED (Donor Did Not Arrive)' },
                ]}
              />
            </div>

            {outcomeType === DonationOutcomeType.DONATED && (
              <div>
                <label className="block text-xs font-semibold text-slate-900 mb-1">
                  Units Collected & Bagged:
                </label>
                <Input
                  type="number"
                  min={1}
                  max={2}
                  value={unitsCollected}
                  onChange={(e) => setUnitsCollected(Number(e.target.value))}
                />
              </div>
            )}

            {outcomeType === DonationOutcomeType.DEFERRED && (
              <div>
                <label className="block text-xs font-semibold text-slate-900 mb-1">
                  Clinical Deferral Reason:
                </label>
                <Input
                  value={deferralReason}
                  onChange={(e) => setDeferralReason(e.target.value)}
                  placeholder="e.g. Low hemoglobin (<12.5 g/dL), recent medication"
                  required
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-900 mb-1">
                Clinical Ledger Notes:
              </label>
              <Input
                value={clinicalNotes}
                onChange={(e) => setClinicalNotes(e.target.value)}
                placeholder="Bag barcode, phlebotomy nurse ID, remarks"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <Button variant="ghost" size="sm" onClick={() => setOutcomeDonorId(null)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" isLoading={actionLoading} onClick={handleRecordOutcome}>
                Save Official Outcome
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* State Control Reason Modal */}
      {reasonModalType && (
        <Modal
          isOpen={true}
          onClose={() => setReasonModalType(null)}
          title={`Confirm Action: ${reasonModalType.toUpperCase()}`}
        >
          <div className="space-y-4 text-xs">
            <p className="text-slate-600">
              Please enter an official rationale for the clinical audit log:
            </p>
            <Input
              value={reasonText}
              onChange={(e) => setReasonText(e.target.value)}
              placeholder="e.g. Hospital requirement satisfied by external inter-centre transfer"
              required
            />
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <Button variant="ghost" size="sm" onClick={() => setReasonModalType(null)}>
                Cancel
              </Button>
              <Button
                variant={reasonModalType === 'cancel' ? 'danger' : 'primary'}
                size="sm"
                isLoading={actionLoading}
                disabled={reasonText.length < 3}
                onClick={() => handleAction(reasonModalType)}
              >
                Confirm
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
