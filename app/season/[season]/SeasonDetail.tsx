"use client";
import React, { useState, useEffect, Fragment } from 'react';
import styles from "./Season.module.css";
import Image from "next/image";
import { useArtworks } from "@/providers/ArtworksProvider";
import { ARTWORK_QUALITY } from "@/common/image";
import { formatSize } from "@/common/format";


const SeasonDetail = ({ param, id }: { param: string, id: string | null; }) => {

    const artworks = (useArtworks().artworks || []).filter(({ season }) => season === param);

    useEffect(() => {
        if (id) {
            setIsClickId(id);
            setShowId(id);
        }
    }, [id]);

    const { container, listPanel, list, listItem, detailPanel, detailImage, caption, captionTitle, captionText } = styles;

    const [showId, setShowId] = useState<String | null>(null);

    const [isClickId, setIsClickId] = useState<String | null>(null);

    return <div className={container}>
        <div className={detailPanel}>
            {artworks.map(({ id, title, poster_path, overview, width, height, material, year }) => (
                <React.Fragment key={id}>
                    {id === showId &&
                        <>
                            <div className={detailImage} >
                                {/* 원본 대신 화면 크기에 맞춘 사본을 받음. 칸 안에서 비율을 지키며 아래쪽에 맞춤 */}
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
                                    sizes="56vw"
                                    quality={ARTWORK_QUALITY}
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
                        </>
                    }
                </React.Fragment>
            ))
            }
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