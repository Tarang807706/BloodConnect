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
import { Users, Megaphone, PlusCircle, CheckCircle2, ShieldCheck, Heart } from 'lucide-react';
import { BloodGroup } from '@bloodconnect/shared';

export default function NgoDashboard() {
  const [dashboard, setDashboard] = useState<any>(null);
  const [cases, setCases] = useState<any[]>([]);
  const [volunteers, setVolunteers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Volunteer creation modal
  const [isAddVolunteerOpen, setIsAddVolunteerOpen] = useState(false);
  const [volunteerForm, setVolunteerForm] = useState({
    fullName: '',
    phone: '',
    email: '',
    city: 'Bengaluru',
    area: 'Jayanagar',
    approxLat: 12.93,
    approxLng: 77.58,
    bloodGroup: BloodGroup.O_POS,
    specialSkills: 'Community Mobilizer',
  });

  // Broadcast modal
  const [broadcastCaseId, setBroadcastCaseId] = useState<string | null>(null);
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [isBroadcasting, setIsBroadcasting] = useState(false);

  const fetchData = async () => {
    try {
      const d = await api.get('/ngo/dashboard');
      setDashboard(d);
      const c = await api.get('/ngo/cases');
      setCases(c);
      const v = await api.get('/ngo/volunteers');
      setVolunteers(v);
    } catch {}
    finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateVolunteer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/ngo/volunteers', volunteerForm);
      setIsAddVolunteerOpen(false);
      setVolunteerForm({
        fullName: '',
        phone: '',
        email: '',
        city: 'Bengaluru',
        area: 'Jayanagar',
        approxLat: 12.93,
        approxLng: 77.58,
        bloodGroup: BloodGroup.O_POS,
        specialSkills: 'Community Mobilizer',
      });
      await fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to add volunteer');
    }
  };

  const handleBroadcast = async () => {
    if (!broadcastCaseId) return;
    setIsBroadcasting(true);
    try {
      const res = await api.post(`/ngo/cases/${broadcastCaseId}/activate`, {
        broadcastMessage,
      });
      alert(res.message);
      setBroadcastCaseId(null);
      setBroadcastMessage('');
      await fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to dispatch broadcast');
    } finally {
      setIsBroadcasting(false);
    }
  };

  if (isLoading) {
    return <div className="max-w-7xl mx-auto px-4 py-12 text-center text-slate-400">Loading NGO Portal...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <DisclaimerBanner message="VOLUNTEER MOBILIZATION NOTICE: NGO volunteers assist solely in community mobilization, transportation, and raising awareness. Clinical eligibility and collection are performed exclusively at the authorized blood centre." />

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900">NGO Volunteer Coordination Network</h1>
          <p className="text-xs text-slate-500 mt-1">
            Stage 3 emergency mobilization for acute hospital shortages requiring grassroots volunteer outreach.
          </p>
        </div>

        <Button variant="primary" size="sm" onClick={() => setIsAddVolunteerOpen(true)} className="flex items-center gap-1.5">
          <PlusCircle className="h-4 w-4" />
          <span>Add Volunteer to Roster</span>
        </Button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs font-semibold text-purple-600 uppercase tracking-wider">Activated Emergency Cases</div>
          <div className="text-2xl font-black text-purple-700 mt-1">{cases.length}</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Registered Volunteer Roster</div>
          <div className="text-2xl font-black text-slate-900 mt-1">{volunteers.length} Active</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Mobilization Efficiency</div>
          <div className="text-2xl font-black text-emerald-600 mt-1">94% Reach</div>
        </div>
      </div>

      {/* Activated Emergency Cases */}
      <Card>
        <CardHeader>
          <CardTitle>Activated Cases Requiring NGO Network Mobilization</CardTitle>
        </CardHeader>
        <CardContent>
          {cases.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-400">
              No cases currently in Stage 3 NGO activation.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {cases.map((c) => (
                <div key={c.caseId} className="py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-slate-900 text-base">
                        Case {c.caseId.slice(0, 8)}: {c.bloodGroup}
                      </span>
                      <StatusBadge status={c.caseStatus || 'NGO_ACTIVATED'} />
                      <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded">
                        Shortage: {c.shortageUnits} Units
                      </span>
                    </div>
                    <div className="text-xs text-slate-600">
                      Message: &ldquo;{c.broadcastMessage}&rdquo;
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => {
                        setBroadcastCaseId(c.caseId);
                        setBroadcastMessage(`Urgent: ${c.shortageUnits} units of ${c.bloodGroup} needed immediately. Contact nearby voluntary donors.`);
                      }}
                      className="flex items-center gap-1.5"
                    >
                      <Megaphone className="h-3.5 w-3.5" />
                      <span>Mobilize Volunteer Network</span>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Volunteer Roster */}
      <Card>
        <CardHeader>
          <CardTitle>Registered Volunteer Roster</CardTitle>
        </CardHeader>
        <CardContent>
          {volunteers.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-400">No volunteers registered yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-2.5 px-4">Volunteer Name</th>
                    <th className="py-2.5 px-4">Phone</th>
                    <th className="py-2.5 px-4">Area / City</th>
                    <th className="py-2.5 px-4">Blood Group</th>
                    <th className="py-2.5 px-4">Special Role</th>
                    <th className="py-2.5 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {volunteers.map((v) => (
                    <tr key={v.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-bold text-slate-900">{v.fullName}</td>
                      <td className="py-3 px-4 font-mono">{v.phone}</td>
                      <td className="py-3 px-4 text-slate-600">{v.area}, {v.city}</td>
                      <td className="py-3 px-4 font-bold text-red-600">{v.bloodGroup || 'Any'}</td>
                      <td className="py-3 px-4 text-slate-700">{v.specialSkills || 'Community Outreach'}</td>
                      <td className="py-3 px-4">
                        <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700">
                          Active
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Volunteer Modal */}
      {isAddVolunteerOpen && (
        <Modal isOpen={true} onClose={() => setIsAddVolunteerOpen(false)} title="Register Volunteer to NGO Roster">
          <form onSubmit={handleCreateVolunteer} className="space-y-4 text-xs">
            <Input
              label="Full Name"
              value={volunteerForm.fullName}
              onChange={(e) => setVolunteerForm({ ...volunteerForm, fullName: e.target.value })}
              required
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Phone Number"
                value={volunteerForm.phone}
                onChange={(e) => setVolunteerForm({ ...volunteerForm, phone: e.target.value })}
                required
              />
              <Input
                label="Email (Optional)"
                type="email"
                value={volunteerForm.email}
                onChange={(e) => setVolunteerForm({ ...volunteerForm, email: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Neighborhood / Area"
                value={volunteerForm.area}
                onChange={(e) => setVolunteerForm({ ...volunteerForm, area: e.target.value })}
                required
              />
              <Input
                label="Special Role / Skills"
                value={volunteerForm.specialSkills}
                onChange={(e) => setVolunteerForm({ ...volunteerForm, specialSkills: e.target.value })}
                placeholder="e.g. Ambulance driver, Youth mobilizer"
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <Button variant="ghost" size="sm" type="button" onClick={() => setIsAddVolunteerOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" type="submit">
                Save Volunteer
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Broadcast Modal */}
      {broadcastCaseId && (
        <Modal isOpen={true} onClose={() => setBroadcastCaseId(null)} title="Dispatch Mobilization Broadcast">
          <div className="space-y-4 text-xs">
            <p className="text-slate-600">
              Send an instant emergency broadcast to all {volunteers.length} registered volunteers in this NGO chapter:
            </p>
            <Input
              label="Broadcast Message"
              value={broadcastMessage}
              onChange={(e) => setBroadcastMessage(e.target.value)}
              required
            />
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <Button variant="ghost" size="sm" onClick={() => setBroadcastCaseId(null)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" isLoading={isBroadcasting} onClick={handleBroadcast}>
                Dispatch Broadcast
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
