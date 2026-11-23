'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '../../../../lib/api';
import { Button } from '../../../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/Card';
import { StatusBadge } from '../../../../components/ui/StatusBadge';
import { DisclaimerBanner } from '../../../../components/ui/DisclaimerBanner';
import { Modal } from '../../../../components/ui/Modal';
import { ResponseType } from '@bloodconnect/shared';
import { Droplet, MapPin, Clock, ShieldCheck, Heart, AlertCircle, Phone, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function DonorRequestDetailPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();

  const [theCase, setTheCase] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Response Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedResponse, setSelectedResponse] = useState<ResponseType>(ResponseType.I_CAN_HELP);
  const [arrivalMinutes, setArrivalMinutes] = useState(30);
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => {
    const fetchCase = async () => {
      try {
        const data = await api.get(`/cases/${id}`);
        setTheCase(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load case');
      } finally {
        setIsLoading(false);
      }
    };
    fetchCase();
  }, [id]);

  const handleSubmitResponse = async () => {
    if (!disclaimerAccepted) return;
    setIsSubmitting(true);
    try {
      await api.post(`/cases/${id}/respond`, {
        response: selectedResponse,
        estimatedArrivalMinutes: selectedResponse === ResponseType.I_CAN_HELP ? arrivalMinutes : undefined,
        acknowledgedDisclaimer: true,
      });
      setSubmitSuccess(true);
      setIsModalOpen(false);
      // Reload case
      const updated = await api.get(`/cases/${id}`);
      setTheCase(updated);
    } catch (err: any) {
      alert(err.message || 'Failed to submit response');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 text-center text-slate-400">
        Loading emergency coordination details...
      </div>
    );
  }

  if (error || !theCase) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 text-center space-y-4">
        <div className="text-red-600 font-semibold">{error || 'Case not found'}</div>
        <Link href="/donor">
          <Button variant="outline">Back to Dashboard</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <Link href="/donor" className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 transition-colors">
        <ArrowLeft className="h-4 w-4" />
        <span>Back to Donor Dashboard</span>
      </Link>

      <DisclaimerBanner message="LEGAL & CLINICAL DISCLAIMER: Your response only shows willingness. The blood centre decides clinical eligibility and performs all medical screening tests. Please report only if contacted or instructed." />

      {submitSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-medium border border-emerald-200">
          Thank you! Your response has been securely recorded in the blood centre coordination ledger.
        </div>
      )}

      {/* Main Request Card */}
      <Card>
        <CardHeader className="bg-red-50/50 border-b border-red-100 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-red-600">
              Emergency Case Notification
            </span>
            <CardTitle className="text-xl font-bold text-slate-900 mt-0.5">
              Urgent Requirement: {theCase.bloodGroup?.replace('_', ' ')} {theCase.component?.replace(/_/g, ' ')}
            </CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={theCase.caseStatus} />
            <StatusBadge status={theCase.urgency} />
          </div>
        </CardHeader>

        <CardContent className="space-y-6 pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Authorized Blood Centre
              </div>
              <div className="font-bold text-slate-900 text-sm">
                {theCase.bloodCentreName}
              </div>
              <div className="text-xs text-slate-500">
                {theCase.bloodCentreArea}, {theCase.bloodCentreCity}
              </div>
              {theCase.bloodCentrePhone && (
                <div className="text-xs text-slate-600 flex items-center gap-1.5 pt-1">
                  <Phone className="h-3.5 w-3.5 text-slate-400" />
                  <span>{theCase.bloodCentrePhone}</span>
                </div>
              )}
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Geographic Proximity
              </div>
              <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-red-600" />
                <span>Approx {theCase.approxDistanceKm?.toFixed(1)} km from your area</span>
              </div>
              <div className="text-xs text-slate-500">
                Required by: {new Date(theCase.requiredBy).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>

          {/* Current Response Status */}
          {theCase.myResponse ? (
            <div className="p-4 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-500 block">Your Current Status:</span>
                <span className="text-sm font-bold text-slate-900">
                  {theCase.myResponse.response === ResponseType.I_CAN_HELP ? 'Willing to Help' : 'Cannot Help'}
                  {theCase.myResponse.estimatedArrivalMinutes && ` (~${theCase.myResponse.estimatedArrivalMinutes} min arrival)`}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  Responded at {new Date(theCase.myResponse.respondedAt).toLocaleTimeString()}
                </span>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedResponse(theCase.myResponse.response);
                  setIsModalOpen(true);
                }}
              >
                Change Answer
              </Button>
            </div>
          ) : (
            <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center gap-3">
              <Button
                variant="primary"
                className="w-full sm:w-1/2 py-3 text-sm font-bold"
                onClick={() => {
                  setSelectedResponse(ResponseType.I_CAN_HELP);
                  setIsModalOpen(true);
                }}
              >
                <Heart className="h-4 w-4 mr-2 fill-current" />
                I Can Help
              </Button>

              <Button
                variant="outline"
                className="w-full sm:w-1/2 py-3 text-sm text-slate-600"
                onClick={() => {
                  setSelectedResponse(ResponseType.CANNOT_HELP);
                  setIsModalOpen(true);
                }}
              >
                Cannot Help Right Now
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confirmation & Safety Disclaimer Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedResponse === ResponseType.I_CAN_HELP ? 'Express Willingness to Help' : 'Decline Request'}
      >
        <div className="space-y-4 text-xs text-slate-700">
          {selectedResponse === ResponseType.I_CAN_HELP ? (
            <>
              <p className="leading-relaxed">
                Thank you for offering to support this urgent blood requirement at <strong>{theCase.bloodCentreName}</strong>.
              </p>

              <div>
                <label className="block text-xs font-semibold text-slate-900 mb-1">
                  Estimated Travel / Arrival Time:
                </label>
                <select
                  value={arrivalMinutes}
                  onChange={(e) => setArrivalMinutes(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                >
                  <option value={20}>Within 20 minutes</option>
                  <option value={30}>Within 30 minutes</option>
                  <option value={45}>Within 45 minutes</option>
                  <option value={60}>Within 1 hour</option>
                  <option value={90}>Within 1.5 hours</option>
                </select>
              </div>

              {/* Mandatory Clinical Disclaimer Checkbox */}
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 space-y-2.5">
                <div className="font-bold text-amber-900 flex items-center gap-1.5">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  <span>Mandatory Clinical Acknowledgment</span>
                </div>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  &ldquo;Your response only shows willingness. The blood centre decides eligibility and screening.&rdquo;
                </p>

                <label className="flex items-start gap-2 pt-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={disclaimerAccepted}
                    onChange={(e) => setDisclaimerAccepted(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-amber-300 text-red-600 focus:ring-red-500"
                  />
                  <span className="text-[11px] font-semibold text-amber-950">
                    I understand that my response denotes willingness only, and the authorized blood centre conducts mandatory clinical testing and makes all eligibility decisions.
                  </span>
                </label>
              </div>
            </>
          ) : (
            <>
              <p className="leading-relaxed">
                We understand you cannot donate right now. Your availability will be preserved and we will not send further notifications for this specific emergency case.
              </p>
              <label className="flex items-start gap-2 pt-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={disclaimerAccepted}
                  onChange={(e) => setDisclaimerAccepted(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-red-600 focus:ring-red-500"
                />
                <span className="text-xs font-medium text-slate-800">
                  Confirm decline for this request
                </span>
              </label>
            </>
          )}

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button variant="ghost" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant={selectedResponse === ResponseType.I_CAN_HELP ? 'primary' : 'secondary'}
              size="sm"
              disabled={!disclaimerAccepted}
              isLoading={isSubmitting}
              onClick={handleSubmitResponse}
            >
              Confirm Response
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
