'use client';

import React from 'react';

type ModalProps = {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    message: string;
    type?: 'success' | 'error' | 'confirm' | 'info';
    onConfirm?: () => void;
    confirmText?: string;
    cancelText?: string;
    children?: React.ReactNode;
};

export default function Modal({
    isOpen,
    onClose,
    title,
    message,
    type = 'info',
    onConfirm,
    confirmText = 'Confirmar',
    cancelText = 'Cancelar',
    children,
}: ModalProps) {
    if (!isOpen) return null;

    const bgColors = {
        success: 'bg-emerald-100 text-emerald-800',
        error: 'bg-red-100 text-red-800',
        confirm: 'bg-amber-100 text-amber-800',
        info: 'bg-blue-100 text-blue-800',
    };

    const iconColors = {
        success: 'text-emerald-600',
        error: 'text-red-600',
        confirm: 'text-amber-600',
        info: 'text-blue-600',
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-6">
                    <div className="flex items-center gap-4 mb-4">
                        <div className={`p-3 rounded-full ${bgColors[type]}`}>
                            <svg xmlns="http://www.w3.org/2000/svg" className={`w-6 h-6 ${iconColors[type]}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                {type === 'success' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />}
                                {type === 'error' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />}
                                {(type === 'confirm' || type === 'info') && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />}
                            </svg>
                        </div>
                        <h3 className="text-lg font-bold text-slate-900">{title}</h3>
                    </div>
                    {children ? (
                        <div className="text-slate-600 text-sm mt-4 w-full">
                            {children}
                        </div>
                    ) : (
                        <p className="text-slate-600 text-sm">{message}</p>
                    )}
                </div>

                <div className="bg-slate-50 px-6 py-4 flex justify-end gap-3 border-t border-slate-100">
                    {(type === 'confirm' || onConfirm) && (
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition"
                        >
                            {cancelText}
                        </button>
                    )}
                    <button
                        onClick={() => {
                            if (onConfirm) onConfirm();
                            else onClose();
                        }}
                        className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition ${type === 'error' ? 'bg-red-600 hover:bg-red-700' :
                            type === 'confirm' ? 'bg-amber-600 hover:bg-amber-700' :
                                'bg-emerald-600 hover:bg-emerald-700'
                            }`}
                    >
                        {type === 'confirm' && onConfirm ? confirmText : 'OK'}
                    </button>
                </div>
            </div>
        </div>
    );
}
