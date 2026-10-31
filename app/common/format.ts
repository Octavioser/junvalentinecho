// 화면에 보이는 길이: 소수점은 쉼표로 (40.12 → 40,12)
export const formatLength = (value: number) => String(value).replace('.', ',');

export const formatSize = (width: number, height: number) => `${formatLength(width)} x ${formatLength(height)} cm`;
