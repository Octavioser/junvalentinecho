"use client";
import React from "react";
import styles from "./GridComponents.module.css";

const GridComponents = ({ columnList, gridData, selectedArtworkId, setSelectedArtworkId, emptyText = '등록된 항목이 없어요.' }: { columnList: { header: string, name: string; type?: string; }[], gridData: Record<string, any>[], selectedArtworkId: string | null, setSelectedArtworkId: (id: string | null) => void; emptyText?: string; }) => {

    return (
        <div className={styles.container}>
            <table className={styles.table}>
                <thead>
                    <tr>
                        {columnList.map(({ header }, index) =>
                            <th key={'cth' + (index + 1)} className={styles.th}>{header}</th>
                        )}
                    </tr>
                </thead>
                <tbody>
                    {gridData.length === 0 && (
                        <tr>
                            <td className={styles.empty} colSpan={columnList.length}>{emptyText}</td>
                        </tr>
                    )}
                    {gridData.map((data, index) => {
                        const isSelected = selectedArtworkId === data.id;
                        return (
                            <tr
                                key={`tbodyTr${index}`}
                                className={`${styles.tr} ${isSelected ? styles.selected : ''}`}
                                onClick={() => { setSelectedArtworkId(data.id); }}
                            >
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
