import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../store/useAuthStore';
import { Monitor, Calendar, User } from 'lucide-react';
import { TableSkeleton } from '../components/ui/Skeleton';

export const AuditLogs: React.FC = () => {
  const token = useAuthStore((state) => state.token);

  // Fetch Audit Logs
  const { data: logs = [], isLoading, error } = useQuery<any[]>({
    queryKey: ['auditLogs'],
    queryFn: async () => {
      const res = await fetch('/api/audit', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch audit logs');
      return res.json();
    },
    enabled: !!token,
  });

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight animate-fade-in">Immutable Audit History</h1>
        <p className="text-xs text-dark-muted">Append-only system security ledger monitoring all CRUD, user provisioning, and file actions.</p>
      </div>

      {isLoading ? (
        <TableSkeleton rows={8} />
      ) : error ? (
        <div className="p-8 text-center bg-red-950/20 border border-red-800/40 text-red-300 rounded-xl text-xs font-semibold">
          Error: Failed to fetch secure audit trails. Ensure you have proper CISO or Auditor credentials.
        </div>
      ) : (
        <div className="border border-dark-border rounded-xl overflow-hidden bg-dark-card shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-dark-border text-dark-muted font-medium bg-[#161d30]/60">
                  <th className="p-4">Timestamp</th>
                  <th className="p-4">User</th>
                  <th className="p-4">Operational Action</th>
                  <th className="p-4">IPv4 Address</th>
                  <th className="p-4">Payload Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-border/40 font-mono">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-dark-muted font-sans">No audit events logged.</td>
                  </tr>
                ) : (
                  logs.map((log) => {
                    let actionColor = 'text-brand-500';
                    if (log.action.includes('DELETE')) actionColor = 'text-red-400';
                    else if (log.action.includes('BOOTSTRAP') || log.action.includes('REGISTER')) actionColor = 'text-purple-400';
                    else if (log.action.includes('CREATE')) actionColor = 'text-emerald-400';

                    let parsedDetails = {};
                    try {
                      parsedDetails = JSON.parse(log.details);
                    } catch (e) {
                      parsedDetails = { raw: log.details };
                    }

                    return (
                      <tr key={log.id} className="hover:bg-dark-border/20 transition-colors">
                        <td className="p-4 text-dark-muted whitespace-nowrap">
                          <div className="flex items-center gap-1.5 font-medium">
                            <Calendar className="h-3.5 w-3.5" />
                            {new Date(log.createdAt).toLocaleString()}
                          </div>
                        </td>
                        <td className="p-4 font-semibold text-dark-text">
                          <div className="flex items-center gap-1.5">
                            <User className="h-3.5 w-3.5 text-gray-500 shrink-0" />
                            <span className="truncate max-w-[150px]" title={log.userEmail}>{log.userEmail}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className={`font-bold ${actionColor}`}>{log.action}</span>
                        </td>
                        <td className="p-4 text-dark-muted">
                          <div className="flex items-center gap-1.5">
                            <Monitor className="h-3.5 w-3.5 text-gray-600" />
                            {log.ipAddress}
                          </div>
                        </td>
                        <td className="p-4">
                          <pre className="text-[10px] text-gray-400 max-h-16 overflow-y-auto whitespace-pre-wrap max-w-sm border border-dark-border/30 p-1.5 rounded bg-dark-bg/20">
                            {JSON.stringify(parsedDetails, null, 2)}
                          </pre>
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

    </div>
  );
};
