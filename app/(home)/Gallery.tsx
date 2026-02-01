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

    const [dialogImage, setDialogImage] = useState<Artwork | null>(null);

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
    useEffect(() => {
        const scrollContainer = scrollRef.current;
        if (!scrollContainer) return;

        const handleWheel = (e: WheelEvent) => {
            e.preventDefault(); // 기본 수직 스크롤 방지
            scrollContainer.scrollLeft += e.deltaY; // 수직 휠 움직임을 가로 스크롤로 변환
        };

        // iOS Safari gesture* 이벤트 막기 
        const onGestureStart = (e: Event) => { e.preventDefault(); };
        const onGestureChange = (e: Event) => { e.preventDefault(); };
        const onGestureEnd = (e: Event) => { e.preventDefault(); };

        let lastX = 0;
        let lastTime = 0;
        let velocity = 0;
        let rafId = 0;

        let lastDist = 0;

        let mode: 'none' | 'drag' | 'pinch' = 'none';

        // 두 손가락 사이 거리 계산
        const getDistFromTouches = (touches: TouchList) => {
            const t1 = touches[0];
            const t2 = touches[1];
            const dx = t2.clientX - t1.clientX;
            const dy = t2.clientY - t1.clientY;
            return Math.hypot(dx, dy);
        };

        const onTouchStart = (e: TouchEvent) => {
            cancelAnimationFrame(rafId);
            if (e.touches.length === 1) {
                // 가로 스크롤 시작
                mode = 'drag';
                lastX = e.touches[0].clientX;
                lastTime = Date.now();
                velocity = 0;
            }
            if (e.touches.length === 2) {
                // 핀치 시작 - 핀치는 개별 카드에서 처리 (react-zoom-pan-pinch)
                mode = 'pinch';
                // lastDist = getDistFromTouches(e.touches); // 제거
            }
            velocity = 0; // 드래그 관성값은 무효
        };

        const onTouchMove = (e: TouchEvent) => {
            e.preventDefault();
            if (mode === 'drag' && e.touches.length === 1) {
                const x = e.touches[0].clientX;
                const now = Date.now();

                // 이동량
                const delta = x - lastX;

                // 스크롤 이동
                scrollContainer.scrollLeft -= delta;

                // 속도 계산 (px/ms)
                velocity = delta / (now - lastTime);

                lastX = x;
                lastTime = now;
            }
            if (mode === 'pinch' && e.touches.length >= 2) {
                // 개별 카드에서 처리하므로 글로벌 로직 제거
            }
        };

        const onTouchEnd = (e: TouchEvent) => {
            if (mode === 'drag') {
                // 드래그 제스처가 완전히 끝났을 때만 관성
                const inertia = () => {
                    scrollContainer.scrollLeft -= velocity * 20;
                    velocity *= 0.95;
                    if (Math.abs(velocity) > 0.01) {
                        rafId = requestAnimationFrame(inertia);
                    }
                };
                requestAnimationFrame(inertia);

            }
            if (mode === 'pinch') {
                lastDist = 0;
            }
            mode = 'none';
        };

        // 이벤트 리스너 추가
        scrollContainer.addEventListener('wheel', handleWheel, { passive: false });

        document.addEventListener('gesturestart', onGestureStart, { passive: false } as AddEventListenerOptions);
        document.addEventListener('gesturechange', onGestureChange, { passive: false } as AddEventListenerOptions);
        document.addEventListener('gestureend', onGestureEnd, { passive: false } as AddEventListenerOptions);

        document.addEventListener('touchstart', onTouchStart, { passive: false });
        document.addEventListener('touchmove', onTouchMove, { passive: false });
        document.addEventListener('touchend', onTouchEnd);


        // 컴포넌트 언마운트 시 이벤트 리스너 제거
        return () => {
            scrollContainer.removeEventListener('wheel', handleWheel);

            document.removeEventListener('gesturestart', onGestureStart as any);
            document.removeEventListener('gesturechange', onGestureChange as any);
            document.removeEventListener('gestureend', onGestureEnd as any);

            document.removeEventListener('touchstart', onTouchStart as any);
            document.removeEventListener('touchmove', onTouchMove as any);
            document.removeEventListener('touchend', onTouchEnd as any);
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
                                <MainImagePosterCard initialScale={1} alwaysShowRatio={true}>
                                    {(item.galleryId && displayGroupList[item.galleryId] || []).map(({ title, id, poster_path, top, width, left, zIndex, season, galleryRaito }, index) =>
                                        <Image
                                            width={0}
                                            height={0}
                                            sizes="33vw"
                                            key={`image${id}`}
                                            className={ImageStyle.metalFrame}
                                            style={{ top: `${top}%`, width: `${width * (galleryRaito || 100) / 100}%`, height: 'auto', left: `${left}%`, zIndex: zIndex ?? undefined, cursor: 'pointer', userSelect: 'none' }}
                                            src={poster_path}
                                            alt={title}
                                            draggable={false}
                                            onContextMenu={e => e.preventDefault()}
                                            onClick={() => {
                                                setDialogImage(item);
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
            {dialogImage && <MainImgDialog targetImg={dialogImage} dialogClose={() => { setDialogImage(null); }} />}
        </div>
    );
};
export default Gallery;