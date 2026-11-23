"use client";
import { useRef, useState } from "react";
import styles from "./visual.module.css";
import { useRouter } from 'next/navigation';
import Image from "next/image";
import { useArtworks } from "@/providers/ArtworksProvider";
import { ARTWORK_QUALITY } from "@/common/image";
import { visualList } from "@/common/order";


// 마우스가 그림이 실제로 그려진 곳 위에 있는지. 그림 칸은 정사각형이고, 그림은 그 안에서 비율을 지키며 가운데에 놓임
const onPicture = (e: React.MouseEvent<HTMLImageElement>) => {
    const image = e.currentTarget;
    if (!image.naturalWidth || !image.naturalHeight) return false;
    const box = image.getBoundingClientRect();
    const scale = Math.min(box.width / image.naturalWidth, box.height / image.naturalHeight);
    return Math.abs(e.clientX - (box.left + box.width / 2)) <= image.naturalWidth * scale / 2
        && Math.abs(e.clientY - (box.top + box.height / 2)) <= image.naturalHeight * scale / 2;
};

const VisualDetail = () => {
    const router = useRouter();

    // 2D 표시에 넣은 그림을 관리자에서 정한 순서대로
    const Artwork = visualList(useArtworks().artworks || []);

    // 지금 그림을 보여 주는 시리즈. 이름에 마우스를 올리면(터치는 한 번 누르면) 그 그림이 뜨고 그대로 남음.
    // 그대로 남아야 마우스를 그림으로 옮겨서 누를 수 있음
    const [showId, setShowId] = useState<String | null>(null);

    const clickFunc = useRef<Function>(null);

    // 시즌 이름·ID에 한글이나 /, ?, # 같은 글자가 있어도 주소가 깨지지 않게
    const open = (season: string, id: string) => router.push(`/season/${encodeURIComponent(season)}?id=${encodeURIComponent(id)}`);


    const { container, left, right, rightDetailImgContainer, rightDetailImg, show } = styles;

    return (
        <div className={container}>
            <div className={left}>
                {Artwork.map(({ id, overview, season }) => (
                    <div
                        key={`veiw${id}`}
                        style={(showId || id) === id ? { cursor: 'pointer' } : { filter: 'blur(4px)' }}
                        onMouseOver={() => { setShowId(id); }}
                        onPointerDown={(e: React.PointerEvent<HTMLDivElement>) => {
                            clickFunc.current = () => {
                                const pointerType = e.pointerType;
                                // 터치: 처음 누르면 그림만 띄움. 그림이 떠 있는 이름을 다시 누르거나 그림을 누르면 들어감
                                if (pointerType === 'touch' && id !== showId) {
                                    setShowId(id);
                                    return;
                                }
                                open(season, id);
                            };
                        }}
                        onPointerLeave={() => { clickFunc.current = null; }}
                        onPointerUp={() => { clickFunc.current && clickFunc.current(); }}
                    >
                        {/* 시리즈(시즌) 이름만 보여 줌 */}
                        <span>{season}</span>
                    </div>
                ))}
            </div>
            <div className={right}>
                {Artwork.map(({ id, title, poster_path, width, season }) => (
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
                            // 그림을 누르면 그 시리즈로 들어감 (PC·모바일 모두. 그림 옆 빈 곳은 반응하지 않음)
                            onMouseMove={(e) => { e.currentTarget.style.cursor = onPicture(e) ? 'pointer' : ''; }}
                            onClick={(e) => { if (onPicture(e)) open(season, id); }}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
};

export default VisualDetail;