"use client";
import React, { useState } from "react";
import styles from "./GridComponents.module.css";

// onReorder를 주면 줄을 끌어서 순서를 바꿀 수 있음. (from 자리의 줄을 to 자리로)
// reorderLocked(이유)를 주면 잠깐 끌 수 없게 하고, 손잡이를 누르면 onReorderLockedAttempt로 알림
// picked(고른 줄의 id를 고른 순서대로)와 onPick을 주면 여러 줄을 고르는 표가 됨:
// 줄을 누르면 onPick(id)로 알리고(고르기·풀기는 부르는 쪽에서), 맨 앞 칸에 고른 순서 번호가 보임. 이때는 selectedArtworkId를 쓰지 않음
// mutedRow: 흐리게 보여 줄 줄 (예: 홈 화면에서 가린 그룹)
const GridComponents = ({ columnList, gridData, selectedArtworkId = null, setSelectedArtworkId, emptyText = '등록된 항목이 없어요.', onReorder, reorderLocked, onReorderLockedAttempt, picked, onPick, mutedRow }: { columnList: { header: string, name: string; type?: string; }[], gridData: Record<string, any>[], selectedArtworkId?: string | null, setSelectedArtworkId?: (id: string | null) => void; emptyText?: string; onReorder?: (from: number, to: number) => void; reorderLocked?: string; onReorderLockedAttempt?: () => void; picked?: string[]; onPick?: (id: string) => void; mutedRow?: (row: Record<string, any>) => boolean; }) => {

    const [dragIndex, setDragIndex] = useState<number | null>(null); // 끌고 있는 줄
    const [dropAt, setDropAt] = useState<number | null>(null);       // 놓으면 이 번호의 줄 앞에 들어감 (맨 끝은 줄 수)

    const last = gridData.length - 1;
    const extraColumns = (onReorder ? 1 : 0) + (picked ? 1 : 0);
    // 놓아도 자리가 그대로인 곳(자기 자신의 바로 위·아래)에는 표시선을 그리지 않음
    const dropLine = dragIndex !== null && dropAt !== null && dropAt !== dragIndex && dropAt !== dragIndex + 1 ? dropAt : null;

    const endDrag = () => { setDragIndex(null); setDropAt(null); };

    return (
        <div className={styles.container}>
            <table className={styles.table}>
                <thead>
                    <tr>
                        {onReorder && <th className={styles.th} />}
                        {picked && <th className={`${styles.th} ${styles.pickCell}`}>순서</th>}
                        {columnList.map(({ header }, index) =>
                            <th key={'cth' + (index + 1)} className={styles.th}>{header}</th>
                        )}
                    </tr>
                </thead>
                <tbody>
                    {gridData.length === 0 && (
                        <tr>
                            <td className={styles.empty} colSpan={columnList.length + extraColumns}>{emptyText}</td>
                        </tr>
                    )}
                    {gridData.map((data, index) => {
                        const pickNo = picked ? picked.indexOf(data.id) + 1 : 0; // 고른 순서 번호 (안 골랐으면 0)
                        const isSelected = picked ? pickNo > 0 : selectedArtworkId === data.id;
                        return (
                            <tr
                                key={`tbodyTr${index}`}
                                className={[
                                    styles.tr,
                                    picked ? styles.pickable : '',
                                    mutedRow?.(data) ? styles.muted : '',
                                    isSelected ? styles.selected : '',
                                    dragIndex === index ? styles.dragging : '',
                                    dropLine === index ? styles.dropBefore : '',
                                    dropLine === last + 1 && index === last ? styles.dropAfter : '',
                                ].join(' ')}
                                aria-selected={isSelected}
                                onClick={() => { if (picked) onPick?.(data.id); else setSelectedArtworkId?.(data.id); }}
                                draggable={!!onReorder && !reorderLocked}
                                onDragStart={(e) => {
                                    e.dataTransfer.effectAllowed = 'move';
                                    e.dataTransfer.setData('text/plain', String(index)); // Firefox는 데이터가 있어야 끌기가 시작됨
                                    setDragIndex(index);
                                }}
                                onDragOver={(e) => {
                                    if (dragIndex === null) return;
                                    e.preventDefault(); // 여기에 놓을 수 있음
                                    const { top, height } = e.currentTarget.getBoundingClientRect();
                                    setDropAt(e.clientY < top + height / 2 ? index : index + 1); // 줄의 위쪽 절반이면 그 줄 앞, 아래쪽이면 뒤
                                }}
                                onDrop={(e) => {
                                    e.preventDefault();
                                    if (onReorder && dropLine !== null && dragIndex !== null) onReorder(dragIndex, dropLine > dragIndex ? dropLine - 1 : dropLine);
                                    endDrag();
                                }}
                                onDragEnd={endDrag}
                            >
                                {onReorder && (reorderLocked
                                    // 잠긴 동안: 손잡이를 눌러도 줄이 선택되지 않게 하고(선택이 바뀌면 다른 확인창이 뜸) 왜 안 되는지만 알림
                                    ? <td className={`${styles.td} ${styles.handle} ${styles.handleLocked}`} title={reorderLocked} onClick={(e) => { e.stopPropagation(); onReorderLockedAttempt?.(); }}>⠿</td>
                                    : <td className={`${styles.td} ${styles.handle}`} title="끌어서 순서 바꾸기">⠿</td>
                                )}
                                {picked && (
                                    <td className={`${styles.td} ${styles.pickCell}`}>
                                        <div className={`${styles.pickMark} ${pickNo ? styles.pickMarkOn : ''}`}>{pickNo || ''}</div>
                                    </td>
                                )}
                                {columnList.map(({ name: colName }, index) =>
                                    <td key={'text' + colName + index} className={styles.td}>
                                        <>{data[colName]}</>
                                    </td>
                                )}
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};

export default GridComponents;
