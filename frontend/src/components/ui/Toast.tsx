import React from 'react';
import { useToastStore } from '../../store/useToastStore';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full">
      {toasts.map((toast) => {
        let bgColor = 'bg-dark-card border-dark-border';
        let textColor = 'text-dark-text';
        let Icon = Info;

        if (toast.type === 'success') {
          bgColor = 'bg-emerald-950/90 border-emerald-800/50';
          textColor = 'text-emerald-300';
          Icon = CheckCircle;
        } else if (toast.type === 'error') {
          bgColor = 'bg-red-950/90 border-red-800/50';
          textColor = 'text-red-300';
          Icon = XCircle;
        } else if (toast.type === 'warning') {
          bgColor = 'bg-amber-950/90 border-amber-800/50';
          textColor = 'text-amber-300';
          Icon = AlertTriangle;
        } else if (toast.type === 'info') {
          bgColor = 'bg-sky-950/90 border-sky-800/50';
          textColor = 'text-sky-300';
          Icon = Info;
        }

        return (
          <div
            key={toast.id}
            className={`flex items-start gap-3 p-4 rounded-lg border shadow-lg backdrop-blur-md animate-slide-in-right ${bgColor} ${textColor}`}
          >
            <Icon className="h-5 w-5 shrink-0 mt-0.5" />
            <div className="flex-1 text-sm font-medium">{toast.message}</div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-gray-400 hover:text-white shrink-0 p-0.5 rounded-full hover:bg-white/10"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
