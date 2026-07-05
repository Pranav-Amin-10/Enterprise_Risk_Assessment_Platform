import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md'
}) => {
  // Lock background scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-3xl',
    '2xl': 'max-w-5xl',
    '4xl': 'max-w-7xl',
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        onClick={onClose} 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
      />

      {/* Content Card */}
      <div className={`relative w-full ${sizeClasses[size]} rounded-xl border border-dark-border bg-dark-card p-6 shadow-2xl z-50 animate-fade-in`}>
        <div className="flex items-center justify-between border-b border-dark-border pb-4 mb-4">
          <h3 className="text-lg font-semibold text-dark-text">{title}</h3>
          <button 
            onClick={onClose}
            className="text-dark-muted hover:text-dark-text p-1.5 rounded-lg hover:bg-dark-border"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="max-h-[75vh] overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
};
