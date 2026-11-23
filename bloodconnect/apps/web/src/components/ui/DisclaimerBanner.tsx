import React from 'react';
import { AlertTriangle, ShieldCheck } from 'lucide-react';

interface DisclaimerBannerProps {
  message?: string;
  variant?: 'warning' | 'info';
  className?: string;
}

export const DisclaimerBanner: React.FC<DisclaimerBannerProps> = ({
  message = 'CLINICAL SAFETY NOTICE: BloodConnect is an emergency coordination tool only. Registered users are strictly potential voluntary donors. Final medical screening, compatibility testing, collection, and distribution are performed exclusively by authorized blood centres.',
  variant = 'warning',
  className = '',
}) => {
  const isWarning = variant === 'warning';

  return (
    <div
      className={`rounded-lg p-3.5 text-xs flex items-start gap-2.5 border ${
        isWarning
          ? 'bg-amber-50 text-amber-900 border-amber-200'
          : 'bg-blue-50 text-blue-900 border-blue-200'
      } ${className}`}
    >
      {isWarning ? (
        <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
      ) : (
        <ShieldCheck className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
      )}
      <div className="leading-relaxed font-medium">{message}</div>
    </div>
  );
};
