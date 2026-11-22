"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from "next/navigation";
import MainImagePosterCard from "../../../components/MainImage/MainImagePosterCard";
import GridComponents from "../../../components/grid/GridComponents";
import ArtworkDisplayImage from './ArtworkDisplayImage';
import { Artwork } from "@/types";
import { updateAllArtwork } from '@/common/comon';
import { formatLength } from '@/common/format';
import { captionList, moveItem } from '@/common/order';
import styles from "../ArtworkPage.module.css";
import { snackbar } from "@/components/Snackbar/Snackbar";

// 이 화면에서 바꾸는 값: 그림 위치와 겹치는 순서
type Position = Pick<Artwork, 'top' | 'left' | 'zIndex'>;

const CAPTION_COLUMNS = [{ name: 'no', header: '순서' }, { name: 'title', header: '제목' }];
const LOCKED_NOTE = '그룹 순서를 저장하거나 되돌리면 배치를 바꿀 수 있어요';

const sameIds = (a: string[], b: string[]) => a.length === b.length && a.every((id) => b.includes(id));
const sameOrder = (a: string[], b: string[]) => a.length === b.length && a.every((id, index) => id === b[index]);

const ArtworkDisplayPanel = ({ title, artworks, selectedArtworkId, locked, setIsLoading, onDirtyChange }: {
    title: string, // 패널 제목 (저장 버튼과 같은 줄에 표시)
    artworks: Artwork[],
    selectedArtworkId: string | null,
    locked: boolean; // 그룹 순서를 바꾸고 아직 저장하지 않은 동안에는 배치를 바꿀 수 없음 (두 가지 변경이 섞이지 않게)
    setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
    onDirtyChange: (dirty: boolean) => void; // 배치를 바꾸고 아직 저장하지 않았는지 (다른 그룹으로 넘어갈 때·그룹 순서 바꾸기를 막을 때 씀)
}) => {

    const posterFrameRef = useRef<HTMLDivElement>(null);

    // 바꾼 것만 따로 기억함. 그룹 번호·전시창 크기·그룹에 속한 그림은 항상 최신 목록(artworks)에서 가져옴.
    // 그림을 통째로 복사해 두면, 그사이 다른 저장으로 바뀐 값을 여기서 저장할 때 옛 값으로 되돌림
    // (그룹 순서를 바꾸면 그룹 번호가 다시 매겨지는데, 옛 번호로 저장돼 다른 그룹과 합쳐졌었음)
    const [moved, setMoved] = useState<Record<string, Position>>({});   // 옮긴 위치 (그림 ID별)
    const [positionsDirty, setPositionsDirty] = useState(false);
    const [captionDraft, setCaptionDraft] = useState<string[] | null>(null); // 끌어서 바꾼 설명 순서 (그림 ID를 새 순서대로)
    const [captionSaved, setCaptionSaved] = useState<string[] | null>(null); // 방금 저장한 설명 순서 (새 목록이 오기 전까지 "저장 안 함"으로 보이지 않게)
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

    // 홈 화면 카드 옆 설명 순서. 끌어서 바꾼 게 없으면 지금 저장된 순서(정한 적 없으면 위에 걸린 그림부터)
    const currentCaptionIds = useMemo(() => captionList(items).map(({ id }) => id), [items]);
    const captionIds = captionDraft && sameIds(captionDraft, currentCaptionIds) ? captionDraft : currentCaptionIds;
    const captionDirty = !sameOrder(captionIds, currentCaptionIds) && !(captionSaved && sameOrder(captionIds, captionSaved));

    // 끌어 바꾼 순서를 더 들고 있을 필요가 없으면 버림: 지금 순서와 같아졌거나(저장한 목록이 새로 옴, 끌어서 원래대로 돌려놓음),
    // 그룹의 그림 구성이 달라졌을 때. 계속 들고 있으면 나중에 그림을 옮겨 자동 순서가 달라졌을 때 옛 순서가 "바꾼 것"으로 되살아남
    useEffect(() => {
        if (!captionDraft) return;
        if (!sameIds(captionDraft, currentCaptionIds) || sameOrder(captionDraft, currentCaptionIds)) { setCaptionDraft(null); setCaptionSaved(null); }
    }, [captionDraft, currentCaptionIds]);

    const dirty = positionsDirty || captionDirty;

    const discard = () => { setMoved({}); setPositionsDirty(false); setCaptionDraft(null); setCaptionSaved(null); };

    useEffect(() => { discard(); }, [selectedArtworkId]);

    useEffect(() => { onDirtyChange(dirty); }, [dirty]);
    // 이 화면이 닫히면(탭 이동·선택 해제) 저장하지 않은 변경도 같이 없어짐
    useEffect(() => () => onDirtyChange(false), []);

    // 전시창보다 큰 그림 (그대로 두면 홈 화면에서도 카드 밖으로 나감)
    const winSize = items[0]?.groupWinSize || 1000;
    const oversized = items
        .map(({ id, title, width }) => ({ title, need: Math.max(width, imageRatios[id] ? width / imageRatios[id] : 0) }))
        .filter(({ need }) => need > winSize);

    const save = async () => {
        setIsLoading(true);
        try {
            // 최신 목록에서 이 그룹 그림의 위치 값만 바꿔서 저장 (그룹 번호 같은 다른 값은 건드리지 않음).
            // 설명 순서는 끌어서 바꿨을 때만 적음: 정한 적 없는 그룹은 계속 위에 걸린 그림부터 나옴
            const order = new Map(captionIds.map((id, index) => [id, index + 1]));
            await updateAllArtwork(artworks.map((artwork) => {
                if (!groupId || artwork.galleryId !== groupId) return artwork;
                return { ...artwork, ...moved[artwork.id], ...(captionDirty ? { captionOrder: order.get(artwork.id) ?? null } : {}) };
            }));
            // 바꾼 값은 그대로 둠: 새 목록이 올 때까지 옛 모습으로 잠깐 돌아가 보이지 않게 (새 목록과 값이 같아짐)
            setPositionsDirty(false);
            if (captionDirty) setCaptionSaved(captionIds);
            snackbar.success('저장되었습니다.');
            router.refresh(); // 페이지 새로고침
        } catch {
            snackbar.error('저장에 실패했습니다.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={{ display: 'flex', flex: 1, flexDirection: 'column', minHeight: 0 }}>
            <div className={styles.headerPanel}>
                {title}
                <div className={styles.headerActions}>
                    {locked && <div className={styles.unsavedNote}>{LOCKED_NOTE}</div>}
                    {dirty && <div className={styles.unsavedNote}>저장하지 않은 배치 변경이 있어요</div>}
                    {dirty && <button className={styles.addButton} onClick={discard}>되돌리기</button>}
                    <button className={styles.addButton} disabled={!dirty} onClick={save}>배치 저장</button>
                </div>
            </div >
            {oversized.length > 0 && (
                <div className={styles.warning}>
                    {oversized.map(({ title }) => `'${title}'`).join(', ')} 그림이 전시창({winSize}cm)보다 커서 카드 밖으로 나가요.
                    전시창 크기를 {Math.ceil(Math.max(...oversized.map(({ need }) => need)))}cm 이상으로 키워주세요.
                </div>
            )}
            <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
                {/* 카드는 남은 영역 안에 들어가는 가장 큰 정사각형 (너비 80% 또는 높이에서 위아래 여백을 뺀 값 중 작은 쪽). 아래 여백에 눈금 막대가 들어감 */}
                <div style={{ display: 'flex', flex: 1, minWidth: 0, minHeight: 0, alignItems: 'center', justifyContent: 'center', containerType: 'size' }}>
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
                                        setPositionsDirty(true);
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
                {/* 홈 화면에서 이 카드 옆에 나오는 설명의 순서. 그림이 하나뿐이면 정할 게 없어서 숨김 */}
                {items.length > 1 && (
                    <div className={styles.captionOrder}>
                        <div className={styles.captionOrderTitle}>홈 화면 설명 순서</div>
                        <div className={styles.captionOrderHint}>줄을 끌어서 순서를 바꿔요</div>
                        <div style={{ flex: 1, minHeight: 0 }}>
                            <GridComponents
                                columnList={CAPTION_COLUMNS}
                                gridData={captionIds.map((id, index) => ({ id, no: index + 1, title: items.find((item) => item.id === id)?.title }))}
                                selectedArtworkId={null}
                                setSelectedArtworkId={() => { }}
                                onReorder={(from, to) => { if (!locked) setCaptionDraft(moveItem(captionIds, from, to)); }}
                                reorderLocked={locked ? LOCKED_NOTE : undefined}
                            />
                        </div>
                    </div>
                )}
            </div>
        </div >
    );
};
export default ArtworkDisplayPanel;
