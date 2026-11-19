"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import ArtworkDisplayPanel from './artwork-display/ArtworkDisplayPanel';
import ArtworkInfoForm from './artwork-info/ArtworkInfoForm';
import { Artwork, MusicBlob } from "@/types";
import ArtAddDialog from "./dialog/ArtAddDialog";
import Image from "next/image";
import styles from "./ArtworkPage.module.css";
import MainImagePosterCard from "@/components/MainImage/MainImagePosterCard";
import { useRouter } from "next/navigation";
import { delArtwork, delImage, updateAllArtwork, updateArtwork, delMusic } from "@/common/comon";
import ShowLoading from "./loading/ShowLoading";
import ImageStyles from "@/components/MainImage/MainImage.module.css";
import { snackbar, SnackbarHost } from "@/components/Snackbar/Snackbar";
import { confirmDialog, ConfirmHost } from "@/components/Confirm/ConfirmDialog";
import { applyGroupOrder, applyVisualOrder, groupIds, moveItem, visualList } from "@/common/order";

const TABS = [
    { header: '이미지 전체', value: '1' },
    { header: '메인 전시장', value: '2' },
    { header: '2D 표시 (시즌별 대표)', value: '3' },
    { header: '음악', value: '4' }
];

const PANEL_TITLE: Record<string, string> = { '1': '이미지 미리보기', '2': '전시창 배치', '3': '이미지 미리보기', '4': '음악 듣기' };

const ArtworkPage = ({ artworks, musicList }: { artworks: Artwork[]; musicList: MusicBlob[]; }) => {

    const [selectedArtworkId, setSelectedArtworkId] = useState<string | null>(null);
    const [tab, setTab] = useState<string>('1');
    const [openDialog, setOpenDialog] = useState<"add" | "mod" | null>(null);

    // 표에서 끌어 바꾼 순서 (아직 저장 전). 메인 전시장은 그룹 번호를, 2D 표시는 작품 ID를 새 순서대로 늘어놓은 것
    const [groupOrder, setGroupOrder] = useState<number[] | null>(null);
    const [visualOrder, setVisualOrder] = useState<string[] | null>(null);
    const unsavedOrder = useRef(false);
    unsavedOrder.current = !!(groupOrder || visualOrder);

    const [isLoading, setIsLoading] = useState<boolean>(false);

    const [preview, setPreview] = useState<{ src: string; ratio: number } | null>(null); // 미리보기 그림의 가로/세로 비율 (어느 그림 것인지 같이 기억)

    // 메인 전시장 탭에서 그림 위치를 옮기고 아직 저장하지 않은 상태
    const unsavedPositions = useRef(false);

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
        const ok = await confirmDialog('저장하지 않은 이미지 위치 변경이 있어요.\n저장하지 않고 넘어갈까요?', { confirmLabel: '저장 안 하고 넘어가기' });
        if (ok) unsavedPositions.current = false;
        return ok;
    };

    const selectArtwork = async (id: string | null) => {
        if (id === selectedArtworkId || !(await leaveUnsavedPositions())) return;
        setSelectedArtworkId(id);
    };

    // 순서를 바꾼 것까지 반영한 목록. 표에 이대로 보여주고, 저장할 때도 이대로 저장함
    const orderedArtworks = useMemo(() => {
        const grouped = groupOrder ? applyGroupOrder(artworks, groupOrder) : artworks;
        return visualOrder ? applyVisualOrder(grouped, visualOrder) : grouped;
    }, [artworks, groupOrder, visualOrder]);

    // 다른 저장으로 목록이 바뀌었을 때: 그룹·2D 구성이 그대로면 바꾸던 순서를 유지하고, 달라졌으면 버림
    useEffect(() => {
        const sameItems = <T,>(a: T[], b: T[]) => a.length === b.length && a.every((item) => b.includes(item));
        setGroupOrder((prev) => prev && sameItems(prev, groupIds(artworks)) ? prev : null);
        setVisualOrder((prev) => prev && sameItems(prev, visualList(artworks).map(({ id }) => id)) ? prev : null);
    }, [artworks]);

    // 표에서 from 자리의 줄을 to 자리로 옮김. 원래 순서로 돌아오면 바뀐 게 없는 것으로 봄
    const reorder = <T,>(saved: T[], draft: T[] | null, from: number, to: number) => {
        const next = moveItem(draft ?? saved, from, to);
        return next.every((item, index) => item === saved[index]) ? null : next;
    };
    const reorderGroups = (from: number, to: number) => setGroupOrder(reorder(groupIds(artworks), groupOrder, from, to));
    const reorderVisual = (from: number, to: number) => setVisualOrder(reorder(visualList(artworks).map(({ id }) => id), visualOrder, from, to));

    const resetOrder = () => { setGroupOrder(null); setVisualOrder(null); };

    const saveOrder = async () => {
        setIsLoading(true);
        try {
            await updateAllArtwork(orderedArtworks);
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
    const selectedMusic = musicList.find((music) => music.id === selectedArtworkId);

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
                    <div className={headerPanel}>이미지 관리</div>
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
                                            await delArtwork(artworks, selectedArtwork.id);
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
                                                            return { ...artwork, galleryId: null };
                                                        }
                                                        return artwork;
                                                    }));
                                                    unsavedPositions.current = false;
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
                                    </>
                                }
                            </>
                        }
                        {tab === '3' && (visualOrder ? orderBar :
                            <>
                                <button className={addButton} onClick={() => { setOpenDialog('add'); }}>추가</button>
                                <button className={addButton}
                                    disabled={!selectedArtworkId}
                                    onClick={async () => {
                                        if (!selectedArtwork) {
                                            snackbar.error('이미지를 찾을 수 없습니다.');
                                            return;
                                        }
                                        const ok = await confirmDialog(`'${selectedArtwork.title}'을(를) 2D 표시에서 뺄까요?\n그림 자체는 지워지지 않아요.`, { confirmLabel: '빼기', danger: true });
                                        if (!ok) return;
                                        setIsLoading(true);
                                        try {
                                            // 순서 값도 지워서, 나중에 다시 넣으면 맨 뒤에 붙게
                                            await updateArtwork(artworks, { ...selectedArtwork, visualYn: '', visualOrder: null });
                                            setSelectedArtworkId(null);
                                            snackbar.success('2D 표시에서 삭제되었습니다.');
                                            router.refresh(); // 페이지 새로고침
                                        } catch {
                                            snackbar.error('저장에 실패했습니다.');
                                        } finally {
                                            setIsLoading(false);
                                        }

                                    }}
                                >삭제
                                </button>

                            </>
                        )}
                        {tab === '4' &&
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
                        }
                    </div>

                    <ArtworkInfoForm
                        tab={tab}
                        artworks={orderedArtworks}
                        musicList={musicList}
                        selectedArtworkId={selectedArtworkId}
                        setSelectedArtworkId={selectArtwork}
                        onReorderGroups={reorderGroups}
                        onReorderVisual={reorderVisual}
                    />
                </div>


                <div className={rightPanel}>
                    {/* 메인 전시장 탭에서 그룹을 고르면 제목 줄을 ArtworkDisplayPanel이 그림 (저장 버튼이 같은 줄에 들어감) */}
                    {!(tab === '2' && selectedArtworkId) && <div className={headerPanel}>{PANEL_TITLE[tab]}</div>}
                    {['1', '3'].includes(tab) && (selectedArtwork ? (
                        <div className={imagePreview}>
                            <div style={{ width: '80%', height: '80%', position: 'relative' }}>
                                <MainImagePosterCard isAdmin={true}>
                                    {/* 카드 크기 기준으로 맞춰서 세로로 긴 그림도 카드 밖으로 나가지 않게 (너비 50%, 높이 80% 안) */}
                                    <div style={{ position: 'absolute', inset: 0, containerType: 'size', '--ratio': previewRatio ?? 1 } as React.CSSProperties}>
                                        <Image
                                            key={selectedArtwork.poster_path}
                                            width={0}
                                            height={0}
                                            sizes="50vw"
                                            className={ImageStyles.metalFrame}
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
                            title={PANEL_TITLE[tab]}
                            artworks={artworks}
                            selectedArtworkId={selectedArtworkId}
                            setIsLoading={setIsLoading}
                            onDirtyChange={(dirty) => { unsavedPositions.current = dirty; }}
                        />
                    ) : (
                        <div className={emptyHint}>왼쪽 목록에서 그룹을 선택하면 전시창 배치를 보고 그림 위치를 옮길 수 있어요.</div>
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
