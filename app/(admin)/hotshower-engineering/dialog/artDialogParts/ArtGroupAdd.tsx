"use client";
import React, { useEffect, useState } from "react";
import { Artwork } from "@/types";
import GridComponents from "@/components/grid/GridComponents";
import { useRouter } from "next/navigation";
import { updateArtwork, updateAllArtwork } from "@/common/comon";
import { snackbar } from "@/components/Snackbar/Snackbar";
import styles from "../ArtAddDialog.module.css";

const ArtGroupAdd = ({ artworks, selectedArtworkId, setSelectedArtworkId, openDialog, setOpenDialog, setIsLoading }
    : {
        artworks: Artwork[],
        selectedArtworkId: string | null,
        setSelectedArtworkId: React.Dispatch<React.SetStateAction<string | null>>,
        openDialog: 'add' | 'mod',
        setOpenDialog: React.Dispatch<React.SetStateAction<"add" | "mod" | null>>;
        setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
    }) => {

    const [targetID, setTargetID] = useState<string | null>(null);

    const [groupWinSize, setGroupWinSize] = useState<number | null>(1000);
    const [error, setError] = useState<string | null>(null);

    // 기존 추가시 배율/크기 가져오기
    useEffect(() => {
        if (openDialog === 'mod' && selectedArtworkId) {
            setGroupWinSize(artworks.find(({ id }) => selectedArtworkId === id)?.groupWinSize ?? 1000);
        }
    }, [openDialog, selectedArtworkId, artworks]);

    const gridData = (() => {
        const data = artworks.map(e => ({ ...e, size: `${e.height} x ${e.width}` }));
        if (openDialog === 'mod' && selectedArtworkId) {
            const target = artworks.find(({ id }) => selectedArtworkId === id);
            if (!target) return data;
            return data.filter(({ galleryId }) => galleryId !== target.galleryId);
        }
        return data;
    })();

    const validSize = !!groupWinSize && groupWinSize > 0;

    const router = useRouter();
    const { picker, pickerHint, pickerGrid, footer, inlineField, input, errorText, primaryButton, secondaryButton } = styles;
    return (
        <div className={picker}>
            <div className={pickerHint}>
                {openDialog === 'add'
                    ? '새 그룹에 넣을 그림을 고르고 전시창 크기를 정하세요.'
                    : '이 그룹에 넣을 그림을 고르거나, 전시창 크기만 바꿀 수 있어요.'}
            </div>
            <div className={pickerGrid}>
                <GridComponents
                    columnList={[
                        { name: 'id', header: 'ID', type: 'string' },
                        { name: 'title', header: '제목', type: 'string' },
                        { name: 'size', header: '세로 x 가로(cm)', type: 'number' },
                        { name: 'overview', header: '설명', type: 'string' }
                    ]}
                    gridData={gridData}
                    selectedArtworkId={targetID}
                    setSelectedArtworkId={(id) => { setTargetID(id); setError(null); }}
                    emptyText="넣을 수 있는 그림이 없어요."
                />
            </div>
            <div className={footer}>
                <label className={inlineField}>
                    전시창 크기
                    <input
                        className={input}
                        type="number"
                        min="1"
                        name="groupWinSize"
                        value={groupWinSize ?? ''}
                        onChange={(e) => { setGroupWinSize(Number(e.target.value)); setError(null); }}
                    />
                    cm
                </label>
                {error && <div className={errorText}>{error}</div>}
                <button type="button" className={secondaryButton} onClick={() => setOpenDialog(null)}>취소</button>
                {openDialog === 'mod' &&
                    <button type="button" className={secondaryButton} onClick={async () => {
                        if (!validSize) {
                            setError('전시창 크기를 0보다 큰 숫자로 입력해주세요.');
                            return;
                        }
                        setIsLoading(true);
                        try {
                            const galleryId = artworks.find((artwork) => artwork.id === selectedArtworkId)?.galleryId;
                            if (galleryId === undefined || galleryId === null) {
                                snackbar.error('갤러리 ID를 찾을 수 없습니다.');
                                setIsLoading(false);
                                return;
                            }

                            await updateAllArtwork(artworks.map(e => {
                                if (e.galleryId === galleryId) {
                                    return { ...e, groupWinSize: groupWinSize ?? 1000 };
                                }
                                return e;
                            }));

                            setTargetID(null);
                            setOpenDialog(null);
                            setSelectedArtworkId(null);
                            snackbar.success('해당 그룹의 전시창 크기가 변경되었습니다.');
                            router.refresh(); // 페이지 새로고침
                        } catch (error) {
                            console.log(error);
                            snackbar.error('저장에 실패했습니다.');
                        } finally {
                            setIsLoading(false);
                        }

                    }}>크기만 저장</button>
                }
                <button type="button" className={primaryButton} onClick={async () => {
                    if (!targetID) {
                        setError('그룹에 넣을 그림을 목록에서 골라주세요.');
                        return;
                    }

                    if (!validSize) {
                        setError('전시창 크기를 0보다 큰 숫자로 입력해주세요.');
                        return;
                    }
                    setIsLoading(true);
                    try {
                        const targetData = artworks.find((artwork) => artwork.id === targetID);

                        if (!targetData) {
                            snackbar.error('대상을 찾을 수 없습니다.');
                            setIsLoading(false);
                            return;
                        }

                        const galleryId = openDialog === 'add' ?
                            // 그룹추가
                            artworks.reduce((acc, curr) => Math.max(acc, curr.galleryId ?? 0), 0) + 1
                            : // 기존그룹에 추가
                            artworks.find((artwork) => artwork.id === selectedArtworkId)?.galleryId;

                        if (galleryId === undefined || galleryId === null) {
                            snackbar.error('갤러리 ID를 설정할 수 없습니다.');
                            setIsLoading(false);
                            return;
                        }

                        await updateArtwork(artworks, { ...targetData, galleryId, groupWinSize: groupWinSize ?? 1000 });
                        setTargetID(null);
                        setOpenDialog(null);
                        setSelectedArtworkId(null);
                        snackbar.success(openDialog === 'mod' ? '해당 그룹에 추가되었습니다.' : '새로운 그룹이 만들어졌습니다.');
                        router.refresh(); // 페이지 새로고침
                    } catch (error) {
                        console.log(error);
                        snackbar.error('저장에 실패했습니다.');
                    } finally {
                        setIsLoading(false);
                    }
                }}>{openDialog === 'mod' ? '그룹에 추가' : '그룹 만들기'}</button>
            </div>
        </div>
    );

};
export default ArtGroupAdd;
