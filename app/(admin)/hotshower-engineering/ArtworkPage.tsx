"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import ArtworkDisplayPanel from './artwork-display/ArtworkDisplayPanel';
import ArtworkInfoForm from './artwork-info/ArtworkInfoForm';
import { Artwork, MusicBlob } from "@/types";
import ArtAddDialog from "./dialog/ArtAddDialog";
import styles from "./ArtworkPage.module.css";
import MainImagePosterCard from "@/components/MainImage/MainImagePosterCard";
import { useRouter } from "next/navigation";
import { delArtwork, delImage, updateAllArtwork, delMusic, saveMusicOrder } from "@/common/comon";
import ShowLoading from "./loading/ShowLoading";
import FramedImage from "@/components/MainImage/FramedImage";
import { snackbar, SnackbarHost } from "@/components/Snackbar/Snackbar";
import { confirmDialog, ConfirmHost } from "@/components/Confirm/ConfirmDialog";
import { applyGroupOrder, applyWallOrder, groupIds, hiddenGroupIds, moveItem, setGroupHidden, wallList } from "@/common/order";
import { applySeasonOrder, deleteSeason, leaveSeason, seasonCover, seasonNames } from "@/common/season";
import SeasonPanel from "./season-panel/SeasonPanel";

const TABS = [
    { header: '이미지 전체', value: '1' },
    { header: '메인 전시장', value: '2' },
    { header: '3D 전시장', value: '5' }, // 3D 벽에 걸 그림과 순서 (홈 화면과 별개)
    { header: '2D 시즌', value: '3' },   // 시즌을 만들고 그림을 넣음. 이 탭에서는 고른 줄의 값(selectedArtworkId)이 시즌 이름
    { header: '음악', value: '4' }
];

// 전시창 배치(그림 위치·설명 순서) 변경과 그룹 순서 변경은 한 번에 한 가지만: 하나를 저장하거나 되돌려야 다른 하나를 할 수 있음
const SAVE_POSITIONS_FIRST = '저장하지 않은 전시창 배치 변경이 있어요. 저장하거나 되돌린 뒤 그룹 순서를 바꿔 주세요.';
// 전시창 배치를 바꾼 동안 왼쪽(이미지 관리) 제목 줄에 띄우는 안내. 오른쪽의 "그룹 순서를 저장하거나 되돌리면 배치를 바꿀 수 있어요"와 짝
const PLACEMENT_LOCK_NOTE = '전시창 배치를 저장하거나 되돌리면 그룹 순서를 바꿀 수 있어요';

const PANEL_TITLE: Record<string, string> = { '1': '이미지 미리보기', '2': '전시창 배치', '3': '시즌 그림', '4': '음악 듣기', '5': '이미지 미리보기' };

const ArtworkPage = ({ artworks, musicList }: { artworks: Artwork[]; musicList: MusicBlob[]; }) => {

    const [selectedArtworkId, setSelectedArtworkId] = useState<string | null>(null);
    const [tab, setTab] = useState<string>('1');
    const [openDialog, setOpenDialog] = useState<"add" | "mod" | null>(null);

    // 표에서 끌어 바꾼 순서 (아직 저장 전). 메인 전시장은 그룹 번호를, 2D 시즌은 시즌 이름을, 3D 전시장은 작품 ID를, 음악은 음악 ID를 새 순서대로 늘어놓은 것
    const [groupOrder, setGroupOrder] = useState<number[] | null>(null);
    const [seasonOrder, setSeasonOrder] = useState<string[] | null>(null);
    const [wallOrder, setWallOrder] = useState<string[] | null>(null);
    const [musicOrder, setMusicOrder] = useState<string[] | null>(null);
    const unsavedOrder = useRef(false);
    unsavedOrder.current = !!(groupOrder || seasonOrder || wallOrder || musicOrder);

    const [isLoading, setIsLoading] = useState<boolean>(false);

    const [preview, setPreview] = useState<{ src: string; ratio: number } | null>(null); // 미리보기 그림의 가로/세로 비율 (어느 그림 것인지 같이 기억)

    // 오른쪽 패널에서 바꾸고 아직 저장하지 않은 상태: 메인 전시장 탭의 전시창 배치(그림 위치·설명 순서), 2D 시즌 탭의 시즌 안 그림 순서
    const [positionsDirty, setPositionsDirty] = useState(false);
    const unsavedPositions = useRef(false);
    unsavedPositions.current = positionsDirty;

    const router = useRouter();

    // 위치·순서를 저장하지 않고 새로고침·창 닫기를 하면 브라우저가 한 번 물어봄
    useEffect(() => {
        const warn = (e: BeforeUnloadEvent) => {
            if (!unsavedPositions.current && !unsavedOrder.current) return;
            e.preventDefault();
            e.returnValue = '';
        };
        window.addEventListener('beforeunload', warn);
        return () => window.removeEventListener('beforeunload', warn);
    }, []);

    // 저장하지 않은 위치 변경이 있으면 버리고 넘어갈지 먼저 물어봄
    const leaveUnsavedPositions = async () => {
        if (!unsavedPositions.current) return true;
        const ok = await confirmDialog(`저장하지 않은 ${tab === '3' ? '시즌 그림 순서' : '전시창 배치'} 변경이 있어요.\n저장하지 않고 넘어갈까요?`, { confirmLabel: '저장 안 하고 넘어가기' });
        if (ok) setPositionsDirty(false);
        return ok;
    };

    const selectArtwork = async (id: string | null) => {
        if (id === selectedArtworkId || !(await leaveUnsavedPositions())) return;
        setSelectedArtworkId(id);
    };

    // 순서를 바꾼 것까지 반영한 목록. 표에 이대로 보여주고, 저장할 때도 이대로 저장함
    const orderedArtworks = useMemo(() => {
        let next = groupOrder ? applyGroupOrder(artworks, groupOrder) : artworks;
        if (seasonOrder) next = applySeasonOrder(next, seasonOrder);
        if (wallOrder) next = applyWallOrder(next, wallOrder);
        return next;
    }, [artworks, groupOrder, seasonOrder, wallOrder]);

    // 음악도 마찬가지 (바꾼 순서대로 세운 목록)
    const orderedMusic = useMemo(
        () => musicOrder ? musicOrder.flatMap((id) => musicList.find((music) => music.id === id) ?? []) : musicList,
        [musicList, musicOrder]
    );

    const sameItems = <T,>(a: T[], b: T[]) => a.length === b.length && a.every((item) => b.includes(item));

    // 다른 저장으로 목록이 바뀌었을 때: 그룹·시즌·3D 구성이 그대로면 바꾸던 순서를 유지하고, 달라졌으면 버림
    useEffect(() => {
        setGroupOrder((prev) => prev && sameItems(prev, groupIds(artworks)) ? prev : null);
        setSeasonOrder((prev) => prev && sameItems(prev, seasonNames(artworks)) ? prev : null);
        setWallOrder((prev) => prev && sameItems(prev, wallList(artworks).map(({ id }) => id)) ? prev : null);
    }, [artworks]);

    // 음악 목록이 새로 왔을 때: 곡 구성이 달라졌거나 바꾸던 순서와 같아졌으면(방금 저장한 순서가 반영됨) 바꾸던 순서를 버림
    useEffect(() => {
        const ids = musicList.map(({ id }) => id);
        setMusicOrder((prev) => prev && sameItems(prev, ids) && !prev.every((id, index) => id === ids[index]) ? prev : null);
    }, [musicList]);

    // 표에서 from 자리의 줄을 to 자리로 옮김. 원래 순서로 돌아오면 바뀐 게 없는 것으로 봄
    const reorder = <T,>(saved: T[], draft: T[] | null, from: number, to: number) => {
        const next = moveItem(draft ?? saved, from, to);
        return next.every((item, index) => item === saved[index]) ? null : next;
    };
    const reorderGroups = (from: number, to: number) => {
        if (positionsDirty) return; // 그림 위치를 바꾸는 중에는 순서를 바꾸지 않음
        setGroupOrder(reorder(groupIds(artworks), groupOrder, from, to));
    };
    const reorderWall = (from: number, to: number) => setWallOrder(reorder(wallList(artworks).map(({ id }) => id), wallOrder, from, to));
    const reorderSeasons = (from: number, to: number) => {
        // 2D 대표 그림이 없는 시즌은 순서를 적어 둘 곳이 없어서 항상 뒤에 남음. 끌어 옮겨도 뒤로 돌려놓고, 그 결과가 그대로면 바뀐 게 없는 것으로 봄
        const saved = seasonNames(artworks);
        const moved = moveItem(seasonOrder ?? saved, from, to);
        const next = [...moved.filter((season) => seasonCover(artworks, season)), ...moved.filter((season) => !seasonCover(artworks, season))];
        setSeasonOrder(next.every((season, index) => season === saved[index]) ? null : next);
    };
    const reorderMusic = (from: number, to: number) => setMusicOrder(reorder(musicList.map(({ id }) => id), musicOrder, from, to));

    const resetOrder = () => { setGroupOrder(null); setSeasonOrder(null); setWallOrder(null); setMusicOrder(null); };

    const saveOrder = async () => {
        setIsLoading(true);
        try {
            // 순서는 한 번에 한 탭 것만 바꿀 수 있음 (탭을 옮길 때 저장하지 않은 순서를 먼저 정리함). 음악 순서는 그림 목록과 따로 저장
            if (musicOrder) await saveMusicOrder(orderedMusic.map(({ pathname }) => pathname));
            else await updateAllArtwork(orderedArtworks);
            resetOrder();
            snackbar.success('순서가 저장되었습니다.');
            router.refresh(); // 페이지 새로고침
        } catch {
            snackbar.error('저장에 실패했습니다.');
        } finally {
            setIsLoading(false);
        }
    };

    // 저장하지 않은 순서 변경이 있으면 버리고 넘어갈지 먼저 물어봄
    const leaveUnsavedOrder = async () => {
        if (!unsavedOrder.current) return true;
        const ok = await confirmDialog('저장하지 않은 순서 변경이 있어요.\n저장하지 않고 넘어갈까요?', { confirmLabel: '저장 안 하고 넘어가기' });
        if (ok) resetOrder();
        return ok;
    };

    // 순서를 바꾸는 중에는 다른 버튼 대신 저장·되돌리기만 보여줌 (순서와 다른 변경이 섞이지 않게)
    const orderBar = (
        <>
            <div className={styles.unsavedNote} style={{ marginRight: 'auto' }}>저장하지 않은 순서 변경이 있어요</div>
            <button className={styles.addButton} onClick={resetOrder}>되돌리기</button>
            <button className={styles.addButton} onClick={saveOrder}>순서 저장</button>
        </>
    );

    const selectedArtwork = artworks.find((artwork) => artwork.id === selectedArtworkId);
    // 비율은 그림을 다 받아야 알 수 있음. 그 전에는 이전 그림 비율로 크기가 잡혀 크게 보였다가 줄어드므로 비율을 알 때까지 숨김
    const previewRatio = preview && preview.src === selectedArtwork?.poster_path ? preview.ratio : null;
    // 미리보기 그림이 화면에 그려지는 너비: 화면 폭의 20%를 넘지 않고, 높이는 화면 높이의 64%를 넘지 않음 (아래 미리보기 칸의 크기에서 나옴).
    // 이 너비에 맞는 사본을 받음. 비율은 그림을 받기 전에는 입력해 둔 실제 크기(cm)로 어림하고(10% 여유), 받은 뒤에는 그림의 실제 비율을 씀
    const previewShape = previewRatio ?? (selectedArtwork && selectedArtwork.width > 0 && selectedArtwork.height > 0 ? selectedArtwork.width / selectedArtwork.height * 1.1 : null);
    const previewSizes = previewShape ? `min(20vw, ${(64 * previewShape).toFixed(1)}vh)` : '20vw';
    const selectedMusic = musicList.find((music) => music.id === selectedArtworkId);
    // 2D 시즌 탭에서 고른 시즌 (이 탭에서는 고른 줄의 값이 시즌 이름)
    const selectedSeason = tab === '3' && selectedArtworkId && seasonNames(artworks).includes(selectedArtworkId) ? selectedArtworkId : null;

    // 메인 전시장 탭에서 고른 그룹이 홈 화면에서 가려져 있는지
    const selectedGroupHidden = tab === '2' && !!selectedArtwork?.galleryId && hiddenGroupIds(artworks).has(selectedArtwork.galleryId);

    // 그림 목록 전체를 고쳐서 저장 (메인 전시장·3D 전시장·2D 시즌 탭의 버튼들이 씀). keepSelection: 저장한 뒤에도 고른 줄을 그대로 둠
    const saveArtworks = async (next: Artwork[], message: string, keepSelection = false) => {
        setIsLoading(true);
        try {
            await updateAllArtwork(next);
            if (!keepSelection) setSelectedArtworkId(null);
            snackbar.success(message);
            router.refresh(); // 페이지 새로고침
        } catch {
            snackbar.error('저장에 실패했습니다.');
        } finally {
            setIsLoading(false);
        }
    };

    const {
        pageWrapper,
        leftPanel,
        topBar,
        addButton,
        tabBar,
        tabButton,
        active,
        rightPanel,
        imagePreview,
        headerPanel,
        emptyHint
    } = styles;
    return (
        <>
            <div className={pageWrapper}>
                <div className={leftPanel}>
                    <div className={headerPanel}>
                        이미지 관리
                        {tab === '2' && positionsDirty && <div className={styles.headerActions}><div className={styles.unsavedNote}>{PLACEMENT_LOCK_NOTE}</div></div>}
                    </div>
                    <div className={tabBar}>
                        {TABS.map(({ header, value }, index) => (
                            <div
                                key={`artworkBtn${index}`}
                                className={`${tabButton} ${tab === value ? active : ''}`}
                                onClick={async () => {
                                    if (value === tab || !(await leaveUnsavedPositions()) || !(await leaveUnsavedOrder())) return;
                                    setTab(value);
                                    setSelectedArtworkId(null);
                                }}
                            >
                                {header}
                            </div>
                        ))}

                    </div>
                    <div className={topBar}>

                        {tab === '1' &&
                            <>
                                <button className={addButton} onClick={() => { setOpenDialog('add'); }}>추가</button>
                                <button className={addButton} disabled={!selectedArtworkId} onClick={() => { setOpenDialog('mod'); }}>수정</button>
                                <button className={addButton} disabled={!selectedArtworkId}
                                    onClick={async () => {
                                        if (!selectedArtwork) return;
                                        const ok = await confirmDialog(`'${selectedArtwork.title}' 그림을 삭제할까요?\n이미지 파일도 함께 지워지고 되돌릴 수 없어요.`, { confirmLabel: '삭제', danger: true });
                                        if (!ok) return;
                                        setIsLoading(true);
                                        try {
                                            await delImage(selectedArtwork.poster_path);
                                            // 시즌 대표 그림을 지우는 경우에 그 시즌의 다음 그림이 대표를 이어받게, 먼저 시즌에서 뺀 목록으로 지움
                                            await delArtwork(leaveSeason(artworks, selectedArtwork.id), selectedArtwork.id);
                                            setSelectedArtworkId(null);
                                            snackbar.success('삭제되었습니다.');
                                            router.refresh(); // 페이지 새로고침
                                        } catch {
                                            snackbar.error('삭제에 실패했습니다.');
                                        } finally {
                                            setIsLoading(false);
                                        }

                                    }}>
                                    삭제
                                </button>
                            </>
                        }
                        {tab === '2' &&
                            <>
                                {groupOrder ? orderBar
                                    :
                                    <>
                                        <button className={addButton} onClick={() => { setOpenDialog('add'); }}>새 그룹 만들기</button>
                                        <button className={addButton} disabled={!selectedArtworkId} onClick={() => { setOpenDialog('mod'); }}>그룹에 추가 · 크기 변경</button>
                                        <button className={addButton}
                                            disabled={!selectedArtworkId}
                                            onClick={async () => {
                                                const ok = await confirmDialog('선택한 그룹을 메인 전시장에서 뺄까요?\n그림 자체는 지워지지 않아요.', { confirmLabel: '그룹 삭제', danger: true });
                                                if (!ok) return;
                                                setIsLoading(true);
                                                try {
                                                    const targetgalleryId = selectedArtwork?.galleryId;
                                                    await updateAllArtwork(artworks.map((artwork) => {
                                                        if (artwork.galleryId === targetgalleryId) {
                                                            // 설명 순서·가리기 값도 지움 (나중에 다른 그룹에 넣었을 때 예전 값이 남아 있지 않게)
                                                            return { ...artwork, galleryId: null, captionOrder: null, galleryHidden: null };
                                                        }
                                                        return artwork;
                                                    }));
                                                    setPositionsDirty(false);
                                                    setSelectedArtworkId(null);
                                                    snackbar.success('그룹이 삭제되었습니다.');
                                                    router.refresh(); // 페이지 새로고침
                                                } catch {
                                                    snackbar.error('저장에 실패했습니다.');
                                                } finally {
                                                    setIsLoading(false);
                                                }

                                            }}>
                                            그룹 삭제
                                        </button>
                                        {/* 지우지 않고 홈 화면에서만 잠깐 숨김. 그림·배치·순서는 그대로라 "다시 보이기"로 바로 되돌림 */}
                                        <button className={addButton}
                                            disabled={!selectedArtwork?.galleryId}
                                            onClick={() => {
                                                if (!selectedArtwork?.galleryId) return;
                                                saveArtworks(
                                                    setGroupHidden(artworks, selectedArtwork.galleryId, !selectedGroupHidden),
                                                    selectedGroupHidden ? '홈 화면에 다시 보이게 했습니다.' : '홈 화면에서 가렸습니다.',
                                                    true);
                                            }}>
                                            {selectedGroupHidden ? '다시 보이기' : '가리기'}
                                        </button>
                                    </>
                                }
                            </>
                        }
                        {tab === '5' && (wallOrder ? orderBar :
                            <>
                                <button className={addButton} onClick={() => { setOpenDialog('add'); }}>추가</button>
                                <button className={addButton}
                                    disabled={!selectedArtwork}
                                    onClick={async () => {
                                        if (!selectedArtwork) return;
                                        const ok = await confirmDialog(`'${selectedArtwork.title}'을(를) 3D 전시장에서 뺄까요?\n그림 자체는 지워지지 않아요.`, { confirmLabel: '빼기', danger: true });
                                        if (!ok) return;
                                        // 순서 값을 지움: 값이 있는 그림만 3D에 걸림 (나중에 다시 넣으면 맨 뒤에 붙음)
                                        await saveArtworks(artworks.map((artwork) => artwork.id === selectedArtwork.id ? { ...artwork, wallOrder: null } : artwork), '3D 전시장에서 뺐습니다.');
                                    }}
                                >빼기
                                </button>
                            </>
                        )}
                        {tab === '3' && (seasonOrder ? orderBar :
                            <>
                                {/* 저장하면 새 시즌·바꾼 이름이 선택되면서 오른쪽에서 바꾸던 시즌 그림 순서가 없어지므로, 창을 열기 전에 먼저 물어봄 */}
                                <button className={addButton} onClick={async () => { if (await leaveUnsavedPositions()) setOpenDialog('add'); }}>새 시즌 만들기</button>
                                <button className={addButton} disabled={!selectedSeason} onClick={async () => { if (await leaveUnsavedPositions()) setOpenDialog('mod'); }}>이름 바꾸기</button>
                                <button className={addButton}
                                    disabled={!selectedSeason}
                                    onClick={async () => {
                                        if (!selectedSeason || !(await leaveUnsavedPositions())) return;
                                        const ok = await confirmDialog(`'${selectedSeason}' 시즌을 없앨까요?\n2D 화면에서 사라지고, 들어 있던 그림은 지워지지 않고 시즌에서만 빠져요.`, { confirmLabel: '시즌 삭제', danger: true });
                                        if (!ok) return;
                                        await saveArtworks(deleteSeason(artworks, selectedSeason), '시즌이 삭제되었습니다.');
                                    }}
                                >시즌 삭제
                                </button>
                            </>
                        )}
                        {tab === '4' && (musicOrder ? orderBar :
                            <>
                                <button className={addButton} onClick={() => { setOpenDialog('add'); }}>추가</button>
                                <button className={addButton}
                                    disabled={!selectedArtworkId}
                                    onClick={async () => {
                                        if (!selectedMusic) {
                                            snackbar.error('음악을 찾을 수 없습니다.');
                                            return;
                                        }
                                        const ok = await confirmDialog(`'${selectedMusic.title}' 음악을 삭제할까요?\n되돌릴 수 없어요.`, { confirmLabel: '삭제', danger: true });
                                        if (!ok) return;
                                        setIsLoading(true);
                                        try {
                                            await delMusic(selectedMusic.pathname);
                                            setSelectedArtworkId(null);
                                            snackbar.success('선택한 음악이 삭제되었습니다.');
                                            router.refresh(); // 페이지 새로고침
                                        } catch (error) {
                                            console.log(error);
                                            snackbar.error('삭제에 실패했습니다.');
                                        } finally {
                                            setIsLoading(false);
                                        }
                                    }}
                                >삭제
                                </button>

                            </>
                        )}
                    </div>

                    <ArtworkInfoForm
                        tab={tab}
                        artworks={orderedArtworks}
                        musicList={orderedMusic}
                        selectedArtworkId={selectedArtworkId}
                        setSelectedArtworkId={selectArtwork}
                        onReorderGroups={reorderGroups}
                        onReorderSeasons={reorderSeasons}
                        onReorderWall={reorderWall}
                        onReorderMusic={reorderMusic}
                        groupReorderLocked={positionsDirty ? SAVE_POSITIONS_FIRST : undefined}
                        onGroupReorderLockedAttempt={() => snackbar.error(SAVE_POSITIONS_FIRST)}
                    />
                </div>


                <div className={rightPanel}>
                    {/* 메인 전시장 탭에서 그룹을, 2D 시즌 탭에서 시즌을 고르면 제목 줄을 그 패널이 그림 (저장 버튼이 같은 줄에 들어감) */}
                    {!((tab === '2' && selectedArtworkId) || selectedSeason) && <div className={headerPanel}>{PANEL_TITLE[tab]}</div>}
                    {['1', '5'].includes(tab) && (selectedArtwork ? (
                        <div className={imagePreview}>
                            <div style={{ width: '80%', height: '80%', position: 'relative' }}>
                                <MainImagePosterCard isAdmin={true}>
                                    {/* 카드 크기 기준으로 맞춰서 세로로 긴 그림도 카드 밖으로 나가지 않게 (너비 50%, 높이 80% 안) */}
                                    <div style={{ position: 'absolute', inset: 0, containerType: 'size', '--ratio': previewRatio ?? 1 } as React.CSSProperties}>
                                        <FramedImage
                                            key={selectedArtwork.poster_path}
                                            width={0}
                                            height={0}
                                            sizes={previewSizes}
                                            src={selectedArtwork.poster_path}
                                            alt={selectedArtwork.title}
                                            onLoad={(e) => setPreview({ src: selectedArtwork.poster_path, ratio: e.currentTarget.naturalWidth / e.currentTarget.naturalHeight })}
                                            style={{
                                                top: '50%',
                                                left: '50%',
                                                transform: 'translate(-50%, -50%)',
                                                width: 'min(50cqw, calc(80cqh * var(--ratio)))',
                                                height: 'auto',
                                                position: 'absolute',
                                                visibility: previewRatio ? 'visible' : 'hidden'
                                            }}
                                        />
                                    </div>
                                </MainImagePosterCard>
                            </div>
                        </div>
                    ) : (
                        <div className={emptyHint}>왼쪽 목록에서 그림을 선택하면 미리보기가 나와요.</div>
                    ))}
                    {tab === '2' && (selectedArtworkId ? (
                        <ArtworkDisplayPanel
                            title={selectedGroupHidden
                                ? <>{PANEL_TITLE[tab]}<div className={`${styles.homeBadge} ${styles.homeBadgeHidden}`}>홈 화면에서 가림</div></>
                                : PANEL_TITLE[tab]}
                            artworks={artworks}
                            selectedArtworkId={selectedArtworkId}
                            locked={!!groupOrder}
                            setIsLoading={setIsLoading}
                            onDirtyChange={setPositionsDirty}
                        />
                    ) : (
                        <div className={emptyHint}>왼쪽 목록에서 그룹을 선택하면 전시창 배치를 보고 그림 위치를 옮길 수 있어요.</div>
                    ))}
                    {tab === '3' && (selectedSeason ? (
                        <SeasonPanel
                            season={selectedSeason}
                            artworks={artworks}
                            setIsLoading={setIsLoading}
                            onDirtyChange={setPositionsDirty}
                            onSeasonGone={() => setSelectedArtworkId(null)}
                        />
                    ) : (
                        <div className={emptyHint}>왼쪽 목록에서 시즌을 선택하면 그 시즌의 그림을 넣고 빼고 순서를 정할 수 있어요.</div>
                    ))}
                    {tab === '4' && (selectedMusic ? (
                        <div className={emptyHint}>
                            <div className={styles.musicTitle}>{selectedMusic.title}</div>
                            <audio key={selectedMusic.url} src={selectedMusic.url} controls />
                        </div>
                    ) : (
                        <div className={emptyHint}>{musicList.length ? '왼쪽 목록에서 음악을 선택하면 들어볼 수 있어요.' : '등록된 음악이 없어요. 추가 버튼으로 올려주세요.'}</div>
                    ))}
                </div>
            </div >
            {openDialog && <ArtAddDialog artworks={artworks} musicList={musicList} selectedArtworkId={selectedArtworkId} setSelectedArtworkId={setSelectedArtworkId} openDialog={openDialog} setOpenDialog={setOpenDialog} tab={tab} setIsLoading={setIsLoading} />}
            {isLoading && <ShowLoading ></ShowLoading>}
            <ConfirmHost />
            <SnackbarHost />
        </>
    );
};
export default ArtworkPage;
