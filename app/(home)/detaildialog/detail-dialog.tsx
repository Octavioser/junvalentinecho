import styles from "./detail.module.css"


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

const detaildaialog = ({ id, movie }: { id: number, movie: Movies[] }) => {

    console.log('rendering!!')

    const { detaildialog, infoContainer, poster, title, info, container } = styles;

    const { homepage, overview, poster_path, title: movieTitle, vote_average, vdieoLink } = movie.find(({ id: movieId }) => id === movieId);

    return <div className={detaildialog}>
        <div className={container}>
            <img className={poster} src={poster_path} alt={movieTitle}></img>
            <div className={info}>
                <h1 >{movieTitle}</h1>
                <h3>⭐{vote_average.toFixed(2)}</h3>
                <p>{overview}</p>
                <a href={homepage} target={"_blank"}>Homepage &rarr;</a>
            </div>
        </div>
        <div className={container}>
            {vdieoLink.map(({ videoId, key, name }) =>
                <iframe key={videoId}
                    src={`https://youtube.com/embed/${key}`}
                    title={name}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                />
            )}
        </div>
    </div>
}

export default detaildaialog;