"use client";
import { useEffect, useState } from "react";
import styles from "./Snackbar.module.css";

// alert() 대신 쓰는 화면 아래 알림. 어디서든 snackbar.success('저장되었습니다.')처럼 부르고,
// 화면에는 <SnackbarHost />가 한 번만 있으면 됨
type Kind = 'success' | 'error';
type Item = { id: number; message: string; kind: Kind; leaving: boolean; };

const DURATION: Record<Kind, number> = { success: 2500, error: 4000 };
const LEAVE_TIME = 200;  // 사라지는 애니메이션 시간 (CSS와 같게)
const MAX_ITEMS = 3;

let items: Item[] = [];
let nextId = 1;
const listeners = new Set<(items: Item[]) => void>();
const emit = () => listeners.forEach(listener => listener(items));

const dismiss = (id: number) => {
    if (!items.some(item => item.id === id && !item.leaving)) return;
    items = items.map(item => item.id === id ? { ...item, leaving: true } : item);
    emit();
    setTimeout(() => {
        items = items.filter(item => item.id !== id);
        emit();
    }, LEAVE_TIME);
};

const show = (message: string, kind: Kind) => {
    const id = nextId++;
    items = [...items.slice(-(MAX_ITEMS - 1)), { id, message, kind, leaving: false }];
    emit();
    setTimeout(() => dismiss(id), DURATION[kind]);
};

export const snackbar = {
    success: (message: string) => show(message, 'success'),
    error: (message: string) => show(message, 'error'),
};

export function SnackbarHost() {
    const [list, setList] = useState<Item[]>(items);

    useEffect(() => {
        listeners.add(setList);
        return () => { listeners.delete(setList); };
    }, []);

    return (
        <div className={styles.host} role="status" aria-live="polite">
            {list.map(({ id, message, kind, leaving }) => (
                <div
                    key={id}
                    className={`${styles.snackbar} ${kind === 'error' ? styles.error : styles.success} ${leaving ? styles.leaving : ''}`}
                    onClick={() => dismiss(id)}
                >
                    <div className={styles.dot} />
                    <div className={styles.message}>{message}</div>
                </div>
            ))}
        </div>
    );
}
