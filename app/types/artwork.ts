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
    groupWinSize: number | null; // 전시창 크기 (cm)
    visualYn: string | null; // 비주얼 ID
    visualOrder?: number | null; // 2D 표시 순서 (없으면 등록한 순서대로 뒤에)
    captionOrder?: number | null; // 홈 화면 카드 옆 설명 순서, 그룹 안에서 (없으면 위에 걸린 그림부터)
    galleryHidden?: boolean | null; // 홈 화면에서 이 그림의 그룹(카드)을 가려 둠. 그룹의 모든 그림에 같이 적음 (관리자 "가리기")
    wallOrder?: number | null; // 3D 전시장 벽에 거는 순서 (값이 있는 그림만 3D에 걸림. 홈 화면과 별개)
    seasonOrder?: number | null; // 시즌 안에서의 순서 (없으면 등록한 순서대로 뒤에)
    width: number; // 실제 길이
    height: number; // 실제높이

    top: number | null; // 상단 위치 (CSS 관련 값)
    left: number | null; // 왼쪽 위치 (CSS 관련 값)
    zIndex: number | null; // z-index (CSS 관련 값)
}

export interface MusicBlob {
    id: string;
    url: string;
    downloadUrl: string;
    pathname: string;
    uploadedAt: string;
    title: string;
}