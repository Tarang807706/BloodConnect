import React from 'react';
import { CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { CaseStatus } from '@bloodconnect/shared';

interface TimelineProps {
  currentStatus: string;
  currentStageNumber?: number;
  history?: Array<{
    id: string;
    fromStatus: string | null;
    toStatus: string;
    reason?: string | null;
    actorRole?: string | null;
    createdAt: string;
  }>;
}

export const CaseTimeline: React.FC<TimelineProps> = ({
  currentStatus,
  currentStageNumber = 1,
  history = [],
}) => {
  const steps = [
    { label: 'Hospital Submitted', id: 'SUBMITTED' },
    { label: 'Centre Verified', id: 'VERIFIED' },
    { label: 'Stage 1 (Proximity)', stage: 1, id: 'ACTIVE_STAGE_1' },
    { label: 'Stage 2 (Expanded)', stage: 2, id: 'ACTIVE_STAGE_2' },
    { label: 'Stage 3 (NGO Mobilized)', stage: 3, id: 'NGO_ACTIVATED' },
    { label: 'Stage 4 (Escalated)', stage: 4, id: 'ESCALATED' },
    { label: 'Fulfilled / Closed', id: 'FULFILLED' },
  ];

  const getStepState = (stepIndex: number, step: any) => {
    if (currentStatus === CaseStatus.FULFILLED || currentStatus === CaseStatus.CLOSED) {
      return 'completed';
    }
    if (step.stage && currentStageNumber > step.stage) {
      return 'completed';
    }
    if (step.stage && currentStageNumber === step.stage) {
      return 'current';
    }
    if (step.id === currentStatus) {
      return 'current';
    }
    return 'upcoming';
  };

  return (
    <div className="w-full py-4">
      <div className="flex items-center justify-between relative">
        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-slate-200 -translate-y-1/2 z-0" />

        {steps.map((step, idx) => {
          const state = getStepState(idx, step);

          return (
            <div key={step.id} className="relative z-10 flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-colors shadow-sm ${
                  state === 'completed'
                    ? 'bg-emerald-600 text-white'
                    : state === 'current'
                    ? 'bg-red-600 text-white ring-4 ring-red-100 animate-pulse'
                    : 'bg-white border-2 border-slate-300 text-slate-400'
                }`}
              >
                {state === 'completed' ? (
                  <CheckCircle2 className="h-5 w-5" />
                ) : (
                  <span>{idx + 1}</span>
                )}
              </div>
              <span className="mt-2 text-[10px] font-semibold text-slate-700 text-center max-w-[70px] leading-tight">
                {step.label}
              </span>
            </div>
          );
        })}
      </div>

      {history.length > 0 && (
        <div className="mt-6 pt-4 border-t border-slate-100">
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Audit Transition Log</h4>
          <div className="space-y-1.5 max-h-36 overflow-y-auto pr-2">
            {history.map((h) => (
              <div key={h.id} className="text-xs text-slate-600 flex items-start justify-between py-1 border-b border-slate-50">
                <div>
                  <span className="font-semibold text-slate-800">{h.toStatus}</span>
                  {h.reason && <span className="text-slate-500"> - {h.reason}</span>}
                  <span className="text-slate-400 text-[10px] ml-1">({h.actorRole || 'System'})</span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono whitespace-nowrap ml-2">
                  {new Date(h.createdAt).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
