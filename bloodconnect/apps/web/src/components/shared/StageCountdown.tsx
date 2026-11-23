'use client';

import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface StageCountdownProps {
  dueAt: string | null | undefined;
  onTimeout?: () => void;
  className?: string;
}

export const StageCountdown: React.FC<StageCountdownProps> = ({
  dueAt,
  onTimeout,
  className = '',
}) => {
  const [timeLeft, setTimeLeft] = useState<{ minutes: number; seconds: number } | null>(null);
  const [isOverdue, setIsOverdue] = useState(false);

  useEffect(() => {
    if (!dueAt) {
      setTimeLeft(null);
      return;
    }

    const calculateTime = () => {
      const difference = new Date(dueAt).getTime() - new Date().getTime();

      if (difference <= 0) {
        setIsOverdue(true);
        setTimeLeft({ minutes: 0, seconds: 0 });
        onTimeout?.();
        return;
      }

      setIsOverdue(false);
      const minutes = Math.floor((difference / 1000 / 60) % 60);
      const seconds = Math.floor((difference / 1000) % 60);
      setTimeLeft({ minutes, seconds });
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [dueAt, onTimeout]);

  if (!dueAt || !timeLeft) {
    return <span className="text-xs text-slate-400">Timer inactive</span>;
  }

  const isUrgent = !isOverdue && timeLeft.minutes < 2;

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-mono font-bold border ${
        isOverdue
          ? 'bg-rose-100 text-rose-800 border-rose-300'
          : isUrgent
          ? 'bg-amber-100 text-amber-800 border-amber-300 animate-pulse'
          : 'bg-slate-100 text-slate-800 border-slate-300'
      } ${className}`}
    >
      <Clock className="h-3.5 w-3.5" />
      <span>
        {isOverdue
          ? 'AUTO-ADVANCING...'
          : `${String(timeLeft.minutes).padStart(2, '0')}:${String(timeLeft.seconds).padStart(2, '0')}`}
      </span>
    </div>
  );
};
