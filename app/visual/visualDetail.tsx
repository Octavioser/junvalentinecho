"use client";
import { useState } from "react"
import styles from "./visual.module.css"

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

const VisualDetail = ({ movie }: { movie: Movies[] }) => {

    const [showId, setShowId] = useState<number | null>(null);

    const { container, left, right, rightDetail } = styles;

    return (
        <div className={container}>
            <div className={left}>
                {movie.map(({ id, overview, poster_path }) => (
                    <div key={id}
                        style={(showId || id) === id ? { cursor: 'pointer' } : { filter: 'blur(1px)' }}
                        onMouseOver={() => { setShowId(id) }}
                        onMouseOut={() => { setShowId(null) }}
                    >
                        {overview}
                    </div>
                ))}
            </div>
            <div className={right}>
                <div className={rightDetail}>
                    {movie.map(({ id, title, poster_path }) => (
                        <img key={id}
                            style={{
                                display: id === showId ? 'flex' : 'none',
                                maxWidth: '100%', /* 부모 너비를 초과하지 않도록 */
                                maxHeight: '100%', /* 부모 높이를 초과하지 않도록 */
                                objectFit: 'contain' /* 비율을 유지하면서 부모 안에 맞춤 */
                            }}
                            src={poster_path}
                            alt={title}
                        />
                    ))}
                </div>

            </div>
        </div>
    )
}

export default VisualDetail;