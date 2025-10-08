export interface Artwork {
    id: string; // 영화 ID
    poster_path: string; // 이미지 경로
    title: string; // 영화 제목
    overview: string; // 내용   
    season: string; // 시즌
    year: number; // 년도
    material: string | null; // 재료
    location: string | null; // 위치
    insertDt: string; // 등록일
    updateDt: string | null; // 수정일
    galleryId: number | null; // 갤러리 ID
    galleryRaito: number | null; // 갤러리 비율
    visualYn: string | null; // 비주얼 ID
    width: number; // 실제 길이
    height: number; // 실제높이

    top: number | null; // 상단 위치 (CSS 관련 값)
    left: number | null; // 왼쪽 위치 (CSS 관련 값)
    zIndex: number | null; // z-index (CSS 관련 값)
}