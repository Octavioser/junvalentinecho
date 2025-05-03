"use client"

import styles from "./home.module.css"
import { useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react";
import Detaildialog from "./detaildialog/Detaildialog";
import MainImage from "../components/MainImage/MainImage";


interface VideoLink {
    videoId: string; // 비디오의 고유 ID
    key: string; // 비디오 키 (YouTube 등 플랫폼에서 사용)
    name: string; // 비디오 제목
}

interface artworks {
    id: number; // 영화 ID
    poster_path: string; // 포스터 이미지 경로
    size: number; // 평균 평점
    overview: string; // 영화 줄거리
    page: string; // 영화 공식 홈페이지 URL
    title: string; // 영화 제목
    top: number; // 상단 위치 (CSS 관련 값)
    width: number; // 너비 (CSS 관련 값)
    left: number; // 왼쪽 위치 (CSS 관련 값)
    zIndex: number; // z-index (CSS 관련 값)
}

const Gallery = ({ artworks }: { artworks: artworks[] }) => {

    const [id, setId] = useState<number>(0);

    const scrollRef = useRef<HTMLDivElement>(null); // Ref 생성

    useEffect(() => {
        const scrollContainer = scrollRef.current;
        if (!scrollContainer) return;

        const handleWheel = (e: WheelEvent) => {
            e.preventDefault(); // 기본 수직 스크롤 방지
            scrollContainer.scrollLeft += e.deltaY; // 수직 휠 움직임을 가로 스크롤로 변환
        };

        // 이벤트 리스너 추가
        scrollContainer.addEventListener('wheel', handleWheel, { passive: false });

        // 컴포넌트 언마운트 시 이벤트 리스너 제거
        return () => {
            scrollContainer.removeEventListener('wheel', handleWheel);
        };
    }, []);


    // const { push } = useRouter(); push(`/movies/${id}`)

    const { scrollContainer, posterTrack, posterCardFrame } = styles;

    return (
        <>
            <div className={scrollContainer} ref={scrollRef} onClick={() => { id && setId(0) }}>
                {artworks.map(({ title, id, poster_path, top, width, left, zIndex }) =>
                    <div key={id} className={posterTrack}>
                        <div className={posterCardFrame}>
                            <MainImage  {...{ title, id, poster_path, top, width, left, zIndex, setId }} />
                        </div>
                    </div>
                )}
            </div>
            {id ? <Detaildialog id={id} artworks={artworks} /> : <></>}
        </>
    )
}
export default Gallery;