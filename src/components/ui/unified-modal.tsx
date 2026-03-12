'use client';

import React, { useState } from 'react';

type ModalVariant = 'success' | 'danger' | 'info' | 'confirm';

type UnifiedModalProps = {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    message: string;
    variant?: ModalVariant;
    onConfirm?: () => void;
    confirmText?: string;
    cancelText?: string;
    dangerWord?: string; // Word user must type to confirm dangerous actions
    children?: React.ReactNode;
};

const variantStyles: Record<ModalVariant, { icon: string; iconBg: string; iconColor: string; btnClass: string }> = {
    success: {
        icon: 'M5 13l4 4L19 7',
        iconBg: 'bg-emerald-100',
        iconColor: 'text-emerald-600',
        btnClass: 'bg-emerald-600 hover:bg-emerald-700',
    },
    danger: {
        icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z',
        iconBg: 'bg-red-100',
        iconColor: 'text-red-600',
        btnClass: 'bg-red-600 hover:bg-red-700',
    },
    info: {
        icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
        iconBg: 'bg-blue-100',
        iconColor: 'text-blue-600',
        btnClass: 'bg-blue-600 hover:bg-blue-700',
    },
    confirm: {
        icon: 'M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
        iconBg: 'bg-amber-100',
        iconColor: 'text-amber-600',
        btnClass: 'bg-amber-600 hover:bg-amber-700',
    },
};

export default function UnifiedModal({
    isOpen,
    onClose,
    title,
    message,
    variant = 'info',
    onConfirm,
    confirmText = 'Confirmar',
    cancelText = 'Cancelar',
    dangerWord,
    children,
}: UnifiedModalProps) {
    const [dangerInput, setDangerInput] = useState('');

    if (!isOpen) return null;

    const style = variantStyles[variant];
    const isDangerLocked = variant === 'danger' && dangerWord && dangerInput !== dangerWord;
    const showCancelBtn = variant === 'confirm' || variant === 'danger' || !!onConfirm;

    const handleConfirm = () => {
        if (isDangerLocked) return;
        setDangerInput('');
        if (onConfirm) onConfirm();
        else onClose();
    };

    const handleClose = () => {
        setDangerInput('');
        onClose();
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200"
            onClick={handleClose}
        >
            <div
                className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200"
                onClick={e => e.stopPropagation()}
            >
                <div className="p-6">
                    <div className="flex items-center gap-4 mb-3">
                        <div className={`p-3 rounded-full ${style.iconBg}`}>
                            <svg xmlns="http://www.w3.org/2000/svg" className={`w-6 h-6 ${style.iconColor}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={style.icon} />
                            </svg>
                        </div>
                        <h3 className="text-lg font-bold text-slate-900">{title}</h3>
                    </div>

                    {children ? (
                        <div className="text-slate-600 text-sm mt-4 w-full">{children}</div>
                    ) : (
                        <p className="text-slate-600 text-sm">{message}</p>
                    )}

                    {variant === 'danger' && dangerWord && (
                        <div className="mt-4">
                            <p className="text-xs text-red-500 font-bold mb-2">
                                Digite <span className="bg-red-50 px-1.5 py-0.5 rounded font-mono">{dangerWord}</span> para confirmar:
                            </p>
                            <input
                                type="text"
                                value={dangerInput}
                                onChange={e => setDangerInput(e.target.value)}
                                className="w-full border border-red-300 rounded-lg p-2.5 text-sm text-slate-900 focus:ring-2 focus:ring-red-500 outline-none"
                                placeholder={dangerWord}
                            />
                        </div>
                    )}
                </div>

                <div className="bg-slate-50 px-6 py-4 flex justify-end gap-3 border-t border-slate-100">
                    {showCancelBtn && (
                        <button
                            onClick={handleClose}
                            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition"
                        >
                            {cancelText}
                        </button>
                    )}
                    <button
                        onClick={handleConfirm}
                        disabled={!!isDangerLocked}
                        className={`px-4 py-2 text-sm font-bold text-white rounded-lg transition ${style.btnClass} disabled:opacity-40 disabled:cursor-not-allowed`}
                    >
                        {onConfirm ? confirmText : 'OK'}
                    </button>
                </div>
            </div>
        </div>
    );
}

// Hook helper for quick inline usage
export function useUnifiedModal() {
    const [state, setState] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        variant: ModalVariant;
        onConfirm?: () => void;
        dangerWord?: string;
    }>({ isOpen: false, title: '', message: '', variant: 'info' });

    const showModal = (config: {
        title: string;
        message: string;
        variant?: ModalVariant;
        onConfirm?: () => void;
        dangerWord?: string;
    }) => {
        setState({ ...config, variant: config.variant || 'info', isOpen: true });
    };

    const hideModal = () => setState(prev => ({ ...prev, isOpen: false }));

    return { modalState: state, showModal, hideModal };
}
