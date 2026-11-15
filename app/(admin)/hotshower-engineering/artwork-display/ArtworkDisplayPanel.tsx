"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from "next/navigation";
import MainImagePosterCard from "../../../components/MainImage/MainImagePosterCard";
import ArtworkDisplayImage from './ArtworkDisplayImage';
import { Artwork } from "@/types";
import { updateAllArtwork } from '@/common/comon';
import { formatLength } from '@/common/format';
import styles from "../ArtworkPage.module.css";
import { snackbar } from "@/components/Snackbar/Snackbar";

const ArtworkDisplayPanel = ({ title, artworks, selectedArtworkId, setIsLoading, onDirtyChange }: {
    title: string, // 패널 제목 (저장 버튼과 같은 줄에 표시)
    artworks: Artwork[],
    selectedArtworkId: string | null,
    setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
    onDirtyChange: (dirty: boolean) => void; // 위치를 옮기고 아직 저장하지 않았는지 (다른 그룹으로 넘어갈 때 확인용)
}) => {

    const posterFrameRef = useRef<HTMLDivElement>(null);

    const [displayPanelItem, setDisplayPanelItem] = useState<Artwork[]>([]);
    const [dirty, setDirty] = useState(false);
    const [imageRatios, setImageRatios] = useState<Record<string, number>>({}); // 그림별 가로/세로 비율

    const router = useRouter();

    useEffect(() => {
        setDisplayPanelItem(artworks.filter(({ galleryId }) => galleryId === artworks.find(({ id }) => id === selectedArtworkId)?.galleryId));
        setDirty(false);
    }, [selectedArtworkId]);

    useEffect(() => { onDirtyChange(dirty); }, [dirty]);

    // 전시창보다 큰 그림 (그대로 두면 홈 화면에서도 카드 밖으로 나감)
    const winSize = displayPanelItem[0]?.groupWinSize || 1000;
    const oversized = displayPanelItem
        .map(({ id, title, width }) => ({ title, need: Math.max(width, imageRatios[id] ? width / imageRatios[id] : 0) }))
        .filter(({ need }) => need > winSize);

    return (
        <div style={{ display: 'flex', flex: 1, flexDirection: 'column', minHeight: 0 }}>
            <div className={styles.headerPanel}>
                {title}
                <div className={styles.headerActions}>
                    {dirty && <div className={styles.unsavedNote}>저장하지 않은 위치 변경이 있어요</div>}
                    <button className={styles.addButton}
                        disabled={!dirty}
                        onClick={async () => {
                            setIsLoading(true);
                            try {
                                await updateAllArtwork(artworks.map(e => {
                                    const target = displayPanelItem.find((i) => i.id === e.id);
                                    if (target) return target;
                                    return e;
                                }));
                                setDirty(false);
                                snackbar.success('저장되었습니다.');
                                router.refresh(); // 페이지 새로고침

                            } catch {
                                snackbar.error('저장에 실패했습니다.');
                            } finally {
                                setIsLoading(false);
                            }
                        }}
                    >
                        이미지 위치 저장
                    </button>
                </div>
            </div >
            {oversized.length > 0 && (
                <div className={styles.warning}>
                    {oversized.map(({ title }) => `'${title}'`).join(', ')} 그림이 전시창({winSize}cm)보다 커서 카드 밖으로 나가요.
                    전시창 크기를 {Math.ceil(Math.max(...oversized.map(({ need }) => need)))}cm 이상으로 키워주세요.
                </div>
            )}
            {/* 카드는 남은 영역 안에 들어가는 가장 큰 정사각형 (너비 80% 또는 높이에서 위아래 여백을 뺀 값 중 작은 쪽). 아래 여백에 눈금 막대가 들어감 */}
            <div style={{ display: 'flex', flex: 1, minHeight: 0, alignItems: 'center', justifyContent: 'center', containerType: 'size' }}>
                <div ref={posterFrameRef} style={{ width: 'min(80cqw, calc(100cqh - 80px))', aspectRatio: 1 / 1, position: 'relative' }}>
                    {/* 카드 한 변의 실제 길이 = 전시창 크기 (정사각형이라 가로·세로가 같음) */}
                    <div className={`${styles.cardDimension} ${styles.cardWidth}`}>가로 {formatLength(winSize)}cm</div>
                    <div className={`${styles.cardDimension} ${styles.cardHeight}`}>세로 {formatLength(winSize)}cm</div>
                    <MainImagePosterCard isAdmin={true} winSize={winSize} alwaysShowRatio={true}>
                        {(displayPanelItem || []).map((item, index) =>
                            <ArtworkDisplayImage
                                key={item.id}
                                posterFrameRef={posterFrameRef}
                                setTargetItem={(item: Artwork) => {
                                    setDisplayPanelItem((prev) => prev.map((i) => (i.id === item.id ? item : i)));
                                    setDirty(true);
                                }}
                                onRatio={(id, ratio) => setImageRatios((prev) => prev[id] === ratio ? prev : { ...prev, [id]: ratio })}
                                targetArtworks={item}
                                refreshZindex={(id: string) => {
                                    // 제일 최근에 수정한 이미지을 제일 위로 올리기
                                    const targetItem = displayPanelItem.find((i) => i.id === id);
                                    const zIndexSortList = displayPanelItem.sort((a, b) => (b.zIndex ?? 0) - (a.zIndex ?? 0));
                                    if (!targetItem) return;
                                    setDisplayPanelItem(
                                        zIndexSortList
                                            .filter((i) => i.id !== id)
                                            .concat(targetItem)
                                            .map((item, zIndex) => ({ ...item, zIndex }))
                                    );
                                }}
                            />
                        )}
                    </MainImagePosterCard>
                </div>
            </div>
        </div >
    );
};
export default ArtworkDisplayPanel;
