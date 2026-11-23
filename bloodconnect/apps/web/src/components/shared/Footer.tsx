import React from 'react';
import { ShieldCheck, Droplet } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-red-600 flex items-center justify-center text-white">
              <Droplet className="h-3.5 w-3.5 fill-current" />
            </div>
            <span className="font-extrabold text-white text-sm tracking-wide">
              BLOOD<span className="text-red-500">CONNECT</span>
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-slate-300 font-semibold bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <span>Authorized Clinical Transfusion Coordination Platform</span>
          </div>
        </div>

        <div className="text-slate-400 text-xs leading-relaxed max-w-4xl border-t border-slate-800 pt-4">
          <strong className="text-slate-200">Clinical & Legal Safety Notice:</strong> BloodConnect does NOT engage in buying, selling, or commercial blood exchange. Blood compatibility, clinical screening, infectious disease testing, component preparation, and transfusion are performed solely by government-authorized blood centres in compliance with the National Blood Transfusion Council (NBTC) guidelines and the Drugs and Cosmetics Act.
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/60">
          <div>&copy; {new Date().getFullYear()} BloodConnect Platform. Academic & Viva Demonstration Release.</div>
          <div className="mt-2 sm:mt-0 font-mono">BTech CSE Capstone Project Implementation</div>
        </div>
      </div>
    </footer>
  );
};
