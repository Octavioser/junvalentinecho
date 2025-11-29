"use client";
import { useRef, useState } from "react";
import styles from "./visual.module.css";
import { useRouter } from 'next/navigation';
import { useArtworks } from "@/providers/ArtworksProvider";


const VisualDetail = () => {
    const router = useRouter();

    const Artwork = (useArtworks().artworks || []).filter(({ visualYn }) => visualYn === 'Y');

    const [showId, setShowId] = useState<String | null>(null);

    const clickFunc = useRef<Function>(null);


    const { container, left, right, rightDetailImgContainer, rightDetailImg, show } = styles;

    return (
        <div className={container}>
            <div className={left}>
                {Artwork.map(({ id, overview, season }) => (
                    <div
                        key={`veiw${id}`}
                        style={(showId || id) === id ? { cursor: 'pointer' } : { filter: 'blur(4px)' }}
                        onMouseOver={() => { setShowId(id); }}
                        onMouseOut={() => { setShowId(null); }}
                        onPointerDown={(e: React.PointerEvent<HTMLDivElement>) => {
                            clickFunc.current = () => {
                                const pointerType = e.pointerType;
                                if (pointerType === 'touch' && id !== showId) {
                                    setShowId(id);
                                    return;
                                }
                                router.push(`/season/${season}?id=${id}`);
                            };
                        }}
                        onPointerLeave={() => { clickFunc.current = null; }}
                        onPointerUp={() => { clickFunc.current && clickFunc.current(); }}
                    >
                        <span>{id}</span>
                    </div>
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