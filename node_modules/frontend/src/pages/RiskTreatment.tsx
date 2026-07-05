import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../store/useAuthStore';
import { Plus, Edit2, Trash2, Calendar, DollarSign, Activity, CheckCircle, Clock } from 'lucide-react';
import { Modal } from '../components/ui/Modal';
import { TableSkeleton } from '../components/ui/Skeleton';
import { toast } from '../store/useToastStore';

export const RiskTreatment: React.FC = () => {
  const token = useAuthStore((state) => state.token);
  const { user } = useAuthStore() as any;
  const queryClient = useQueryClient();

  const isReadOnly = ['viewer', 'auditor'].includes(user?.role);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTreatment, setSelectedTreatment] = useState<any | null>(null);

  // Form States
  const [riskId, setRiskId] = useState('');
  const [ownerId, setOwnerId] = useState('');
  const [budget, setBudget] = useState(0);
  const [dueDate, setDueDate] = useState('');
  const [progressPercent, setProgressPercent] = useState(0);
  const [status, setStatus] = useState<'planned' | 'in_progress' | 'completed' | 'deferred'>('planned');
  const [description, setDescription] = useState('');

  // Fetch Treatment Plans
  const { data: treatments = [], isLoading } = useQuery<any[]>({
    queryKey: ['treatments'],
    queryFn: async () => {
      const res = await fetch('/api/treatments', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch treatments');
      return res.json();
    },
    enabled: !!token,
  });

  // Fetch Risks (to link)
  const { data: risks = [] } = useQuery<any[]>({
    queryKey: ['risks'],
    queryFn: async () => {
      const res = await fetch('/api/risks', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!token && !isReadOnly,
  });

  // Fetch Users (for owner allocation)
  const { data: users = [] } = useQuery<any[]>({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await fetch('/api/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!token && !isReadOnly,
  });

  // Create Mutation
  const createMutation = useMutation({
    mutationFn: async (newTreatment: any) => {
      const res = await fetch('/api/treatments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newTreatment)
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to define treatment');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['treatments'] });
      queryClient.invalidateQueries({ queryKey: ['risks'] });
      toast.success('Risk treatment plan active');
      closeModal();
    },
    onError: (err: any) => {
      toast.error(`Error: ${err.message}`);
    }
  });

  // Update Mutation
  const updateMutation = useMutation({
    mutationFn: async (updatedTreatment: any) => {
      const res = await fetch(`/api/treatments/${selectedTreatment.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updatedTreatment)
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update treatment');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['treatments'] });
      queryClient.invalidateQueries({ queryKey: ['risks'] });
      toast.success('Risk treatment plan updated');
      closeModal();
    },
    onError: (err: any) => {
      toast.error(`Error: ${err.message}`);
    }
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/treatments/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete treatment');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['treatments'] });
      queryClient.invalidateQueries({ queryKey: ['risks'] });
      toast.success('Treatment plan removed');
    },
    onError: (err: any) => {
      toast.error(`Error: ${err.message}`);
    }
  });

  const openCreateModal = () => {
    setSelectedTreatment(null);
    setRiskId('');
    setOwnerId('');
    setBudget(0);
    setDueDate('');
    setProgressPercent(0);
    setStatus('planned');
    setDescription('');
    setIsModalOpen(true);
  };

  const openEditModal = (t: any) => {
    setSelectedTreatment(t);
    setRiskId(t.riskId);
    setOwnerId(t.ownerId || '');
    setBudget(t.budget);
    setDueDate(new Date(t.dueDate).toISOString().substring(0, 10));
    setProgressPercent(t.progressPercent);
    setStatus(t.status);
    setDescription(t.description || '');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedTreatment(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!riskId || !dueDate) {
      toast.error('Risk alignment and due date are required');
      return;
    }

    const payload = {
      riskId,
      ownerId: ownerId || null,
      budget: Number(budget),
      dueDate: new Date(dueDate).toISOString(),
      progressPercent: Number(progressPercent),
      status,
      description: description || null,
    };

    if (selectedTreatment) {
      updateMutation.mutate(payload);
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Delete this treatment plan? This will set the linked risk back to identified status.')) {
      deleteMutation.mutate(id);
    }
  };

  // Only display risks that do not already have an active treatment plan (excluding the currently edited risk)
  const availableRisks = risks.filter(r => 
    !treatments.some(t => t.riskId === r.id) || 
    (selectedTreatment && selectedTreatment.riskId === r.id)
  );

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Risk Treatment Plans</h1>
          <p className="text-xs text-dark-muted">Establish corrective action paths, budget allocations, milestones, and track mitigation progress.</p>
        </div>
        {!isReadOnly && (
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white font-medium text-xs py-2.5 px-4 rounded-lg shadow-lg shadow-brand-500/10 transition-all w-fit"
          >
            <Plus className="h-4 w-4" />
            Define Plan
          </button>
        )}
      </div>

      {/* Main Treatments Grid */}
      {isLoading ? (
        <TableSkeleton />
      ) : (
        <div className="border border-dark-border rounded-xl overflow-hidden bg-dark-card shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-dark-border text-dark-muted font-medium bg-[#161d30]/60">
                  <th className="p-4">Risk Identifier</th>
                  <th className="p-4">Mitigation Strategy Summary</th>
                  <th className="p-4">Owner</th>
                  <th className="p-4">Budget</th>
                  <th className="p-4">Due Date</th>
                  <th className="p-4">Progress</th>
                  <th className="p-4">Status</th>
                  {!isReadOnly && <th className="p-4 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-border/40">
                {treatments.length === 0 ? (
                  <tr>
                    <td colSpan={isReadOnly ? 7 : 8} className="p-8 text-center text-dark-muted">No treatment plans defined yet.</td>
                  </tr>
                ) : (
                  treatments.map((t) => (
                    <tr key={t.id} className="hover:bg-dark-border/20 transition-colors">
                      <td className="p-4">
                        <div className="font-bold text-brand-500">{t.riskIdentifier}</div>
                        <div className="font-semibold text-dark-text max-w-[120px] truncate mt-0.5" title={t.riskTitle}>{t.riskTitle}</div>
                      </td>
                      <td className="p-4">
                        <p className="text-dark-text font-medium leading-relaxed max-w-[200px] truncate">{t.description || 'No strategy defined.'}</p>
                      </td>
                      <td className="p-4 font-semibold text-dark-text">
                        {t.ownerName || 'Unassigned'}
                        {t.ownerEmail && <div className="text-[10px] font-medium text-dark-muted mt-0.5">{t.ownerEmail}</div>}
                      </td>
                      <td className="p-4 font-bold text-dark-text">
                        ${t.budget.toLocaleString()}
                      </td>
                      <td className="p-4 text-dark-muted font-medium">
                        {new Date(t.dueDate).toLocaleDateString()}
                      </td>
                      <td className="p-4">
                        <div className="w-full max-w-[100px] bg-dark-bg border border-dark-border h-2 rounded-full overflow-hidden flex">
                          <div 
                            className={`h-full ${t.progressPercent === 100 ? 'bg-emerald-500' : 'bg-brand-500'}`} 
                            style={{ width: `${t.progressPercent}%` }} 
                          />
                        </div>
                        <span className="text-[9px] font-bold text-dark-text mt-1 block">{t.progressPercent}% Complete</span>
                      </td>
                      <td className="p-4 capitalize">
                        <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-medium border ${
                          t.status === 'completed' 
                            ? 'bg-emerald-950/20 border-emerald-800/40 text-emerald-300'
                            : t.status === 'deferred'
                            ? 'bg-red-950/20 border-red-800/40 text-red-300'
                            : 'bg-amber-950/20 border-amber-800/40 text-amber-300'
                        }`}>
                          {t.status.replace('_', ' ')}
                        </span>
                      </td>
                      {!isReadOnly && (
                        <td className="p-4 text-right">
                          <div className="inline-flex gap-2">
                            <button
                              onClick={() => openEditModal(t)}
                              className="p-1.5 text-dark-muted hover:text-white rounded-lg hover:bg-dark-border transition-colors"
                            >
                              <Edit2 className="h-4.5 w-4.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(t.id)}
                              className="p-1.5 text-red-400 hover:text-red-300 rounded-lg hover:bg-red-950/20 transition-colors"
                            >
                              <Trash2 className="h-4.5 w-4.5" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATE / EDIT DIALOG MODAL */}
      <Modal isOpen={isModalOpen} onClose={closeModal} title={selectedTreatment ? 'Edit Treatment Plan' : 'Define Corrective Action Plan'}>
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          
          <div className="space-y-1">
            <label className="text-xs font-semibold text-dark-text">Select Risk Event</label>
            <select
              value={riskId}
              onChange={(e) => setRiskId(e.target.value)}
              className="w-full bg-[#232d45]/20 border border-dark-border rounded-lg px-3 py-2 text-xs text-dark-text focus:outline-none"
              disabled={!!selectedTreatment}
              required
            >
              <option value="">Select Risk...</option>
              {availableRisks.map(r => (
                <option key={r.id} value={r.id}>{r.riskId} - {r.title}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-dark-text">Mitigation Owner</label>
            <select
              value={ownerId}
              onChange={(e) => setOwnerId(e.target.value)}
              className="w-full bg-[#232d45]/20 border border-dark-border rounded-lg px-3 py-2 text-xs text-dark-text focus:outline-none"
            >
              <option value="">Select Owner...</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-dark-text">Mitigation Budget (USD)</label>
              <div className="relative">
                <DollarSign className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-dark-muted" />
                <input
                  type="number"
                  value={budget}
                  onChange={(e) => setBudget(Number(e.target.value))}
                  className="w-full bg-[#232d45]/20 border border-dark-border rounded-lg pl-8 pr-3 py-2 text-xs text-dark-text focus:outline-none"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-dark-text">Target Due Date</label>
              <div className="relative">
                <Calendar className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-dark-muted" />
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full bg-[#232d45]/20 border border-dark-border rounded-lg pl-8 pr-3 py-2 text-xs text-dark-text focus:outline-none"
                  required
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-dark-text">Progress Completion (%)</label>
              <input
                type="number"
                min={0}
                max={100}
                value={progressPercent}
                onChange={(e) => setProgressPercent(Number(e.target.value))}
                className="w-full bg-[#232d45]/20 border border-dark-border rounded-lg px-3 py-2 text-xs text-dark-text focus:outline-none"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-dark-text">Plan Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full bg-[#232d45]/20 border border-dark-border rounded-lg px-3 py-2 text-xs text-dark-text focus:outline-none"
              >
                <option value="planned">Planned</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="deferred">Deferred</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-dark-text">Description of Mitigation Strategy</label>
            <textarea
              placeholder="Outline steps, firewall configurations, patching timelines, or security policies to be established..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full bg-[#232d45]/20 border border-dark-border rounded-lg px-3 py-2 text-xs text-dark-text focus:outline-none focus:border-brand-500"
              required
            />
          </div>

          <div className="border-t border-dark-border pt-4 flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={closeModal}
              className="bg-transparent hover:bg-dark-border text-dark-text font-medium text-xs py-2 px-4 rounded-lg border border-dark-border transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
              className="bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white font-medium text-xs py-2 px-4 rounded-lg shadow-lg shadow-brand-500/10 transition-all"
            >
              {selectedTreatment ? 'Save Changes' : 'Create Plan'}
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
};
