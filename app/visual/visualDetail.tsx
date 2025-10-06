"use client";
import { useState } from "react";
import styles from "./visual.module.css";
import { Artwork, ArtworkList } from "@/types";
import Link from "next/link";



const VisualDetail = ({ Artwork }: { Artwork: ArtworkList; }) => {

    const [showId, setShowId] = useState<String | null>(null);

    const { container, left, right, rightDetail, rightDetailImg } = styles;

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
                            {overview}
                        </div>
                    </Link>
                ))}
            </div>
            <div className={right}>
                <div className={rightDetail}>
                    {Artwork.map(({ id, title, poster_path, width }) => (
                        <img
                            className={rightDetailImg}
                            key={id}
                            style={{
                                display: id === showId ? 'flex' : 'none',
                                width: `${width}%`,
                            }}
                            src={poster_path}
                            alt={title}
                            draggable={false}
                            onContextMenu={e => e.preventDefault()}
                        />
                    ))}
                </div>

            </div>
        </div>
    );
};

export default VisualDetail;