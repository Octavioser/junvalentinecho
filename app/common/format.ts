// 화면에 보이는 길이 (소수점은 점: 40.12)
export const formatLength = (value: number) => String(value);

// 그림 크기에 쓰는 길이: 소수점이 없으면 .0을 붙임 (60 → 60.0 / 35.2 → 35.2)
const formatSizeLength = (value: number) => {
    const text = formatLength(value);
    return text.includes('.') ? text : `${text}.0`;
};

// 그림 크기 숫자만: 미술 작품 표기 관례대로 세로 x 가로 (관리자 표처럼 단위를 따로 쓰는 곳용)
export const formatSizeNumbers = (width: number, height: number) => `${formatSizeLength(height)} x ${formatSizeLength(width)}`;

// 그림 크기: 세로 x 가로 cm
export const formatSize = (width: number, height: number) => `${formatSizeNumbers(width, height)} cm`;
