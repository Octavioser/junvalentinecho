"use client";
import { useState } from "react"
import styles from "./visual.module.css"
import { Artwork, ArtworkList } from "@/types";
import Link from "next/link";



const VisualDetail = ({ Artwork }: { Artwork: ArtworkList }) => {

    const [showId, setShowId] = useState<String | null>(null);

    const { container, left, right, rightDetail } = styles;

    return (
        <div className={container}>
            <div className={left}>
                {Artwork.map(({ id, overview, poster_path, season }) => (
                    <Link href={`/season/${season}`} key={id}>
                        <div
                            style={(showId || id) === id ? { cursor: 'pointer' } : { filter: 'blur(4px)' }}
                            onMouseOver={() => { setShowId(id) }}
                            onMouseOut={() => { setShowId(null) }}
                        >
                            {overview}
                        </div>
                    </Link>
                ))}
            </div>
            <div className={right}>
                <div className={rightDetail}>
                    {Artwork.map(({ id, title, poster_path, season }) => (
                        <img
                            key={id}
                            style={{
                                display: id === showId ? 'flex' : 'none',
                                maxWidth: '100%', /* 부모 너비를 초과하지 않도록 */
                                maxHeight: '100%', /* 부모 높이를 초과하지 않도록 */
                                objectFit: 'contain', /* 비율을 유지하면서 부모 안에 맞춤 */
                                userSelect: 'none'
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
    )
}

export default VisualDetail;