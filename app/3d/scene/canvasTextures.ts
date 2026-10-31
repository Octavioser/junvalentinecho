import { CanvasTexture, LinearFilter, RepeatWrapping, SRGBColorSpace } from "three";
import { Artwork } from "@/types";
import { formatSize } from "@/common/format";
import { ColorGrid } from "./photoSamples";

const makeCanvas = (width: number, height: number) => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    return { canvas, ctx: canvas.getContext('2d')! };
};

const hexRgb = (hex: string) => {
    const n = parseInt(hex.slice(1), 16);
    return [n >> 16, (n >> 8) & 255, n & 255];
};

// 축 위에서 value 양옆 칸과 보간 비율. 축 범위 밖은 끝 칸 값을 그대로 씀
const locate = (axis: number[], value: number): [number, number, number] => {
    const ascending = axis[axis.length - 1] > axis[0];
    for (let i = 0; i < axis.length - 1; i++) {
        if (ascending ? value <= axis[i + 1] : value >= axis[i + 1]) {
            const t = (value - axis[i]) / (axis[i + 1] - axis[i]);
            return [i, i + 1, Math.min(1, Math.max(0, t))];
        }
    }
    return [axis.length - 1, axis.length - 1, 0];
};

// sRGB ↔ 선형 변환표 (픽셀마다 pow를 부르면 3D 페이지 열 때 화면이 멈춤)
const SRGB_TO_LINEAR = Float32Array.from({ length: 256 }, (_, v) => {
    const c = v / 255;
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
});
const LINEAR_STEPS = 4095;
const LINEAR_TO_SRGB = Uint8ClampedArray.from({ length: LINEAR_STEPS + 1 }, (_, i) => {
    const c = i / LINEAR_STEPS;
    return Math.round(255 * (c <= 0.0031308 ? c * 12.92 : 1.055 * Math.pow(c, 1 / 2.4) - 0.055));
});
const linearToSrgb = (c: number) => LINEAR_TO_SRGB[Math.round(Math.min(1, Math.max(0, c)) * LINEAR_STEPS)];

// 모서리 그늘처럼 가로·세로로 나눠지는 밝기 배율 (캔버스 위치 0~1 → 배율)
export type Shade = { x?: (fx: number) => number; y?: (fy: number) => number; };

// 사진에서 뽑은 색 격자를 면 하나 크기의 부드러운 텍스처로 펼침.
// u = 캔버스 왼쪽→오른쪽의 cols 축 값, v = 위→아래의 rows 축 값
export function gridTexture(grid: ColorGrid, u: [number, number], v: [number, number], width = 128, height = 32, shade: Shade = {}) {
    const { canvas, ctx } = makeCanvas(width, height);
    const image = ctx.createImageData(width, height);
    const rgb = grid.colors.map(row => row.map(hexRgb));
    // 열·행마다 한 번씩만 계산
    const columns = Array.from({ length: width }, (_, x) => {
        const fx = (x + 0.5) / width;
        return { at: locate(grid.cols, u[0] + (u[1] - u[0]) * fx), light: shade.x ? shade.x(fx) : 1 };
    });

    for (let y = 0; y < height; y++) {
        const fy = (y + 0.5) / height;
        const [r0, r1, rt] = locate(grid.rows, v[0] + (v[1] - v[0]) * fy);
        const rowLight = shade.y ? shade.y(fy) : 1;
        for (let x = 0; x < width; x++) {
            const { at: [c0, c1, ct], light: columnLight } = columns[x];
            const light = rowLight * columnLight;
            const i = (y * width + x) * 4;
            for (let k = 0; k < 3; k++) {
                const upper = rgb[r0][c0][k] * (1 - ct) + rgb[r0][c1][k] * ct;
                const lower = rgb[r1][c0][k] * (1 - ct) + rgb[r1][c1][k] * ct;
                const value = upper * (1 - rt) + lower * rt;
                image.data[i + k] = light === 1 ? value : linearToSrgb(SRGB_TO_LINEAR[Math.round(value)] * light);
            }
            image.data[i + 3] = 255;
        }
    }
    ctx.putImageData(image, 0, 0);

    const texture = new CanvasTexture(canvas);
    texture.colorSpace = SRGBColorSpace;
    texture.generateMipmaps = false;
    texture.minFilter = LinearFilter;
    return texture;
}

// 페인트 벽의 아주 옅은 얼룩 (완전히 평평한 CG 벽처럼 보이지 않게). 한 칸 PAINT_TILE m, 이음매 없이 반복
export const PAINT_TILE = 2.4;

export function paintTexture() {
    const px = 128; // 아주 옅은 얼룩이라 이 정도면 충분 (크면 3D 페이지 열 때 계산이 길어짐)
    const { canvas, ctx } = makeCanvas(px, px);
    let seed = 5;
    const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    // 주기적인 값 노이즈 (격자 끝이 처음과 이어짐)
    const octave = (cells: number) => {
        const lattice = Array.from({ length: cells * cells }, rand);
        const at = (i: number, j: number) => lattice[((j % cells) * cells) + (i % cells)];
        return (x: number, y: number) => {
            const gx = x * cells, gy = y * cells;
            const i = Math.floor(gx), j = Math.floor(gy);
            const tx = gx - i, ty = gy - j;
            const sx = tx * tx * (3 - 2 * tx), sy = ty * ty * (3 - 2 * ty);
            const top = at(i, j) * (1 - sx) + at(i + 1, j) * sx;
            const bottom = at(i, j + 1) * (1 - sx) + at(i + 1, j + 1) * sx;
            return top * (1 - sy) + bottom * sy;
        };
    };
    const layers = [{ noise: octave(3), amp: 0.012 }, { noise: octave(9), amp: 0.007 }, { noise: octave(32), amp: 0.004 }];
    const image = ctx.createImageData(px, px);
    let sum = 0;
    for (let y = 0; y < px; y++) {
        for (let x = 0; x < px; x++) {
            let light = 1 - 0.02;
            for (const { noise, amp } of layers) light += (noise(x / px, y / px) - 0.5) * 2 * amp;
            const value = linearToSrgb(Math.min(1, light));
            const i = (y * px + x) * 4;
            image.data[i] = image.data[i + 1] = image.data[i + 2] = value;
            image.data[i + 3] = 255;
            sum += Math.min(1, light);
        }
    }
    ctx.putImageData(image, 0, 0);

    const texture = new CanvasTexture(canvas);
    texture.colorSpace = SRGBColorSpace;
    texture.wrapS = texture.wrapT = RepeatWrapping;
    return { texture, mean: sum / (px * px) };
}

// 천장 조명이 그림 주변 벽에 만드는 밝은 빛 웅덩이 (가운데가 밝고 가장자리로 갈수록 사라짐)
export function lightPoolTexture() {
    const px = 256;
    const { canvas, ctx } = makeCanvas(px, px);
    const gradient = ctx.createRadialGradient(px / 2, px / 2, 0, px / 2, px / 2, px / 2);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.45)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, px, px);
    const texture = new CanvasTexture(canvas);
    texture.colorSpace = SRGBColorSpace;
    return texture;
}

// 그림 뒤 벽에 떨어지는 부드러운 그림자. 반환 크기(m)만큼의 판에 붙임
export function shadowTexture(width: number, height: number, blur: number) {
    const pad = blur * 2;
    const planeW = width + pad * 2, planeH = height + pad * 2;
    const pxPerM = Math.min(600, 512 / Math.max(planeW, planeH));
    const cw = Math.ceil(planeW * pxPerM), ch = Math.ceil(planeH * pxPerM);
    const { canvas, ctx } = makeCanvas(cw, ch);
    // 사각형은 캔버스 밖에 그리고 그림자만 안으로 들여옴
    ctx.shadowColor = 'rgba(40, 48, 60, 1)';
    ctx.shadowBlur = blur * pxPerM;
    ctx.shadowOffsetX = cw * 2;
    ctx.fillRect(pad * pxPerM - cw * 2, pad * pxPerM, width * pxPerM, height * pxPerM);

    const texture = new CanvasTexture(canvas);
    texture.colorSpace = SRGBColorSpace;
    return { texture, width: planeW, height: planeH };
}

// 그림 옆 벽 캡션 (홈 화면 캡션과 같은 구성: 제목 / 크기 / 재료)
export async function captionTexture({ title, width, height, material }: Artwork) {
    const pxPerM = 1400;
    const titleSize = 0.05 * pxPerM, bodySize = 0.036 * pxPerM, maxWidth = 0.62 * pxPerM;
    const family = `${getComputedStyle(document.body).fontFamily}, "Apple SD Gothic Neo", "Malgun Gothic", "Noto Sans KR", sans-serif`;
    const titleFont = `italic 600 ${titleSize}px ${family}`;
    const bodyFont = `300 ${bodySize}px ${family}`;

    try {
        await Promise.race([
            Promise.all([document.fonts.load(titleFont, `${title}A`), document.fonts.load(bodyFont, 'A')]),
            new Promise(resolve => setTimeout(resolve, 1500)),
        ]);
    } catch { /* 폰트를 못 불러와도 기본 글꼴로 그림 */ }

    const measure = makeCanvas(1, 1).ctx;
    measure.font = titleFont;
    const titleLines: string[] = [];
    for (const word of title.split(/\s+/)) {
        const last = titleLines[titleLines.length - 1];
        if (last && measure.measureText(`${last} ${word}`).width <= maxWidth) titleLines[titleLines.length - 1] = `${last} ${word}`;
        else titleLines.push(word);
    }
    const bodyLines = [formatSize(width, height), material].filter((line): line is string => !!line);

    const lineGap = 1.45;
    const cw = Math.ceil(maxWidth);
    const ch = Math.ceil(titleLines.length * titleSize * lineGap + bodyLines.length * bodySize * lineGap + bodySize * 0.4);
    const { canvas, ctx } = makeCanvas(cw, ch);
    ctx.fillStyle = '#25272c';
    ctx.textBaseline = 'top';
    let y = 0;
    ctx.font = titleFont;
    for (const line of titleLines) { ctx.fillText(line, 0, y, maxWidth); y += titleSize * lineGap; }
    ctx.font = bodyFont;
    for (const line of bodyLines) { ctx.fillText(line, 0, y, maxWidth); y += bodySize * lineGap; }

    const texture = new CanvasTexture(canvas);
    texture.colorSpace = SRGBColorSpace;
    // 사이트 span처럼 세로로 0.75배
    return { texture, width: cw / pxPerM, height: (ch / pxPerM) * 0.75 };
}
