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
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md bg-[#181818] border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className={cn(
                "w-10 h-10 md:w-12 md:h-12 rounded-2xl flex items-center justify-center shrink-0",
                variant === 'danger' ? "bg-red-500/20 text-red-500" :
                variant === 'warning' ? "bg-yellow-500/20 text-yellow-500" :
                "bg-blue-500/20 text-blue-500"
              )}>
                <AlertTriangle className="w-5 h-5 md:w-6 md:h-6" />
              </div>
              <h3 className="text-xl md:text-2xl font-bold tracking-tight">{title}</h3>
            </div>
            
            <p className="text-gray-400 mb-8 leading-relaxed">
              {message}
            </p>
            
            <div className="flex gap-3">
              <button
                onClick={onCancel}
                className="flex-1 py-3 rounded-xl font-bold text-gray-400 hover:text-white hover:bg-white/5 transition-all"
              >
                {cancelText}
              </button>
              <button
                onClick={() => {
                  onConfirm();
                  onCancel();
                }}
                className={cn(
                  "flex-1 py-3 rounded-xl font-bold transition-all hover:scale-105",
                  variant === 'danger' ? "bg-red-500 text-white" :
                  variant === 'warning' ? "bg-yellow-500 text-black" :
                  "bg-[#1DB954] text-black"
                )}
              >
                {confirmText}
              </button>
            </div>
            
            <button
              onClick={onCancel}
              className="absolute top-6 right-6 p-2 text-gray-500 hover:text-white rounded-full hover:bg-white/5 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
