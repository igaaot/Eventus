import React from 'react';
import { UserRound } from 'lucide-react';

export default function Participants() {
  return (
    <div className="rounded-2xl border border-[#E5E7EB] bg-white p-10 text-center shadow-sm">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#F3F4F6] text-[#1A1A1A]">
        <UserRound size={28} />
      </div>
      <h2 className="text-2xl font-bold text-[#1A1A1A]">Participantes integrados às contas</h2>
      <p className="mt-2 text-sm text-[#6B7280]">
        Nesta versão do Eventus, cada conta cadastrada já representa o perfil de um participante do sistema.
      </p>
    </div>
  );
}
