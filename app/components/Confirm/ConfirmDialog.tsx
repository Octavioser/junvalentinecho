"use client";
import { useEffect, useState } from "react";
import styles from "./ConfirmDialog.module.css";

// confirm() 대신 쓰는 확인 창. `if (!(await confirmDialog('삭제할까요?'))) return;` 처럼 쓰고,
// 화면에는 <ConfirmHost />가 한 번만 있으면 됨
type Request = { message: string; confirmLabel: string; danger: boolean; resolve: (ok: boolean) => void; };

let current: Request | null = null;
const listeners = new Set<(request: Request | null) => void>();
const emit = () => listeners.forEach(listener => listener(current));

export function confirmDialog(message: string, { confirmLabel = '확인', danger = false }: { confirmLabel?: string; danger?: boolean; } = {}) {
    return new Promise<boolean>(resolve => {
        current?.resolve(false);
        current = { message, confirmLabel, danger, resolve };
        emit();
    });
}

const close = (ok: boolean) => {
    current?.resolve(ok);
    current = null;
    emit();
};

export function ConfirmHost() {
    const [request, setRequest] = useState<Request | null>(current);

    useEffect(() => {
        listeners.add(setRequest);
        return () => { listeners.delete(setRequest); };
    }, []);

    useEffect(() => {
        if (!request) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') { e.stopPropagation(); close(false); }
        };
        window.addEventListener('keydown', onKey, true);
        return () => window.removeEventListener('keydown', onKey, true);
    }, [request]);

    if (!request) return null;

    return (
        <div className={styles.overlay} onClick={() => close(false)}>
            <div className={styles.dialog} role="alertdialog" aria-modal="true" onClick={e => e.stopPropagation()}>
                <div className={styles.message}>{request.message}</div>
                <div className={styles.actions}>
                    <button type="button" className={styles.cancel} onClick={() => close(false)}>취소</button>
                    <button type="button" className={`${styles.confirm} ${request.danger ? styles.danger : ''}`} onClick={() => close(true)} autoFocus>
                        {request.confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}
