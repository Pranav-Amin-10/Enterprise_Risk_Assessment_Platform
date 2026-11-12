import React, { useState, useEffect, useRef } from 'react';
import { useAuthStore, PREVIEW_ROLES } from '../../store/useAuthStore';
import { useThemeStore } from '../../store/useThemeStore';
import { useNotificationStore } from '../../store/useNotificationStore';
import { auth } from '../../services/firebase';
import { signOut } from 'firebase/auth';
import { 
  Bell, 
  Sun, 
  Moon, 
  LogOut, 
  ShieldAlert, 
  Check, 
  Eye, 
  RotateCcw, 
  ChevronDown, 
  Users 
} from 'lucide-react';
import { toast } from '../../store/useToastStore';

export const Navbar: React.FC = () => {
  const { user, realUser, previewRole, previewInfo, setPreviewRole, exitPreview } = useAuthStore() as any;
  const { theme, toggleTheme } = useThemeStore();
  const { notifications, unreadCount, fetchNotifications, markAsRead, markAllAsRead } = useNotificationStore();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showRolePreview, setShowRolePreview] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const previewDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchNotifications();
    // Poll notifications every 60 seconds
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  // Close notifications dropdown on clicking outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
      if (previewDropdownRef.current && !previewDropdownRef.current.contains(e.target as Node)) {
        setShowRolePreview(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleLogout = async () => {
    try {
      localStorage.removeItem('grc_admin_mode');
      localStorage.removeItem('grc_logged_in_user_email');
      sessionStorage.removeItem('grc_preview_role');
      useAuthStore.getState().setAuth(null, null);
      await signOut(auth);
      toast.success('Logged out successfully');
    } catch (err: any) {
      toast.error(`Logout failed: ${err.message}`);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <header className="h-16 border-b border-dark-border bg-dark-card/50 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Left side: Platform Brand and Mode Status */}
      <div className="flex items-center gap-3">
        <h2 className="text-lg font-semibold text-dark-text tracking-wide">Enterprise Risk Assessment</h2>

        {/* Dynamic Mode Badge: Preview Mode Banner vs Admin Mode */}
        {previewRole ? (
          <div className="flex items-center gap-2 bg-amber-500/15 border border-amber-500/40 px-3 py-1 rounded-full text-xs">
            <Eye className="h-3.5 w-3.5 text-amber-400 animate-pulse" />
            <span className="text-amber-300 font-semibold">
              Previewing: {previewInfo?.label || previewRole}
            </span>
            <span className="text-amber-200/60 text-[11px] hidden lg:inline">
              ({previewInfo?.personaName})
            </span>
            <button
              onClick={() => {
                exitPreview();
                toast.info('Returned to Super Admin mode');
              }}
              className="ml-1 text-[11px] font-bold text-amber-200 hover:text-white bg-amber-500/25 hover:bg-amber-500/50 px-2 py-0.5 rounded transition-all flex items-center gap-1 shadow-sm"
              title="Exit Preview and restore Super Admin"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Exit Preview</span>
            </button>
          </div>
        ) : user?.role === 'super_admin' ? (
          <span className="px-2.5 py-0.5 text-[9px] bg-brand-500/15 text-brand-400 border border-brand-500/30 rounded-full font-bold uppercase tracking-wider animate-pulse shrink-0">
            🛡️ Admin Mode
          </span>
        ) : null}

        {user?.isUnregistered && (
          <span className="px-2 py-0.5 text-xs bg-amber-500/20 text-amber-300 border border-amber-800/40 rounded-full font-medium">
            Pending Role Sync
          </span>
        )}
      </div>

      {/* Right side controls */}
      <div className="flex items-center gap-3">
        {/* Role Preview Switcher Dropdown (Visible for Super Admin or when in Preview Mode) */}
        {(realUser?.role === 'super_admin' || user?.role === 'super_admin' || previewRole) && (
          <div className="relative" ref={previewDropdownRef}>
            <button
              onClick={() => setShowRolePreview(!showRolePreview)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                previewRole
                  ? 'bg-amber-500/15 text-amber-300 border-amber-500/40 hover:bg-amber-500/25 shadow-sm shadow-amber-500/10'
                  : 'bg-dark-card border-dark-border text-dark-muted hover:text-dark-text hover:border-brand-500/40 hover:bg-dark-border/40'
              }`}
              title="Preview application as different GRC roles"
            >
              <Eye className={`h-3.5 w-3.5 ${previewRole ? 'text-amber-400' : 'text-brand-500'}`} />
              <span className="font-semibold">{previewRole ? `Role: ${previewInfo?.label}` : 'Role Preview'}</span>
              <ChevronDown className="h-3 w-3 opacity-70" />
            </button>

            {showRolePreview && (
              <div className="absolute right-0 mt-2 w-80 rounded-xl border border-dark-border bg-dark-card shadow-2xl p-3 z-50 animate-in fade-in duration-150">
                <div className="border-b border-dark-border pb-2.5 mb-2.5">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-dark-text text-xs flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5 text-brand-500" />
                      Role Preview Switcher
                    </h4>
                    {previewRole && (
                      <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-mono font-medium">
                        Active Preview
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-dark-muted mt-1 leading-normal">
                    Experience the platform interface and permissions from different stakeholder viewpoints.
                  </p>
                </div>

                {/* Exit Preview Option (Only when preview is active) */}
                {previewRole && (
                  <button
                    onClick={() => {
                      exitPreview();
                      setShowRolePreview(false);
                      toast.info('Returned to Super Admin mode');
                    }}
                    className="w-full mb-2 p-2.5 rounded-lg border border-brand-500/40 bg-brand-500/10 hover:bg-brand-500/20 text-left transition-all flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="h-7 w-7 rounded-md bg-brand-500/20 text-brand-400 flex items-center justify-center font-bold text-xs shrink-0 group-hover:scale-105 transition-transform">
                        <RotateCcw className="h-3.5 w-3.5" />
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-brand-300">Exit Preview</div>
                        <div className="text-[10px] text-dark-muted">Return to Super Admin (Unrestricted platform management)</div>
                      </div>
                    </div>
                  </button>
                )}

                <div className="text-[10px] uppercase font-bold text-dark-muted tracking-wider px-1 mb-1.5">
                  Select Role View
                </div>

                <div className="space-y-1 max-h-[340px] overflow-y-auto pr-0.5">
                  {Object.entries(PREVIEW_ROLES).map(([roleKey, persona]) => {
                    const isCurrent = previewRole === roleKey;
                    return (
                      <button
                        key={roleKey}
                        onClick={() => {
                          setPreviewRole(roleKey as any);
                          setShowRolePreview(false);
                          toast.success(`Switched preview to ${persona.label} (${persona.personaName})`);
                        }}
                        className={`w-full p-2 rounded-lg text-left transition-all flex items-start justify-between border ${
                          isCurrent
                            ? 'bg-amber-500/15 border-amber-500/40 text-amber-200 shadow-sm'
                            : 'bg-dark-card/40 border-transparent hover:border-dark-border hover:bg-dark-border/40 text-dark-text'
                        }`}
                      >
                        <div className="space-y-0.5 flex-1 pr-2">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-semibold">{persona.label}</span>
                            <span className="text-[9px] px-1.5 py-0.2 bg-dark-border/60 text-dark-muted rounded font-medium">
                              {persona.badge}
                            </span>
                          </div>
                          <div className="text-[11px] text-dark-muted leading-tight">
                            {persona.description}
                          </div>
                          <div className="text-[10px] text-brand-400/80 pt-0.5 flex items-center gap-1">
                            <span>👤 {persona.personaName}</span>
                            {persona.departmentName && (
                              <span className="text-dark-muted">• {persona.departmentName}</span>
                            )}
                          </div>
                        </div>
                        {isCurrent ? (
                          <Check className="h-4 w-4 text-amber-400 shrink-0 mt-1" />
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Dynamic GRC Version */}
        <span className="text-[10px] text-dark-muted font-bold bg-dark-border/30 px-2 py-0.5 rounded border border-dark-border select-none hidden sm:inline">
          v1.2.0
        </span>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg text-dark-muted hover:text-dark-text hover:bg-dark-border transition-colors"
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>

        {/* Notifications Bell */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-lg text-dark-muted hover:text-dark-text hover:bg-dark-border transition-colors relative"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 h-5 min-w-[20px] px-1 bg-red-600 text-white rounded-full flex items-center justify-center text-[10px] font-bold border border-[#161d30]">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 rounded-xl border border-dark-border bg-dark-card shadow-2xl p-4 z-50">
              <div className="flex items-center justify-between border-b border-dark-border pb-2 mb-2">
                <h4 className="font-semibold text-dark-text text-sm">Notifications</h4>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs text-brand-500 hover:text-brand-600 font-medium"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-60 overflow-y-auto space-y-2">
                {notifications.length === 0 ? (
                  <div className="py-6 text-center text-xs text-dark-muted">No alerts at this time.</div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`p-2.5 rounded-lg border text-xs flex gap-2.5 transition-colors ${
                        n.isRead === 0
                          ? 'bg-[#232d45]/20 border-dark-border/80'
                          : 'bg-transparent border-transparent'
                      }`}
                    >
                      <ShieldAlert className="h-4 w-4 text-brand-500 shrink-0 mt-0.5" />
                      <div className="flex-1 space-y-0.5">
                        <div className="font-medium text-dark-text">{n.title}</div>
                        <div className="text-dark-muted leading-relaxed">{n.message}</div>
                        <div className="text-[10px] text-gray-500 mt-1">
                          {new Date(n.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      {n.isRead === 0 && (
                        <button
                          onClick={() => markAsRead(n.id)}
                          className="p-1 h-fit text-brand-500 hover:text-white rounded hover:bg-dark-border shrink-0"
                          title="Mark read"
                        >
                          <Check className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Card */}
        {user && (
          <div className="flex items-center gap-3 border-l border-dark-border pl-4">
            <div className={`h-9 w-9 rounded-full font-bold text-sm flex items-center justify-center shrink-0 ${
              previewRole ? 'bg-amber-600 text-white' : 'bg-brand-500 text-white'
            }`}>
              {getInitials(user.name)}
            </div>
            <div className="hidden md:block">
              <div className="text-xs font-semibold text-dark-text max-w-[120px] truncate">{user.name}</div>
              <div className="text-[10px] text-dark-muted capitalize font-medium flex items-center gap-1">
                <span>{user.role?.replace('_', ' ')}</span>
                {previewRole && (
                  <span className="text-[8px] bg-amber-500/20 text-amber-300 px-1 rounded uppercase tracking-wider font-bold">
                    PREVIEW
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-950/20 transition-colors ml-2"
              title="Sign Out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
