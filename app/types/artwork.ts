export interface Artwork {
    id: string; // 영화 ID
    galleryId: string; // 갤러리 ID
    poster_path: string; // 이미지 경로
    size: string; // 사이즈
    title: string; // 영화 제목
    overview: string; // 내용   
    season: string; // 시즌
    createdDt: string; // 생성일
    insertDt: string; // 등록일
    updateDt: string; // 수정일
    page: string; // 페이지
    top: number; // 상단 위치 (CSS 관련 값)
    width: number; // 너비 (CSS 관련 값)
    left: number; // 왼쪽 위치 (CSS 관련 값)
    zIndex: number; // z-index (CSS 관련 값)
}

export type ArtworkList = Artwork[];