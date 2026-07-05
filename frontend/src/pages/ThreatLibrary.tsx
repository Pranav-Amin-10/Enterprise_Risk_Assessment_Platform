import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../store/useAuthStore';
import { Plus, Trash2, Shield, Search, Skull, BookOpen, Lock } from 'lucide-react';
import { Modal } from '../components/ui/Modal';
import { TableSkeleton } from '../components/ui/Skeleton';
import { toast } from '../store/useToastStore';

export const ThreatLibrary: React.FC = () => {
  const token = useAuthStore((state) => state.token);
  const { user } = useAuthStore() as any;
  const queryClient = useQueryClient();

  const isReadOnly = ['viewer', 'auditor'].includes(user?.role);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Form State
  const [threatId, setThreatId] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Malware');

  // Fetch Threat Library
  const { data: threats = [], isLoading } = useQuery<any[]>({
    queryKey: ['threats'],
    queryFn: async () => {
      const res = await fetch('/api/library/threats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch threats');
      return res.json();
    },
    enabled: !!token,
  });

  // Create Custom Threat Mutation
  const createMutation = useMutation({
    mutationFn: async (newThreat: any) => {
      const res = await fetch('/api/library/threats', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newThreat)
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to add threat');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['threats'] });
      toast.success('Custom threat added successfully');
      closeModal();
    },
    onError: (err: any) => {
      toast.error(`Error: ${err.message}`);
    }
  });

  // Delete Custom Threat Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/library/threats/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete threat');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['threats'] });
      toast.success('Custom threat removed');
    },
    onError: (err: any) => {
      toast.error(`Error: ${err.message}`);
    }
  });

  const openCreateModal = () => {
    setThreatId(`THR-${Math.floor(100 + Math.random() * 900)}`);
    setName('');
    setDescription('');
    setCategory('Malware');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!threatId || !name || !category) {
      toast.error('All fields are required');
      return;
    }

    createMutation.mutate({
      threatId,
      name,
      description: description || null,
      category,
    });
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this custom threat definition?')) {
      deleteMutation.mutate(id);
    }
  };

  const filteredThreats = threats.filter((t) => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.threatId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Threat Library</h1>
          <p className="text-xs text-dark-muted">Standard and custom catalogs of cyber threats, vectors, and risk events.</p>
        </div>
        {!isReadOnly && (
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white font-medium text-xs py-2.5 px-4 rounded-lg shadow-lg shadow-brand-500/10 transition-all w-fit"
          >
            <Plus className="h-4 w-4" />
            Add Threat
          </button>
        )}
      </div>

      {/* Search block */}
      <div className="relative w-full">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-dark-muted" />
        <input
          type="text"
          placeholder="Search threats by ID, title, or category..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-dark-card border border-dark-border rounded-xl pl-10 pr-4 py-2.5 text-xs text-dark-text focus:outline-none focus:border-brand-500 transition-colors"
        />
      </div>

      {/* Main Grid List */}
      {isLoading ? (
        <TableSkeleton />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredThreats.length === 0 ? (
            <div className="col-span-full py-12 text-center text-dark-muted border border-dark-border bg-dark-card rounded-xl">No threat profiles match search.</div>
          ) : (
            filteredThreats.map((threat) => (
              <div 
                key={threat.id} 
                className="bg-dark-card border border-dark-border rounded-xl p-5 shadow-sm hover:border-[#0284c7]/40 transition-all flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <span className="px-2 py-0.5 bg-brand-500/10 text-brand-500 rounded text-[10px] font-bold tracking-wider">
                      {threat.threatId}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-semibold uppercase ${
                      threat.isCustom === 1
                        ? 'bg-purple-500/10 text-purple-300 border border-purple-500/20'
                        : 'bg-dark-border text-dark-muted'
                    }`}>
                      {threat.isCustom === 1 ? 'Custom' : 'System'}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                      <Skull className="h-4.5 w-4.5 text-red-400 shrink-0" />
                      {threat.name}
                    </h3>
                    <p className="text-xs text-dark-muted leading-relaxed min-h-[50px]">
                      {threat.description || 'No description provided.'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-dark-border/40 pt-3 mt-4 text-[10px] font-medium">
                  <div className="text-dark-muted capitalize">
                    Category: <strong className="text-dark-text">{threat.category}</strong>
                  </div>
                  {threat.isCustom === 1 && !isReadOnly && (
                    <button
                      onClick={() => handleDelete(threat.id)}
                      className="text-red-400 hover:text-red-300 flex items-center gap-1 hover:underline"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* CREATE THREAT MODAL */}
      <Modal isOpen={isModalOpen} onClose={closeModal} title="Register New Threat Vector">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-dark-text">Threat Identifier (ID)</label>
            <input
              type="text"
              value={threatId}
              onChange={(e) => setThreatId(e.target.value)}
              className="w-full bg-[#232d45]/20 border border-dark-border rounded-lg px-3 py-2 text-xs text-dark-text focus:outline-none focus:border-brand-500"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-dark-text">Threat Title / Name</label>
            <input
              type="text"
              placeholder="e.g. Supply Chain Ransomware Injection"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-[#232d45]/20 border border-dark-border rounded-lg px-3 py-2 text-xs text-dark-text focus:outline-none focus:border-brand-500"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-dark-text">Description</label>
            <textarea
              placeholder="Detailed description of the threat vector, typical indicators of compromise, and affected systems..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full bg-[#232d45]/20 border border-dark-border rounded-lg px-3 py-2 text-xs text-dark-text focus:outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-dark-text">Category Classification</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-[#232d45]/20 border border-dark-border rounded-lg px-3 py-2 text-xs text-dark-text focus:outline-none"
            >
              <option value="Malware">Malware / Ransomware</option>
              <option value="Social Engineering">Social Engineering / Phishing</option>
              <option value="Internal Risk">Internal Threat / Insider Sabotage</option>
              <option value="Third-Party Risk">Third-Party Vendor / Supply Chain</option>
              <option value="Exploitation">Technical Zero-Day Exploitation</option>
              <option value="Network Threat">Network DDoS / Volumetric Flood</option>
              <option value="Identity Theft">Credential Abuse / Session Theft</option>
              <option value="Infrastructure Risk">Cloud / Infrastructure Misconfiguration</option>
            </select>
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
              disabled={createMutation.isPending}
              className="bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white font-medium text-xs py-2 px-4 rounded-lg shadow-lg shadow-brand-500/10 transition-all"
            >
              Add Threat Definition
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
};
