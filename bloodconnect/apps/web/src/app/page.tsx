'use client';

import React from 'react';
import Link from 'next/link';
import {
  Droplet,
  ShieldAlert,
  ArrowRight,
  Clock,
  Users,
  Building2,
  CheckCircle2,
  AlertTriangle,
  Zap,
} from 'lucide-react';
import { DisclaimerBanner } from '../components/ui/DisclaimerBanner';

export default function LandingPage() {
  return (
    <div className="space-y-16 py-8">
      {/* Disclaimer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <DisclaimerBanner />
      </div>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-6 pb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-100 text-red-700 text-xs font-bold uppercase tracking-wider mb-6">
          <Zap className="h-3.5 w-3.5" />
          <span>Bridging the Emergency Coordination Gap</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight max-w-4xl mx-auto">
          AI-Assisted Emergency Blood Coordination &{' '}
          <span className="text-red-600">Progressive Donor Mobilization</span>
        </h1>

        <p className="mt-6 text-lg sm:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
          When an urgent surgical emergency hits a hospital and regional blood centres lack sufficient shelf stock,
          BloodConnect orchestrates multi-stage voluntary donor mobilization and NGO network activation under strict clinical governance.
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/login"
            className="px-6 py-3.5 rounded-xl bg-red-600 text-white font-bold text-sm hover:bg-red-700 shadow-lg shadow-red-200 transition-all flex items-center gap-2"
          >
            <span>Launch Live Demo & Log In</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/register"
            className="px-6 py-3.5 rounded-xl bg-white text-slate-700 border border-slate-300 font-bold text-sm hover:bg-slate-50 transition-all"
          >
            Register as Voluntary Donor
          </Link>
          <Link
            href="/register/organization"
            className="px-6 py-3.5 rounded-xl bg-slate-900 text-white font-bold text-sm hover:bg-slate-800 transition-all"
          >
            Hospital / Centre Onboarding
          </Link>
        </div>
      </section>

      {/* Positioning Matrix: BloodConnect vs Existing Systems */}
      <section className="bg-slate-100/70 py-16 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
              Why BloodConnect? Not an e-RaktKosh Clone.
            </h2>
            <p className="mt-3 text-sm text-slate-600">
              Understanding the distinct role of BloodConnect in the Indian healthcare ecosystem for your technical viva.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Existing Systems */}
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center gap-3 text-slate-500 font-bold text-sm uppercase tracking-wider">
                <Building2 className="h-5 w-5 text-slate-400" />
                <span>Existing Blood Bank Management Systems</span>
              </div>
              <h3 className="text-xl font-bold text-slate-800">Static Inventory & Directory Catalog</h3>
              <ul className="space-y-3 text-sm text-slate-600 pt-2">
                <li className="flex items-start gap-2">
                  <span className="text-slate-400 font-bold">&bull;</span>
                  Tracks blood units sitting in cold storage across blood banks.
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-slate-400 font-bold">&bull;</span>
                  Donor directories are static lists with unverified real-time availability.
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-slate-400 font-bold">&bull;</span>
                  Does not actively mobilize donors when an acute shortage occurs.
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-slate-400 font-bold">&bull;</span>
                  Hospitals are left manually calling donors during life-or-death crises.
                </li>
              </ul>
            </div>

            {/* BloodConnect Innovation */}
            <div className="bg-red-50/50 p-8 rounded-2xl border border-red-200 shadow-sm space-y-4">
              <div className="flex items-center gap-3 text-red-600 font-bold text-sm uppercase tracking-wider">
                <Zap className="h-5 w-5" />
                <span>BloodConnect Coordination Platform</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900">Dynamic Multi-Stage Emergency Escalation</h3>
              <ul className="space-y-3 text-sm text-slate-700 pt-2">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <strong>Solves the Emergency Gap:</strong> Triggers immediately when hospital shortage is confirmed.
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <strong>Progressive Notification:</strong> Radius ~5 km &rarr; ~15 km &rarr; NGO volunteer brigade &rarr; Regional centres.
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <strong>Pure State Machine:</strong> Concurrency-safe transitions with immutable audit trails.
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <strong>Zero Medical Risk:</strong> Never determines compatibility; strict clinical authority at blood centres.
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 4-Stage Progressive Orchestration Architecture */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
            How The Emergency Response Orchestrator Works
          </h2>
          <p className="mt-3 text-sm text-slate-600">
            A state machine governed by pure evaluator logic (`evaluateNextStage`), automated timers, and clinical confirmation.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative">
            <div className="text-xs font-extrabold text-amber-600 uppercase tracking-wider mb-2">Stage 1</div>
            <h4 className="font-bold text-slate-900 mb-2">Proximity Targeting</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Notifies potential donors within ~5 km radius. 10-minute timer starts. Evaluates willingness responses in real-time.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative">
            <div className="text-xs font-extrabold text-orange-600 uppercase tracking-wider mb-2">Stage 2</div>
            <h4 className="font-bold text-slate-900 mb-2">Expanded Mobilization</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              If responses are insufficient upon timeout, radius expands to ~15 km, mobilizing wider registered donor circles.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative">
            <div className="text-xs font-extrabold text-purple-600 uppercase tracking-wider mb-2">Stage 3</div>
            <h4 className="font-bold text-slate-900 mb-2">NGO Network Activated</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Emergency activation triggers partner NGOs (Lions Club, Sankalp Foundation) to deploy field volunteers and dispatchers.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative">
            <div className="text-xs font-extrabold text-rose-600 uppercase tracking-wider mb-2">Stage 4</div>
            <h4 className="font-bold text-slate-900 mb-2">Regional Escalation</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Transfers coordination to secondary regional blood transfusion networks across the city for inter-facility transfers.
            </p>
          </div>
        </div>
      </section>

      {/* Safety Rules Guarantee */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="bg-slate-900 text-white rounded-3xl p-8 sm:p-12">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-red-400 mb-4">
              <AlertTriangle className="h-4 w-4" />
              <span>Invariable Clinical Safety Principles</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Built Specifically to Pass Medical Viva & Ethical Defense
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8 text-xs text-slate-300">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                <span><strong>No compatibility logic:</strong> Blood centres decide compatibility exclusively.</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                <span><strong>No donor marketplace:</strong> Buying or selling blood is completely impossible.</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                <span><strong>Approximate Location:</strong> Exact addresses are never stored; coordinates rounded to ~1.1 km.</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                <span><strong>Willingness &ne; Eligibility:</strong> "I Can Help" denotes willingness only; screening is mandatory.</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
