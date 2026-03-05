'use client';

import { useEffect, useState } from 'react';
import { getHistory } from '@/app/actions/history.actions';
import { useTranslations } from 'next-intl';

export default function ClinicalDashboard({ refreshTrigger = 0 }: { refreshTrigger?: number }) {
    const t = useTranslations('Dashboard');
    const [stats, setStats] = useState({
        total: 0,
        recent: 0,
        topTemplate: t('none'),
        chartData: [0, 0, 0, 0, 0, 0, 0] // 7 days
    });

    useEffect(() => {
        const calculateStats = async () => {
            const records = await getHistory();
            const total = records.length;

            // Recentes (Últimos 7 dias)
            const now = new Date();
            const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

            const recentRecords = records.filter(r => new Date(r.createdAt) >= sevenDaysAgo);
            const recent = recentRecords.length;

            // Template Mais Usado
            const templatesCount: Record<string, number> = {};
            records.forEach(r => {
                const tName = r.template?.name || t('none');
                templatesCount[tName] = (templatesCount[tName] || 0) + 1;
            });

            let topTemplate = t('none');
            let maxCount = 0;
            for (const [name, count] of Object.entries(templatesCount)) {
                if (count > maxCount) {
                    maxCount = count;
                    topTemplate = name;
                }
            }

            // Chart Data (simples barras CSS) - dist. dos útlimos 7 dias
            const chartData = [0, 0, 0, 0, 0, 0, 0];
            recentRecords.forEach(r => {
                const date = new Date(r.createdAt);
                const diffTime = Math.abs(now.getTime() - date.getTime());
                const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                if (diffDays >= 0 && diffDays < 7) {
                    chartData[6 - diffDays]++; // 6 é hoje, 0 é 7 dias atrás
                }
            });

            setStats({ total, recent, topTemplate, chartData });
        };

        calculateStats();
    }, [refreshTrigger, t]);

    const maxChartValue = Math.max(...stats.chartData, 1);

    return (
        <div className="w-full flex-col sm:flex-row flex gap-4 mt-6">
            {/* Total */}
            <div className="flex-1 bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex items-center gap-4">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                </div>
                <div>
                    <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">{t('totalRecords')}</h3>
                    <p className="text-2xl font-black text-slate-800 leading-none mt-1">{stats.total}</p>
                </div>
            </div>

            {/* Recentes & Chart */}
            <div className="flex-[1.5] bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col justify-center">
                <div className="flex justify-between items-end mb-2">
                    <div>
                        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">{t('recentVolume')}</h3>
                        <p className="text-2xl font-black text-emerald-600 leading-none mt-1">{stats.recent}</p>
                    </div>
                    {/* Mini css chart */}
                    <div className="flex items-end gap-1.5 h-10 w-32 border-b border-slate-100 pb-1">
                        {stats.chartData.map((val, i) => {
                            const heightPercentage = (val / maxChartValue) * 100;
                            return (
                                <div key={i} className="flex-1 bg-emerald-100 rounded-t-sm flex items-end justify-center group relative gap-1" style={{ height: "100%" }}>
                                    <div
                                        className="w-full bg-emerald-400 rounded-t-sm transition-all duration-500"
                                        style={{ height: `${Math.max(10, heightPercentage)}%` }}
                                    ></div>
                                    <div className="opacity-0 group-hover:opacity-100 absolute bottom-full mb-1 text-[10px] bg-slate-800 text-white px-1.5 py-0.5 rounded shadow pointer-events-none transition z-10">
                                        {val}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Template Mais Usado */}
            <div className="flex-1 bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex items-center gap-4">
                <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>
                </div>
                <div className="overflow-hidden">
                    <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">{t('topTemplate')}</h3>
                    <p className="text-lg font-black text-slate-800 leading-tight mt-1 truncate">{stats.topTemplate}</p>
                </div>
            </div>
        </div>
    );
}
