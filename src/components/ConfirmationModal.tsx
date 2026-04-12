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
            className="relative w-full max-w-md bg-black border border-white/20 p-6 md:p-8 rounded-none"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className={cn(
                "w-10 h-10 md:w-12 md:h-12 border flex items-center justify-center shrink-0 rounded-none",
                variant === 'danger' ? "border-red-500/30 text-red-500 bg-transparent" :
                variant === 'warning' ? "border-yellow-500/30 text-yellow-500 bg-transparent" :
                "border-white/30 text-white bg-transparent"
              )}>
                <AlertTriangle className="w-5 h-5 md:w-6 md:h-6" />
              </div>
              <div>
                <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-1 block">SYSTEM_CONFIRMATION</label>
                <h3 className="text-sm md:text-base font-mono uppercase tracking-widest text-white">{title}</h3>
              </div>
            </div>
            
            <p className="text-[11px] font-mono uppercase tracking-widest text-zinc-400 mb-8 leading-relaxed">
              {message}
            </p>
            
            <div className="flex gap-3">
              <button
                onClick={onCancel}
                className="flex-1 py-3 text-[10px] font-mono uppercase tracking-widest text-zinc-500 hover:text-white border border-transparent hover:border-white/20 transition-colors rounded-none"
              >
                {cancelText}
              </button>
              <button
                onClick={() => {
                  onConfirm();
                  onCancel();
                }}
                className={cn(
                  "flex-1 py-3 text-[10px] font-mono uppercase tracking-widest transition-all rounded-none",
                  variant === 'danger' ? "bg-transparent border border-red-500 text-red-500 hover:bg-red-500/10" :
                  variant === 'warning' ? "bg-transparent border border-yellow-500 text-yellow-500 hover:bg-yellow-500/10" :
                  "bg-white text-black hover:bg-zinc-200"
                )}
              >
                {confirmText}
              </button>
            </div>
            
            <button
              onClick={onCancel}
              className="absolute top-6 right-6 p-2 text-zinc-500 hover:text-white transition-colors rounded-none"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
