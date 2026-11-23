import { useEffect, useState } from "react";
import { useThree } from "@react-three/fiber";
import { CanvasTexture, ImageLoader, SRGBColorSpace, Texture, TextureLoader, Vector2, WebGLRenderer } from "three";

const MIN_SIDE = 2048; // 원본을 걸 때: 작은 화면에서도 긴 변은 적어도 이만큼 (원본이 더 작으면 원본 크기)
const MAX_SIDE = 4096; // 아무리 큰 화면에서도 긴 변은 이만큼까지
const MARGIN = 1.25;   // 화면에 꽉 찼을 때 크기보다 이만큼 여유 있게

const finish = <T extends Texture>(texture: T, gl: WebGLRenderer) => {
    texture.colorSpace = SRGBColorSpace;
    texture.anisotropy = Math.min(8, gl.capabilities.getMaxAnisotropy());
    return texture;
};

// 받은 원본을 "그림 앞으로 다가갔을 때 화면에 꽉 차는 크기"보다 조금 크게만 줄여서 캔버스에 그림.
// 원본은 가로·세로가 수천 픽셀이라 그대로 그래픽 카드에 올리면 메모리를 수백 MB 쓰고, 그보다 크게 올려도 화면에 보이는 건 같음
const fitToScreen = async (image: HTMLImageElement, gl: WebGLRenderer) => {
    const screen = gl.getDrawingBufferSize(new Vector2()); // 화면 픽셀 수 (기기 배율 포함)
    const longSide = Math.max(image.naturalWidth, image.naturalHeight);
    const fitScreen = Math.min(screen.x / image.naturalWidth, screen.y / image.naturalHeight) * MARGIN;
    const scale = Math.min(1, Math.min(MAX_SIDE, gl.capabilities.maxTextureSize) / longSide, Math.max(fitScreen, MIN_SIDE / longSide));
    const width = Math.max(1, Math.round(image.naturalWidth * scale));
    const height = Math.max(1, Math.round(image.naturalHeight * scale));

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d')!;
    // 큰 원본을 풀고 줄이는 일은 화면이 멈추지 않게 브라우저에 따로 맡김. 못 하는 브라우저는 바로 그림
    const resized = await createImageBitmap(image, { resizeWidth: width, resizeHeight: height, resizeQuality: 'high' }).catch(() => null);
    if (resized) { context.drawImage(resized, 0, 0); resized.close(); }
    else { context.imageSmoothingQuality = 'high'; context.drawImage(image, 0, 0, width, height); }
    return canvas;
};

// 그림 한 장의 텍스처. Suspense 없이: 준비될 때까지 null, 실패하면 계속 null (그 그림만 빠짐).
//
// - copy: 화면용으로 줄인 사본 (수십~수백 KB). 벽에 걸린 모든 그림이 먼저 이걸로 걸려서 3D 화면이 바로 뜨고 걸어 다닐 때 버벅이지 않음.
//   그림의 가로·세로 비율, 투명한 곳 확인, 그림자 모양도 이걸로 봄 (원본으로 바뀌어도 그대로)
// - texture: 화면에 보여 줄 것. wantOriginal(그 그림 앞으로 다가감)이면 원본 파일(수 MB)을 받아서, 다 준비되면 사본 대신 이걸로 바꿈.
//   wantOriginal이 꺼지면 원본을 내려놓고 사본으로 돌아감 (원본을 여러 장 들고 있으면 메모리를 많이 씀)
export function useArtworkTexture(copyUrl: string, originalUrl: string, wantOriginal: boolean) {
    const gl = useThree(state => state.gl);
    const invalidate = useThree(state => state.invalidate);
    const [copy, setCopy] = useState<Texture | null>(null);
    const [original, setOriginal] = useState<Texture | null>(null);

    useEffect(() => {
        let alive = true;
        let loaded: Texture | null = null;
        new TextureLoader().load(copyUrl, result => {
            if (!alive) { result.dispose(); return; }
            loaded = finish(result, gl);
            setCopy(loaded);
            invalidate();
        }, undefined, () => { /* 이미지 실패: 이 그림만 표시 안 함 */ });

        return () => {
            alive = false;
            loaded?.dispose();
            setCopy(null);
        };
    }, [copyUrl, gl, invalidate]);

    const ready = !!copy; // 사본이 걸린 다음에 원본을 받기 시작 (둘을 같이 받으면 사본이 늦어짐)
    useEffect(() => {
        if (!wantOriginal || !ready) return;
        let alive = true;
        let loaded: Texture | null = null;
        new ImageLoader().load(originalUrl, async (image) => {
            try {
                const canvas = await fitToScreen(image, gl);
                if (!alive) return;
                loaded = finish(new CanvasTexture(canvas), gl);
                setOriginal(loaded);
                invalidate();
            } catch { /* 원본 실패: 사본을 계속 보여 줌 */ }
        }, undefined, () => { /* 원본 실패: 사본을 계속 보여 줌 */ });

        return () => {
            alive = false;
            loaded?.dispose();
            setOriginal(null);
            invalidate();
        };
    }, [originalUrl, wantOriginal, ready, gl, invalidate]);

    return { copy, texture: original ?? copy };
}
