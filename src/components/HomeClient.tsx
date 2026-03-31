'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import TemplateForm from "@/components/TemplateForm";
import TemplateSelector from "@/components/TemplateSelector";
import ConsultasList from "@/components/ConsultasList";
import RemoteLinksList from "@/components/RemoteLinksList";
import HeaderSettings from "@/components/HeaderSettings";
import ClinicalDashboard from "@/components/ClinicalDashboard";
import AudioRecorder from "@/components/AudioRecorder";
import InsightsPreviewModal from "@/components/InsightsPreviewModal";
import { useTranslations, useLocale } from 'next-intl';

export default function HomeClient({ initialTemplates }: { initialTemplates: any[] }) {
  const t = useTranslations('Home');
  const d = useTranslations('Dashboard');
  const locale = useLocale();
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(initialTemplates.length > 0 ? String(initialTemplates[0].id) : "mock_1");
  const [refreshHistoryTrigger, setRefreshHistoryTrigger] = useState(0);
  const [activeTab, setActiveTab] = useState<'consults' | 'links'>('consults');

  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState<{
    record?: any;
    formData?: Record<string, string>;
    templateSchema?: any;
    templateId?: string;
    patientName?: string;
    consultDate?: string;
  }>({});

  const [audioAiResult, setAudioAiResult] = useState<any>(null);

  const handleRecordSaved = () => {
    setRefreshHistoryTrigger(prev => prev + 1);
  };
  
  const handleOpenReview = (data: typeof previewData) => {
    setPreviewData(data);
    setShowPreview(true);
  };

  const handleExport = async (mode: 'compact' | 'full', enrichedData: Record<string, string>) => {
    const { saveRecord, updatePatientRecord } = await import('@/app/actions/history.actions');
    const { getDoctorProfile } = await import('@/app/actions/profile.actions');
    const { exportAnamneseToPDF } = await import('@/lib/exportPdf');

    const finalPatientName = previewData.patientName || enrichedData.nome || enrichedData.paciente || enrichedData.identificacao || "Paciente Sem Nome";
    
    let res;
    if (previewData.record?.id) {
        res = await updatePatientRecord(previewData.record.id, enrichedData);
    } else {
        res = await saveRecord({
            patientName: finalPatientName,
            templateId: previewData.templateId || '',
            date: previewData.consultDate || new Date().toISOString().split('T')[0],
            data: enrichedData
        });
    }

    if (res.success && res.data) {
      handleRecordSaved();
      const profile = await getDoctorProfile();
      exportAnamneseToPDF(res.data, profile, mode, locale);
    }
  };

  const handleEmail = (enrichedData: Record<string, string>) => {
    setShowPreview(false);
    const bodyText = Object.entries(enrichedData).map(([k, v]) => `${k.toUpperCase()}:\n${v}`).join('\n\n');
    window.location.href = `mailto:?subject=Relatório Clínico&body=${encodeURIComponent(bodyText)}`;
  };

  return (
    <div key={locale} className="min-h-screen bg-background flex flex-col items-center p-4 sm:p-8 font-[family-name:var(--font-geist-sans)] relative">
      <HeaderSettings />
      

      <main className="w-full max-w-5xl flex flex-col gap-12 pt-20">
        
        {/* Header Section */}
        <motion.header 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-3"
        >
          <div className="inline-block bg-primary/10 text-primary text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest mb-2">
            Plataforma Médica Inteligente
          </div>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-slate-900 leading-tight">
            {t('title').split(' ')[0]} <span className="text-primary">{t('title').split(' ').slice(1).join(' ')}</span>
          </h1>
          <p className="text-slate-500 text-lg max-w-2xl mx-auto">{t('subtitle')}</p>
        </motion.header>

        {/* Dashboard/Stats Section */}
        <motion.section 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="w-full"
        >
          <div className="flex items-center justify-between mb-4 px-2">
            <h2 className="text-xl font-black text-slate-800">{d('title')}</h2>
            <div className="h-px bg-slate-200 flex-1 mx-4 opacity-50"></div>
          </div>
          <ClinicalDashboard refreshTrigger={refreshHistoryTrigger} />
        </motion.section>

        {/* Main Work Area: Form + Selector */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
        >
          {/* Main Form Card */}
          <div className="lg:col-span-8 bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden relative group">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-primary/20"></div>
            <div className="p-8">
              {/* Centralized Audio Assistant (Moved from Float to Static) */}
              <div className="mb-8">
                <AudioRecorder 
                  variant="floating"
                  templateFields={initialTemplates.find(t => String(t.id) === selectedTemplateId)?.schema?.fields || []}
                  onResult={(data) => setAudioAiResult(data)} 
                  isModalActive={showPreview}
                />
              </div>

              <TemplateForm 
                templateId={selectedTemplateId} 
                incomingAiData={audioAiResult}
                onSaved={handleRecordSaved}
                onReviewRequest={(data) => handleOpenReview({
                  formData: data.formData,
                  templateSchema: data.templateSchema,
                  templateId: selectedTemplateId,
                  patientName: data.patientName,
                  consultDate: data.consultDate
                })}
              />
            </div>
          </div>

          {/* Sidebar / Selector */}
          <div className="lg:col-span-4 lg:sticky lg:top-24 w-full">
            <div className="bg-white/50 backdrop-blur-sm rounded-3xl p-6 border border-slate-200/60 shadow-sm flex flex-col h-full max-h-[80vh] lg:max-h-[calc(100vh-180px)]">
                <div className="flex items-center gap-2 mb-6">
                    <div className="w-1.5 h-6 bg-primary rounded-full"></div>
                    <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest">{t('fillStructure')}</h2>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 hover:scrollbar-thumb-primary/40 transition-colors">
                  <TemplateSelector onSelect={setSelectedTemplateId} initialTemplates={initialTemplates} />
                </div>
            </div>
          </div>
        </motion.section>

        {/* History / Recent Activity Section - Redesigned Isolation */}
        <motion.section 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="w-full mt-8 bg-white/40 backdrop-blur-sm rounded-[3rem] p-8 border border-white/60 shadow-inner"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 border-b border-slate-200/60 pb-6">
            <div className="flex items-center gap-6">
                <button 
                onClick={() => setActiveTab('consults')}
                className={`text-xl font-black transition-all relative ${activeTab === 'consults' ? 'text-slate-900 scale-110' : 'text-slate-400 hover:text-slate-600'}`}
                >
                {t('recentConsults')}
                {activeTab === 'consults' && <motion.div layoutId="tab-underline" className="absolute -bottom-6 left-0 w-full h-1 bg-primary rounded-full"></motion.div>}
                </button>
                <button 
                onClick={() => setActiveTab('links')}
                className={`text-xl font-black transition-all relative flex items-center gap-2 ${activeTab === 'links' ? 'text-slate-900 scale-110' : 'text-slate-400 hover:text-slate-600'}`}
                >
                Links Remotos
                {activeTab === 'links' && <motion.div layoutId="tab-underline" className="absolute -bottom-6 left-0 w-full h-1 bg-primary rounded-full"></motion.div>}
                </button>
            </div>
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-2xl shadow-sm border border-slate-100">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                <span className="text-slate-600 text-xs font-black uppercase tracking-widest">{t('localBadge')}</span>
            </div>
          </div>
          
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
                {activeTab === 'consults' ? (
                <ConsultasList 
                    refreshTrigger={refreshHistoryTrigger} 
                    onReview={(record) => handleOpenReview({
                    record,
                    formData: record.data,
                    templateSchema: record.template?.schema,
                    templateId: record.templateId,
                    patientName: record.patientName,
                    consultDate: record.date || record.createdAt
                    })}
                />
                ) : (
                <RemoteLinksList refreshTrigger={refreshHistoryTrigger} />
                )}
            </motion.div>
          </AnimatePresence>
        </motion.section>

        <footer className="mt-8 text-center text-sm text-slate-400 pb-12">
          <div className="flex flex-col items-center gap-2 mb-4">
            <div className="flex items-center justify-center gap-2">
              <div className="h-px bg-slate-200 w-12"></div>
              <span className="font-bold text-slate-300 italic tracking-widest uppercase text-[10px]">Anamnese PWA</span>
              <div className="h-px bg-slate-200 w-12"></div>
            </div>
            <div className="flex items-center gap-3 bg-slate-100/50 px-4 py-1.5 rounded-full border border-slate-200/50">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 00-2 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                512-bit SSL Secured
              </span>
              <div className="w-1 h-1 bg-slate-200 rounded-full"></div>
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Certified Medical Platform</span>
              <div className="w-1 h-1 bg-slate-200 rounded-full"></div>
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Trusted by +500 Doctors</span>
            </div>
          </div>
          {t('footer')}
        </footer>

        <InsightsPreviewModal 
          isOpen={showPreview}
          formData={previewData.formData || {}}
          templateSchema={previewData.templateSchema}
          templateId={previewData.templateId || ''}
          patientName={previewData.patientName || ''}
          consultDate={previewData.consultDate || ''}
          onExport={handleExport}
          onEmail={handleEmail}
          onClose={() => setShowPreview(false)}
        />
      </main>
    </div>
  );
}
