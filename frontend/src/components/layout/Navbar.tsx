import React, { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { useThemeStore } from '../../store/useThemeStore';
import { useNotificationStore } from '../../store/useNotificationStore';
import { auth } from '../../services/firebase';
import { signOut } from 'firebase/auth';
import { Bell, Sun, Moon, LogOut, ShieldAlert, Check } from 'lucide-react';
import { toast } from '../../store/useToastStore';

export const Navbar: React.FC = () => {
  const { user } = useAuthStore() as any;
  const { theme, toggleTheme } = useThemeStore();
  const { notifications, unreadCount, fetchNotifications, markAsRead, markAllAsRead } = useNotificationStore();

  const [showNotifications, setShowNotifications] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleLogout = async () => {
    try {
      localStorage.removeItem('grc_admin_mode');
      localStorage.removeItem('grc_logged_in_user_email');
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
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-semibold text-dark-text tracking-wide">Enterprise Risk Assessment</h2>
        {user?.role === 'super_admin' && (
          <span className="px-2.5 py-0.5 text-[9px] bg-brand-500/15 text-brand-400 border border-brand-500/30 rounded-full font-bold uppercase tracking-wider animate-pulse shrink-0">
            🛡️ Admin Mode
          </span>
        )}
        {user?.isUnregistered && (
          <span className="px-2 py-0.5 text-xs bg-amber-500/20 text-amber-300 border border-amber-800/40 rounded-full font-medium">
            Pending Role Sync
          </span>
        )}
      </div>

      <div className="flex items-center gap-4">
        {/* Dynamic GRC Version */}
        <span className="text-[10px] text-dark-muted font-bold bg-dark-border/30 px-2 py-0.5 rounded border border-dark-border select-none">
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
            <div className="h-9 w-9 rounded-full bg-brand-500 text-white font-bold text-sm flex items-center justify-center shrink-0">
              {getInitials(user.name)}
            </div>
            <div className="hidden md:block">
              <div className="text-xs font-semibold text-dark-text max-w-[120px] truncate">{user.name}</div>
              <div className="text-[10px] text-dark-muted capitalize font-medium">{user.role?.replace('_', ' ')}</div>
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
