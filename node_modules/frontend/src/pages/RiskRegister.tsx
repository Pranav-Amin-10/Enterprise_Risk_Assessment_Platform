import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../store/useAuthStore';
import { Plus, Edit2, Trash2, ShieldAlert, AlertTriangle, Eye, FileText, Upload, Calendar, X, ShieldAlert as AlertIcon } from 'lucide-react';
import { Modal } from '../components/ui/Modal';
import { TableSkeleton } from '../components/ui/Skeleton';
import { toast } from '../store/useToastStore';

export const RiskRegister: React.FC = () => {
  const token = useAuthStore((state) => state.token);
  const { user } = useAuthStore() as any;
  const queryClient = useQueryClient();

  const isReadOnly = ['viewer', 'auditor'].includes(user?.role);

  // Layout states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedRisk, setSelectedRisk] = useState<any | null>(null);
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSeverity, setFilterSeverity] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  // Form core states
  const [riskId, setRiskId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assetId, setAssetId] = useState('');
  const [threatId, setThreatId] = useState('');
  const [vulnerabilityId, setVulnerabilityId] = useState('');
  const [inherentImpact, setInherentImpact] = useState(1);
  const [inherentLikelihood, setInherentLikelihood] = useState(1);
  const [residualImpact, setResidualImpact] = useState(1);
  const [residualLikelihood, setResidualLikelihood] = useState(1);
  const [treatmentStrategy, setTreatmentStrategy] = useState<'accept' | 'mitigate' | 'transfer' | 'avoid'>('mitigate');
  const [riskOwnerId, setRiskOwnerId] = useState('');
  const [status, setStatus] = useState<'identified' | 'assessing' | 'treating' | 'accepted' | 'mitigated' | 'closed'>('identified');
  const [reviewDate, setReviewDate] = useState('');
  const [notes, setNotes] = useState('');
  
  // Controls subform states
  const [controls, setControls] = useState<any[]>([]);
  const [newControlName, setNewControlName] = useState('');
  const [newControlDesc, setNewControlDesc] = useState('');
  const [newControlStatus, setNewControlStatus] = useState<'planned' | 'implemented' | 'partially_implemented'>('implemented');

  // Upload evidence states
  const [uploading, setUploading] = useState(false);
  const [evidenceList, setEvidenceList] = useState<any[]>([]);

  // Fetch list of Risks
  const { data: risks = [], isLoading } = useQuery<any[]>({
    queryKey: ['risks'],
    queryFn: async () => {
      const res = await fetch('/api/risks', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch risks');
      return res.json();
    },
    enabled: !!token,
  });

  // Fetch Assets
  const { data: assets = [] } = useQuery<any[]>({
    queryKey: ['assets'],
    queryFn: async () => {
      const res = await fetch('/api/assets', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!token && !isReadOnly,
  });

  // Fetch Threats
  const { data: threats = [] } = useQuery<any[]>({
    queryKey: ['threats'],
    queryFn: async () => {
      const res = await fetch('/api/library/threats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!token && !isReadOnly,
  });

  // Fetch Vulnerabilities
  const { data: vulnerabilities = [] } = useQuery<any[]>({
    queryKey: ['vulnerabilities'],
    queryFn: async () => {
      const res = await fetch('/api/library/vulnerabilities', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!token && !isReadOnly,
  });

  // Fetch Users
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
    mutationFn: async (newRisk: any) => {
      const res = await fetch('/api/risks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newRisk)
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create risk');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['risks'] });
      toast.success('Risk registered successfully');
      closeModal();
    },
    onError: (err: any) => {
      toast.error(`Error: ${err.message}`);
    }
  });

  // Update Mutation
  const updateMutation = useMutation({
    mutationFn: async (updatedRisk: any) => {
      const res = await fetch(`/api/risks/${selectedRisk.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updatedRisk)
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update risk');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['risks'] });
      toast.success('Risk updated successfully');
      closeModal();
    },
    onError: (err: any) => {
      toast.error(`Error: ${err.message}`);
    }
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/risks/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete risk');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['risks'] });
      toast.success('Risk removed successfully');
    },
    onError: (err: any) => {
      toast.error(`Error: ${err.message}`);
    }
  });

  const openCreateModal = () => {
    setSelectedRisk(null);
    setRiskId(`RSK-${Math.floor(100 + Math.random() * 900)}`);
    setTitle('');
    setDescription('');
    setAssetId('');
    setThreatId('');
    setVulnerabilityId('');
    setInherentImpact(1);
    setInherentLikelihood(1);
    setResidualImpact(1);
    setResidualLikelihood(1);
    setTreatmentStrategy('mitigate');
    setRiskOwnerId('');
    setStatus('identified');
    setReviewDate('');
    setNotes('');
    setControls([]);
    setEvidenceList([]);
    setIsModalOpen(true);
  };

  const openEditModal = async (risk: any) => {
    setSelectedRisk(risk);
    setRiskId(risk.riskId);
    setTitle(risk.title);
    setDescription(risk.description);
    setAssetId(risk.assetId);
    setThreatId(risk.threatId || '');
    setVulnerabilityId(risk.vulnerabilityId || '');
    setInherentImpact(risk.inherentImpact);
    setInherentLikelihood(risk.inherentLikelihood);
    setResidualImpact(risk.residualImpact);
    setResidualLikelihood(risk.residualLikelihood);
    setTreatmentStrategy(risk.treatmentStrategy);
    setRiskOwnerId(risk.riskOwnerId || '');
    setStatus(risk.status);
    setReviewDate(risk.reviewDate ? new Date(risk.reviewDate).toISOString().substring(0, 10) : '');
    setNotes(risk.notes || '');
    
    // Fetch details including controls and evidence
    try {
      const res = await fetch(`/api/risks/${risk.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const fullRisk = await res.json();
        setControls(fullRisk.controls || []);
      }
      
      const fileRes = await fetch(`/api/evidence/linked?riskId=${risk.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (fileRes.ok) {
        const files = await fileRes.json();
        setEvidenceList(files || []);
      }
    } catch (e) {
      console.error(e);
    }
    
    setIsModalOpen(true);
  };

  const openDetailModal = async (risk: any) => {
    setSelectedRisk(risk);
    setControls([]);
    setEvidenceList([]);
    setIsDetailOpen(true);

    try {
      const res = await fetch(`/api/risks/${risk.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const fullRisk = await res.json();
        setControls(fullRisk.controls || []);
      }

      const fileRes = await fetch(`/api/evidence/linked?riskId=${risk.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (fileRes.ok) {
        const files = await fileRes.json();
        setEvidenceList(files || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedRisk(null);
    setControls([]);
    setEvidenceList([]);
  };

  const handleAddControl = () => {
    if (!newControlName) return;
    setControls([...controls, {
      controlName: newControlName,
      controlDescription: newControlDesc || null,
      status: newControlStatus,
    }]);
    setNewControlName('');
    setNewControlDesc('');
  };

  const handleRemoveControl = (idx: number) => {
    setControls(controls.filter((_, i) => i !== idx));
  };

  // Upload Evidence File
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedRisk) return;

    setUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    fd.append('riskId', selectedRisk.id);

    try {
      const res = await fetch('/api/evidence/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: fd
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('Evidence file uploaded');
        setEvidenceList([...evidenceList, data]);
      } else {
        toast.error(`Upload failed: ${data.error || 'Server error'}`);
      }
    } catch (err: any) {
      toast.error(`Upload failed: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteFile = async (fileId: string) => {
    if (!window.confirm('Delete this evidence file?')) return;
    try {
      const res = await fetch(`/api/evidence/${fileId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        toast.success('File deleted');
        setEvidenceList(evidenceList.filter(f => f.id !== fileId));
      }
    } catch (err: any) {
      toast.error('Failed to delete file');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !assetId) {
      toast.error('Title and Asset allocation are required');
      return;
    }

    const payload = {
      riskId,
      title,
      description,
      assetId,
      threatId: threatId || null,
      vulnerabilityId: vulnerabilityId || null,
      inherentImpact: Number(inherentImpact),
      inherentLikelihood: Number(inherentLikelihood),
      residualImpact: Number(residualImpact),
      residualLikelihood: Number(residualLikelihood),
      treatmentStrategy,
      riskOwnerId: riskOwnerId || null,
      status,
      reviewDate: reviewDate ? new Date(reviewDate).toISOString() : null,
      notes: notes || null,
      controls,
    };

    if (selectedRisk) {
      updateMutation.mutate(payload);
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this risk from the register?')) {
      deleteMutation.mutate(id);
    }
  };

  // Filter Logic
  const filteredRisks = risks.filter((r) => {
    const matchesSearch = 
      r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.riskId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.assetName && r.assetName.toLowerCase().includes(searchTerm.toLowerCase()));

    let matchesSeverity = true;
    if (filterSeverity !== 'all') {
      const score = r.inherentScore;
      if (filterSeverity === 'critical') matchesSeverity = score >= 15;
      else if (filterSeverity === 'high') matchesSeverity = score >= 10 && score < 15;
      else if (filterSeverity === 'medium') matchesSeverity = score >= 5 && score < 10;
      else if (filterSeverity === 'low') matchesSeverity = score < 5;
    }

    const matchesStatus = filterStatus === 'all' || r.status === filterStatus;

    return matchesSearch && matchesSeverity && matchesStatus;
  });

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Risk Register</h1>
          <p className="text-xs text-dark-muted">Perform qualitative risk assessments, assign owners, link controls, and track treatments.</p>
        </div>
        {!isReadOnly && (
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white font-medium text-xs py-2.5 px-4 rounded-lg shadow-lg shadow-brand-500/10 transition-all w-fit"
          >
            <Plus className="h-4 w-4" />
            Identify Risk
          </button>
        )}
      </div>

      {/* Filter panel */}
      <div className="bg-dark-card border border-dark-border p-4 rounded-xl shadow-sm flex flex-col md:flex-row gap-4 items-center">
        
        {/* Search */}
        <div className="relative w-full md:flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-dark-muted" />
          <input
            type="text"
            placeholder="Search risks by ID, title, or asset name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#232d45]/20 border border-dark-border rounded-lg pl-10 pr-4 py-2 text-xs text-dark-text focus:outline-none focus:border-brand-500 transition-colors"
          />
        </div>

        {/* Severity */}
        <div className="flex items-center gap-2 w-full md:w-fit">
          <ShieldAlert className="h-3.5 w-3.5 text-dark-muted shrink-0" />
          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            className="bg-[#232d45]/30 border border-dark-border rounded-lg px-3 py-2 text-xs text-dark-text focus:outline-none w-full"
          >
            <option value="all">All Severities</option>
            <option value="critical">Critical (15-25)</option>
            <option value="high">High (10-14)</option>
            <option value="medium">Medium (5-9)</option>
            <option value="low">Low (1-4)</option>
          </select>
        </div>

        {/* Status */}
        <div className="flex items-center gap-2 w-full md:w-fit">
          <AlertTriangle className="h-3.5 w-3.5 text-dark-muted shrink-0" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-[#232d45]/30 border border-dark-border rounded-lg px-3 py-2 text-xs text-dark-text focus:outline-none w-full"
          >
            <option value="all">All Statuses</option>
            <option value="identified">Identified</option>
            <option value="assessing">Assessing</option>
            <option value="treating">Treating</option>
            <option value="accepted">Accepted</option>
            <option value="mitigated">Mitigated</option>
            <option value="closed">Closed</option>
          </select>
        </div>

      </div>

      {/* Main Register Table */}
      {isLoading ? (
        <TableSkeleton />
      ) : (
        <div className="border border-dark-border rounded-xl overflow-hidden bg-dark-card shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-dark-border text-dark-muted font-medium bg-[#161d30]/60">
                  <th className="p-4">ID</th>
                  <th className="p-4">Title</th>
                  <th className="p-4">Linked Asset</th>
                  <th className="p-4 text-center">Inherent Risk</th>
                  <th className="p-4 text-center">Residual Risk</th>
                  <th className="p-4">Strategy</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-border/40">
                {filteredRisks.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-dark-muted">No risks defined matching filters.</td>
                  </tr>
                ) : (
                  filteredRisks.map((r) => {
                    let inhBg = 'bg-risk-low';
                    if (r.inherentScore >= 15) inhBg = 'bg-risk-critical';
                    else if (r.inherentScore >= 10) inhBg = 'bg-risk-high';
                    else if (r.inherentScore >= 5) inhBg = 'bg-risk-medium';

                    let resBg = 'text-risk-low';
                    if (r.residualScore >= 15) resBg = 'text-risk-critical';
                    else if (r.residualScore >= 10) resBg = 'text-risk-high';
                    else if (r.residualScore >= 5) resBg = 'text-risk-medium';

                    return (
                      <tr key={r.id} className="hover:bg-dark-border/20 transition-colors">
                        <td className="p-4 font-bold text-brand-500">{r.riskId}</td>
                        <td className="p-4 font-semibold text-dark-text">
                          <button onClick={() => openDetailModal(r)} className="hover:text-brand-500 text-left font-bold transition-colors">
                            {r.title}
                          </button>
                        </td>
                        <td className="p-4">
                          <div className="font-medium text-dark-text">{r.assetName || 'Unassigned'}</div>
                          {r.assetCriticality && <div className="text-[10px] text-dark-muted uppercase mt-0.5">Crit: {r.assetCriticality}</div>}
                        </td>
                        <td className="p-4 text-center">
                          <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold text-white ${inhBg}`}>
                            {r.inherentScore} ({r.inherentLikelihood}x{r.inherentImpact})
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          <span className={`font-bold ${resBg}`}>
                            {r.residualScore} ({r.residualLikelihood}x{r.residualImpact})
                          </span>
                        </td>
                        <td className="p-4 capitalize text-dark-muted font-medium">
                          {r.treatmentStrategy}
                        </td>
                        <td className="p-4 capitalize">
                          <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-medium border ${
                            r.status === 'mitigated' || r.status === 'closed'
                              ? 'bg-emerald-950/20 border-emerald-800/40 text-emerald-300'
                              : r.status === 'accepted'
                              ? 'bg-blue-950/20 border-blue-800/40 text-blue-300'
                              : 'bg-amber-950/20 border-amber-800/40 text-amber-300'
                          }`}>
                            {r.status}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <div className="inline-flex gap-2">
                            <button
                              onClick={() => openDetailModal(r)}
                              className="p-1.5 text-dark-muted hover:text-white rounded-lg hover:bg-dark-border transition-colors"
                              title="View details"
                            >
                              <Eye className="h-4.5 w-4.5" />
                            </button>
                            {!isReadOnly && (
                              <>
                                <button
                                  onClick={() => openEditModal(r)}
                                  className="p-1.5 text-dark-muted hover:text-white rounded-lg hover:bg-dark-border transition-colors"
                                  title="Edit risk"
                                >
                                  <Edit2 className="h-4.5 w-4.5" />
                                </button>
                                <button
                                  onClick={() => handleDelete(r.id)}
                                  className="p-1.5 text-red-400 hover:text-red-300 rounded-lg hover:bg-red-950/20 transition-colors"
                                  title="Delete risk"
                                >
                                  <Trash2 className="h-4.5 w-4.5" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* RISK DETAIL VIEW MODAL */}
      <Modal isOpen={isDetailOpen} onClose={() => setIsDetailOpen(false)} title={`GRC Risk Assessment Report`} size="lg">
        {selectedRisk && (
          <div className="space-y-6 text-xs leading-relaxed text-dark-text">
            
            <div className="flex justify-between items-center border-b border-dark-border pb-3">
              <div>
                <span className="text-[10px] font-bold bg-brand-500/10 text-brand-500 px-2 py-0.5 rounded mr-2">{selectedRisk.riskId}</span>
                <span className="text-sm font-bold text-white">{selectedRisk.title}</span>
              </div>
              <span className="px-2 py-0.5 border border-dark-border rounded text-[10px] uppercase font-bold text-dark-muted bg-dark-bg/30">
                {selectedRisk.status}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <span className="text-dark-muted font-medium">Risk Description:</span>
                <p className="bg-[#232d45]/20 border border-dark-border p-3 rounded-lg text-dark-text">{selectedRisk.description}</p>
              </div>
              
              <div className="space-y-2">
                <div><span className="text-dark-muted font-medium">Linked Asset:</span> <strong className="text-white">{selectedRisk.assetName || 'Unassigned'}</strong></div>
                <div><span className="text-dark-muted font-medium">Threat Vector:</span> <strong className="text-white">{selectedRisk.threatName || 'Unassigned'}</strong></div>
                <div><span className="text-dark-muted font-medium">Vulnerability:</span> <strong className="text-white">{selectedRisk.vulnerabilityName || 'Unassigned'}</strong></div>
                <div><span className="text-dark-muted font-medium">Treatment Strategy:</span> <strong className="text-white capitalize">{selectedRisk.treatmentStrategy}</strong></div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 bg-dark-bg/25 border border-dark-border p-4 rounded-xl">
              <div className="text-center space-y-1">
                <div className="text-[10px] font-bold text-dark-muted uppercase">Inherent Risk Score</div>
                <div className="text-xl font-black text-white">{selectedRisk.inherentScore}</div>
                <div className="text-[10px] text-dark-muted">Likelihood ({selectedRisk.inherentLikelihood}) x Impact ({selectedRisk.inherentImpact})</div>
              </div>
              <div className="text-center space-y-1 border-l border-dark-border">
                <div className="text-[10px] font-bold text-dark-muted uppercase">Residual Risk Score</div>
                <div className="text-xl font-black text-brand-500">{selectedRisk.residualScore}</div>
                <div className="text-[10px] text-dark-muted">Likelihood ({selectedRisk.residualLikelihood}) x Impact ({selectedRisk.residualImpact})</div>
              </div>
            </div>

            {/* Controls */}
            <div className="space-y-2">
              <h4 className="font-bold text-white border-b border-dark-border pb-1">Mitigation Controls</h4>
              {controls.length === 0 ? (
                <div className="text-dark-muted text-xs">No active controls mapped to this risk.</div>
              ) : (
                <ul className="space-y-2">
                  {controls.map((c, i) => (
                    <li key={i} className="bg-dark-bg/35 border border-dark-border p-2.5 rounded-lg flex items-center justify-between">
                      <div>
                        <strong className="text-white">{c.controlName}</strong>
                        {c.controlDescription && <p className="text-[10px] text-dark-muted mt-0.5">{c.controlDescription}</p>}
                      </div>
                      <span className="px-1.5 py-0.5 bg-dark-border border border-dark-border text-[9px] rounded font-semibold capitalize text-dark-muted">
                        {c.status.replace('_', ' ')}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Evidence List */}
            <div className="space-y-2">
              <h4 className="font-bold text-white border-b border-dark-border pb-1">Evidence Documents</h4>
              {evidenceList.length === 0 ? (
                <div className="text-dark-muted text-xs">No audit evidence attached yet.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {evidenceList.map((f) => (
                    <div key={f.id} className="bg-dark-bg/35 border border-dark-border p-2 rounded-lg flex items-center justify-between">
                      <a
                        href={`/api/evidence/${f.id}/download`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-brand-500 hover:underline flex items-center gap-1.5 font-medium"
                      >
                        <FileText className="h-4 w-4" />
                        {f.name}
                      </a>
                      <span className="text-[9px] text-dark-muted">{(f.fileSize / 1024).toFixed(1)} KB</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="border-t border-dark-border pt-4 flex justify-end">
              <button
                onClick={() => setIsDetailOpen(false)}
                className="bg-brand-500 hover:bg-brand-600 text-white font-semibold py-2 px-4 rounded-lg"
              >
                Close Report
              </button>
            </div>

          </div>
        )}
      </Modal>

      {/* CREATE / EDIT RISK DIALOG MODAL */}
      <Modal isOpen={isModalOpen} onClose={closeModal} title={selectedRisk ? `Edit Assessment: ${selectedRisk.title}` : 'Identify New Risk Event'} size="2xl">
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            <div className="space-y-1">
              <label className="text-xs font-semibold text-dark-text">Risk ID</label>
              <input
                type="text"
                value={riskId}
                onChange={(e) => setRiskId(e.target.value)}
                className="w-full bg-[#232d45]/20 border border-dark-border rounded-lg px-3 py-2 text-xs text-dark-text focus:outline-none focus:border-brand-500"
                required
              />
            </div>

            <div className="space-y-1 md:col-span-2">
              <label className="text-xs font-semibold text-dark-text">Risk Title</label>
              <input
                type="text"
                placeholder="e.g. Unauthorized Database Access via Open SQL Port"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-[#232d45]/20 border border-dark-border rounded-lg px-3 py-2 text-xs text-dark-text focus:outline-none focus:border-brand-500"
                required
              />
            </div>

            <div className="space-y-1 md:col-span-3">
              <label className="text-xs font-semibold text-dark-text">Description</label>
              <textarea
                placeholder="Describe the risk scenario, threat actions, vulnerabilities exploited, and business impacts..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full bg-[#232d45]/20 border border-dark-border rounded-lg px-3 py-2 text-xs text-dark-text focus:outline-none focus:border-brand-500"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-dark-text">Linked Asset</label>
              <select
                value={assetId}
                onChange={(e) => setAssetId(e.target.value)}
                className="w-full bg-[#232d45]/20 border border-dark-border rounded-lg px-3 py-2 text-xs text-dark-text focus:outline-none"
                required
              >
                <option value="">Select Asset</option>
                {assets.map(a => (
                  <option key={a.id} value={a.id}>{a.assetId} - {a.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-dark-text">Linked Threat (Optional)</label>
              <select
                value={threatId}
                onChange={(e) => setThreatId(e.target.value)}
                className="w-full bg-[#232d45]/20 border border-dark-border rounded-lg px-3 py-2 text-xs text-dark-text focus:outline-none"
              >
                <option value="">Select Threat</option>
                {threats.map(t => (
                  <option key={t.id} value={t.id}>{t.threatId} - {t.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-dark-text">Linked Vulnerability (Optional)</label>
              <select
                value={vulnerabilityId}
                onChange={(e) => setVulnerabilityId(e.target.value)}
                className="w-full bg-[#232d45]/20 border border-dark-border rounded-lg px-3 py-2 text-xs text-dark-text focus:outline-none"
              >
                <option value="">Select Vulnerability</option>
                {vulnerabilities.map(v => (
                  <option key={v.id} value={v.id}>{v.vulnId} - {v.name}</option>
                ))}
              </select>
            </div>

            {/* Inherent Score Inputs */}
            <div className="border border-dark-border rounded-xl p-3 bg-dark-bg/20 space-y-3">
              <div className="text-center font-bold text-[10px] text-dark-muted uppercase border-b border-dark-border pb-1">
                Inherent Risk Matrix
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-[10px] text-dark-text font-medium">Likelihood</label>
                  <select
                    value={inherentLikelihood}
                    onChange={(e) => setInherentLikelihood(Number(e.target.value))}
                    className="w-full bg-dark-bg border border-dark-border rounded p-1 mt-1 text-center"
                  >
                    {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
                <div className="flex-1">
                  <label className="text-[10px] text-dark-text font-medium">Impact</label>
                  <select
                    value={inherentImpact}
                    onChange={(e) => setInherentImpact(Number(e.target.value))}
                    className="w-full bg-dark-bg border border-dark-border rounded p-1 mt-1 text-center"
                  >
                    {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
              </div>
              <div className="text-center text-xs font-bold text-white pt-1">
                Inherent Index: <span className="text-red-400">{inherentLikelihood * inherentImpact}</span>
              </div>
            </div>

            {/* Residual Score Inputs */}
            <div className="border border-dark-border rounded-xl p-3 bg-dark-bg/20 space-y-3">
              <div className="text-center font-bold text-[10px] text-dark-muted uppercase border-b border-dark-border pb-1">
                Residual Risk Matrix
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-[10px] text-dark-text font-medium">Likelihood</label>
                  <select
                    value={residualLikelihood}
                    onChange={(e) => setResidualLikelihood(Number(e.target.value))}
                    className="w-full bg-dark-bg border border-dark-border rounded p-1 mt-1 text-center"
                  >
                    {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
                <div className="flex-1">
                  <label className="text-[10px] text-dark-text font-medium">Impact</label>
                  <select
                    value={residualImpact}
                    onChange={(e) => setResidualImpact(Number(e.target.value))}
                    className="w-full bg-dark-bg border border-dark-border rounded p-1 mt-1 text-center"
                  >
                    {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
              </div>
              <div className="text-center text-xs font-bold text-white pt-1">
                Residual Index: <span className="text-brand-500">{residualLikelihood * residualImpact}</span>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-dark-text">Treatment Strategy</label>
              <select
                value={treatmentStrategy}
                onChange={(e) => setTreatmentStrategy(e.target.value as any)}
                className="w-full bg-[#232d45]/20 border border-dark-border rounded-lg px-3 py-2 text-xs text-dark-text focus:outline-none"
              >
                <option value="mitigate">Mitigate (Implement Controls)</option>
                <option value="accept">Accept (Formal Risk Acceptance)</option>
                <option value="transfer">Transfer (Insurance / Vendor)</option>
                <option value="avoid">Avoid (Cancel business activity)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-dark-text">Risk Owner</label>
              <select
                value={riskOwnerId}
                onChange={(e) => setRiskOwnerId(e.target.value)}
                className="w-full bg-[#232d45]/20 border border-dark-border rounded-lg px-3 py-2 text-xs text-dark-text focus:outline-none"
              >
                <option value="">Select Owner</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-dark-text">Assessment Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full bg-[#232d45]/20 border border-dark-border rounded-lg px-3 py-2 text-xs text-dark-text focus:outline-none"
              >
                <option value="identified">Identified</option>
                <option value="assessing">Assessing</option>
                <option value="treating">Treating</option>
                <option value="accepted">Accepted</option>
                <option value="mitigated">Mitigated</option>
                <option value="closed">Closed</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-dark-text">Review Due Date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-2.5 h-3.5 w-3.5 text-dark-muted" />
                <input
                  type="date"
                  value={reviewDate}
                  onChange={(e) => setReviewDate(e.target.value)}
                  className="w-full bg-[#232d45]/20 border border-dark-border rounded-lg pl-9 pr-3 py-2 text-xs text-dark-text focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-1 md:col-span-3">
              <label className="text-xs font-semibold text-dark-text">Risk Analyst Notes</label>
              <textarea
                placeholder="Audit logs notes, caveats, or control exception references..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="w-full bg-[#232d45]/20 border border-dark-border rounded-lg px-3 py-2 text-xs text-dark-text focus:outline-none focus:border-brand-500"
              />
            </div>

          </div>

          {/* Subform: mitigation controls mapping */}
          <div className="border border-dark-border rounded-xl p-4 space-y-3 bg-dark-bg/10">
            <h4 className="font-semibold text-white">Add Mitigation Controls</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
              <input
                type="text"
                placeholder="Control Title (e.g. Enforce 16-char MFA)"
                value={newControlName}
                onChange={(e) => setNewControlName(e.target.value)}
                className="w-full bg-[#232d45]/30 border border-dark-border rounded px-2.5 py-1.5 text-xs text-dark-text"
              />
              <input
                type="text"
                placeholder="Description / Technical standard"
                value={newControlDesc}
                onChange={(e) => setNewControlDesc(e.target.value)}
                className="w-full bg-[#232d45]/30 border border-dark-border rounded px-2.5 py-1.5 text-xs text-dark-text"
              />
              <div className="flex gap-2">
                <select
                  value={newControlStatus}
                  onChange={(e) => setNewControlStatus(e.target.value as any)}
                  className="w-full bg-[#232d45]/30 border border-dark-border rounded px-2.5 py-1.5 text-xs text-dark-text"
                >
                  <option value="implemented">Implemented</option>
                  <option value="partially_implemented">Partially Implemented</option>
                  <option value="planned">Planned</option>
                </select>
                <button
                  type="button"
                  onClick={handleAddControl}
                  className="bg-brand-500 hover:bg-brand-600 text-white font-bold px-3 py-1.5 rounded"
                >
                  Add
                </button>
              </div>
            </div>

            {/* List of currently added controls */}
            {controls.length > 0 && (
              <ul className="divide-y divide-dark-border/40 max-h-36 overflow-y-auto mt-2">
                {controls.map((c, i) => (
                  <li key={i} className="py-2 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-dark-text">{c.controlName}</span>{' '}
                      {c.controlDescription && <span className="text-dark-muted text-[10px]">({c.controlDescription})</span>}
                      <span className="ml-2 text-[9px] px-1 py-0.5 bg-dark-bg border border-dark-border rounded text-dark-muted capitalize">{c.status}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveControl(i)}
                      className="text-red-400 hover:text-red-300 font-bold"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Subform: Evidence Upload (Only on Edit mode since it needs a Risk ID generated in DB) */}
          {selectedRisk && (
            <div className="border border-dark-border rounded-xl p-4 space-y-3 bg-dark-bg/10">
              <h4 className="font-semibold text-white">Attached Audit Evidence</h4>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer bg-dark-border hover:bg-dark-border/80 text-dark-text text-xs py-1.5 px-3 rounded font-medium border border-dark-border">
                  <Upload className="h-3.5 w-3.5" />
                  Upload PDF or Image
                  <input
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg"
                    className="hidden"
                    onChange={handleFileUpload}
                    disabled={uploading}
                  />
                </label>
                {uploading && <span className="text-[10px] text-dark-muted animate-pulse">Uploading file...</span>}
              </div>

              {evidenceList.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                  {evidenceList.map((f) => (
                    <div key={f.id} className="bg-dark-bg/40 border border-dark-border p-2 rounded flex items-center justify-between">
                      <span className="font-medium text-dark-text truncate max-w-[150px]">{f.name}</span>
                      <button
                        type="button"
                        onClick={() => handleDeleteFile(f.id)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

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
              {selectedRisk ? 'Save Changes' : 'Identify Risk'}
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
};
