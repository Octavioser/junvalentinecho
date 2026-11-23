"use client";

import styles from "./home.module.css";
import { use, useEffect, useRef, useState, RefObject } from "react";
import MainImagePosterCard from "../components/MainImage/MainImagePosterCard";
import FramedImage from "../components/MainImage/FramedImage";
import { Artwork } from "@/types";
import Link from "next/link";
import { useArtworks } from "@/providers/ArtworksProvider";
import { formatSize } from "@/common/format";
import { ARTWORK_QUALITY } from "@/common/image";
import { captionList } from "@/common/order";

import MainImgDialog from "./(mainImgDailog)/MainImgDialog";

const CARD_VMIN = 80 / 1.3; // 카드 한 변의 화면 길이(vmin). home.module.css의 posterCardSquare에서 나옴
const CLICK_SLOP = 8;       // 누른 뒤 이보다 많이 움직였으면 클릭이 아니라 끌기로 봄 (px)

const Gallery = () => {
    const { artworks } = useArtworks();

    const scrollRef = useRef<HTMLDivElement>(null); // Ref 생성
    const cardFrame = useRef<Array<HTMLDivElement>>([]);
    const targetDisplayId = useRef<string | null>(null);


    const [groupIdList, setGroupIdList] = useState<Artwork[]>([]);
    const [displayGroupList, setDisplayGroupList] = useState<{ [x: string]: Artwork[]; }>({});

    const [dialogImageId, setDialogImageId] = useState<string | null>(null);
    const [dialogPreview, setDialogPreview] = useState<string | undefined>(undefined); // 상세창을 열려고 누른 그림의 주소 (창이 열리자마자 그 그림부터 보여 줌)
    const pressStart = useRef<{ x: number; y: number; } | null>(null); // 그림을 누르기 시작한 자리 (끌기와 클릭 구분용)

    // 확대해 본 카드. 평소에는 카드 크기에 맞는 사본을 보여 주고, 확대한 카드의 그림만 원본 파일로 바꿈 (다시 줄여도 원본 유지).
    // 모든 카드를 원본으로 보여 주면 넘길 때마다 수 MB짜리 큰 그림을 풀어야 해서 버벅임
    const [zoomed, setZoomed] = useState<{ [groupId: string]: true; }>({});

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
    // 가로 스크롤만 휠로 지원 (Shift 없이도) + 부드러운 관성 이징
    useEffect(() => {
        const scrollContainer = scrollRef.current;
        if (!scrollContainer) return;

        const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        // 1. 브라우저 줌 전역 차단 (Ctrl + Wheel)
        const preventZoom = (e: WheelEvent) => {
            if (e.ctrlKey) {
                e.preventDefault();
            }
        };

        // 관성 이징 루프 — 실제 scrollLeft를 target 쪽으로 매 프레임 12%씩 당긴다 (ease-out)
        let target = scrollContainer.scrollLeft;
        let raf: number | null = null;
        const tween = () => {
            const cur = scrollContainer.scrollLeft;
            const diff = target - cur;
            if (Math.abs(diff) < 0.4) { scrollContainer.scrollLeft = target; raf = null; return; }
            scrollContainer.scrollLeft = cur + diff * 0.12; // 0.12 작을수록 더 미끄러짐
            raf = requestAnimationFrame(tween);
        };

        // 스크롤바 드래그/네이티브 스크롤 시 target 동기화 (rAF 미실행 중일 때만)
        const syncTarget = () => { if (raf == null) target = scrollContainer.scrollLeft; };
        scrollContainer.addEventListener('scroll', syncTarget, { passive: true });

        // 2. 가로 스크롤 변환 (Ctrl 키 없을 때만) - 캡쳐 단계에서 처리하여 자식 컴포넌트(라이브러리)로 이벤트 전달 방지
        const handleScroll = (e: WheelEvent) => {
            if (!e.ctrlKey && e.deltaY !== 0) {
                if (reducedMotion) {
                    // 동작 줄이기: 기존처럼 즉시 스크롤
                    scrollContainer.scrollLeft += e.deltaY;
                } else {
                    const max = scrollContainer.scrollWidth - scrollContainer.clientWidth;
                    if (raf == null) target = scrollContainer.scrollLeft;
                    target = Math.max(0, Math.min(max, target + e.deltaY));
                    if (raf == null) raf = requestAnimationFrame(tween);
                }
                // 이벤트 전파 중단 (MainImagePosterCard가 이 이벤트를 받지 못하게 함 -> 줌 안됨)
                e.stopPropagation();
                // 브라우저 기본 가로 스크롤이 동시에 적용돼 이중으로 움직이는 것 방지
                e.preventDefault();
            }
        };

        window.addEventListener('wheel', preventZoom, { passive: false });
        // 스크롤 컨테이너에 캡쳐 리스너 등록
        scrollContainer.addEventListener('wheel', handleScroll, { passive: false, capture: true });

        return () => {
            window.removeEventListener('wheel', preventZoom);
            scrollContainer.removeEventListener('wheel', handleScroll, { capture: true } as any);
            scrollContainer.removeEventListener('scroll', syncTarget);
            if (raf) cancelAnimationFrame(raf);
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
                            <div className={styles.posterCardSquare}>
                                <MainImagePosterCard winSize={(displayGroupList[item.galleryId!] || [])[0].groupWinSize || 1000} alwaysShowRatio={true}
                                    onScaleChange={(scale) => { if (scale > 1.01) setZoomed(prev => prev[item.id] ? prev : { ...prev, [item.id]: true }); }}
                                >
                                    {(item.galleryId && displayGroupList[item.galleryId] || []).map(({ title, id, poster_path, top, width, left, zIndex, season, groupWinSize }, index) => {
                                        const winSize = groupWinSize || 1000;
                                        return (
                                            <FramedImage
                                                width={0}
                                                height={0}
                                                // 확대한 카드: 올린 원본 파일을 그대로 받음. 같은 img의 주소만 바뀌므로 원본이 다 받아질 때까지는 사본이 그대로 보이다가 바뀜.
                                                //   (저장소에서 바로 받는 그림이라 crossOrigin이 있어야 투명한 곳이 있는지 읽을 수 있음)
                                                // 평소: 그림이 화면에서 실제로 차지하는 너비(카드 대비 비율 x 카드 크기)에 맞는 사본
                                                {...(zoomed[item.id]
                                                    ? { unoptimized: true, crossOrigin: 'anonymous' as const }
                                                    : { sizes: `${((width / winSize) * CARD_VMIN).toFixed(1)}vmin`, quality: ARTWORK_QUALITY })}
                                                key={`image${id}`}
                                                style={{ top: `${top}%`, width: `${(width / winSize) * 100}%`, height: 'auto', left: `${left}%`, zIndex: zIndex ?? undefined, cursor: 'pointer', userSelect: 'none', pointerEvents: 'auto' }}
                                                src={poster_path}
                                                alt={title}
                                                draggable={false}
                                                onContextMenu={e => e.preventDefault()}
                                                onPointerDown={(e) => { pressStart.current = { x: e.clientX, y: e.clientY }; }}
                                                onClick={(e) => {
                                                    // 그림 위에서 끌어서 옮긴 뒤 손을 떼도 클릭이 생기므로, 누른 자리에서 거의 안 움직였을 때만 상세창을 엶
                                                    const start = pressStart.current;
                                                    if (start && Math.hypot(e.clientX - start.x, e.clientY - start.y) > CLICK_SLOP) return;
                                                    setDialogPreview(e.currentTarget.currentSrc || undefined);
                                                    setDialogImageId(id);
                                                }}
                                            />
                                        );
                                    })}
                                </MainImagePosterCard>
                            </div>
                            <div className={posterCardExplainContainer}>
                                {/* 설명은 관리자가 정한 순서대로, 정한 적 없으면 카드에서 위에 걸린 그림부터. 그림 목록 자체의 순서는 겹침 순서라 그대로 둠 */}
                                {captionList(item.galleryId && displayGroupList[item.galleryId] || [])
                                    .map(({ title, width, height, material, year }, index) =>
                                        <div key={`explain${index}`} className={posterCardExplain}>
                                            <span style={{ whiteSpace: 'normal', fontWeight: '600', fontStyle: 'italic' }}>{title}</span>
                                            <span>{formatSize(width, height)}</span>
                                            <span>{material}</span>
                                            {/* 연도는 맨 아래 */}
                                            {!!year && <span>{year}</span>}
                                        </div>
                                    )}
                            </div>
                        </div>

                    </div>
                )}
            </div>
            {(() => {
                if (dialogImageId) {
                    const target = artworks.find(item => item.id === dialogImageId);
                    return target ? <MainImgDialog targetImg={target} previewSrc={dialogPreview} dialogClose={() => { setDialogImageId(null); }} /> : null;
                }
                return null;
            })()}
        </div>
    );
};
export default Gallery;;