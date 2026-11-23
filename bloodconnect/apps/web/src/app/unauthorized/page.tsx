'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '../../components/ui/Button';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

export default function UnauthorizedPage() {
  return (
    <div className="max-w-md mx-auto py-24 px-4 text-center space-y-5">
      <div className="w-16 h-16 rounded-3xl bg-red-100 text-red-600 flex items-center justify-center mx-auto shadow-md">
        <ShieldAlert className="h-8 w-8" />
      </div>

      <h1 className="text-2xl font-black text-slate-900">403 - Access Denied</h1>
      <p className="text-xs text-slate-500 leading-relaxed">
        You do not possess the required clinical authorization or role permissions to access this coordination endpoint. Organization tenant boundaries are strictly monitored.
      </p>

      <div className="pt-2">
        <Link href="/">
          <Button variant="secondary" className="flex items-center gap-2 mx-auto">
            <ArrowLeft className="h-4 w-4" />
            <span>Return to Safe Home</span>
          </Button>
        </Link>
      </div>
    </div>
  );
}
