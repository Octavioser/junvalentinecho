"use client";
import { useRef, useState } from "react";
import styles from "./visual.module.css";
import { useRouter } from 'next/navigation';
import Image from "next/image";
import { useArtworks } from "@/providers/ArtworksProvider";
import { ARTWORK_QUALITY } from "@/common/image";


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
                                // 시즌 이름·ID에 한글이나 /, ?, # 같은 글자가 있어도 주소가 깨지지 않게
                                router.push(`/season/${encodeURIComponent(season)}?id=${encodeURIComponent(id)}`);
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
                        {/* 원본 대신 화면 크기에 맞춘 사본을 받음. 숨겨진 그림도 미리 받아 둬서(eager) 이름에 마우스를 올리면 바로 보임 */}
                        <Image
                            className={rightDetailImg}
                            key={id}
                            src={poster_path}
                            alt={title}
                            width={0}
                            height={0}
                            sizes="(max-aspect-ratio: 1/1) 40vh, 40vw"
                            quality={ARTWORK_QUALITY}
                            loading="eager"
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