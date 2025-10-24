"use client";

import styles from "./home.module.css";
import { use, useEffect, useRef, useState, RefObject } from "react";
import MainImagePosterCard from "../components/MainImage/MainImagePosterCard";
import ImageStyle from "../components/MainImage/MainImage.module.css";
import { Artwork } from "@/types";
import Link from "next/link";
import Player from "./(player)/Player";
import { useArtworks } from "@/providers/ArtworksProvider";
import MainImageRatio from "@/components/MainImage/MainImageRatio";

const Gallery = () => {
    const { artworks } = useArtworks();

    const scrollRef = useRef<HTMLDivElement>(null); // Ref 생성
    const cardFrame = useRef<Array<HTMLDivElement>>([]);
    const targetDisplayId = useRef<string | null>(null);


    const [groupIdList, setGroupIdList] = useState<Artwork[]>([]);
    const [displayGroupList, setDisplayGroupList] = useState<{ [x: string]: Artwork[]; }>({});

    useEffect(() => {
        const scrollContainer = scrollRef.current;
        if (!scrollContainer) return;

        const handleWheel = (e: WheelEvent) => {
            e.preventDefault(); // 기본 수직 스크롤 방지
            if (e.ctrlKey) {
                if (targetDisplayId.current) {
                    setGroupIdList((prev) => prev.map((art) =>
                        art.id === targetDisplayId.current ? { ...art, galleryRaito: art.galleryRaito + (e.deltaY > 0 ? 1 : -1) } : art
                    ));
                }
            }
            else {
                scrollContainer.scrollLeft += e.deltaY; // 수직 휠 움직임을 가로 스크롤로 변환
            }
        };

        // 이벤트 리스너 추가
        scrollContainer.addEventListener('wheel', handleWheel, { passive: false });

        // 컴포넌트 언마운트 시 이벤트 리스너 제거
        return () => {
            scrollContainer.removeEventListener('wheel', handleWheel);
        };
    }, []);

    useEffect(() => {
        // 중복된 galleryId를 가진 Artwork 객체를 제거
        setGroupIdList(
            Array.from(new Map(artworks.filter((item) => item.galleryId).map(item => [item.galleryId, item])).values()) || []
        );

        setDisplayGroupList(
            artworks.reduce((acc: { [key: string]: Artwork[]; }, cur: Artwork) => {
                const key = `${cur.galleryId}`;
                if (acc[key]) return { ...acc, [key]: acc[key].concat([cur]) };
                return { ...acc, [key]: [cur] };
            }, {})
        );
    }, [artworks]);

    useEffect(() => {
        if (!scrollRef.current) return;
        const observer = new IntersectionObserver(entries => {
            const list = entries.filter(e => e.isIntersecting);
            targetDisplayId.current = (list[0]?.target as HTMLElement)?.dataset?.groupid || null;
        }, {
            root: scrollRef.current,
            threshold: 0.5, // 절반이상 보일때
        });

        cardFrame.current.forEach(el => el && observer.observe(el));
        return () => observer.disconnect();
    }, [groupIdList.length]);


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
                {groupIdList.map(({ id, galleryId, galleryRaito }) =>
                    <div key={id} className={posterTrack}>
                        <div className={posterCardFrame} ref={(el) => { if (el) cardFrame.current.push(el); }} data-groupid={id}>
                            <div style={{ width: '100%', aspectRatio: 1 / 1 }}>
                                <MainImagePosterCard>
                                    {(displayGroupList[galleryId] || []).map(({ title, id, poster_path, top, width, left, zIndex, season }, index) =>
                                        <Link href={`/season/${season}?id=${id}`} key={id}>
                                            <img
                                                className={ImageStyle.metalFrame}
                                                style={{ top: `${top}%`, width: `${width * galleryRaito / 100}%`, left: `${left}%`, zIndex, cursor: 'pointer', userSelect: 'none' }}
                                                src={poster_path}
                                                alt={title}
                                                draggable={false}
                                                onContextMenu={e => e.preventDefault()}
                                            >
                                            </img>
                                        </Link>
                                    )}
                                </MainImagePosterCard>
                                {galleryRaito && <MainImageRatio ratio={galleryRaito} />}
                            </div>
                            <div className={posterCardExplainContainer}>
                                {(displayGroupList[galleryId] || []).map(({ title, width, height, material }, index) =>
                                    <div key={`explain${index}`} className={posterCardExplain}>
                                        <span>{title}</span>
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
                <Player />
            </div>
        </div>
    );
};
export default Gallery;