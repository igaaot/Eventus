import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export default function Modal({ isOpen, onClose, title, children }: ModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="brand-card relative w-full max-w-lg overflow-hidden rounded-[28px]"
          >
            <div className="flex items-center justify-between border-b border-slate-200/70 bg-[linear-gradient(180deg,#f8fbff_0%,#f4f8ff_100%)] px-6 py-4">
              <h3 className="text-lg font-bold text-slate-950">{title}</h3>
              <button
                onClick={onClose}
                className="rounded-xl p-2 text-slate-500 transition-colors hover:bg-slate-200/70 hover:text-slate-900"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
