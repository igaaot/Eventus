import React from 'react';
import { Info } from 'lucide-react';

interface InfoHintProps {
  text: string;
}

export default function InfoHint({ text }: InfoHintProps) {
  return (
    <div className="group relative inline-flex">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white/90 text-sky-700 shadow-sm transition hover:border-sky-200 hover:bg-sky-50">
        <Info size={16} />
      </div>
      <div className="pointer-events-none absolute right-0 top-10 z-30 w-64 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-600 opacity-0 shadow-[0_20px_40px_rgba(15,23,42,0.12)] transition duration-200 group-hover:opacity-100">
        {text}
      </div>
    </div>
  );
}
