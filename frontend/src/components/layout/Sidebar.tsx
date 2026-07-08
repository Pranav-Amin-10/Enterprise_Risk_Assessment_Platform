import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { 
  LayoutDashboard, 
  ShieldAlert, 
  Server, 
  Skull, 
  Lock, 
  Activity, 
  FileText, 
  History, 
  Settings,
  ShieldAlert as ShieldIcon
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const location = useLocation();
  const { user } = useAuthStore() as any;

  const role = user?.role || 'viewer';

  const menuItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard, roles: ['*'] },
    { name: 'Risk Register', path: '/risks', icon: ShieldAlert, roles: ['*'] },
    { name: 'Asset Inventory', path: '/assets', icon: Server, roles: ['*'] },
    { name: 'Threat Library', path: '/threats', icon: Skull, roles: ['*'] },
    { name: 'Vulnerability Library', path: '/vulnerabilities', icon: Lock, roles: ['*'] },
    { name: 'Treatment Plans', path: '/treatments', icon: Activity, roles: ['*'] },
    { name: 'Reports Center', path: '/reports', icon: FileText, roles: ['*'] },
    { name: 'Audit History', path: '/audit-logs', icon: History, roles: ['super_admin', 'ciso', 'auditor'] },
    { name: 'Settings & Org', path: '/settings', icon: Settings, roles: ['super_admin', 'ciso'] },
  ];

  const filteredItems = menuItems.filter(item => 
    item.roles.includes('*') || item.roles.includes(role)
  );

  return (
    <aside className="w-64 border-r border-dark-border bg-dark-card/30 flex flex-col shrink-0">
      {/* Brand logo */}
      <div className="h-16 px-6 border-b border-dark-border flex items-center gap-3">
        <ShieldIcon className="h-6 w-6 text-brand-500" />
        <span className="font-bold text-dark-text text-base tracking-wider">PLATFORM GRC</span>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 py-6 px-4 space-y-1.5 overflow-y-auto">
        {filteredItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <NavLink
              key={item.name}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/20'
                  : 'text-dark-muted hover:text-dark-text hover:bg-dark-border'
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Footer metadata */}
      <div className="p-4 border-t border-dark-border text-center">
        <div className="text-[10px] text-gray-500 font-semibold tracking-wider uppercase">Enterprise Mode</div>
        <div className="text-[9px] text-gray-600 mt-0.5">v1.0.0 (Stable)</div>
      </div>
    </aside>
  );
};
