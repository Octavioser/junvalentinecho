export interface Artwork {
    id: string; // 영화 ID
    poster_path: string; // 이미지 경로
    size: string; // 사이즈
    title: string; // 영화 제목
    overview: string; // 내용   
    season: string; // 시즌
    insertDt: string; // 등록일
    updateDt: string | null; // 수정일
    top: number | null; // 상단 위치 (CSS 관련 값)
    width: number | null; // 너비 (CSS 관련 값)
    left: number | null; // 왼쪽 위치 (CSS 관련 값)
    zIndex: number | null; // z-index (CSS 관련 값)
    galleryId: number | null; // 갤러리 ID
    visualYn: string | null; // 비주얼 ID
}

export type ArtworkList = Artwork[];