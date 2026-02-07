"use client";

import styles from "./home.module.css";
import { use, useEffect, useRef, useState, RefObject } from "react";
import MainImagePosterCard from "../components/MainImage/MainImagePosterCard";
import ImageStyle from "../components/MainImage/MainImage.module.css";
import { Artwork, MusicBlob } from "@/types";
import Link from "next/link";
import Image from "next/image";
import Player from "./(player)/Player";
import { useArtworks } from "@/providers/ArtworksProvider";

import MainImgDialog from "./(mainImgDailog)/MainImgDialog";

const Gallery = ({ musicList }: { musicList: MusicBlob[]; }) => {
    const { artworks } = useArtworks();

    const scrollRef = useRef<HTMLDivElement>(null); // Ref 생성
    const cardFrame = useRef<Array<HTMLDivElement>>([]);
    const targetDisplayId = useRef<string | null>(null);


    const [groupIdList, setGroupIdList] = useState<Artwork[]>([]);
    const [displayGroupList, setDisplayGroupList] = useState<{ [x: string]: Artwork[]; }>({});

    const [dialogImageId, setDialogImageId] = useState<string | null>(null);

    // 옵저버로 확대 대상 이미지 선정하기
    useEffect(() => {
        if (!scrollRef.current) return;
        const observer = new IntersectionObserver(entries => {
            const list = entries.filter(e => e.isIntersecting);
            targetDisplayId.current = (list[0]?.target as HTMLElement)?.dataset?.groupid || null;
        }, {
            root: scrollRef.current,
            threshold: 0.6, // 절반이상 보일때
        });

        cardFrame.current.forEach(el => el && observer.observe(el));
        return () => observer.disconnect();
    }, [groupIdList.length]);

    // 스크롤 이벤트
    // 
    // 가로 스크롤만 휠로 지원 (Shift 없이도)
    useEffect(() => {
        const scrollContainer = scrollRef.current;
        if (!scrollContainer) return;

        // 1. 브라우저 줌 전역 차단 (Ctrl + Wheel)
        const preventZoom = (e: WheelEvent) => {
            if (e.ctrlKey) {
                e.preventDefault();
            }
        };

        // 2. 가로 스크롤 변환 (Ctrl 키 없을 때만) - 캡쳐 단계에서 처리하여 자식 컴포넌트(라이브러리)로 이벤트 전달 방지
        const handleScroll = (e: WheelEvent) => {
            if (!e.ctrlKey && e.deltaY !== 0) {
                // 가로 스크롤 처리
                if (scrollContainer) scrollContainer.scrollLeft += e.deltaY;

                // 이벤트 전파 중단 (MainImagePosterCard가 이 이벤트를 받지 못하게 함 -> 줌 안됨)
                e.stopPropagation();
            }
        };

        window.addEventListener('wheel', preventZoom, { passive: false });
        // 스크롤 컨테이너에 캡쳐 리스너 등록
        scrollContainer.addEventListener('wheel', handleScroll, { passive: false, capture: true });

        return () => {
            window.removeEventListener('wheel', preventZoom);
            scrollContainer.removeEventListener('wheel', handleScroll, { capture: true } as any);
        };
    }, []);


    useEffect(() => {
        // 중복된 galleryId를 가진 Artwork 객체를 제거
        setGroupIdList(
            (Array.from(new Map(artworks.filter((item) => item.galleryId).map(item => [item.galleryId, item])).values()) || [])
                .sort((a, b) => (a.galleryId || 0) - (b.galleryId || 0))
        );

        setDisplayGroupList(
            artworks.reduce((acc: { [key: string]: Artwork[]; }, cur: Artwork) => {
                const key = `${cur.galleryId}`;
                if (acc[key]) return { ...acc, [key]: acc[key].concat([cur]) };
                return { ...acc, [key]: [cur] };
            }, {})
        );
    }, [artworks]);




    const {
        homeContainer,
        scrollContainer,
        posterTrack,
        posterCardFrame,
        posterCardExplainContainer,
        posterCardExplain
    } = styles;

    return (
        <div className={homeContainer} ref={scrollRef}>
            <div className={scrollContainer}>
                {groupIdList.map((item) =>
                    <div key={item.id} className={posterTrack}>
                        <div className={posterCardFrame} ref={(el) => { if (el) cardFrame.current.push(el); }} data-groupid={item.id}>
                            <div style={{ width: '100%', aspectRatio: 1 / 1 }}>
                                <MainImagePosterCard ratio={(displayGroupList[item.galleryId!] || [])[0].galleryRaito || 100} alwaysShowRatio={true}>
                                    {(item.galleryId && displayGroupList[item.galleryId] || []).map(({ title, id, poster_path, top, width, left, zIndex, season, galleryRaito }, index) =>
                                        <Image
                                            width={0}
                                            height={0}
                                            sizes="33vw"
                                            key={`image${id}`}
                                            className={ImageStyle.metalFrame}
                                            style={{ top: `${top}%`, width: `${width * (galleryRaito || 100) / 100}%`, height: 'auto', left: `${left}%`, zIndex: zIndex ?? undefined, cursor: 'pointer', userSelect: 'none', pointerEvents: 'auto' }}
                                            src={poster_path}
                                            alt={title}
                                            draggable={false}
                                            onContextMenu={e => e.preventDefault()}
                                            onClick={() => {
                                                setDialogImageId(id);
                                            }}
                                        />
                                    )}
                                </MainImagePosterCard>
                            </div>
                            <div className={posterCardExplainContainer}>
                                {(item.galleryId && displayGroupList[item.galleryId] || []).map(({ title, width, height, material }, index) =>
                                    <div key={`explain${index}`} className={posterCardExplain}>
                                        <span style={{ whiteSpace: 'normal' }}>{title}</span>
                                        <span>{`${width} x ${height} cm`}</span>
                                        <span>{material}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                    </div>
                )}
            </div>
            <div className={styles.playerContainer}>
                <Player musicList={musicList} />
            </div>
            {(() => {
                if (dialogImageId) {
                    const target = artworks.find(item => item.id === dialogImageId);
                    return target ? <MainImgDialog targetImg={target} dialogClose={() => { setDialogImageId(null); }} /> : null;
                }
                return null;
            })()}
        </div>
    );
};
export default Gallery;