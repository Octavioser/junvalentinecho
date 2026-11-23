import { useEffect, useState } from "react";
import { useThree } from "@react-three/fiber";
import { SRGBColorSpace, Texture, TextureLoader } from "three";

// Suspense 없이 텍스처를 불러옴: 준비될 때까지 null, 실패하면 계속 null (그 그림만 빠짐)
export function useImageTexture(url: string) {
    const gl = useThree(state => state.gl);
    const invalidate = useThree(state => state.invalidate);
    const [texture, setTexture] = useState<Texture | null>(null);

    useEffect(() => {
        let alive = true;
        let loaded: Texture | null = null;
        new TextureLoader().load(url, result => {
            if (!alive) { result.dispose(); return; }
            result.colorSpace = SRGBColorSpace;
            result.anisotropy = Math.min(8, gl.capabilities.getMaxAnisotropy());
            loaded = result;
            setTexture(result);
            invalidate();
        }, undefined, () => { /* 이미지 실패: 이 그림만 표시 안 함 */ });

        return () => {
            alive = false;
            loaded?.dispose();
            setTexture(null);
        };
    }, [url, gl, invalidate]);

    return texture;
}
