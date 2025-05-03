import styles from "./detail.module.css"


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
}

const detaildaialog = ({ id, artworks }: { id: number, artworks: artworks[] }) => {

    const { detaildialog, poster, info, container } = styles;

    const { page, overview, poster_path, title: movieTitle, size } = artworks.find(({ id: movieId }) => id === movieId);

    return <div className={detaildialog}>
        <div className={container}>
            <img className={poster} src={poster_path} alt={movieTitle}></img>
            <div className={info}>
                <h1 >{movieTitle}</h1>
                <h3>{size.toFixed(2)}</h3>
                <p>{overview}</p>
                <a href={page} target={"_blank"}>page &rarr;</a>
            </div>
        </div>
    </div>
}

export default detaildaialog;