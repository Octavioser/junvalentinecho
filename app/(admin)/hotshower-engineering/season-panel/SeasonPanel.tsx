"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import GridComponents from "../../../components/grid/GridComponents";
import ArtPicker from "../dialog/artDialogParts/ArtPicker";
import { Artwork } from "@/types";
import { updateAllArtwork } from "@/common/comon";
import { moveItem } from "@/common/order";
import { applySeasonArtworkOrder, joinSeasonAll, leaveSeason, seasonArtworks, seasonCover, setSeasonCover } from "@/common/season";
import { snackbar } from "@/components/Snackbar/Snackbar";
import { confirmDialog } from "@/components/Confirm/ConfirmDialog";
import styles from "../ArtworkPage.module.css";
import dialogStyles from "../dialog/ArtAddDialog.module.css";

const COLUMNS = [{ name: 'no', header: '순서' }, { name: 'title', header: '제목' }, { name: 'id', header: 'ID' }, { name: 'cover', header: '2D 대표' }];

const sameOrder = (a: string[], b: string[]) => a.length === b.length && a.every((id, index) => id === b[index]);
const sameIds = (a: string[], b: string[]) => a.length === b.length && a.every((id) => b.includes(id));

// 2D 시즌 탭의 오른쪽: 고른 시즌에 들어 있는 그림들. 그림을 넣고 빼고, 줄을 끌어 순서를 정하고, 2D 화면에 보일 대표 그림을 고름
const SeasonPanel = ({ season, artworks, setIsLoading, onDirtyChange, onSeasonGone }: {
    season: string;
    artworks: Artwork[];
    setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
    onDirtyChange: (dirty: boolean) => void; // 그림 순서를 바꾸고 아직 저장하지 않았는지 (다른 시즌·탭으로 넘어갈 때 물어보는 용도)
    onSeasonGone: () => void;                // 마지막 그림을 빼서 시즌이 없어졌을 때
}) => {
    const router = useRouter();
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [draft, setDraft] = useState<string[] | null>(null); // 끌어서 바꾼 순서 (그림 ID를 새 순서대로). 저장 전
    const [adding, setAdding] = useState(false);

    // 최신 목록에서 이 시즌의 그림을 계산함 (그림을 통째로 들고 있으면 그사이 다른 저장으로 바뀐 값을 옛 값으로 되돌리게 됨)
    const saved = useMemo(() => seasonArtworks(artworks, season), [artworks, season]);
    const savedIds = useMemo(() => saved.map(({ id }) => id), [saved]);
    const ids = draft && sameIds(draft, savedIds) ? draft : savedIds;
    const dirty = !sameOrder(ids, savedIds);
    const cover = seasonCover(artworks, season);
    const selected = saved.find(({ id }) => id === selectedId);

    // 시즌을 바꾸면 고른 그림과 바꾸던 순서를 버림
    useEffect(() => { setSelectedId(null); setDraft(null); }, [season]);
    // 바꾸던 순서가 저장된 순서와 같아졌거나(저장한 목록이 새로 옴) 그림 구성이 달라졌으면 버림
    useEffect(() => {
        if (draft && (!sameIds(draft, savedIds) || sameOrder(draft, savedIds))) setDraft(null);
    }, [draft, savedIds]);

    useEffect(() => { onDirtyChange(dirty); }, [dirty]);
    useEffect(() => () => onDirtyChange(false), []);

    const save = async (next: Artwork[], message: string, after?: () => void) => {
        setIsLoading(true);
        try {
            await updateAllArtwork(next);
            after?.();
            snackbar.success(message);
            router.refresh(); // 페이지 새로고침
        } catch {
            snackbar.error('저장에 실패했습니다.');
        } finally {
            setIsLoading(false);
        }
    };

    const remove = async () => {
        if (!selected) return;
        const last = saved.length === 1;
        const ok = await confirmDialog(
            last
                ? `'${selected.title}'은(는) 이 시즌의 마지막 그림이에요.\n빼면 '${season}' 시즌도 없어져요. 그림 자체는 지워지지 않아요.`
                : `'${selected.title}'을(를) '${season}' 시즌에서 뺄까요?\n그림 자체는 지워지지 않아요.`,
            { confirmLabel: '빼기', danger: true });
        if (!ok) return;
        await save(leaveSeason(artworks, selected.id), last ? '시즌이 없어졌습니다.' : '시즌에서 뺐습니다.', () => { setSelectedId(null); if (last) onSeasonGone(); });
    };

    return (
        <div style={{ display: 'flex', flex: 1, flexDirection: 'column', minHeight: 0 }}>
            <div className={styles.headerPanel}>
                시즌 그림 · {season}
                <div className={styles.headerActions}>
                    {dirty ? (
                        <>
                            <div className={styles.unsavedNote}>저장하지 않은 순서 변경이 있어요</div>
                            <button className={styles.addButton} onClick={() => setDraft(null)}>되돌리기</button>
                            <button className={styles.addButton} onClick={() => save(applySeasonArtworkOrder(artworks, season, ids), '순서가 저장되었습니다.')}>순서 저장</button>
                        </>
                    ) : (
                        <>
                            <button className={styles.addButton} onClick={() => setAdding(true)}>그림 추가</button>
                            <button className={styles.addButton} disabled={!selected} onClick={remove}>시즌에서 빼기</button>
                            <button className={styles.addButton} disabled={!selected || selected.id === cover?.id}
                                onClick={() => selected && save(setSeasonCover(artworks, season, selected.id), '2D 대표 그림이 바뀌었습니다.')}>2D 대표로</button>
                        </>
                    )}
                </div>
            </div>
            {!cover && <div className={styles.warning}>이 시즌은 2D 대표 그림이 없어서 2D 화면에 나오지 않아요. 그림을 고르고 "2D 대표로"를 누르면 나와요.</div>}
            <div style={{ flex: 1, minHeight: 0, padding: 'var(--sp)', boxSizing: 'border-box' }}>
                <GridComponents
                    columnList={COLUMNS}
                    gridData={ids.map((id, index) => {
                        const artwork = saved.find((item) => item.id === id)!;
                        return { id, no: index + 1, title: artwork.title, cover: id === cover?.id ? '대표' : '' };
                    })}
                    selectedArtworkId={selectedId}
                    setSelectedArtworkId={setSelectedId}
                    emptyText="이 시즌에 그림이 없어요."
                    onReorder={(from, to) => setDraft(moveItem(ids, from, to))}
                />
            </div>
            {/* 고른 그림 미리보기 */}
            <div style={{ flex: '0 0 42%', minHeight: 0, position: 'relative', borderTop: '1px solid #F5F5F7', backgroundColor: '#FAFAFA' }}>
                {selected
                    ? <Image key={selected.poster_path} src={selected.poster_path} alt={selected.title} fill sizes="25vw" style={{ objectFit: 'contain', padding: 24, boxSizing: 'border-box' }} />
                    : <div className={styles.emptyHint} style={{ height: '100%' }}>그림을 고르면 여기에 보여요. 줄을 끌면 시즌 안에서의 순서가 바뀌어요.</div>}
            </div>

            {adding && (
                <>
                    <div className={dialogStyles.overlayStyle} onClick={() => setAdding(false)} />
                    <div className={dialogStyles.dialogStyle} role="dialog" aria-modal="true" aria-labelledby="season-add-title">
                        <div className={dialogStyles.header}>
                            <div id="season-add-title" className={dialogStyles.title}>'{season}' 시즌에 그림 추가</div>
                            <button type="button" className={dialogStyles.closeButton} aria-label="닫기" onClick={() => setAdding(false)}>✕</button>
                        </div>
                        <div className={dialogStyles.body}>
                            <ArtPicker
                                hint="이 시즌에 넣을 그림을 순서대로 누르세요. 여러 개를 한 번에 고를 수 있고, 번호 순서대로 시즌 맨 뒤에 붙어요. 다른 시즌에 있던 그림은 그 시즌에서 빠지고 여기로 옮겨져요."
                                candidates={artworks.filter((artwork) => artwork.season !== season)}
                                emptyText="넣을 수 있는 그림이 없어요."
                                confirmLabel="추가"
                                onCancel={() => setAdding(false)}
                                onPick={(ids) => save(joinSeasonAll(artworks, ids, season), '시즌에 추가되었습니다.', () => setAdding(false))}
                            />
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};
export default SeasonPanel;
