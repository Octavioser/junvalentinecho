import { useEffect, useMemo } from "react";
import { useThree } from "@react-three/fiber";
import { BufferAttribute, MeshBasicMaterial, PlaneGeometry } from "three";
import { ROOM } from "../wallLayout";
import { CEILING, ColorGrid, LEFT_WALL } from "./photoSamples";
import { gridTexture, paintTexture, PAINT_TILE } from "./canvasTextures";

// 앞뒤 벽은 그림 벽 중간쯤(앞쪽 16m)의 세로 색 그대로 → 네 벽이 같은 벽으로 보임.
// 정면으로 빛을 덜 받는 만큼만 살짝 어둡게
const END_WALL_S = 16;
const END_WALL_LIGHT = 0.965;

// 바닥도 벽과 같은 재질·색 (그림 벽 아래쪽 밝기). 무늬 없이 모서리 그늘만 얹음
const WHITE_FLOOR = '#cfd2d8';
const FLOOR: ColorGrid = { cols: [0, 1], rows: [0, 1], colors: [[WHITE_FLOOR, WHITE_FLOOR], [WHITE_FLOOR, WHITE_FLOOR]] };

// 모서리 그늘: 맞닿은 면에서 d(m) 떨어진 곳의 밝기 배율
const ao = (d: number, depth: number, reach: number) => 1 - depth * Math.exp(-Math.max(0, d) / reach);

// uv1 = 면 위의 m 좌표. 반복 무늬(페인트 얼룩)를 방 크기와 상관없이 같은 크기로 깔기 위해
const meterPlane = (width: number, height: number) => {
    const geometry = new PlaneGeometry(width, height);
    const uv = geometry.attributes.uv;
    const uv1 = new Float32Array(uv.count * 2);
    for (let i = 0; i < uv.count; i++) {
        uv1[i * 2] = uv.getX(i) * width;
        uv1[i * 2 + 1] = uv.getY(i) * height;
    }
    geometry.setAttribute('uv1', new BufferAttribute(uv1, 2));
    return geometry;
};

export default function Room({ farZ }: { farZ: number; }) {
    const gl = useThree(state => state.gl);
    const length = ROOM.entranceZ - farZ;
    const width = ROOM.rightWallX - ROOM.artWallX;
    const midX = (ROOM.artWallX + ROOM.rightWallX) / 2, midZ = (ROOM.entranceZ + farZ) / 2;
    const midY = ROOM.ceiling / 2;
    const nearS = -ROOM.entranceZ, farS = -farZ; // 앞쪽 거리 s = -z

    // 면 색은 사진에서 뽑은 값 그대로 (조명 없는 재질) + 모서리 그늘과 옅은 페인트 얼룩. 바닥도 같은 재질
    const surfaces = useMemo(() => {
        const paint = paintTexture();
        paint.texture.channel = 1;
        paint.texture.repeat.set(1 / PAINT_TILE, 1 / PAINT_TILE);
        paint.texture.anisotropy = gl.capabilities.getMaxAnisotropy();

        // 바닥·천장과 만나는 곳, 옆 벽과 만나는 모서리를 어둡게 (가로·세로 배율의 곱)
        const wallHeight = (y: number) => ao(y, 0.14, 0.35) * ao(ROOM.ceiling - y, 0.1, 0.6);
        const wallAlong = (s: number) => ao(s - nearS, 0.1, 0.45) * ao(farS - s, 0.1, 0.45);
        const wallAcross = (x: number) => ao(x - ROOM.artWallX, 0.1, 0.45) * ao(ROOM.rightWallX - x, 0.1, 0.45);
        const floorAcross = (x: number) => ao(x - ROOM.artWallX, 0.16, 0.35) * ao(ROOM.rightWallX - x, 0.16, 0.35);
        const floorAlong = (s: number) => ao(s - nearS, 0.16, 0.35) * ao(farS - s, 0.16, 0.35);
        const ceilingAcross = (x: number) => ao(x - ROOM.artWallX, 0.12, 0.7) * ao(ROOM.rightWallX - x, 0.12, 0.7);
        const ceilingAlong = (s: number) => ao(s - nearS, 0.12, 0.7) * ao(farS - s, 0.12, 0.7);
        const heightShade = (fy: number) => wallHeight(ROOM.ceiling * (1 - fy));

        const painted = (lightMap: ReturnType<typeof gridTexture>) => new MeshBasicMaterial({
            map: paint.texture,
            lightMap,
            // basic 재질의 lightMap에는 1/π가 곱해지고, 무늬 평균 밝기만큼 어두워지므로 되돌림 → 사진 색
            lightMapIntensity: Math.PI / paint.mean,
        });

        return {
            textures: [paint.texture],
            leftWall: painted(gridTexture(LEFT_WALL, [nearS, farS], [ROOM.ceiling, 0], 384, 80,
                { x: fx => wallAlong(nearS + fx * length), y: heightShade })),
            rightWall: painted(gridTexture(LEFT_WALL, [farS, nearS], [ROOM.ceiling, 0], 384, 80,
                { x: fx => wallAlong(farS - fx * length), y: heightShade })),
            // 앞뒤 벽은 좌우가 대칭이라 하나로 같이 씀
            endWall: painted(gridTexture(LEFT_WALL, [END_WALL_S, END_WALL_S], [ROOM.ceiling, 0], 128, 80,
                { x: fx => END_WALL_LIGHT * wallAcross(ROOM.artWallX + fx * width), y: heightShade })),
            ceiling: painted(gridTexture(CEILING, [ROOM.artWallX, ROOM.rightWallX], [nearS, farS], 96, 288,
                { x: fx => ceilingAcross(ROOM.artWallX + fx * width), y: fy => ceilingAlong(nearS + fy * length) })),
            floor: painted(gridTexture(FLOOR, [ROOM.artWallX, ROOM.rightWallX], [farS, nearS], 96, 384,
                { x: fx => floorAcross(ROOM.artWallX + fx * width), y: fy => floorAlong(farS - fy * length) })),
            // 벽 아래 바닥과 만나는 얇은 이음선
            baseLine: new MeshBasicMaterial({ color: '#a3a6ad' }),
        };
    }, [farZ, gl, length, width, nearS, farS]);

    const geometries = useMemo(() => ({
        floor: meterPlane(width, length),
        ceiling: meterPlane(width, length),
        sideWall: meterPlane(length, ROOM.ceiling),
        endWall: meterPlane(width, ROOM.ceiling),
    }), [width, length]);

    useEffect(() => () => {
        surfaces.textures.forEach(texture => texture.dispose());
        [surfaces.leftWall, surfaces.rightWall, surfaces.endWall, surfaces.ceiling, surfaces.floor, surfaces.baseLine].forEach(material => {
            material.lightMap?.dispose();
            material.dispose();
        });
    }, [surfaces]);
    useEffect(() => () => Object.values(geometries).forEach(geometry => geometry.dispose()), [geometries]);

    const BASE = 0.008;
    return (
        <group>
            <mesh geometry={geometries.floor} material={surfaces.floor} position={[midX, 0, midZ]} rotation={[-Math.PI / 2, 0, 0]} />
            <mesh geometry={geometries.ceiling} material={surfaces.ceiling} position={[midX, ROOM.ceiling, midZ]} rotation={[Math.PI / 2, 0, 0]} />
            <mesh geometry={geometries.sideWall} material={surfaces.leftWall} position={[ROOM.artWallX, midY, midZ]} rotation={[0, Math.PI / 2, 0]} />
            <mesh geometry={geometries.sideWall} material={surfaces.rightWall} position={[ROOM.rightWallX, midY, midZ]} rotation={[0, -Math.PI / 2, 0]} />
            <mesh geometry={geometries.endWall} material={surfaces.endWall} position={[midX, midY, farZ]} />
            <mesh geometry={geometries.endWall} material={surfaces.endWall} position={[midX, midY, ROOM.entranceZ]} rotation={[0, Math.PI, 0]} />

            <mesh material={surfaces.baseLine} position={[ROOM.artWallX + 0.002, BASE / 2, midZ]} rotation={[0, Math.PI / 2, 0]}>
                <planeGeometry args={[length, BASE]} />
            </mesh>
            <mesh material={surfaces.baseLine} position={[ROOM.rightWallX - 0.002, BASE / 2, midZ]} rotation={[0, -Math.PI / 2, 0]}>
                <planeGeometry args={[length, BASE]} />
            </mesh>
            <mesh material={surfaces.baseLine} position={[midX, BASE / 2, farZ + 0.002]}>
                <planeGeometry args={[width, BASE]} />
            </mesh>
            <mesh material={surfaces.baseLine} position={[midX, BASE / 2, ROOM.entranceZ - 0.002]} rotation={[0, Math.PI, 0]}>
                <planeGeometry args={[width, BASE]} />
            </mesh>
        </group>
    );
}
