"use client";
import React, { useState } from "react";
import { Artwork } from "@/types";
import GridComponents from "@/components/grid/GridComponents";
import { useRouter } from "next/navigation";
import { updateArtwork } from "@/common/comon";
import { snackbar } from "@/components/Snackbar/Snackbar";
import styles from "../ArtAddDialog.module.css";

const ArtVisualAdd = ({ artworks, setOpenDialog, setIsLoading }:
    { artworks: Artwork[], setOpenDialog: React.Dispatch<React.SetStateAction<"add" | "mod" | null>>, setIsLoading: React.Dispatch<React.SetStateAction<boolean>>; }) => {

    const [targetID, setTargetID] = useState<string | null>(null);


    const router = useRouter();
    const { picker, pickerHint, pickerGrid, footer, primaryButton, secondaryButton } = styles;

    return (
        <div className={picker}>
            <div className={pickerHint}>2D 페이지에 시즌 대표로 보여줄 그림을 고르세요.</div>
            <div className={pickerGrid}>
                <GridComponents
                    columnList={[
                        { name: 'id', header: 'ID', type: 'string' },
                        { name: 'title', header: '제목', type: 'string' },
                        { name: 'size', header: '세로 x 가로(cm)', type: 'number' },
                        { name: 'overview', header: '설명', type: 'string' }
                    ]}
                    gridData={artworks.filter(({ visualYn }) => visualYn !== 'Y').map(e => ({ ...e, size: `${e.height} x ${e.width}` }))}
                    selectedArtworkId={targetID}
                    setSelectedArtworkId={setTargetID}
                    emptyText="모든 그림이 이미 2D 표시에 들어가 있어요."
                />
            </div>
            <div className={footer}>
                <button type="button" className={secondaryButton} onClick={() => setOpenDialog(null)}>취소</button>
                <button type="button" className={primaryButton} disabled={!targetID} onClick={async () => {
                    setIsLoading(true);
                    try {
                        const targetData = artworks.find((artwork) => artwork.id === targetID);
                        if (!targetData) {
                            snackbar.error('이미지를 찾을 수 없습니다.');
                            return;
                        }
                        await updateArtwork(artworks, { ...targetData, visualYn: 'Y' });
                        setTargetID(null);
                        setOpenDialog(null);
                        snackbar.success('2D 표시에 추가되었습니다.');
                        router.refresh(); // 페이지 새로고침
                    } catch (error) {
                        console.log(error);
                        snackbar.error('저장에 실패했습니다.');
                    } finally {
                        setIsLoading(false);
                    }

                }}>추가</button>
            </div>
        </div>
    );

};
export default ArtVisualAdd;
