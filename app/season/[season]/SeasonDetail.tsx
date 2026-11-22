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

    const { container, leftPanel, rightPanel, leftBox, rightDetail } = styles;

    const [showId, setShowId] = useState<String | null>(null);

    const [isClickId, setIsClickId] = useState<String | null>(null);

    return <div className={container}>
        <div className={leftPanel}>
            {artworks.map(({ id, overview, poster_path, season, title }) => (
                <div
                    key={id}
                    className={leftBox}
                    style={(showId || id) === id ? { cursor: 'pointer' } : { filter: 'blur(4px)' }}
                    onClick={() => {
                        setIsClickId(id);
                        setShowId(id);
                    }}
                    // 마우스를 올린 동안에는 그 그림을 미리 보여 주고, 떠나면 클릭해 둔 그림으로 돌아감 (클릭한 그림이 없으면 아무것도 안 보임).
                    // 다른 그림에 마우스를 올렸다 떼도 클릭한 선택은 풀리지 않음
                    onMouseOver={() => { setShowId(id); }}
                    onMouseOut={() => { setShowId(isClickId); }}
                >
                    <span> {title}</span>
                </div>
            ))}
        </div>
        <div className={rightPanel}>
            {artworks.map(({ id, title, poster_path, overview, width, height, material, year }) => (
                <React.Fragment key={id}>
                    {id === showId &&
                        <>
                            <div className={rightDetail} >
                                {/* 원본 대신 화면 크기에 맞춘 사본을 받음. 칸(너비 100%, 높이 80%) 안에서 비율을 지키며 아래쪽에 맞춤 */}
                                <Image
                                    style={{
                                        width: '100%',
                                        height: '80%',
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
                            {/* 그림 아래 정보: 홈에서 그림을 눌렀을 때 뜨는 창과 같은 순서 (제목, 연도, 크기, 재료, 설명) */}
                            <span>{title}</span>
                            <span>{year}</span>
                            <span>{formatSize(width, height)}</span>
                            <span>{material}</span>
                            <span>{overview}</span>
                        </>
                    }
                </React.Fragment>
            ))
            }
        </div>
    </div>;

};
export default SeasonDetail;