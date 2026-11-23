import { MutableRefObject, useEffect, useMemo, useState } from "react";
import { ThreeEvent, useThree } from "@react-three/fiber";
import { AdditiveBlending, Texture } from "three";
import { HANG, ROOM, WallItem } from "../wallLayout";
import { captionTexture, lightPoolTexture, shadowTexture } from "./canvasTextures";
import { Focus, MoveInput } from "./input";
import { useArtworkTexture } from "./useImageTexture";
import { hasTransparency } from "@/common/image";

const FRAME = 0.004;         // 메탈 프레임 테두리
const FRAME_COLOR = '#b9bdc4';
const DEPTH = 0.025;         // 벽에서 튀어나온 두께
const ARTWORK_TINT = '#dfe1e6'; // 사진 속 흰 벽 밝기에 맞춘 노출 (그림 속 흰색이 벽보다 살짝만 밝게)
const POOL_OPACITY = 0.035;  // 그림을 비추는 천장 조명의 빛 웅덩이 세기 (티 나지 않을 정도로만)
const CAPTION_GAP = 0.2;
const CAPTION_Y = 1.32;
const CLICK_SLOP = 8;        // 이보다 많이 움직였으면 누른 게 아니라 끌어서 시선을 돌린 것 (px)

// 벽에 거는 사본: 같은 출처의 Next 이미지 최적화를 거쳐 큰 원본을 줄여서 받음 (품질 75는 next.config.js의 images.qualities에 있어야 함)
const copyUrl = ({ poster_path }: WallItem['artwork'], width: number) =>
    `/_next/image?url=${encodeURIComponent(poster_path)}&w=${width > 2 ? 1920 : 1080}&q=75`;

const decal = { transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -2 };

let poolTexture: Texture | null = null; // 모든 그림이 같이 쓰는 빛 웅덩이 무늬
const getPoolTexture = () => poolTexture ??= lightPoolTexture();

export default function ArtworkPiece({ item, input }: { item: WallItem; input: MutableRefObject<MoveInput>; }) {
    const { artwork, width, z } = item;
    const gl = useThree(state => state.gl);
    const invalidate = useThree(state => state.invalidate);
    // 평소에는 줄인 사본을 걸어 두고, 이 그림 앞으로 다가가면 올린 원본 파일로 바꿔 검 (모든 그림을 원본으로 걸면 받는 양과 메모리가 커서 버벅임).
    // 물러나도 원본을 그대로 두었다가(다시 다가가면 바로 보이게) 다른 그림 앞으로 가면 내려놓음: 원본은 한 번에 한 장만
    const [wantOriginal, setWantOriginal] = useState(false);
    useEffect(() => {
        const listeners = input.current.focusListeners;
        const onFocus = (focus: Focus | null) => { if (focus) setWantOriginal(focus.id === artwork.id); };
        listeners.add(onFocus);
        return () => { listeners.delete(onFocus); };
    }, [artwork.id, input]);

    const { copy, texture } = useArtworkTexture(copyUrl(artwork, width), artwork.poster_path, wantOriginal);

    // 높이는 홈 화면처럼 이미지 비율로 (데이터의 세로 cm는 캡션 표기용). 비율·투명한 곳·그림자는 사본으로 봄 (원본으로 바뀌어도 그대로)
    const image = copy?.image as HTMLImageElement | undefined;
    const height = image ? width * image.naturalHeight / image.naturalWidth : 0;
    const y = Math.max(HANG.centerY, height / 2 + HANG.minBottom);

    // 배경을 잘라낸 그림(투명한 곳이 있는 그림)은 네모난 액자 없이 그림 모양대로 걸고, 그림자도 그 모양을 따름
    const cutout = useMemo(() => !!image && hasTransparency(image), [image]);

    const shadow = useMemo(() => {
        if (!height) return null;
        return cutout ? shadowTexture(width, height, 0.025, image) : shadowTexture(width + FRAME * 2, height + FRAME * 2, 0.025);
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
            {/* 4mm 테두리라 조명 계산 없이 밝은 금속색만 칠함 (조명 재질은 셰이더 컴파일이 무거워 첫 화면이 멈춤) */}
            {!cutout && (
                <mesh position={[0, 0, DEPTH / 2]}>
                    <boxGeometry args={[width + FRAME * 2, height + FRAME * 2, DEPTH]} />
                    <meshBasicMaterial color={FRAME_COLOR} />
                </mesh>
            )}
            {/* 잘라낸 그림은 투명한 곳으로 벽과 그림자가 비쳐야 하므로 빛 웅덩이·그림자·캡션(1~3)보다 나중에 그림 */}
            <mesh
                position={[0, 0, DEPTH + 0.002]}
                renderOrder={cutout ? 4 : 0}
                onClick={pick}
                onPointerOver={() => setCursor('pointer')}
                onPointerOut={() => setCursor('')}
            >
                <planeGeometry args={[width, height]} />
                <meshBasicMaterial map={texture} color={ARTWORK_TINT} transparent={cutout} />
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
