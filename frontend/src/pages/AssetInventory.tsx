import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../store/useAuthStore';
import { Plus, Edit2, Trash2, ShieldAlert, Tag, Filter, Search, Calendar } from 'lucide-react';
import { Modal } from '../components/ui/Modal';
import { TableSkeleton } from '../components/ui/Skeleton';
import { toast } from '../store/useToastStore';

export const AssetInventory: React.FC = () => {
  const token = useAuthStore((state) => state.token);
  const { user } = useAuthStore() as any;
  const queryClient = useQueryClient();

  const isReadOnly = ['viewer', 'auditor', 'ciso', 'risk_owner', 'department_head'].includes(user?.role);

  // States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<any | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterCriticality, setFilterCriticality] = useState('all');

  // Form states
  const [assetId, setAssetId] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('server');
  const [businessOwnerId, setBusinessOwnerId] = useState('');
  const [technicalOwnerId, setTechnicalOwnerId] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [criticality, setCriticality] = useState<'low' | 'medium' | 'high' | 'critical'>('low');
  const [ciaConfidentiality, setCiaConfidentiality] = useState(1);
  const [ciaIntegrity, setCiaIntegrity] = useState(1);
  const [ciaAvailability, setCiaAvailability] = useState(1);
  const [assetValue, setAssetValue] = useState(0);
  const [dataClassification, setDataClassification] = useState<'public' | 'internal' | 'confidential' | 'restricted'>('internal');
  const [lifecycleStatus, setLifecycleStatus] = useState<'active' | 'retired' | 'under_development'>('active');
  const [tags, setTags] = useState('');
  const [reviewDate, setReviewDate] = useState('');

  // Fetch Assets
  const { data: assets = [], isLoading } = useQuery<any[]>({
    queryKey: ['assets'],
    queryFn: async () => {
      const res = await fetch('/api/assets', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch assets');
      return res.json();
    },
    enabled: !!token,
  });

  // Fetch Users (for owners list)
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

  // Fetch Organizations (for departments)
  const { data: orgs = [] } = useQuery<any[]>({
    queryKey: ['organizations'],
    queryFn: async () => {
      const res = await fetch('/api/orgs', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!token && !isReadOnly,
  });

  // Create Mutation
  const createMutation = useMutation({
    mutationFn: async (newAsset: any) => {
      const res = await fetch('/api/assets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newAsset)
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create asset');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      toast.success('Asset added successfully');
      closeModal();
    },
    onError: (err: any) => {
      toast.error(`Error: ${err.message}`);
    }
  });

  // Update Mutation
  const updateMutation = useMutation({
    mutationFn: async (updatedAsset: any) => {
      const res = await fetch(`/api/assets/${selectedAsset.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updatedAsset)
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update asset');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      toast.success('Asset updated successfully');
      closeModal();
    },
    onError: (err: any) => {
      toast.error(`Error: ${err.message}`);
    }
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/assets/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete asset');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      toast.success('Asset deleted successfully');
    },
    onError: (err: any) => {
      toast.error(`Error: ${err.message}`);
    }
  });

  const openCreateModal = () => {
    setSelectedAsset(null);
    setAssetId(`AST-${Math.floor(100 + Math.random() * 900)}`);
    setName('');
    setDescription('');
    setType('server');
    setBusinessOwnerId('');
    setTechnicalOwnerId('');
    setDepartmentId('');
    setCriticality('low');
    setCiaConfidentiality(1);
    setCiaIntegrity(1);
    setCiaAvailability(1);
    setAssetValue(0);
    setDataClassification('internal');
    setLifecycleStatus('active');
    setTags('');
    setReviewDate('');
    setIsModalOpen(true);
  };

  const openEditModal = (asset: any) => {
    setSelectedAsset(asset);
    setAssetId(asset.assetId);
    setName(asset.name);
    setDescription(asset.description || '');
    setType(asset.type);
    setBusinessOwnerId(asset.businessOwnerId || '');
    setTechnicalOwnerId(asset.technicalOwnerId || '');
    setDepartmentId(asset.departmentId || '');
    setCriticality(asset.criticality);
    setCiaConfidentiality(asset.ciaConfidentiality);
    setCiaIntegrity(asset.ciaIntegrity);
    setCiaAvailability(asset.ciaAvailability);
    setAssetValue(asset.assetValue);
    setDataClassification(asset.dataClassification);
    setLifecycleStatus(asset.lifecycleStatus);
    setTags(asset.tags || '');
    setReviewDate(asset.reviewDate ? new Date(asset.reviewDate).toISOString().substring(0, 10) : '');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedAsset(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !assetId) {
      toast.error('Asset ID and Name are required');
      return;
    }

    const payload = {
      assetId,
      name,
      description: description || null,
      type,
      businessOwnerId: businessOwnerId || null,
      technicalOwnerId: technicalOwnerId || null,
      departmentId: departmentId || null,
      criticality,
      ciaConfidentiality: Number(ciaConfidentiality),
      ciaIntegrity: Number(ciaIntegrity),
      ciaAvailability: Number(ciaAvailability),
      assetValue: Number(assetValue),
      dataClassification,
      lifecycleStatus,
      tags: tags || null,
      reviewDate: reviewDate ? new Date(reviewDate).toISOString() : null,
    };

    if (selectedAsset) {
      updateMutation.mutate(payload);
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this asset? Doing so will cascade delete all linked risks.')) {
      deleteMutation.mutate(id);
    }
  };

  // Filter Assets
  const filteredAssets = assets.filter((asset) => {
    const matchesSearch = 
      asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.assetId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (asset.tags && asset.tags.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = filterType === 'all' || asset.type === filterType;
    const matchesCriticality = filterCriticality === 'all' || asset.criticality === filterCriticality;

    return matchesSearch && matchesType && matchesCriticality;
  });

  return (
    <div className="space-y-6">
      
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-dark-text tracking-tight">Asset Inventory</h1>
          <p className="text-xs text-dark-muted">Manage company information systems, infrastructure, and business processes.</p>
        </div>
        {!isReadOnly && (
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white font-medium text-xs py-2.5 px-4 rounded-lg shadow-lg shadow-brand-500/10 transition-all w-fit"
          >
            <Plus className="h-4 w-4" />
            Add Asset
          </button>
        )}
      </div>

      {/* Advanced Filters Block */}
      <div className="bg-dark-card border border-dark-border p-4 rounded-xl shadow-sm flex flex-col md:flex-row gap-4 items-center">
        
        {/* Search */}
        <div className="relative w-full md:flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-dark-muted" />
          <input
            type="text"
            placeholder="Search by ID, name, or tags..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#232d45]/20 border border-dark-border rounded-lg pl-10 pr-4 py-2 text-xs text-dark-text focus:outline-none focus:border-brand-500 transition-colors"
          />
        </div>

        {/* Filter Type */}
        <div className="flex items-center gap-2 w-full md:w-fit">
          <Filter className="h-3.5 w-3.5 text-dark-muted shrink-0" />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-[#232d45]/30 border border-dark-border rounded-lg px-3 py-2 text-xs text-dark-text focus:outline-none w-full"
          >
            <option value="all">All Types</option>
            <option value="server">Servers</option>
            <option value="application">Applications</option>
            <option value="api">APIs</option>
            <option value="database">Databases</option>
            <option value="endpoint">Endpoints</option>
            <option value="network_device">Network Devices</option>
            <option value="cloud_resource">Cloud Resources</option>
            <option value="business_process">Business Processes</option>
            <option value="sensitive_info">Sensitive Info</option>
          </select>
        </div>

        {/* Filter Criticality */}
        <div className="flex items-center gap-2 w-full md:w-fit">
          <ShieldAlert className="h-3.5 w-3.5 text-dark-muted shrink-0" />
          <select
            value={filterCriticality}
            onChange={(e) => setFilterCriticality(e.target.value)}
            className="bg-[#232d45]/30 border border-dark-border rounded-lg px-3 py-2 text-xs text-dark-text focus:outline-none w-full"
          >
            <option value="all">All Criticalities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </div>

      </div>

      {/* Main Table Grid */}
      {isLoading ? (
        <TableSkeleton />
      ) : (
        <div className="border border-dark-border rounded-xl overflow-hidden bg-dark-card shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-dark-border text-dark-muted font-medium bg-dark-card/60">
                  <th className="p-4">ID</th>
                  <th className="p-4">Name</th>
                  <th className="p-4">Type</th>
                  <th className="p-4">Criticality</th>
                  <th className="p-4 text-center">CIA Rating</th>
                  <th className="p-4">Classification</th>
                  <th className="p-4">Status</th>
                  {!isReadOnly && <th className="p-4 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-border/40">
                {filteredAssets.length === 0 ? (
                  <tr>
                    <td colSpan={isReadOnly ? 7 : 8} className="p-8 text-center text-dark-muted">No assets found matching filters.</td>
                  </tr>
                ) : (
                  filteredAssets.map((asset) => {
                    let critColor = 'bg-risk-low text-white';
                    if (asset.criticality === 'critical') critColor = 'bg-risk-critical text-white';
                    else if (asset.criticality === 'high') critColor = 'bg-risk-high text-white';
                    else if (asset.criticality === 'medium') critColor = 'bg-risk-medium text-white';

                    let classBg = 'bg-blue-500/10 text-blue-300 border border-blue-500/20';
                    if (asset.dataClassification === 'restricted') classBg = 'bg-purple-500/10 text-purple-300 border border-purple-500/20';
                    else if (asset.dataClassification === 'confidential') classBg = 'bg-red-500/10 text-red-300 border border-red-500/20';
                    else if (asset.dataClassification === 'public') classBg = 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20';

                    return (
                      <tr key={asset.id} className="hover:bg-dark-border/20 transition-colors">
                        <td className="p-4 font-bold text-brand-500">{asset.assetId}</td>
                        <td className="p-4">
                          <div className="font-semibold text-dark-text">{asset.name}</div>
                          {asset.description && <div className="text-[10px] text-dark-muted truncate max-w-[200px] mt-0.5">{asset.description}</div>}
                        </td>
                        <td className="p-4 capitalize text-dark-muted font-medium">
                          {asset.type.replace('_', ' ')}
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold capitalize ${critColor}`}>
                            {asset.criticality}
                          </span>
                        </td>
                        <td className="p-4 text-center font-semibold text-dark-text">
                          <span className="text-[10px] px-1.5 py-0.5 bg-dark-bg border border-dark-border rounded" title="Confidentiality">C:{asset.ciaConfidentiality}</span>{' '}
                          <span className="text-[10px] px-1.5 py-0.5 bg-dark-bg border border-dark-border rounded" title="Integrity">I:{asset.ciaIntegrity}</span>{' '}
                          <span className="text-[10px] px-1.5 py-0.5 bg-dark-bg border border-dark-border rounded" title="Availability">A:{asset.ciaAvailability}</span>
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${classBg}`}>
                            {asset.dataClassification}
                          </span>
                        </td>
                        <td className="p-4 capitalize">
                          <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-medium border ${
                            (asset.lifecycleStatus || 'active') === 'active' 
                              ? 'bg-emerald-950/20 border-emerald-800/40 text-emerald-300'
                              : (asset.lifecycleStatus || 'active') === 'retired'
                              ? 'bg-red-950/20 border-red-800/40 text-red-300'
                              : 'bg-amber-950/20 border-amber-800/40 text-amber-300'
                          }`}>
                            {(asset.lifecycleStatus || 'active').replace('_', ' ')}
                          </span>
                        </td>
                        {!isReadOnly && (
                          <td className="p-4 text-right">
                            <div className="inline-flex gap-2">
                              <button
                                onClick={() => openEditModal(asset)}
                                className="p-1.5 text-dark-muted hover:text-white rounded-lg hover:bg-dark-border transition-colors"
                              >
                                <Edit2 className="h-4.5 w-4.5" />
                              </button>
                              <button
                                onClick={() => handleDelete(asset.id)}
                                className="p-1.5 text-red-400 hover:text-red-300 rounded-lg hover:bg-red-950/20 transition-colors"
                              >
                                <Trash2 className="h-4.5 w-4.5" />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATE/EDIT ASSET DIALOG MODAL */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={selectedAsset ? `Edit Asset: ${selectedAsset.name}` : 'Add New Asset'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            <div className="space-y-1">
              <label className="text-xs font-semibold text-dark-text">Asset ID</label>
              <input
                type="text"
                value={assetId}
                onChange={(e) => setAssetId(e.target.value)}
                className="w-full bg-[#232d45]/20 border border-dark-border rounded-lg px-3 py-2 text-xs text-dark-text focus:outline-none focus:border-brand-500"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-dark-text">Asset Name</label>
              <input
                type="text"
                placeholder="e.g. Production Oracle DB"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-[#232d45]/20 border border-dark-border rounded-lg px-3 py-2 text-xs text-dark-text focus:outline-none focus:border-brand-500"
                required
              />
            </div>

            <div className="space-y-1 md:col-span-2">
              <label className="text-xs font-semibold text-dark-text">Description</label>
              <textarea
                placeholder="Detailed description of what the asset contains, locations, and dependencies..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="w-full bg-[#232d45]/20 border border-dark-border rounded-lg px-3 py-2 text-xs text-dark-text focus:outline-none focus:border-brand-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-dark-text">Asset Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full bg-[#232d45]/20 border border-dark-border rounded-lg px-3 py-2 text-xs text-dark-text focus:outline-none"
              >
                <option value="server">Server</option>
                <option value="application">Application</option>
                <option value="api">API</option>
                <option value="database">Database</option>
                <option value="endpoint">Endpoint</option>
                <option value="network_device">Network Device</option>
                <option value="cloud_resource">Cloud Resource</option>
                <option value="business_process">Business Process</option>
                <option value="sensitive_info">Sensitive Information Asset</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-dark-text">Business Department</label>
              <select
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
                className="w-full bg-[#232d45]/20 border border-dark-border rounded-lg px-3 py-2 text-xs text-dark-text focus:outline-none"
              >
                <option value="">Select Department</option>
                {orgs.filter(o => o.type === 'department').map(o => (
                  <option key={o.id} value={o.id}>{o.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-dark-text">Business Owner</label>
              <select
                value={businessOwnerId}
                onChange={(e) => setBusinessOwnerId(e.target.value)}
                className="w-full bg-[#232d45]/20 border border-dark-border rounded-lg px-3 py-2 text-xs text-dark-text focus:outline-none"
              >
                <option value="">Select Owner</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-dark-text">Technical Owner</label>
              <select
                value={technicalOwnerId}
                onChange={(e) => setTechnicalOwnerId(e.target.value)}
                className="w-full bg-[#232d45]/20 border border-dark-border rounded-lg px-3 py-2 text-xs text-dark-text focus:outline-none"
              >
                <option value="">Select Engineer</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-dark-text">Criticality</label>
              <select
                value={criticality}
                onChange={(e) => setCriticality(e.target.value as any)}
                className="w-full bg-[#232d45]/20 border border-dark-border rounded-lg px-3 py-2 text-xs text-dark-text focus:outline-none"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-dark-text">Asset Replacement Value (USD)</label>
              <input
                type="number"
                value={assetValue}
                onChange={(e) => setAssetValue(Number(e.target.value))}
                className="w-full bg-[#232d45]/20 border border-dark-border rounded-lg px-3 py-2 text-xs text-dark-text focus:outline-none"
              />
            </div>

            {/* CIA Ratings Group */}
            <div className="border border-dark-border rounded-xl p-3 md:col-span-2 grid grid-cols-3 gap-3 bg-dark-bg/20">
              <div className="text-center font-bold text-[10px] text-dark-muted uppercase col-span-3 pb-1 border-b border-dark-border">
                CIA Sensitivity Rating (1 to 3)
              </div>
              <div className="space-y-1 text-center">
                <label className="text-[10px] font-semibold text-dark-text">Confidentiality</label>
                <select
                  value={ciaConfidentiality}
                  onChange={(e) => setCiaConfidentiality(Number(e.target.value))}
                  className="w-full bg-dark-bg border border-dark-border rounded px-2 py-1 text-xs text-dark-text text-center focus:outline-none"
                >
                  <option value={1}>1 - Low</option>
                  <option value={2}>2 - Medium</option>
                  <option value={3}>3 - High</option>
                </select>
              </div>
              <div className="space-y-1 text-center">
                <label className="text-[10px] font-semibold text-dark-text">Integrity</label>
                <select
                  value={ciaIntegrity}
                  onChange={(e) => setCiaIntegrity(Number(e.target.value))}
                  className="w-full bg-dark-bg border border-dark-border rounded px-2 py-1 text-xs text-dark-text text-center focus:outline-none"
                >
                  <option value={1}>1 - Low</option>
                  <option value={2}>2 - Medium</option>
                  <option value={3}>3 - High</option>
                </select>
              </div>
              <div className="space-y-1 text-center">
                <label className="text-[10px] font-semibold text-dark-text">Availability</label>
                <select
                  value={ciaAvailability}
                  onChange={(e) => setCiaAvailability(Number(e.target.value))}
                  className="w-full bg-dark-bg border border-dark-border rounded px-2 py-1 text-xs text-dark-text text-center focus:outline-none"
                >
                  <option value={1}>1 - Low</option>
                  <option value={2}>2 - Medium</option>
                  <option value={3}>3 - High</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-dark-text">Data Classification</label>
              <select
                value={dataClassification}
                onChange={(e) => setDataClassification(e.target.value as any)}
                className="w-full bg-[#232d45]/20 border border-dark-border rounded-lg px-3 py-2 text-xs text-dark-text focus:outline-none"
              >
                <option value="public">Public</option>
                <option value="internal">Internal</option>
                <option value="confidential">Confidential</option>
                <option value="restricted">Restricted</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-dark-text">Lifecycle Status</label>
              <select
                value={lifecycleStatus}
                onChange={(e) => setLifecycleStatus(e.target.value as any)}
                className="w-full bg-[#232d45]/20 border border-dark-border rounded-lg px-3 py-2 text-xs text-dark-text focus:outline-none"
              >
                <option value="active">Active</option>
                <option value="retired">Retired</option>
                <option value="under_development">Under Development</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-dark-text">Tags (Comma Separated)</label>
              <div className="relative">
                <Tag className="absolute left-3 top-2.5 h-3.5 w-3.5 text-dark-muted" />
                <input
                  type="text"
                  placeholder="pci-dss, critical-data, web"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  className="w-full bg-[#232d45]/20 border border-dark-border rounded-lg pl-9 pr-3 py-2 text-xs text-dark-text focus:outline-none"
                />
              </div>
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
              {selectedAsset ? 'Save Changes' : 'Create Asset'}
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
};
