import { useEffect, useMemo, useState } from "react";
import { ThreeEvent, useThree } from "@react-three/fiber";
import { AdditiveBlending, Texture } from "three";
import { HANG, ROOM, WallItem } from "../wallLayout";
import { captionTexture, lightPoolTexture, shadowTexture } from "./canvasTextures";
import { useImageTexture } from "./useImageTexture";

const FRAME = 0.004;         // 메탈 프레임 테두리
const DEPTH = 0.025;         // 벽에서 튀어나온 두께
const ARTWORK_TINT = '#dfe1e6'; // 사진 속 흰 벽 밝기에 맞춘 노출 (그림 속 흰색이 벽보다 살짝만 밝게)
const POOL_OPACITY = 0.035;  // 그림을 비추는 천장 조명의 빛 웅덩이 세기 (티 나지 않을 정도로만)
const CAPTION_GAP = 0.2;
const CAPTION_Y = 1.32;
const CLICK_SLOP = 8;        // 이보다 많이 움직였으면 드래그로 봄 (px)

// 같은 출처의 Next 이미지 최적화를 거쳐 큰 원본을 줄여서 받음 (홈 <Image>와 같은 주소라 캐시 공유)
const textureUrl = ({ poster_path }: WallItem['artwork'], width: number) =>
    `/_next/image?url=${encodeURIComponent(poster_path)}&w=${width > 2 ? 1920 : 1080}&q=75`;

const decal = { transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -2 };

let poolTexture: Texture | null = null; // 모든 그림이 같이 쓰는 빛 웅덩이 무늬
const getPoolTexture = () => poolTexture ??= lightPoolTexture();

export default function ArtworkPiece({ item, onSelect }: { item: WallItem; onSelect: (id: string) => void; }) {
    const { artwork, width, z } = item;
    const gl = useThree(state => state.gl);
    const invalidate = useThree(state => state.invalidate);
    const texture = useImageTexture(textureUrl(artwork, width));

    // 높이는 홈 화면처럼 이미지 비율로 (데이터의 세로 cm는 캡션 표기용)
    const image = texture?.image as HTMLImageElement | undefined;
    const height = image ? width * image.naturalHeight / image.naturalWidth : 0;
    const y = Math.max(HANG.centerY, height / 2 + HANG.minBottom);

    const shadow = useMemo(() => height ? shadowTexture(width + FRAME * 2, height + FRAME * 2, 0.025) : null, [width, height]);
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

    const select = (e: ThreeEvent<MouseEvent>) => {
        e.stopPropagation();
        if (e.delta > CLICK_SLOP) return;
        onSelect(artwork.id);
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
            <mesh position={[0, 0, DEPTH / 2]}>
                <boxGeometry args={[width + FRAME * 2, height + FRAME * 2, DEPTH]} />
                <meshStandardMaterial color="#c8ccd2" metalness={0.4} roughness={0.35} />
            </mesh>
            <mesh
                position={[0, 0, DEPTH + 0.002]}
                onClick={select}
                onPointerOver={() => setCursor('pointer')}
                onPointerOut={() => setCursor('')}
            >
                <planeGeometry args={[width, height]} />
                <meshBasicMaterial map={texture} color={ARTWORK_TINT} />
            </mesh>
            {caption && (
                <mesh position={[width / 2 + FRAME + CAPTION_GAP + caption.width / 2, CAPTION_Y - y, 0.003]} renderOrder={3}>
                    <planeGeometry args={[caption.width, caption.height]} />
                    <meshBasicMaterial map={caption.texture} {...decal} />
                </mesh>
            )}
        </group>
    );
}
