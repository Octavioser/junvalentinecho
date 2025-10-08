"use client";
import React, { useState, useEffect, Fragment } from 'react';
import styles from "./Season.module.css";
import { useArtworks } from "@/providers/ArtworksProvider";


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
                                <img

                                    style={{
                                        display: 'flex',
                                        maxWidth: '100%', /* 부모 너비를 초과하지 않도록 */
                                        maxHeight: '80%', /* 부모 높이를 초과하지 않도록 */
                                        objectFit: 'contain', /* 비율을 유지하면서 부모 안에 맞춤 */
                                        userSelect: 'none'
                                    }}
                                    src={poster_path}
                                    alt={title}
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