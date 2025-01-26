"use client"

import Link from "next/link";
import styles from "./home.module.css"
import { useRouter } from "next/navigation"
import { on } from "events";
import { useEffect, useRef } from "react";


interface Movie {
    adult: boolean;
    backdrop_path: string;
    genre_ids: number[];
    id: number;
    original_language: string;
    original_title: string;
    overview: string;
    popularity: number;
    poster_path: string;
    release_date: string;
    title: string;
    video: boolean;
    vote_average: number;
    vote_count: number;
}


const Movie = ({ movie }: { movie: Movie[] }) => {

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


    const { push } = useRouter();
    return (
        <div className={styles.scrollContainer} ref={scrollRef}>
            <div className={styles.container} >
                {movie.map(({ title, id, poster_path }) =>
                    <div className={styles.movieCard} key={id}>
                        <img className={styles.moviePoster}
                            src={poster_path}
                            alt={title}
                            onClick={() => { push(`/movies/${id}`) }}>
                        </img>
                    </div>
                )}
            </div >
        </div>
    )
}
export default Movie;