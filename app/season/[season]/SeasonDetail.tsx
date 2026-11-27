"use client";
import { useCallback, useEffect, useRef, useState } from 'react';
import styles from "./Season.module.css";
import Image from "next/image";
import { useArtworks } from "@/providers/ArtworksProvider";
import { ARTWORK_QUALITY } from "@/common/image";
import { formatSize } from "@/common/format";
import { seasonArtworks } from "@/common/season";
import MainImgDialog from "../../(home)/(mainImgDailog)/MainImgDialog";

// 그림 칸(Season.module.css의 .detailImage)의 크기: 너비는 화면 폭의 72%를 넘지 않고, 높이는 플레이어를 뺀 화면 높이의 48%
const BOX_VW = 72;
const BOX_VH = 40.8; // (100 - 15) x 0.48
const LIST_FADE = 56; // 제목 목록이 더 있는 쪽 끝이 서서히 사라지는 길이 (px)

// 그림이 화면에서 실제로 그려지는 너비. 칸 안에 비율을 지키며 들어가므로, 세로로 긴 그림은 칸 높이에 맞춰져 훨씬 좁게 그려짐.
// 이 너비에 맞는 사본을 받게 함: 칸 너비로만 알려 주면 좁게 보이는 그림도 화면 폭짜리 큰 파일(수백 KB~수 MB)을 받음.
// 비율은 입력해 둔 실제 크기(cm)로 어림하고 10% 여유를 둠
const drawnWidth = (width: number, height: number) =>
    width > 0 && height > 0 ? `min(${BOX_VW}vw, ${(BOX_VH * (width / height) * 1.1).toFixed(1)}vh)` : `${BOX_VW}vw`;

// 마우스가 그림이 실제로 그려진 곳 위에 있는지. 그림 칸은 그림보다 넓고, 그림은 그 안에서 비율을 지키며 아래 가운데에 놓임
const onPicture = (e: React.MouseEvent<HTMLImageElement>) => {
    const image = e.currentTarget;
    if (!image.naturalWidth || !image.naturalHeight) return false;
    const box = image.getBoundingClientRect();
    const scale = Math.min(box.width / image.naturalWidth, box.height / image.naturalHeight);
    const pictureWidth = image.naturalWidth * scale, pictureHeight = image.naturalHeight * scale;
    return Math.abs(e.clientX - (box.left + box.width / 2)) <= pictureWidth / 2 && e.clientY >= box.bottom - pictureHeight;
};

const SeasonDetail = ({ param, id }: { param: string, id: string | null; }) => {

    // 이 시즌에 들어 있는 그림을 관리자가 정한 순서대로
    const artworks = seasonArtworks(useArtworks().artworks || [], param);

    useEffect(() => {
        if (id) setShowId(id);
    }, [id]);

    const { container, listPanel, list, listItem, detailPanel, detailItem, detailItemHidden, detailImage, caption, captionTitle, captionText } = styles;

    // 지금 보여 주는 그림. 제목에 마우스를 올리거나 누르면 그 그림으로 바뀌고 그대로 남음 (마우스를 떼도 돌아가지 않음)
    const [showId, setShowId] = useState<String | null>(null);

    // 제목 목록을 넘겨 볼 수 있다는 표시: 더 있는 쪽(위·아래) 끝을 서서히 흐리게 함 (스크롤 막대는 어떤 것도 보여 주지 않음. 넘기는 기능은 그대로).
    // 제목도 목록 가운데에서 멀수록(끝으로 갈수록) 연하고 더 흐리게 보임.
    // 넘길 때마다 화면 전체를 다시 그리지 않게, 상태로 두지 않고 요소에 바로 적음
    const listRef = useRef<HTMLDivElement>(null);
    const updateScrollCue = useCallback(() => {
        const el = listRef.current;
        if (!el) return;
        const { scrollTop, scrollHeight, clientHeight } = el;
        // 끝까지 남은 거리만큼만 흐리게 해서, 끝에 다가가면 흐림이 줄다가 없어짐
        el.style.setProperty('--fade-top', `${Math.min(LIST_FADE, Math.max(0, scrollTop))}px`);
        el.style.setProperty('--fade-bottom', `${Math.min(LIST_FADE, Math.max(0, scrollHeight - clientHeight - scrollTop))}px`);
        // 제목마다 목록 가운데에서 얼마나 떨어져 있는지 (--away: 가운데 0 ~ 위아래 끝 1).
        // 이 값이 클수록 연하고 흐리게 보임 (Season.module.css)
        const box = el.getBoundingClientRect();
        if (box.height <= 0) return; // 아직 화면에 놓이지 않았음 (놓이면 크기가 바뀌면서 다시 불림)
        const middle = box.top + box.height / 2;
        for (const item of el.children) {
            const rect = item.getBoundingClientRect();
            const away = Math.min(1, Math.abs((rect.top + rect.bottom) / 2 - middle) / (box.height / 2));
            (item as HTMLElement).style.setProperty('--away', away.toFixed(3));
        }
    }, []);
    // 처음 그릴 때, 목록 내용이 바뀔 때, 화면 크기가 바뀔 때, 글꼴을 다 받았을 때(줄바꿈이 달라짐) 다시 맞춤
    useEffect(() => {
        updateScrollCue();
        const el = listRef.current;
        const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(updateScrollCue) : null;
        if (el && observer) observer.observe(el);
        window.addEventListener('resize', updateScrollCue);
        document.fonts?.ready.then(updateScrollCue);
        return () => {
            observer?.disconnect();
            window.removeEventListener('resize', updateScrollCue);
        };
    }, [updateScrollCue, artworks.length]);

    const [dialogId, setDialogId] = useState<string | null>(null); // 그림을 눌러 연 상세창 (홈 화면과 같은 창)
    const dialogArtwork = artworks.find(({ id }) => id === dialogId);
    const [dialogPreview, setDialogPreview] = useState<string | undefined>(undefined); // 누른 그림의 주소 (창이 열리자마자 그 그림부터 보여 줌)

    return <div className={container}>
        <div className={detailPanel}>
            {/* 이 시즌의 그림을 모두 그려 두고 고른 것만 보여 줌. 들어오자마자 미리 받아 두므로(eager) 제목에 마우스를 올리면 바로 뜨고,
                한 번 본 그림을 다시 볼 때 새로 받거나 다시 그리지 않음 */}
            {artworks.map(({ id, title, poster_path, overview, width, height, material, year }) => (
                <div key={id} className={id === showId ? detailItem : detailItemHidden}>
                    <div className={detailImage} >
                        {/* 원본 대신 화면에 그려지는 크기에 맞춘 사본을 받음. 칸 안에서 비율을 지키며 아래쪽에 맞춤 */}
                        <Image
                            style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'contain',
                                objectPosition: 'bottom',
                                userSelect: 'none'
                            }}
                            src={poster_path}
                            alt={title}
                            width={0}
                            height={0}
                            sizes={drawnWidth(width, height)}
                            quality={ARTWORK_QUALITY}
                            loading="eager"
                            draggable={false}
                            onContextMenu={e => e.preventDefault()}
                            // 그림을 누르면 홈 화면처럼 상세창이 뜸 (그림 옆 빈 곳은 반응하지 않음)
                            onMouseMove={(e) => { e.currentTarget.style.cursor = onPicture(e) ? 'pointer' : ''; }}
                            onClick={(e) => { if (onPicture(e)) { setDialogPreview(e.currentTarget.currentSrc || undefined); setDialogId(id); } }}
                        />
                    </div>
                    {/* 그림 아래 정보: 제목(기울임) / 재료 / 크기 / 연도(맨 아래), 그 아래에 설명 글 */}
                    <div className={caption}>
                        <span><i className={captionTitle}>{title}</i></span>
                        {material && <span>{material}</span>}
                        <span>{formatSize(width, height)}</span>
                        {!!year && <span>{year}</span>}
                        {overview && <span className={captionText}>{overview}</span>}
                    </div>
                </div>
            ))}
        </div>
        {/* 이 시즌의 그림 제목 목록 (오른쪽) */}
        <div className={listPanel}>
            <div className={list} ref={listRef} onScroll={updateScrollCue}>
                {artworks.map(({ id, overview, poster_path, season, title }) => (
                    <div
                        key={id}
                        // 또렷하게 보일 제목: 지금 보여 주는 그림의 제목, 아직 아무것도 안 골랐으면 모든 제목. 나머지는 흐리게.
                        // 거기에 더해 목록 끝으로 갈수록 연해지고 흐림도 세짐 (Season.module.css의 --away)
                        className={[listItem, (showId || id) === id ? styles.listItemOn : styles.listItemOff, id === showId ? styles.listItemSelected : ''].join(' ')}
                        // 마우스를 올리기만 해도 고른 것으로 침 (누르는 것과 같음). 터치 화면은 누르면 고름
                        onMouseOver={() => { setShowId(id); }}
                        onClick={() => { setShowId(id); }}
                    >
                        <span> {title}</span>
                    </div>
                ))}
            </div>
        </div>
        {dialogArtwork && <MainImgDialog targetImg={dialogArtwork} previewSrc={dialogPreview} dialogClose={() => { setDialogId(null); }} />}
    </div>;

};
export default SeasonDetail;