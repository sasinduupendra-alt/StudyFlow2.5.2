import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: 'danger' | 'warning' | 'info';
}

export default function ConfirmationModal({
  isOpen,
  title,
  message,
  confirmText = 'CONFIRM',
  cancelText = 'CANCEL',
  onConfirm,
  onCancel,
  variant = 'danger'
}: ConfirmationModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
            className="absolute inset-0 bg-black/90 backdrop-blur-md"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="relative w-full max-w-md scifi-panel p-6 md:p-8 shadow-[0_0_50px_rgba(0,0,0,0.5)] border-border-dim"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className={cn(
                "w-10 h-10 md:w-12 md:h-12 border flex items-center justify-center shrink-0",
                variant === 'danger' ? "border-red-500/30 text-red-500 bg-red-500/5" :
                variant === 'warning' ? "border-yellow-500/30 text-yellow-500 bg-yellow-500/5" :
                "border-brand/30 text-brand bg-brand/5"
              )}>
                <AlertTriangle className="w-5 h-5 md:w-6 md:h-6" />
              </div>
              <div>
                <label className="hud-label !text-gray-600 mb-1">SYSTEM_CONFIRMATION</label>
                <h3 className="text-sm md:text-base font-black uppercase tracking-tighter">{title}</h3>
              </div>
            </div>
            
            <p className="text-[11px] font-black uppercase tracking-tight text-gray-500 mb-8 leading-relaxed">
              {message}
            </p>
            
            <div className="flex gap-3">
              <button
                onClick={onCancel}
                className="flex-1 py-3 text-[10px] font-black uppercase tracking-widest text-gray-700 hover:text-white transition-colors"
              >
                {cancelText}
              </button>
              <button
                onClick={() => {
                  onConfirm();
                  onCancel();
                }}
                className={cn(
                  "flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-all",
                  variant === 'danger' ? "bg-red-500/10 border border-red-500/30 text-red-500 hover:bg-red-500/20" :
                  variant === 'warning' ? "bg-yellow-500/10 border border-yellow-500/30 text-yellow-500 hover:bg-yellow-500/20" :
                  "scifi-button"
                )}
              >
                {confirmText}
              </button>
            </div>
            
            <button
              onClick={onCancel}
              className="absolute top-6 right-6 p-2 text-gray-700 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
