// 그림 파일 업로드 조건과 화면 표시 품질 (관리자 입력창·업로드 허가 경로·공개 화면이 같이 씀)

// 올릴 수 있는 형식 → 저장할 확장자. 브라우저가 보여줄 수 있고 화면용 사본으로 변환되는 형식만
export const IMAGE_TYPES: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/avif': 'avif',
};

export const IMAGE_MAX_BYTES = 4.5 * 1024 * 1024; // 원본 파일 최대 4.5MB
export const IMAGE_MAX_PIXELS = 8192;            // 가로·세로 최대 픽셀 (Vercel 이미지 변환이 받는 원본 한도)

// 작품을 보여줄 때 쓰는 압축 품질 (기본 75보다 높게). next.config.js의 images.qualities에도 있어야 함
export const ARTWORK_QUALITY = 90;

const slug = (s: string) =>
    s
        .trim()                          // 1) 앞뒤 공백 제거
        .toLowerCase()                   // 2) 소문자화
        .replace(/[^\w.-]+/g, "-")       // 3) 영숫자/밑줄(_)/점(.)/하이픈(-) 외 문자를 하이픈으로 치환
        .replace(/-+/g, "-")             // 4) 연속 하이픈을 하나로 축약
        .replace(/^-|-$|^\.+/g, "");     // 5) 선두 하이픈, 끝 하이픈, 선두의 점(숨김파일 방지) 제거

// 저장 경로: images/제목.확장자 (저장소가 뒤에 무작위 글자를 붙여서 주소가 겹치지 않음)
export const imagePath = (title: string, type: string) =>
    `images/${slug(title.replace(/\.[^.]+$/, "")) || 'image'}.${IMAGE_TYPES[type]}`;
