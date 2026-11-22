"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from "next/navigation";
import MainImagePosterCard from "../../../components/MainImage/MainImagePosterCard";
import ArtworkDisplayImage from './ArtworkDisplayImage';
import { Artwork } from "@/types";
import { updateAllArtwork } from '@/common/comon';
import { formatLength } from '@/common/format';
import styles from "../ArtworkPage.module.css";
import { snackbar } from "@/components/Snackbar/Snackbar";

// 이 화면에서 바꾸는 값: 그림 위치와 겹치는 순서
type Position = Pick<Artwork, 'top' | 'left' | 'zIndex'>;

const ArtworkDisplayPanel = ({ title, artworks, selectedArtworkId, locked, setIsLoading, onDirtyChange }: {
    title: string, // 패널 제목 (저장 버튼과 같은 줄에 표시)
    artworks: Artwork[],
    selectedArtworkId: string | null,
    locked: boolean; // 그룹 순서를 바꾸고 아직 저장하지 않은 동안에는 그림을 옮길 수 없음 (두 가지 변경이 섞이지 않게)
    setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
    onDirtyChange: (dirty: boolean) => void; // 위치를 옮기고 아직 저장하지 않았는지 (다른 그룹으로 넘어갈 때·순서 바꾸기를 막을 때 씀)
}) => {

    const posterFrameRef = useRef<HTMLDivElement>(null);

    // 옮긴 위치만 따로 기억 (그림 ID별). 그룹 번호·전시창 크기·그룹에 속한 그림은 항상 최신 목록(artworks)에서 가져옴.
    // 그림을 통째로 복사해 두면, 그사이 다른 저장으로 바뀐 값을 위치 저장이 옛 값으로 되돌림
    // (그룹 순서를 바꾸면 그룹 번호가 다시 매겨지는데, 옛 번호로 저장돼 다른 그룹과 합쳐졌었음)
    const [moved, setMoved] = useState<Record<string, Position>>({});
    const [dirty, setDirty] = useState(false);
    const [imageRatios, setImageRatios] = useState<Record<string, number>>({}); // 그림별 가로/세로 비율

    const router = useRouter();

    // 선택한 그룹의 그림들 (최신 목록에 옮긴 위치만 덮어씀)
    const groupId = artworks.find(({ id }) => id === selectedArtworkId)?.galleryId;
    const items = useMemo(
        () => groupId
            ? artworks.filter(({ galleryId }) => galleryId === groupId).map((artwork) => moved[artwork.id] ? { ...artwork, ...moved[artwork.id] } : artwork)
            : [],
        [artworks, groupId, moved]
    );

    const discard = () => { setMoved({}); setDirty(false); };

    useEffect(() => { discard(); }, [selectedArtworkId]);

    useEffect(() => { onDirtyChange(dirty); }, [dirty]);
    // 이 화면이 닫히면(탭 이동·선택 해제) 저장하지 않은 변경도 같이 없어짐
    useEffect(() => () => onDirtyChange(false), []);

    // 전시창보다 큰 그림 (그대로 두면 홈 화면에서도 카드 밖으로 나감)
    const winSize = items[0]?.groupWinSize || 1000;
    const oversized = items
        .map(({ id, title, width }) => ({ title, need: Math.max(width, imageRatios[id] ? width / imageRatios[id] : 0) }))
        .filter(({ need }) => need > winSize);

    return (
        <div style={{ display: 'flex', flex: 1, flexDirection: 'column', minHeight: 0 }}>
            <div className={styles.headerPanel}>
                {title}
                <div className={styles.headerActions}>
                    {locked && <div className={styles.unsavedNote}>그룹 순서를 저장하거나 되돌리면 그림을 옮길 수 있어요</div>}
                    {dirty && <div className={styles.unsavedNote}>저장하지 않은 위치 변경이 있어요</div>}
                    {dirty && <button className={styles.addButton} onClick={discard}>되돌리기</button>}
                    <button className={styles.addButton}
                        disabled={!dirty}
                        onClick={async () => {
                            setIsLoading(true);
                            try {
                                // 최신 목록에서 이 그룹 그림의 위치 값만 바꿔서 저장 (그룹 번호 같은 다른 값은 건드리지 않음)
                                await updateAllArtwork(artworks.map((artwork) =>
                                    groupId && artwork.galleryId === groupId && moved[artwork.id] ? { ...artwork, ...moved[artwork.id] } : artwork
                                ));
                                // 옮긴 위치는 그대로 둠: 새 목록이 올 때까지 그림이 옛 자리로 잠깐 돌아가 보이지 않게 (새 목록과 값이 같아짐)
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
                        {items.map((item) =>
                            <ArtworkDisplayImage
                                key={item.id}
                                posterFrameRef={posterFrameRef}
                                locked={locked}
                                setTargetItem={({ id, top, left, zIndex }: Artwork) => {
                                    // 겹치는 순서는 누를 때 따로 바꾸므로(refreshZindex), 그 값이 있으면 그대로 둠
                                    setMoved((prev) => ({ ...prev, [id]: { top, left, zIndex: prev[id]?.zIndex ?? zIndex } }));
                                    setDirty(true);
                                }}
                                onRatio={(id, ratio) => setImageRatios((prev) => prev[id] === ratio ? prev : { ...prev, [id]: ratio })}
                                targetArtworks={item}
                                refreshZindex={(id: string) => {
                                    // 방금 누른 그림을 맨 위로 올림. 나머지는 지금 겹친 순서 그대로
                                    const stack = items
                                        .filter((item) => item.id !== id)
                                        .sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0))
                                        .concat(items.filter((item) => item.id === id));
                                    setMoved((prev) => {
                                        const next = { ...prev };
                                        stack.forEach(({ id, top, left }, zIndex) => { next[id] = { top: prev[id]?.top ?? top, left: prev[id]?.left ?? left, zIndex }; });
                                        return next;
                                    });
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
