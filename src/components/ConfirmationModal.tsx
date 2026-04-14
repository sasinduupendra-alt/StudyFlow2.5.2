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
  confirmText = 'Confirm',
  cancelText = 'Cancel',
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
            className="relative w-full max-w-md bg-[#1C1C1E] border border-white/5 p-8 md:p-10 rounded-[32px] shadow-2xl"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className={cn(
                "w-12 h-12 md:w-14 md:h-14 flex items-center justify-center shrink-0 rounded-full",
                variant === 'danger' ? "bg-[#FF453A]/10 text-[#FF453A]" :
                variant === 'warning' ? "bg-[#FF9F0A]/10 text-[#FF9F0A]" :
                "bg-brand/10 text-brand"
              )}>
                <AlertTriangle className="w-6 h-6 md:w-7 md:h-7" />
              </div>
              <div>
                <h3 className="text-xl md:text-2xl font-bold text-white tracking-tight">{title}</h3>
              </div>
            </div>
            
            <p className="text-sm md:text-base font-medium text-[#8E8E93] mb-8 leading-relaxed">
              {message}
            </p>
            
            <div className="flex gap-4">
              <button
                onClick={onCancel}
                className="flex-1 py-3.5 text-sm font-semibold text-[#8E8E93] hover:text-white hover:bg-white/5 transition-colors rounded-full"
              >
                {cancelText}
              </button>
              <button
                onClick={() => {
                  onConfirm();
                  onCancel();
                }}
                className={cn(
                  "flex-1 py-3.5 text-sm font-semibold transition-all rounded-full shadow-md",
                  variant === 'danger' ? "bg-[#FF453A] text-white hover:opacity-90" :
                  variant === 'warning' ? "bg-[#FF9F0A] text-white hover:opacity-90" :
                  "bg-brand text-white hover:opacity-90"
                )}
              >
                {confirmText}
              </button>
            </div>
            
            <button
              onClick={onCancel}
              className="absolute top-6 right-6 p-2 text-[#8E8E93] hover:text-white hover:bg-white/10 transition-colors rounded-full"
            >
              <X className="w-5 h-5" />
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
