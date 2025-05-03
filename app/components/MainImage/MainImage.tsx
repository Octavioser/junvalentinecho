import styles from "./MainImage.module.css";

interface info {
    id: number; // 영화 ID
    poster_path: string; // 포스터 이미지 경로
    title: string; // 영화 제목
    top: number; // 상단 위치 (CSS 관련 값)
    width: number; // 너비 (CSS 관련 값)
    left: number; // 왼쪽 위치 (CSS 관련 값)
    zIndex: number; // z-index (CSS 관련 값)
    setId: (param: number) => void; // ID 설정 함수
}


const MainImage = ({ title, id, poster_path, top, width, left, zIndex, setId }: info) => {

    const { prosterTrack, prosterCard, metalFrame } = styles;

    return (
        <div className={prosterTrack} key={id}>
            <div className={prosterCard}>
                <img className={metalFrame}
                    style={{ top: `${top}%`, width: `${width}%`, left: `${left}%`, zIndex }}
                    src={poster_path}
                    alt={title}
                    onClick={() => { setId(id) }}>
                </img>
            </div>
        </div>
    )
}

export default MainImage;