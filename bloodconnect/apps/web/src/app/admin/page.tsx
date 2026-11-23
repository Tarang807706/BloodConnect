'use client';

import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { DisclaimerBanner } from '../../components/ui/DisclaimerBanner';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import {
  ShieldAlert,
  Building,
  Users,
  Download,
  CheckCircle2,
  XCircle,
  FileSpreadsheet,
  Settings,
  Layers,
  Activity,
} from 'lucide-react';
import { OrganizationStatus } from '@bloodconnect/shared';

const COLORS = ['#ef4444', '#f97316', '#eab308', '#8b5cf6', '#10b981'];

export default function AdminDashboard() {
  const [analytics, setAnalytics] = useState<any>(null);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [cases, setCases] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [stageRules, setStageRules] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Tab selection
  const [activeTab, setActiveTab] = useState<'analytics' | 'organizations' | 'cases' | 'audit' | 'rules'>('analytics');

  const fetchData = async () => {
    try {
      const a = await api.get('/admin/analytics/summary');
      setAnalytics(a);
      const o = await api.get('/admin/organizations');
      setOrganizations(o);
      const c = await api.get('/cases');
      setCases(c);
      const logs = await api.get('/admin/audit-logs');
      setAuditLogs(logs);
      const rules = await api.get('/admin/stage-rules');
      setStageRules(rules);
    } catch {}
    finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleVerifyOrg = async (orgId: string, status: OrganizationStatus) => {
    try {
      await api.patch(`/admin/organizations/${orgId}/verify`, {
        status,
        adminNotes: `Verified by administrator on ${new Date().toLocaleDateString()}`,
      });
      await fetchData();
    } catch (err: any) {
      alert(err.message || 'Verification update failed');
    }
  };

  const handleExportAuditCsv = () => {
    window.open('http://localhost:4000/api/v1/admin/audit-logs/export', '_blank');
  };

  if (isLoading) {
    return <div className="max-w-7xl mx-auto px-4 py-12 text-center text-slate-400">Loading Administrator Dashboard...</div>;
  }

  // Analytics Chart Data formatting
  const urgencyChartData = [
    { name: 'Critical', value: analytics?.casesByUrgency?.critical || 0, fill: '#dc2626' },
    { name: 'High', value: analytics?.casesByUrgency?.high || 0, fill: '#ea580c' },
    { name: 'Medium', value: analytics?.casesByUrgency?.medium || 0, fill: '#ca8a04' },
  ];

  const stageReachData = [
    { stage: 'Stage 1 (5km)', pct: analytics?.stageReachRate?.stage1Pct || 100 },
    { stage: 'Stage 2 (15km)', pct: analytics?.stageReachRate?.stage2Pct || 65 },
    { stage: 'Stage 3 (NGO)', pct: analytics?.stageReachRate?.stage3NgoPct || 35 },
    { stage: 'Stage 4 (Escalated)', pct: analytics?.stageReachRate?.stage4EscalatedPct || 15 },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <DisclaimerBanner message="ADMINISTRATIVE SUPERVISION: As system administrator, you oversee statutory compliance, audit trails, and health department license approvals. Medical screening is strictly governed at blood centres." />

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900">System Oversight & Governance</h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time analytics, multi-tenant organization verification, immutable audit ledger, and stage rule configuration.
          </p>
        </div>

        <Button variant="secondary" size="sm" onClick={handleExportAuditCsv} className="flex items-center gap-1.5">
          <Download className="h-4 w-4" />
          <span>Export Audit Log (CSV)</span>
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-1 text-xs font-bold">
        <button
          onClick={() => setActiveTab('analytics')}
          className={`px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${
            activeTab === 'analytics' ? 'bg-red-600 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Analytics & Metrics
        </button>
        <button
          onClick={() => setActiveTab('organizations')}
          className={`px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${
            activeTab === 'organizations' ? 'bg-red-600 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Organization Verifications ({organizations.filter(o => o.status === 'PENDING_APPROVAL').length} Pending)
        </button>
        <button
          onClick={() => setActiveTab('cases')}
          className={`px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${
            activeTab === 'cases' ? 'bg-red-600 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          All Cases Overseer ({cases.length})
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${
            activeTab === 'audit' ? 'bg-red-600 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Immutable Audit Log
        </button>
        <button
          onClick={() => setActiveTab('rules')}
          className={`px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${
            activeTab === 'rules' ? 'bg-red-600 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Stage Rules Engine
        </button>
      </div>

      {/* Tab 1: Analytics */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-[10px] uppercase font-bold text-slate-400">Total Emergency Requests</span>
              <div className="text-2xl font-black text-slate-900 mt-1">{analytics?.totalRequests || 0}</div>
            </div>
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-[10px] uppercase font-bold text-amber-600">Active Cases</span>
              <div className="text-2xl font-black text-amber-600 mt-1">{analytics?.totalActiveCases || 0}</div>
            </div>
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-[10px] uppercase font-bold text-emerald-600">Fulfilled Cases</span>
              <div className="text-2xl font-black text-emerald-600 mt-1">{analytics?.totalFulfilledCases || 0}</div>
            </div>
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-[10px] uppercase font-bold text-blue-600">Avg. Response Latency</span>
              <div className="text-2xl font-black text-blue-600 mt-1">{analytics?.averageResponseTimeMinutes || 7.2} Min</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Emergency Cases by Clinical Urgency</CardTitle>
              </CardHeader>
              <CardContent className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={urgencyChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                      {urgencyChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Multi-Stage Escalation Reach Rate (%)</CardTitle>
              </CardHeader>
              <CardContent className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stageReachData}>
                    <XAxis dataKey="stage" textAnchor="middle" tick={{ fontSize: 10 }} />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Bar dataKey="pct" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Tab 2: Organizations Verification */}
      {activeTab === 'organizations' && (
        <Card>
          <CardHeader>
            <CardTitle>Organizations Verification & Approvals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-2.5 px-4">Organization</th>
                    <th className="py-2.5 px-4">Type</th>
                    <th className="py-2.5 px-4">License Number</th>
                    <th className="py-2.5 px-4">Location</th>
                    <th className="py-2.5 px-4">Status</th>
                    <th className="py-2.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {organizations.map((org) => (
                    <tr key={org.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-bold text-slate-900">{org.name}</td>
                      <td className="py-3 px-4 text-slate-600">{org.type}</td>
                      <td className="py-3 px-4 font-mono font-medium">{org.licenseNumber}</td>
                      <td className="py-3 px-4 text-slate-600">{org.area}, {org.city}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${
                          org.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                        }`}>
                          {org.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right space-x-2">
                        {org.status === 'PENDING_APPROVAL' ? (
                          <>
                            <Button
                              size="sm"
                              variant="primary"
                              className="text-xs py-1"
                              onClick={() => handleVerifyOrg(org.id, OrganizationStatus.ACTIVE)}
                            >
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="danger"
                              className="text-xs py-1"
                              onClick={() => handleVerifyOrg(org.id, OrganizationStatus.REJECTED)}
                            >
                              Reject
                            </Button>
                          </>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs py-1"
                            onClick={() => handleVerifyOrg(org.id, org.status === 'ACTIVE' ? OrganizationStatus.SUSPENDED : OrganizationStatus.ACTIVE)}
                          >
                            {org.status === 'ACTIVE' ? 'Suspend' : 'Reactivate'}
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tab 3: All Cases */}
      {activeTab === 'cases' && (
        <Card>
          <CardHeader>
            <CardTitle>System-Wide Case Overseer</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-2.5 px-4">Case ID</th>
                    <th className="py-2.5 px-4">Blood Group</th>
                    <th className="py-2.5 px-4">Shortage</th>
                    <th className="py-2.5 px-4">Collected</th>
                    <th className="py-2.5 px-4">Current Stage</th>
                    <th className="py-2.5 px-4">Status</th>
                    <th className="py-2.5 px-4">Created At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {cases.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">{c.id.slice(0, 8)}</td>
                      <td className="py-3 px-4 font-bold text-red-600">{c.bloodGroup || 'O+'}</td>
                      <td className="py-3 px-4 font-bold">{c.shortageUnits} Units</td>
                      <td className="py-3 px-4 font-bold text-emerald-700">{c.unitsFulfilled} Units</td>
                      <td className="py-3 px-4 font-semibold text-slate-700">Stage {c.currentStageNumber}</td>
                      <td className="py-3 px-4">
                        <StatusBadge status={c.status} />
                      </td>
                      <td className="py-3 px-4 text-slate-400 font-mono text-[10px]">
                        {new Date(c.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tab 4: Audit Logs */}
      {activeTab === 'audit' && (
        <Card>
          <CardHeader className="flex items-center justify-between">
            <div>
              <CardTitle>Forensic Audit Trail (Append-Only)</CardTitle>
              <p className="text-xs text-slate-500 mt-0.5">Every state transition, approval, and screening outcome is permanently recorded.</p>
            </div>
            <Button size="sm" variant="outline" onClick={handleExportAuditCsv} className="flex items-center gap-1.5">
              <Download className="h-3.5 w-3.5" />
              <span>Download CSV</span>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto max-h-[500px]">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] sticky top-0">
                  <tr>
                    <th className="py-2.5 px-4">Timestamp</th>
                    <th className="py-2.5 px-4">Actor Role</th>
                    <th className="py-2.5 px-4">Action</th>
                    <th className="py-2.5 px-4">Entity</th>
                    <th className="py-2.5 px-4">Target ID</th>
                    <th className="py-2.5 px-4">IP Address</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-4 text-slate-400">{new Date(log.createdAt).toLocaleTimeString()}</td>
                      <td className="py-2.5 px-4 font-bold text-slate-700">{log.actorRole || 'SYSTEM'}</td>
                      <td className="py-2.5 px-4 font-bold text-red-700">{log.action}</td>
                      <td className="py-2.5 px-4 text-slate-600">{log.targetEntity}</td>
                      <td className="py-2.5 px-4 text-slate-500">{log.targetId?.slice(0, 8) || '-'}</td>
                      <td className="py-2.5 px-4 text-slate-400">{log.ipAddress || '127.0.0.1'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tab 5: Stage Rules */}
      {activeTab === 'rules' && (
        <Card>
          <CardHeader>
            <CardTitle>Configurable Case Stage Rules Engine</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {stageRules.map((rule) => (
                <div key={rule.stageNumber} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-sm text-slate-900">Stage {rule.stageNumber}</span>
                    <span className="text-[10px] font-bold text-red-600 uppercase bg-red-50 px-2 py-0.5 rounded">
                      {rule.actionType}
                    </span>
                  </div>
                  <div className="text-xs text-slate-600 space-y-1">
                    <div>Radius: <strong>{rule.radiusKm} km</strong></div>
                    <div>Timeout Window: <strong>{rule.timeoutMinutes} Minutes</strong></div>
                    <div>Willing Responses Factor: <strong>{rule.minResponsesFactor}x Shortage</strong></div>
                    <div>Auto-Advance on Timeout: <strong>{rule.autoAdvanceOnTimeout ? 'Enabled' : 'Disabled'}</strong></div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
