"use client";
import { useEffect, useRef, useState } from "react";
import styles from "./visual.module.css";
import { useRouter } from 'next/navigation';
import Image from "next/image";
import { useArtworks } from "@/providers/ArtworksProvider";
import { ARTWORK_QUALITY } from "@/common/image";
import { seasonCovers } from "@/common/season";


// 마우스가 그림이 실제로 그려진 곳 위에 있는지. 그림 칸은 정사각형이고, 그림은 그 안에서 비율을 지키며 가운데에 놓임
const onPicture = (e: React.MouseEvent<HTMLImageElement>) => {
    const image = e.currentTarget;
    if (!image.naturalWidth || !image.naturalHeight) return false;
    const box = image.getBoundingClientRect();
    const scale = Math.min(box.width / image.naturalWidth, box.height / image.naturalHeight);
    return Math.abs(e.clientX - (box.left + box.width / 2)) <= image.naturalWidth * scale / 2
        && Math.abs(e.clientY - (box.top + box.height / 2)) <= image.naturalHeight * scale / 2;
};

// 세로 화면(모바일) 목록에서 그림 한 장이 차지하는 자리: 화면 폭의 68%, 화면 높이의 44%를 넘지 않음.
// 높이를 이 정도로 잡아야 첫 그림 아래로 다음 그림이 꽤 보여서, 아래로 넘기면 더 있다는 걸 알 수 있음
const LIST_VW = 68;
const LIST_VH = 44;
const END_SLOP = 24; // 목록을 이만큼 남기고 끝까지 내렸으면 끝으로 봄: 아래쪽을 흐리게 하지 않음 (px)

// 그 자리에 비율을 지키며 들어간 그림의 너비. 비율은 입력해 둔 실제 크기(cm)로 어림함 (그림을 받기 전에 자리를 잡아 두려고)
const listWidth = (width: number, height: number) =>
    width > 0 && height > 0 ? `min(${LIST_VW}vw, ${(LIST_VH * width / height).toFixed(1)}vh)` : `${LIST_VW}vw`;

const VisualDetail = () => {
    const router = useRouter();

    // 세로 화면(모바일)인지. 화면을 처음 그릴 때는 알 수 없어서 null.
    // 세로 화면과 가로 화면이 서로 다른 그림 목록을 쓰는데, 지금 화면에 맞는 쪽의 그림만 그려서 반대쪽 그림은 받지 않게 함
    const [portrait, setPortrait] = useState<boolean | null>(null);
    useEffect(() => {
        const query = window.matchMedia('(max-aspect-ratio: 1/1)');
        const update = () => setPortrait(query.matches);
        update();
        query.addEventListener('change', update);
        return () => query.removeEventListener('change', update);
    }, []);

    // 시즌마다 대표 그림 하나씩, 관리자에서 정한 시즌 순서대로 (대표가 없는 시즌은 나오지 않음)
    const Artwork = seasonCovers(useArtworks().artworks || []);

    // 지금 그림을 보여 주는 시리즈. 이름에 마우스를 올리면(터치는 한 번 누르면) 그 그림이 뜨고 그대로 남음.
    // 그대로 남아야 마우스를 그림으로 옮겨서 누를 수 있음
    const [showId, setShowId] = useState<String | null>(null);

    const clickFunc = useRef<Function>(null);

    // 시즌 이름·ID에 한글이나 /, ?, # 같은 글자가 있어도 주소가 깨지지 않게
    const open = (season: string, id: string) => router.push(`/season/${encodeURIComponent(season)}?id=${encodeURIComponent(id)}`);

    // 세로 화면 목록: 아래에 아직 안 본 시리즈가 더 있는지. 있는 동안 목록 아래쪽이 서서히 사라지게 해서 이어진다는 걸 알림
    const listRef = useRef<HTMLDivElement>(null);
    const [more, setMore] = useState(false);
    const checkMore = () => {
        const list = listRef.current;
        if (list) setMore(list.scrollTop + list.clientHeight < list.scrollHeight - END_SLOP);
    };
    useEffect(() => {
        checkMore();
        window.addEventListener('resize', checkMore);
        return () => window.removeEventListener('resize', checkMore);
    }, [portrait, Artwork.length]);

    const { container, left, right, rightDetailImgContainer, rightDetailImg, show, mobileList, mobileItem, mobilePicture, hasMore } = styles;

    return (
        <div className={container}>
            {/* 세로 화면(모바일): 시리즈마다 대표 그림과 이름을 위아래로 나열하고, 누르면 바로 들어감.
                마우스를 올려 미리 보는 PC 방식은 터치 화면에서 두 번 눌러야 해서 따로 만듦.
                가로 화면에서는 CSS로 숨기고 그림도 그리지 않음 (숨겨져 있어도 그려 두면 일부를 받아 버림) */}
            <div className={`${mobileList} ${more ? hasMore : ''}`} ref={listRef} onScroll={checkMore}>
                {portrait === true && Artwork.map(({ id, title, poster_path, width, height, season }) => (
                    <div key={`mobile${id}`} className={mobileItem} onClick={() => open(season, id)}>
                        <div className={mobilePicture} style={{ width: listWidth(width, height), aspectRatio: width > 0 && height > 0 ? `${width} / ${height}` : undefined }}>
                            <Image
                                src={poster_path}
                                alt={title}
                                width={0}
                                height={0}
                                sizes={listWidth(width, height)}
                                quality={ARTWORK_QUALITY}
                                draggable={false}
                                onContextMenu={e => e.preventDefault()}
                            />
                        </div>
                        <span>{season}</span>
                    </div>
                ))}
            </div>
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
                {/* 가로 화면(PC)에서만 그림 (세로 화면에서는 이 칸이 숨겨지는데, 미리 받는 그림이라 그려 두면 받아 버림) */}
                {portrait === false && Artwork.map(({ id, title, poster_path, width, season }) => (
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