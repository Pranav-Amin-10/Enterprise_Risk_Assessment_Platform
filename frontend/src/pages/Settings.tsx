import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../store/useAuthStore';
import { useThemeStore } from '../store/useThemeStore';
import { Plus, Edit2, Trash2, Users, Building, UserX, UserCheck, Check, X, Eye, EyeOff, Sliders } from 'lucide-react';
import { Modal } from '../components/ui/Modal';
import { TableSkeleton } from '../components/ui/Skeleton';
import { toast } from '../store/useToastStore';

export const Settings: React.FC = () => {
  const token = useAuthStore((state) => state.token);
  const { user: currentActingUser } = useAuthStore() as any;
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'users' | 'orgs' | 'preferences'>('users');
  const { fontSize, setFontSize, theme, toggleTheme } = useThemeStore();
  
  // Modals visibility states
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isOrgModalOpen, setIsOrgModalOpen] = useState(false);
  
  const [selectedUser, setSelectedUser] = useState<any | null>(null);


  // User Form States
  const [userEmail, setUserEmail] = useState('');
  const [userName, setUserName] = useState('');
  const [userPassword, setUserPassword] = useState('');
  const [showUserPassword, setShowUserPassword] = useState(false);
  const [userRole, setUserRole] = useState<'super_admin' | 'ciso' | 'risk_manager' | 'auditor' | 'asset_owner' | 'risk_owner' | 'department_head' | 'viewer'>('viewer');
  const [userStatus, setUserStatus] = useState<'active' | 'locked' | 'pending'>('pending');

  // User Password Complexity Calculations
  const hasMinLength = userPassword.length >= 8;
  const hasUppercase = /[A-Z]/.test(userPassword);
  const hasLowercase = /[a-z]/.test(userPassword);
  const hasNumber = /[0-9]/.test(userPassword);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(userPassword);

  const strengthScore = [
    hasMinLength,
    hasUppercase,
    hasLowercase,
    hasNumber,
    hasSpecial
  ].filter(Boolean).length;

  const getStrengthLabel = () => {
    if (userPassword.length === 0) return { label: 'None', color: 'bg-dark-border', text: 'text-dark-muted' };
    if (strengthScore <= 2) return { label: 'Weak', color: 'bg-red-500', text: 'text-red-400' };
    if (strengthScore <= 4) return { label: 'Medium', color: 'bg-amber-500', text: 'text-amber-400' };
    return { label: 'Strong', color: 'bg-emerald-500', text: 'text-emerald-400' };
  };

  const strength = getStrengthLabel();

  // Org Form States
  const [orgName, setOrgName] = useState('');
  const [orgType, setOrgType] = useState<'company' | 'business_unit' | 'department' | 'team'>('department');
  const [orgParentId, setOrgParentId] = useState('');
  const [orgLocation, setOrgLocation] = useState('');

  // Fetch Users
  const { data: usersList = [], isLoading: isUsersLoading } = useQuery<any[]>({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await fetch('/api/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch users');
      return res.json();
    },
    enabled: !!token,
  });

  // Fetch Orgs
  const { data: orgsList = [], isLoading: isOrgsLoading } = useQuery<any[]>({
    queryKey: ['organizations'],
    queryFn: async () => {
      const res = await fetch('/api/orgs', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch organization nodes');
      return res.json();
    },
    enabled: !!token,
  });

  // --- USER MUTATIONS ---

  // 1. Create User
  const createUserMutation = useMutation({
    mutationFn: async (newUser: any) => {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newUser)
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to add user');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('User pre-registered in D1 database');
      closeUserModal();
    },
    onError: (err: any) => {
      toast.error(`Error: ${err.message}`);
    }
  });

  // 2. Update User
  const updateUserMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetch(`/api/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update user');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('User role and status updated');
      closeUserModal();
    },
    onError: (err: any) => {
      toast.error(`Error: ${err.message}`);
    }
  });

  // 3. Delete User
  const deleteUserMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/users/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete user');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('User record deleted');
    },
    onError: (err: any) => {
      toast.error(`Error: ${err.message}`);
    }
  });

  // --- ORG MUTATIONS ---

  // 4. Create Org Node
  const createOrgMutation = useMutation({
    mutationFn: async (newOrg: any) => {
      const res = await fetch('/api/orgs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newOrg)
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create org node');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      toast.success('Organization node added');
      closeOrgModal();
    },
    onError: (err: any) => {
      toast.error(`Error: ${err.message}`);
    }
  });

  // 5. Delete Org Node
  const deleteOrgMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/orgs/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete org node');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      toast.success('Organization node removed');
    },
    onError: (err: any) => {
      toast.error(`Error: ${err.message}`);
    }
  });


  // --- USER MODAL HANDLERS ---
  const openCreateUserModal = () => {
    setSelectedUser(null);
    setUserEmail('');
    setUserName('');
    setUserPassword('');
    setShowUserPassword(false);
    setUserRole('viewer');
    setUserStatus('pending');
    setIsUserModalOpen(true);
  };

  const openEditUserModal = (u: any) => {
    setSelectedUser(u);
    setUserEmail(u.email);
    setUserName(u.name);
    setUserPassword('');
    setShowUserPassword(false);
    setUserRole(u.role);
    setUserStatus(u.status);
    setIsUserModalOpen(true);
  };

  const closeUserModal = () => {
    setIsUserModalOpen(false);
    setSelectedUser(null);
  };

  const handleUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userEmail || !userName) {
      toast.error('Email and Name are required');
      return;
    }

    if (userPassword && strengthScore < 5) {
      toast.error('Password must fulfill all security complexity requirements.');
      return;
    }

    if (selectedUser) {
      const payload: any = {
        name: userName,
        role: userRole,
        status: userStatus,
      };
      if (userPassword) {
        payload.password = userPassword;
      }
      updateUserMutation.mutate(payload);
    } else {
      if (!userPassword) {
        toast.error('Password is required for new users');
        return;
      }
      createUserMutation.mutate({
        email: userEmail,
        name: userName,
        role: userRole,
        status: userStatus,
        password: userPassword,
      });
    }
  };

  const handleDeleteUser = (id: string) => {
    if (window.confirm('Are you sure you want to delete this user record from D1? They will lose access to the GRC dashboards.')) {
      deleteUserMutation.mutate(id);
    }
  };


  // --- ORG MODAL HANDLERS ---
  const openCreateOrgModal = () => {
    setOrgName('');
    setOrgType('department');
    setOrgParentId('');
    setOrgLocation('');
    setIsOrgModalOpen(true);
  };

  const closeOrgModal = () => {
    setIsOrgModalOpen(false);
  };

  const handleOrgSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgName) {
      toast.error('Organization Name is required');
      return;
    }

    createOrgMutation.mutate({
      name: orgName,
      type: orgType,
      parentId: orgParentId || null,
      location: orgLocation || null,
    });
  };

  const handleDeleteOrg = (id: string) => {
    if (window.confirm('Delete this organization node? Doing so will dissociate all assets connected to this node.')) {
      deleteOrgMutation.mutate(id);
    }
  };

  return (
    <div className="space-y-6 text-xs text-dark-text">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-dark-text tracking-tight">System Settings & Org Chart</h1>
        <p className="text-xs text-dark-muted">Provision corporate directories, assign security roles, and define organizational departments.</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-dark-border gap-2">
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 font-semibold flex items-center gap-1.5 border-b-2 transition-all ${
            activeTab === 'users'
              ? 'border-brand-500 text-dark-text'
              : 'border-transparent text-dark-muted hover:text-dark-text'
          }`}
        >
          <Users className="h-4.5 w-4.5" />
          User Directory & RBAC
        </button>
        <button
          onClick={() => setActiveTab('orgs')}
          className={`px-4 py-2 font-semibold flex items-center gap-1.5 border-b-2 transition-all ${
            activeTab === 'orgs'
              ? 'border-brand-500 text-dark-text'
              : 'border-transparent text-dark-muted hover:text-dark-text'
          }`}
        >
          <Building className="h-4.5 w-4.5" />
          Business Divisions & Nodes
        </button>
        <button
          onClick={() => setActiveTab('preferences')}
          className={`px-4 py-2 font-semibold flex items-center gap-1.5 border-b-2 transition-all ${
            activeTab === 'preferences'
              ? 'border-brand-500 text-dark-text'
              : 'border-transparent text-dark-muted hover:text-dark-text'
          }`}
        >
          <Sliders className="h-4.5 w-4.5" />
          Console Preferences
        </button>
      </div>

      {/* TAB 1: USER RBAC DIRECTORY */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-semibold text-dark-text">Registered Users ({usersList.length})</h3>
            <button
              onClick={openCreateUserModal}
              className="flex items-center gap-1.5 bg-brand-500 hover:bg-brand-600 text-white px-3 py-1.5 rounded font-medium shadow-md shadow-brand-500/15"
            >
              <Plus className="h-4 w-4" />
              Provision User
            </button>
          </div>

          {isUsersLoading ? (
            <TableSkeleton rows={4} />
          ) : (
            <div className="border border-dark-border bg-dark-card rounded-xl overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-dark-border text-dark-muted font-medium bg-dark-card/60">
                    <th className="p-3">Full Name</th>
                    <th className="p-3">Email Address</th>
                    <th className="p-3">Security Role</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-border/40 font-medium">
                  {usersList.map((u) => {
                    const isSelf = currentActingUser?.id === u.id;
                    let roleBadge = 'bg-dark-border text-dark-muted';
                    if (u.role === 'super_admin') roleBadge = 'bg-red-500/10 text-red-300 border border-red-500/20';
                    else if (u.role === 'ciso') roleBadge = 'bg-purple-500/10 text-purple-300 border border-purple-500/20';
                    else if (u.role === 'risk_manager') roleBadge = 'bg-blue-500/10 text-blue-300 border border-blue-500/20';
                    else if (u.role === 'auditor') roleBadge = 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20';

                    return (
                      <tr key={u.id} className="hover:bg-dark-border/20 transition-colors">
                        <td className="p-3 text-dark-text font-semibold flex items-center gap-1.5">
                          {u.name}
                          {isSelf && <span className="text-[9px] px-1 py-0.2 bg-brand-500/20 text-brand-400 border border-brand-500/40 rounded">You</span>}
                        </td>
                        <td className="p-3 text-dark-muted">{u.email}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${roleBadge}`}>
                            {u.role.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="p-3 capitalize">
                          <span className={`inline-flex items-center gap-1 text-[10px] font-bold ${
                            u.status === 'active' 
                              ? 'text-emerald-400' 
                              : u.status === 'locked' 
                              ? 'text-red-400' 
                              : 'text-amber-400'
                          }`}>
                            {u.status === 'active' ? <UserCheck className="h-4 w-4" /> : <UserX className="h-4 w-4" />}
                            {u.status}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <div className="inline-flex gap-2">
                            <button
                              onClick={() => openEditUserModal(u)}
                              className="p-1 text-dark-muted hover:text-white rounded hover:bg-dark-border"
                              title="Edit user"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            {!isSelf && (
                              <button
                                onClick={() => handleDeleteUser(u.id)}
                                className="p-1 text-red-400 hover:text-red-300 rounded hover:bg-red-950/20"
                                title="Delete user"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: BUSINESS NODES */}
      {activeTab === 'orgs' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-semibold text-dark-text">Organizational Hierarchy Nodes ({orgsList.length})</h3>
            <button
              onClick={openCreateOrgModal}
              className="flex items-center gap-1.5 bg-brand-500 hover:bg-brand-600 text-white px-3 py-1.5 rounded font-medium shadow-md shadow-brand-500/15"
            >
              <Plus className="h-4 w-4" />
              Add Node
            </button>
          </div>

          {isOrgsLoading ? (
            <TableSkeleton rows={4} />
          ) : (
            <div className="border border-dark-border bg-dark-card rounded-xl overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-dark-border text-dark-muted font-medium bg-dark-card/60">
                    <th className="p-3">Node Name</th>
                    <th className="p-3">Node Type</th>
                    <th className="p-3">HQ / Location</th>
                    <th className="p-3">Parent Node Reference</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-border/40 font-medium">
                  {orgsList.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-dark-muted font-sans">No organization nodes created.</td>
                    </tr>
                  ) : (
                    orgsList.map((o) => {
                      const parent = orgsList.find(parentOrg => parentOrg.id === o.parentId);
                      let typeColor = 'text-brand-400';
                      if (o.type === 'company') typeColor = 'text-red-400';
                      else if (o.type === 'business_unit') typeColor = 'text-purple-400';
                      else if (o.type === 'team') typeColor = 'text-amber-400';

                      return (
                        <tr key={o.id} className="hover:bg-dark-border/20 transition-colors">
                          <td className="p-3 text-dark-text font-bold">{o.name}</td>
                          <td className="p-3 font-semibold uppercase text-[10px] tracking-wider">
                            <span className={typeColor}>{o.type.replace('_', ' ')}</span>
                          </td>
                          <td className="p-3 text-dark-muted">{o.location || 'N/A'}</td>
                          <td className="p-3 text-dark-text font-bold">
                            {parent ? parent.name : <span className="text-gray-600 font-normal">None (Root Node)</span>}
                          </td>
                          <td className="p-3 text-right">
                            <button
                              onClick={() => handleDeleteOrg(o.id)}
                              className="p-1 text-red-400 hover:text-red-300 rounded hover:bg-red-950/20"
                              title="Delete node"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: USER PREFERENCES */}
      {activeTab === 'preferences' && (
        <div className="space-y-6 max-w-xl">
          <div className="bg-dark-card border border-dark-border rounded-xl p-6 space-y-6 shadow-sm">
            <div>
              <h3 className="text-sm font-semibold text-white mb-1">Display & Theme</h3>
              <p className="text-[11px] text-dark-muted">Customize the platform's visual appearance and color scheme.</p>
            </div>

            <div className="flex items-center justify-between py-3 border-b border-dark-border/40">
              <div>
                <span className="font-semibold text-white">Visual Interface Theme</span>
                <p className="text-[10px] text-dark-muted mt-0.5">Toggle between dark mode console and light mode interface.</p>
              </div>
              <button
                type="button"
                onClick={toggleTheme}
                className="bg-brand-500 hover:bg-brand-600 text-white px-4 py-1.5 rounded font-bold shadow-md shadow-brand-500/10 transition-colors"
              >
                Switch to {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <span className="font-semibold text-white">Interface Scale & Text Density</span>
                <p className="text-[10px] text-dark-muted mt-0.5">Adjust the global text sizes and spacing densities across the platform.</p>
              </div>
              
              <div className="grid grid-cols-3 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setFontSize('sm')}
                  className={`py-2 px-3 rounded-lg border font-semibold text-center transition-all ${
                    fontSize === 'sm'
                      ? 'bg-brand-500/10 border-brand-500 text-brand-400 font-bold'
                      : 'bg-[#232d45]/20 border-dark-border text-dark-muted hover:text-white'
                  }`}
                >
                  <div className="text-xs">Small</div>
                  <div className="text-[9px] mt-0.5 opacity-80">14.5px Base</div>
                </button>
                <button
                  type="button"
                  onClick={() => setFontSize('md')}
                  className={`py-2 px-3 rounded-lg border font-semibold text-center transition-all ${
                    fontSize === 'md'
                      ? 'bg-brand-500/10 border-brand-500 text-brand-400 font-bold'
                      : 'bg-[#232d45]/20 border-dark-border text-dark-muted hover:text-white'
                  }`}
                >
                  <div className="text-xs">Medium (Default)</div>
                  <div className="text-[9px] mt-0.5 opacity-80">16.25px Base</div>
                </button>
                <button
                  type="button"
                  onClick={() => setFontSize('lg')}
                  className={`py-2 px-3 rounded-lg border font-semibold text-center transition-all ${
                    fontSize === 'lg'
                      ? 'bg-brand-500/10 border-brand-500 text-brand-400 font-bold'
                      : 'bg-[#232d45]/20 border-dark-border text-dark-muted hover:text-white'
                  }`}
                >
                  <div className="text-xs">Large</div>
                  <div className="text-[9px] mt-0.5 opacity-80">18.0px Base</div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* USER PROVISION MODAL */}
      <Modal isOpen={isUserModalOpen} onClose={closeUserModal} title={selectedUser ? 'Modify GRC Permission Profile' : 'Pre-Register Corporate Employee'}>
        <form onSubmit={handleUserSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-dark-text">User Email Address</label>
            <input
              type="email"
              placeholder="e.g. engineer@company.com"
              value={userEmail}
              onChange={(e) => setUserEmail(e.target.value)}
              className="w-full bg-[#232d45]/20 border border-dark-border rounded-lg px-3 py-2 text-xs text-dark-text focus:outline-none focus:border-brand-500 disabled:opacity-50"
              disabled={!!selectedUser}
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-dark-text">Employee Name</label>
            <input
              type="text"
              placeholder="e.g. John Doe"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className="w-full bg-[#232d45]/20 border border-dark-border rounded-lg px-3 py-2 text-xs text-dark-text focus:outline-none focus:border-brand-500"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-dark-text">
              {selectedUser ? 'New Password (leave blank to keep unchanged)' : 'Account Password'}
            </label>
            <div className="relative">
              <input
                type={showUserPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={userPassword}
                onChange={(e) => setUserPassword(e.target.value)}
                className="w-full bg-[#232d45]/20 border border-dark-border rounded-lg pl-3 pr-10 py-2 text-xs text-dark-text focus:outline-none focus:border-brand-500"
                required={!selectedUser}
              />
              <button
                type="button"
                onClick={() => setShowUserPassword(!showUserPassword)}
                className="absolute right-3 top-2 text-dark-muted hover:text-white transition-colors"
                title={showUserPassword ? 'Hide password' : 'Show password'}
              >
                {showUserPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
              </button>
            </div>

            {/* Password Complexity Checklist & Meter */}
            {userPassword.length > 0 && (
              <div className="mt-2 space-y-2 bg-[#232d45]/10 border border-dark-border/40 rounded-lg p-3 text-left">
                <div className="flex justify-between items-center text-[9px] font-bold uppercase tracking-wider">
                  <span className="text-dark-muted">Password Strength</span>
                  <span className={strength.text}>{strength.label}</span>
                </div>
                <div className="h-1 w-full bg-dark-border rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${strength.color} transition-all duration-300`} 
                    style={{ width: `${(strengthScore / 5) * 100}%` }}
                  />
                </div>
                <div className="grid grid-cols-2 gap-x-2 gap-y-1 mt-2 text-[10px]">
                  <div className="flex items-center gap-1">
                    {hasMinLength ? <Check className="h-3 w-3 text-emerald-400" /> : <X className="h-3 w-3 text-red-500" />}
                    <span className={hasMinLength ? 'text-dark-text font-medium' : 'text-dark-muted'}>Min 8 chars</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {hasUppercase ? <Check className="h-3 w-3 text-emerald-400" /> : <X className="h-3 w-3 text-red-500" />}
                    <span className={hasUppercase ? 'text-dark-text font-medium' : 'text-dark-muted'}>Uppercase (A-Z)</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {hasLowercase ? <Check className="h-3 w-3 text-emerald-400" /> : <X className="h-3 w-3 text-red-500" />}
                    <span className={hasLowercase ? 'text-dark-text font-medium' : 'text-dark-muted'}>Lowercase (a-z)</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {hasNumber ? <Check className="h-3 w-3 text-emerald-400" /> : <X className="h-3 w-3 text-red-500" />}
                    <span className={hasNumber ? 'text-dark-text font-medium' : 'text-dark-muted'}>Number (0-9)</span>
                  </div>
                  <div className="flex items-center gap-1 col-span-2">
                    {hasSpecial ? <Check className="h-3 w-3 text-emerald-400" /> : <X className="h-3 w-3 text-red-500" />}
                    <span className={hasSpecial ? 'text-dark-text font-medium' : 'text-dark-muted'}>Special symbol (!@#$...)</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-dark-text">Access Security Role</label>
            <select
              value={userRole}
              onChange={(e) => setUserRole(e.target.value as any)}
              className="w-full bg-[#232d45]/20 border border-dark-border rounded-lg px-3 py-2 text-xs text-dark-text focus:outline-none"
            >
              <option value="viewer">Viewer (Read-only GRC Dashboard access)</option>
              <option value="ciso">CISO (Complete Policy, Risk Accept, and Log audits)</option>
              <option value="risk_manager">Risk Manager (Assess risks, controls, and treatments)</option>
              <option value="auditor">Auditor (Independent log auditing and read-only reviews)</option>
              <option value="asset_owner">Asset Owner (Owns information systems inventory)</option>
              <option value="risk_owner">Risk Owner (Mitigates and treats assigned risk items)</option>
              <option value="department_head">Department Head (View department scope only)</option>
              <option value="super_admin">Super Admin (Unrestricted platform management)</option>
            </select>
          </div>

          {selectedUser && (
            <div className="space-y-1">
              <label className="text-xs font-semibold text-dark-text">User Status</label>
              <select
                value={userStatus}
                onChange={(e) => setUserStatus(e.target.value as any)}
                className="w-full bg-[#232d45]/20 border border-dark-border rounded-lg px-3 py-2 text-xs text-dark-text focus:outline-none"
              >
                <option value="active">Active (Permit platform access)</option>
                <option value="locked">Locked (Block sessions immediately)</option>
                <option value="pending">Pending Claim (Awaiting Firebase auth registration)</option>
              </select>
            </div>
          )}

          <div className="border-t border-dark-border pt-4 flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={closeUserModal}
              className="bg-transparent hover:bg-dark-border text-dark-text font-medium text-xs py-2 px-4 rounded-lg border border-dark-border transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createUserMutation.isPending || updateUserMutation.isPending}
              className="bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white font-medium text-xs py-2 px-4 rounded-lg shadow-lg shadow-brand-500/10 transition-all"
            >
              {selectedUser ? 'Update Profile' : 'Pre-Register User'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ORG NODE MODAL */}
      <Modal isOpen={isOrgModalOpen} onClose={closeOrgModal} title="Create Organization Node">
        <form onSubmit={handleOrgSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-dark-text">Node Name</label>
            <input
              type="text"
              placeholder="e.g. Cyber Engineering Division"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              className="w-full bg-[#232d45]/20 border border-dark-border rounded-lg px-3 py-2 text-xs text-dark-text focus:outline-none focus:border-brand-500"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-dark-text">Node Classification Type</label>
            <select
              value={orgType}
              onChange={(e) => setOrgType(e.target.value as any)}
              className="w-full bg-[#232d45]/20 border border-dark-border rounded-lg px-3 py-2 text-xs text-dark-text focus:outline-none"
            >
              <option value="company">Company (Root legal entity)</option>
              <option value="business_unit">Business Unit (Divisions, e.g. Retail Bank)</option>
              <option value="department">Department (Teams group, e.g. Information Security)</option>
              <option value="team">Team (Sub-teams, e.g. Threat Intelligence)</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-dark-text">Parent Node (Hierarchical Reference)</label>
            <select
              value={orgParentId}
              onChange={(e) => setOrgParentId(e.target.value)}
              className="w-full bg-[#232d45]/20 border border-dark-border rounded-lg px-3 py-2 text-xs text-dark-text focus:outline-none"
            >
              <option value="">None (Root Node)</option>
              {orgsList.map(o => (
                <option key={o.id} value={o.id}>{o.name} ({o.type.toUpperCase()})</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-dark-text">Office Location / Region</label>
            <input
              type="text"
              placeholder="e.g. Austin HQ"
              value={orgLocation}
              onChange={(e) => setOrgLocation(e.target.value)}
              className="w-full bg-[#232d45]/20 border border-dark-border rounded-lg px-3 py-2 text-xs text-dark-text focus:outline-none focus:border-brand-500"
            />
          </div>

          <div className="border-t border-dark-border pt-4 flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={closeOrgModal}
              className="bg-transparent hover:bg-dark-border text-dark-text font-medium text-xs py-2 px-4 rounded-lg border border-dark-border transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createOrgMutation.isPending}
              className="bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white font-medium text-xs py-2 px-4 rounded-lg shadow-lg shadow-brand-500/10 transition-all"
            >
              Create Node
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
};
