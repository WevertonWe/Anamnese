'use client';

import { useState } from 'react';
import TemplateForm from "@/components/TemplateForm";
import TemplateSelector from "@/components/TemplateSelector";
import ConsultasList from "@/components/ConsultasList";
import RemoteLinksList from "@/components/RemoteLinksList";
import HeaderSettings from "@/components/HeaderSettings";
import ClinicalDashboard from "@/components/ClinicalDashboard";
import { useTranslations, useLocale } from 'next-intl';

export default function Home() {
  const t = useTranslations('Home');
  const d = useTranslations('Dashboard');
  const locale = useLocale();
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("mock_1");
  const [refreshHistoryTrigger, setRefreshHistoryTrigger] = useState(0);
  const [activeTab, setActiveTab] = useState<'consults' | 'links'>('consults');

  const handleRecordSaved = () => {
    setRefreshHistoryTrigger(prev => prev + 1);
  };

  return (
    <div key={locale} className="min-h-screen bg-slate-50 flex items-center justify-center p-4 sm:p-8 font-[family-name:var(--font-geist-sans)] relative animate-in fade-in duration-500 slide-in-from-bottom-2">
      <HeaderSettings />
      <main className="w-full max-w-4xl flex flex-col items-center gap-8 pt-8 sm:pt-0">
        <header className="text-center space-y-2">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">{t('title')}</h1>
          <p className="text-slate-600 font-medium">{t('subtitle')}</p>
        </header>

        <section className="w-full flex flex-col gap-2 mt-2">
          <h2 className="text-lg font-bold text-slate-800">{d('title')}</h2>
          <ClinicalDashboard refreshTrigger={refreshHistoryTrigger} />
        </section>

        <section className="w-full flex border bg-white p-4 rounded-xl shadow-lg border-slate-100 flex-col md:flex-row gap-6 mt-4">
          <div className="flex-[2]">
            <div className="h-full border border-slate-200 rounded-lg bg-slate-50 relative p-6">
              <TemplateForm templateId={selectedTemplateId} onSaved={handleRecordSaved} />
            </div>
          </div>

          <div className="flex-1 mt-6 md:mt-0 pt-6 md:pt-0 border-t md:border-t-0 md:border-l border-slate-100 md:pl-6">
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">{t('fillStructure')}</h2>
            <TemplateSelector onSelect={setSelectedTemplateId} />
          </div>
        </section>

        <section className="w-full mt-6">
          <div className="flex items-center gap-4 mb-4 border-b border-slate-200 pb-2">
            <button 
              onClick={() => setActiveTab('consults')}
              className={`text-lg font-bold pb-2 transition-colors relative ${activeTab === 'consults' ? 'text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
            >
              {t('recentConsults')}
              {activeTab === 'consults' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-emerald-500 rounded-t-full"></div>}
            </button>
            <button 
              onClick={() => setActiveTab('links')}
              className={`text-lg font-bold pb-2 transition-colors relative flex items-center gap-2 ${activeTab === 'links' ? 'text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Links Remotos
              {activeTab === 'links' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-emerald-500 rounded-t-full"></div>}
            </button>
            <span className="bg-slate-200 text-slate-600 text-xs font-bold px-2 py-0.5 rounded-full ml-auto">{t('localBadge')}</span>
          </div>
          
          {activeTab === 'consults' ? (
            <ConsultasList refreshTrigger={refreshHistoryTrigger} />
          ) : (
            <RemoteLinksList refreshTrigger={refreshHistoryTrigger} />
          )}
        </section>

        <footer className="mt-8 text-center text-sm text-slate-400">
          {t('footer')}
        </footer>
      </main>
    </div>
  );
}
