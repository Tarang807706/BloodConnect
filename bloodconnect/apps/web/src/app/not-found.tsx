'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '../components/ui/Button';
import { Droplet, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="max-w-md mx-auto py-24 px-4 text-center space-y-5">
      <div className="w-16 h-16 rounded-3xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto shadow-sm">
        <Droplet className="h-8 w-8" />
      </div>

      <h1 className="text-3xl font-black text-slate-900">404</h1>
      <h2 className="text-base font-bold text-slate-700">Coordination Record Not Found</h2>
      <p className="text-xs text-slate-500 leading-relaxed">
        The requested emergency case, verification record, or coordination route does not exist or has expired from the active ledger.
      </p>

      <div className="pt-2">
        <Link href="/">
          <Button variant="secondary" className="flex items-center gap-2 mx-auto">
            <ArrowLeft className="h-4 w-4" />
            <span>Return to Dashboard</span>
          </Button>
        </Link>
      </div>
    </div>
  );
}
