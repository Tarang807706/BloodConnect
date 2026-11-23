import React from 'react';
import { CaseStatus, RequestStatus, Urgency } from '@bloodconnect/shared';

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '' }) => {
  let color = 'bg-slate-100 text-slate-700 border-slate-200';
  let label = status.replace(/_/g, ' ');

  switch (status) {
    case 'ACTIVE_STAGE_1':
      color = 'bg-amber-50 text-amber-700 border-amber-200';
      label = 'Stage 1 (Proximity)';
      break;
    case 'ACTIVE_STAGE_2':
      color = 'bg-orange-50 text-orange-700 border-orange-200';
      label = 'Stage 2 (Expanded)';
      break;
    case 'NGO_ACTIVATED':
      color = 'bg-purple-50 text-purple-700 border-purple-200';
      label = 'Stage 3 (NGO Mobilized)';
      break;
    case 'ESCALATED':
      color = 'bg-rose-50 text-rose-700 border-rose-200';
      label = 'Stage 4 (Escalated)';
      break;
    case 'FULFILLED':
      color = 'bg-emerald-50 text-emerald-700 border-emerald-200';
      label = 'Fulfilled';
      break;
    case 'PARTIALLY_FULFILLED':
      color = 'bg-teal-50 text-teal-700 border-teal-200';
      label = 'Partially Fulfilled';
      break;
    case 'PAUSED':
      color = 'bg-yellow-50 text-yellow-800 border-yellow-200';
      label = 'Paused';
      break;
    case 'CANCELLED':
    case 'REJECTED':
      color = 'bg-red-50 text-red-700 border-red-200';
      break;
    case 'CLOSED':
      color = 'bg-slate-100 text-slate-600 border-slate-300';
      label = 'Closed';
      break;
    case 'SUBMITTED':
      color = 'bg-blue-50 text-blue-700 border-blue-200';
      label = 'Submitted';
      break;
    case 'VERIFIED':
      color = 'bg-cyan-50 text-cyan-700 border-cyan-200';
      label = 'Verified (Shortage Confirmed)';
      break;
    case 'NO_SHORTAGE':
      color = 'bg-green-50 text-green-700 border-green-200';
      label = 'Fulfilled From Stock';
      break;
    case 'CRITICAL':
      color = 'bg-red-100 text-red-800 border-red-300 font-bold';
      break;
    case 'HIGH':
      color = 'bg-orange-100 text-orange-800 border-orange-200';
      break;
    case 'MEDIUM':
      color = 'bg-amber-100 text-amber-800 border-amber-200';
      break;
    case 'I_CAN_HELP':
      color = 'bg-emerald-100 text-emerald-800 border-emerald-300 font-semibold';
      label = 'Willing to Help';
      break;
    case 'CANNOT_HELP':
      color = 'bg-slate-100 text-slate-600 border-slate-200';
      label = 'Cannot Help';
      break;
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${color} ${className}`}
    >
      {label}
    </span>
  );
};
