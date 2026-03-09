export default function OfflinePage() {
    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-20 h-20 text-slate-300 mb-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h1 className="text-2xl font-black text-slate-800 mb-2">Sem Conexão à Internet</h1>
            <p className="text-slate-500 max-w-sm mx-auto mb-8 leading-relaxed">
                O Anamnese Pro parece estar offline. Volte quando recuperar sua conexão ou abra páginas previamente cacheadas.
            </p>
            <button
                onClick={() => window.location.reload()}
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-sm transition"
            >
                Tentar Novamente
            </button>
        </div>
    );
}
