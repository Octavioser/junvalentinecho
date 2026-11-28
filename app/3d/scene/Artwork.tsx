import { MutableRefObject, useEffect, useMemo, useState } from "react";
import { ThreeEvent, useThree } from "@react-three/fiber";
import { AdditiveBlending, MathUtils, Texture } from "three";
import { HANG, ROOM, WallItem } from "../wallLayout";
import { captionTexture, lightPoolTexture, shadowTexture } from "./canvasTextures";
import { MoveInput } from "./input";
import { useImageTexture } from "./useImageTexture";
import { photoFov, viewDistanceFor } from "./CameraRig";
import { hasTransparency } from "@/common/image";

const DEPTH = 0.027;         // 그림이 벽에서 떠 있는 거리. 액자 없이 그림만 걺 (예전에는 4mm 금속 액자가 있었음): 벽에 지는 그림자로 떠 보임
const ARTWORK_TINT = '#dfe1e6'; // 사진 속 흰 벽 밝기에 맞춘 노출 (그림 속 흰색이 벽보다 살짝만 밝게)
const POOL_OPACITY = 0.035;  // 그림을 비추는 천장 조명의 빛 웅덩이 세기 (티 나지 않을 정도로만)
const CAPTION_GAP = 0.2;
const CAPTION_Y = 1.32;
const CLICK_SLOP = 8;        // 이보다 많이 움직였으면 누른 게 아니라 끌어서 시선을 돌린 것 (px)

// Next 이미지 최적화가 만들어 주는 사본 너비들 (Next 기본값 imageSizes + deviceSizes 중 텍스처로 쓸 만한 것)
const COPY_WIDTHS = [256, 384, 640, 750, 828, 1080, 1200, 1920];

// 그림 텍스처로 받을 사본의 너비(px): 이 화면에서 그 그림이 가장 크게 보일 때(눌러서 앞으로 다가갔을 때) 차지하는 너비에 맞춤.
// 사본이 화면에 그려지는 크기보다 훨씬 크면 GPU가 줄이면서 캔버스 결 같은 잔무늬가 가로줄(모아레)로 깨져 보임.
// 예전에는 모든 그림을 1080px(2m 넘는 그림은 1920px)로 받아서, 12cm짜리 작은 그림이 휴대폰에서 줄무늬로 보였음 (원본은 더 커서 더 심해짐)
// screenHeight·dpr: 지금 3D 화면의 세로(CSS px)와 화소 배율. width·height: 벽에 걸린 그림 크기(m)
const textureWidth = (width: number, height: number, screenWidth: number, screenHeight: number, dpr: number) => {
    const aspect = screenWidth / screenHeight;
    const fov = photoFov(aspect);
    const visibleHeight = 2 * viewDistanceFor({ width, height }, fov, aspect) * Math.tan(MathUtils.degToRad(fov) / 2);
    const needed = width / visibleHeight * screenHeight * dpr;
    return COPY_WIDTHS.find((copy) => copy >= needed) ?? COPY_WIDTHS[COPY_WIDTHS.length - 1];
};

// 같은 출처의 Next 이미지 최적화를 거쳐 큰 원본을 줄여서 받음 (품질 75는 next.config.js의 images.qualities에 있어야 함)
const textureUrl = (posterPath: string, copyWidth: number) =>
    `/_next/image?url=${encodeURIComponent(posterPath)}&w=${copyWidth}&q=75`;

const decal = { transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -2 };

let poolTexture: Texture | null = null; // 모든 그림이 같이 쓰는 빛 웅덩이 무늬
const getPoolTexture = () => poolTexture ??= lightPoolTexture();

export default function ArtworkPiece({ item, input }: { item: WallItem; input: MutableRefObject<MoveInput>; }) {
    const { artwork, width, z } = item;
    const gl = useThree(state => state.gl);
    const invalidate = useThree(state => state.invalidate);
    const get = useThree(state => state.get);
    // 받을 사본 크기는 처음 그릴 때의 화면 크기로 한 번만 정함 (창 크기를 바꿀 때마다 그림을 새로 받지 않게).
    // 세로 길이는 입력해 둔 실제 크기(cm)로 어림 (그림 파일을 받기 전이라 비율을 아직 모름)
    const url = useMemo(() => {
        const { size, viewport } = get();
        const height = artwork.height > 0 ? artwork.height / 100 : width;
        return textureUrl(artwork.poster_path, textureWidth(width, height, size.width, size.height, viewport.dpr));
    }, [artwork.poster_path, artwork.height, width, get]);
    const texture = useImageTexture(url);

    // 높이는 홈 화면처럼 이미지 비율로 (데이터의 세로 cm는 캡션 표기용)
    const image = texture?.image as HTMLImageElement | undefined;
    const height = image ? width * image.naturalHeight / image.naturalWidth : 0;
    const y = Math.max(HANG.centerY, height / 2 + HANG.minBottom);

    // 배경을 잘라낸 그림(투명한 곳이 있는 그림)은 그림자가 네모가 아니라 그림 모양을 따름
    const cutout = useMemo(() => !!image && hasTransparency(image), [image]);

    const shadow = useMemo(() => {
        if (!height) return null;
        return shadowTexture(width, height, 0.025, cutout ? image : undefined);
    }, [width, height, cutout, image]);
    useEffect(() => () => shadow?.texture.dispose(), [shadow]);

    const [caption, setCaption] = useState<{ texture: Texture; width: number; height: number; } | null>(null);
    useEffect(() => {
        let alive = true;
        let made: Texture | null = null;
        captionTexture(artwork).then(result => {
            made = result.texture;
            if (!alive) { made.dispose(); return; }
            result.texture.anisotropy = Math.min(8, gl.capabilities.getMaxAnisotropy());
            setCaption(result);
            invalidate();
        });
        return () => { alive = false; made?.dispose(); };
    }, [artwork, gl, invalidate]);

    // 그림·캡션이 실제로 붙은 다음 한 번 더 그려야 멈춰 있는 화면에도 나타남
    useEffect(() => { invalidate(); }, [texture, shadow, caption, invalidate]);

    if (!texture) return null;

    // 그림을 누르면 그 앞으로 다가감 (CameraRig가 이동). 다가가 있는 그림을 다시 누르면 보던 방향 그대로 뒤로 물러남
    const pick = (e: ThreeEvent<MouseEvent>) => {
        e.stopPropagation();
        if (e.delta > CLICK_SLOP) return;
        input.current.focus = input.current.focus?.id === artwork.id ? null : { id: artwork.id, z, y, width, height };
        input.current.wake();
    };
    const setCursor = (cursor: string) => { gl.domElement.style.cursor = cursor; };

    // 그룹 기준: x = 벽 따라 안쪽(오른쪽), y = 위, z = 벽에서 방 쪽
    return (
        <group position={[ROOM.artWallX, y, z]} rotation={[0, Math.PI / 2, 0]}>
            {/* 위에서 비추는 조명이라 빛 웅덩이는 그림보다 살짝 위가 중심 */}
            <mesh position={[0, 0.15, 0.0015]} renderOrder={1}>
                <planeGeometry args={[Math.max(width + 2.4, 3), Math.max(height + 2.4, 3)]} />
                <meshBasicMaterial map={getPoolTexture()} opacity={POOL_OPACITY} blending={AdditiveBlending} {...decal} />
            </mesh>
            {shadow && (
                <mesh position={[0.012, -0.018, 0.003]} renderOrder={2}>
                    <planeGeometry args={[shadow.width, shadow.height]} />
                    <meshBasicMaterial map={shadow.texture} opacity={0.22} {...decal} />
                </mesh>
            )}
            {/* 그림. 잘라낸 그림은 투명한 곳으로 벽과 그림자가 비쳐야 하므로 빛 웅덩이·그림자·캡션(1~3)보다 나중에 그림 */}
            <mesh
                position={[0, 0, DEPTH]}
                renderOrder={cutout ? 4 : 0}
                onClick={pick}
                onPointerOver={() => setCursor('pointer')}
                onPointerOut={() => setCursor('')}
            >
                <planeGeometry args={[width, height]} />
                <meshBasicMaterial map={texture} color={ARTWORK_TINT} transparent={cutout} />
            </mesh>
            {caption && (
                <mesh position={[width / 2 + CAPTION_GAP + caption.width / 2, CAPTION_Y - y, 0.003]} renderOrder={3}>
                    <planeGeometry args={[caption.width, caption.height]} />
                    <meshBasicMaterial map={caption.texture} {...decal} />
                </mesh>
            )}
        </group>
    );
}
