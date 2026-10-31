// 화면에 보이는 길이: 소수점은 쉼표로 (40.12 → 40,12)
export const formatLength = (value: number) => String(value).replace('.', ',');

// 작품 크기: 미술 작품 표기 관례대로 세로 x 가로
export const formatSize = (width: number, height: number) => `${formatLength(height)} x ${formatLength(width)} cm`;
