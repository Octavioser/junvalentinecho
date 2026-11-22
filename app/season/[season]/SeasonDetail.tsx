"use client";
import { useState, useEffect } from 'react';
import styles from "./Season.module.css";
import Image from "next/image";
import { useArtworks } from "@/providers/ArtworksProvider";
import { ARTWORK_QUALITY } from "@/common/image";
import { formatSize } from "@/common/format";

// 그림 칸(Season.module.css의 .detailImage)의 크기: 너비는 화면 폭의 72%를 넘지 않고, 높이는 플레이어를 뺀 화면 높이의 48%
const BOX_VW = 72;
const BOX_VH = 40.8; // (100 - 15) x 0.48

// 그림이 화면에서 실제로 그려지는 너비. 칸 안에 비율을 지키며 들어가므로, 세로로 긴 그림은 칸 높이에 맞춰져 훨씬 좁게 그려짐.
// 이 너비에 맞는 사본을 받게 함: 칸 너비로만 알려 주면 좁게 보이는 그림도 화면 폭짜리 큰 파일(수백 KB~수 MB)을 받음.
// 비율은 입력해 둔 실제 크기(cm)로 어림하고 10% 여유를 둠
const drawnWidth = (width: number, height: number) =>
    width > 0 && height > 0 ? `min(${BOX_VW}vw, ${(BOX_VH * (width / height) * 1.1).toFixed(1)}vh)` : `${BOX_VW}vw`;

const SeasonDetail = ({ param, id }: { param: string, id: string | null; }) => {

    const artworks = (useArtworks().artworks || []).filter(({ season }) => season === param);

    useEffect(() => {
        if (id) {
            setIsClickId(id);
            setShowId(id);
        }
    }, [id]);

    const { container, listPanel, list, listItem, detailPanel, detailItem, detailItemHidden, detailImage, caption, captionTitle, captionText } = styles;

    const [showId, setShowId] = useState<String | null>(null);

    const [isClickId, setIsClickId] = useState<String | null>(null);

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
                        />
                    </div>
                    {/* 그림 아래 정보: 갤러리 캡션 관례대로 "제목(기울임), 연도" / 재료 / 크기, 그 아래에 설명 */}
                    <div className={caption}>
                        <span><i className={captionTitle}>{title}</i>, {year}</span>
                        {material && <span>{material}</span>}
                        <span>{formatSize(width, height)}</span>
                        {overview && <span className={captionText}>{overview}</span>}
                    </div>
                </div>
            ))}
        </div>
        {/* 이 시즌의 그림 제목 목록 (오른쪽) */}
        <div className={listPanel}>
            {/* 마우스가 목록을 완전히 벗어났을 때만 클릭해 둔 그림으로 돌아감 (클릭한 그림이 없으면 아무것도 안 보임).
                제목 사이 빈 곳을 지날 때는 마지막으로 올려 본 그림을 그대로 보여 줘서 화면이 왔다 갔다 하지 않음 */}
            <div className={list} onMouseLeave={() => { setShowId(isClickId); }}>
                {artworks.map(({ id, overview, poster_path, season, title }) => (
                    <div
                        key={id}
                        className={listItem}
                        style={(showId || id) === id ? { cursor: 'pointer' } : { filter: 'blur(4px)' }}
                        onClick={() => {
                            setIsClickId(id);
                            setShowId(id);
                        }}
                        // 마우스를 올리면 그 그림을 미리 보여 줌. 클릭한 선택은 그대로 남음
                        onMouseOver={() => { setShowId(id); }}
                    >
                        <span> {title}</span>
                    </div>
                ))}
            </div>
        </div>
    </div>;

};
export default SeasonDetail;