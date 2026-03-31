export default function Loading() {
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-4">
                <div className="relative w-16 h-16">
                    <div className="absolute inset-0 border-4 border-primary/10 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-primary rounded-full border-t-transparent animate-spin"></div>
                </div>
                <div className="flex flex-col items-center">
                    <span className="text-xs font-black uppercase tracking-[0.2em] text-primary animate-pulse">Carregando Plataforma...</span>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2">Iniciando ambiente clínico seguro</p>
                </div>
            </div>
        </div>
    );
}
