"use client";
import React, { useState, useEffect, Fragment } from 'react';
import styles from "./Season.module.css";
import Image from "next/image";
import { useArtworks } from "@/providers/ArtworksProvider";
import { ARTWORK_QUALITY } from "@/common/image";


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
                    }}
                    onMouseOver={() => { setShowId(id); }}
                    onMouseOut={() => {
                        if (!isClickId) setShowId(null);
                        if (isClickId !== id) {
                            setIsClickId(null);
                            setShowId(null);
                        }
                    }}
                >
                    <span> {title}</span>
                </div>
            ))}
        </div>
        <div className={rightPanel}>
            {artworks.map(({ id, title, poster_path, overview }) => (
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
                            <span>{title}</span>
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