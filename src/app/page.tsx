'use client';

import { useState } from 'react';
import TemplateForm from "@/components/TemplateForm";
import TemplateSelector from "@/components/TemplateSelector";
import ConsultasList from "@/components/ConsultasList";
import HeaderSettings from "@/components/HeaderSettings";

export default function Home() {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("mock_1");
  const [refreshHistoryTrigger, setRefreshHistoryTrigger] = useState(0);

  const handleRecordSaved = () => {
    setRefreshHistoryTrigger(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 sm:p-8 font-[family-name:var(--font-geist-sans)] relative">
      <HeaderSettings />
      <main className="w-full max-w-4xl flex flex-col items-center gap-8 pt-8 sm:pt-0">
        <header className="text-center space-y-2">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">Projetinho</h1>
          <p className="text-slate-600 font-medium">Anamnese Inteligente PWA</p>
        </header>

        <section className="w-full flex border bg-white p-4 rounded-xl shadow-lg border-slate-100 flex-col md:flex-row gap-6">
          <div className="flex-[2]">
            <div className="h-full border border-slate-200 rounded-lg bg-slate-50 relative p-6">
              <TemplateForm templateId={selectedTemplateId} onSaved={handleRecordSaved} />
            </div>
          </div>

          <div className="flex-1 mt-6 md:mt-0 pt-6 md:pt-0 border-t md:border-t-0 md:border-l border-slate-100 md:pl-6">
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Estrutura de Preenchimento</h2>
            <TemplateSelector onSelect={setSelectedTemplateId} />
          </div>
        </section>

        <section className="w-full mt-6">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-lg font-bold text-slate-800">Consultas Recentes</h2>
            <span className="bg-slate-200 text-slate-600 text-xs font-bold px-2 py-0.5 rounded-full">Local</span>
          </div>
          <ConsultasList refreshTrigger={refreshHistoryTrigger} />
        </section>

        <footer className="mt-8 text-center text-sm text-slate-400">
          Modo Offline-First Ativado. Todo processamento ocorre no seu dispositivo.
        </footer>
      </main>
    </div>
  );
}
