"use client";
import React, { useState } from "react";
import styles from "./GridComponents.module.css";

// onReorder를 주면 줄을 끌어서 순서를 바꿀 수 있음. (from 자리의 줄을 to 자리로)
const GridComponents = ({ columnList, gridData, selectedArtworkId, setSelectedArtworkId, emptyText = '등록된 항목이 없어요.', onReorder }: { columnList: { header: string, name: string; type?: string; }[], gridData: Record<string, any>[], selectedArtworkId: string | null, setSelectedArtworkId: (id: string | null) => void; emptyText?: string; onReorder?: (from: number, to: number) => void; }) => {

    const [dragIndex, setDragIndex] = useState<number | null>(null); // 끌고 있는 줄
    const [dropAt, setDropAt] = useState<number | null>(null);       // 놓으면 이 번호의 줄 앞에 들어감 (맨 끝은 줄 수)

    const last = gridData.length - 1;
    // 놓아도 자리가 그대로인 곳(자기 자신의 바로 위·아래)에는 표시선을 그리지 않음
    const dropLine = dragIndex !== null && dropAt !== null && dropAt !== dragIndex && dropAt !== dragIndex + 1 ? dropAt : null;

    const endDrag = () => { setDragIndex(null); setDropAt(null); };

    return (
        <div className={styles.container}>
            <table className={styles.table}>
                <thead>
                    <tr>
                        {onReorder && <th className={styles.th} />}
                        {columnList.map(({ header }, index) =>
                            <th key={'cth' + (index + 1)} className={styles.th}>{header}</th>
                        )}
                    </tr>
                </thead>
                <tbody>
                    {gridData.length === 0 && (
                        <tr>
                            <td className={styles.empty} colSpan={columnList.length + (onReorder ? 1 : 0)}>{emptyText}</td>
                        </tr>
                    )}
                    {gridData.map((data, index) => {
                        const isSelected = selectedArtworkId === data.id;
                        return (
                            <tr
                                key={`tbodyTr${index}`}
                                className={[
                                    styles.tr,
                                    isSelected ? styles.selected : '',
                                    dragIndex === index ? styles.dragging : '',
                                    dropLine === index ? styles.dropBefore : '',
                                    dropLine === last + 1 && index === last ? styles.dropAfter : '',
                                ].join(' ')}
                                onClick={() => { setSelectedArtworkId(data.id); }}
                                draggable={!!onReorder}
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
                                {onReorder && <td className={`${styles.td} ${styles.handle}`} title="끌어서 순서 바꾸기">⠿</td>}
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
