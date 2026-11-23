"use client";
import { useState, useEffect } from 'react';
import styles from "./Season.module.css";
import Image from "next/image";
import { useArtworks } from "@/providers/ArtworksProvider";
import { ARTWORK_QUALITY } from "@/common/image";
import { formatSize } from "@/common/format";
import MainImgDialog from "../../(home)/(mainImgDailog)/MainImgDialog";

// 그림 칸(Season.module.css의 .detailImage)의 크기: 너비는 화면 폭의 72%를 넘지 않고, 높이는 플레이어를 뺀 화면 높이의 48%
const BOX_VW = 72;
const BOX_VH = 40.8; // (100 - 15) x 0.48

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

    const artworks = (useArtworks().artworks || []).filter(({ season }) => season === param);

    useEffect(() => {
        if (id) setShowId(id);
    }, [id]);

    const { container, listPanel, list, listItem, detailPanel, detailItem, detailItemHidden, detailImage, caption, captionTitle, captionText } = styles;

    // 지금 보여 주는 그림. 제목에 마우스를 올리거나 누르면 그 그림으로 바뀌고 그대로 남음 (마우스를 떼도 돌아가지 않음)
    const [showId, setShowId] = useState<String | null>(null);

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
            <div className={list}>
                {artworks.map(({ id, overview, poster_path, season, title }) => (
                    <div
                        key={id}
                        className={listItem}
                        style={(showId || id) === id ? { cursor: 'pointer' } : { filter: 'blur(4px)' }}
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