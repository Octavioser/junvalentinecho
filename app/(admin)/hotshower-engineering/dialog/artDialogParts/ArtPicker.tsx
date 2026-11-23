"use client";
import React, { useState } from "react";
import { Artwork } from "@/types";
import GridComponents from "@/components/grid/GridComponents";
import { formatSizeNumbers } from "@/common/format";
import styles from "../ArtAddDialog.module.css";

const COLUMNS = [
    { name: 'id', header: 'ID', type: 'string' },
    { name: 'title', header: '제목', type: 'string' },
    { name: 'season', header: '지금 시즌', type: 'string' },
    { name: 'size', header: '세로 x 가로(cm)', type: 'number' },
];

// 고른 목록에서 id를 넣거나 뺌 (이미 골랐으면 풀고, 아니면 맨 뒤에 붙임). 하나를 풀면 뒤의 번호가 당겨짐
export const togglePick = (picked: string[], id: string) => picked.includes(id) ? picked.filter((item) => item !== id) : [...picked, id];

// 그림 목록에서 여러 개를 순서대로 골라 넣는 창의 몸통 (3D 전시장에 추가, 시즌에 그림 추가, 새 시즌의 그림).
// 줄을 누른 순서대로 번호가 붙고, onPick은 그 순서대로 늘어놓은 id들을 받음 (한 번 저장으로 여러 개를 넣음).
// children: 목록 위에 더 넣을 입력칸 (예: 새 시즌 이름). blocked: 지금 넣을 수 없는 이유 (있으면 버튼을 막고 보여 줌)
const ArtPicker = ({ hint, candidates, emptyText, confirmLabel, blocked, children, onPick, onCancel }: {
    hint: string;
    candidates: Artwork[];
    emptyText: string;
    confirmLabel: string;
    blocked?: string | null;
    children?: React.ReactNode;
    onPick: (ids: string[]) => void;
    onCancel: () => void;
}) => {
    const [picked, setPicked] = useState<string[]>([]);
    const ids = picked.filter((id) => candidates.some((artwork) => artwork.id === id)); // 목록에서 없어진 그림은 뺌
    const { picker, pickerHint, pickerGrid, footer, errorText, primaryButton, secondaryButton } = styles;

    return (
        <div className={picker}>
            <div className={pickerHint}>{hint}</div>
            {children}
            <div className={pickerGrid}>
                <GridComponents
                    columnList={COLUMNS}
                    gridData={candidates.map((artwork) => ({ ...artwork, season: artwork.season || '-', size: formatSizeNumbers(artwork.width, artwork.height) }))}
                    picked={ids}
                    onPick={(id) => setPicked(togglePick(ids, id))}
                    emptyText={emptyText}
                />
            </div>
            <div className={footer}>
                {blocked
                    ? <div className={errorText}>{blocked}</div>
                    : ids.length > 0 && <div className={styles.hint} style={{ marginRight: 'auto' }}>{ids.length}개 고름 · 다시 누르면 풀려요</div>}
                <button type="button" className={secondaryButton} onClick={onCancel}>취소</button>
                <button type="button" className={primaryButton} disabled={!ids.length || !!blocked} onClick={() => { if (ids.length) onPick(ids); }}>
                    {confirmLabel}{ids.length > 1 ? ` (${ids.length}개)` : ''}
                </button>
            </div>
        </div>
    );
};
export default ArtPicker;
