"use client";
import { useState } from "react";
import styles from "./visual.module.css";
import { Artwork } from "@/types";
import Link from "next/link";
import { useArtworks } from "@/providers/ArtworksProvider";


const VisualDetail = () => {

    const Artwork = (useArtworks().artworks || []).filter(({ visualYn }) => visualYn === 'Y');

    const [showId, setShowId] = useState<String | null>(null);

    const { container, left, right, rightDetailImgContainer, rightDetailImg, show } = styles;

    return (
        <div className={container}>
            <div className={left}>
                {Artwork.map(({ id, overview, season }) => (
                    <Link href={`/season/${season}`} key={id}>
                        <div
                            style={(showId || id) === id ? { cursor: 'pointer' } : { filter: 'blur(4px)' }}
                            onMouseOver={() => { setShowId(id); }}
                            onMouseOut={() => { setShowId(null); }}
                        >
                            <span>{id}</span>
                        </div>
                    </Link>
                ))}
            </div>
            <div className={right}>
                {Artwork.map(({ id, title, poster_path, width }) => (
                    <div key={`rightDetial${id}`} className={`${rightDetailImgContainer} ${id === showId ? show : ''}`}>
                        <img
                            className={rightDetailImg}
                            key={id}
                            src={poster_path}
                            alt={title}
                            draggable={false}
                            onContextMenu={e => e.preventDefault()}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
};

export default VisualDetail;