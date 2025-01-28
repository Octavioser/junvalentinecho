"use client"

import styles from "./home.module.css"
import { useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react";
import Detaildialog from "./detaildialog/detail-dialog";


interface VideoLink {
    videoId: string; // 비디오의 고유 ID
    key: string; // 비디오 키 (YouTube 등 플랫폼에서 사용)
    name: string; // 비디오 제목
}

interface Movies {
    id: number; // 영화 ID
    poster_path: string; // 포스터 이미지 경로
    vote_average: number; // 평균 평점
    overview: string; // 영화 줄거리
    homepage: string; // 영화 공식 홈페이지 URL
    vdieoLink: VideoLink[]; // 관련 비디오 링크 리스트
    title: string; // 영화 제목
    top: number; // 상단 위치 (CSS 관련 값)
    width: number; // 너비 (CSS 관련 값)
}

const Movie = ({ movie }: { movie: Movies[] }) => {

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

    const { scrollContainer, container, prosterTrack, prosterCard, poster } = styles;

    return (
        <>
            <div className={scrollContainer} ref={scrollRef} onClick={() => { id && setId(0) }}>
                <div className={container} >
                    {movie.map(({ title, id, poster_path, top, width }, index) =>
                        <div className={prosterTrack} key={id}>
                            <div className={prosterCard}>
                                <img className={poster}
                                    style={{ top: `${top}%`, width: `${width}%` }}
                                    src={poster_path}
                                    alt={title}
                                    onClick={() => {
                                        console.log(id)
                                        setId(id)
                                        console.log('setId')
                                    }}>
                                </img>
                            </div>
                        </div>
                    )}
                </div >
            </div>
            {id ? <Detaildialog id={id} movie={movie} /> : <></>}
        </>
    )
}
export default Movie;