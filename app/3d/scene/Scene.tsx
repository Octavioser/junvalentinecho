"use client";
import { MutableRefObject } from "react";
import { Canvas } from "@react-three/fiber";
import { ROOM, WallItem } from "../wallLayout";
import { MoveInput } from "./input";
import Room from "./Room";
import ArtworkPiece from "./Artwork";
import CameraRig, { photoFov } from "./CameraRig";

export type SceneProps = {
    items: WallItem[];
    farZ: number;
    input: MutableRefObject<MoveInput>;
    onSelect: (id: string) => void;
};

export default function Scene({ items, farZ, input, onSelect }: SceneProps) {
    return (
        <Canvas
            flat // 톤매핑 없음: 사진에서 뽑은 색과 그림 색이 그대로 나옴
            frameloop="demand"
            dpr={[1, 2]}
            gl={{ antialias: true }}
            camera={{ position: [ROOM.railX, ROOM.eye, 0], fov: photoFov(1290 / 848), near: 0.1, far: 50 }}
            style={{ touchAction: 'none' }}
            onCreated={({ invalidate }) => { input.current.wake = () => invalidate(); }}
        >
            {/* 그림 프레임만 조명을 받음. 벽·바닥·천장은 사진 색을 그대로 칠함 */}
            <hemisphereLight args={['#ffffff', '#c3c7cf', 2.2]} />
            <directionalLight position={[2, 8, 3]} intensity={1.2} />
            <Room farZ={farZ} />
            {items.map(item => <ArtworkPiece key={item.artwork.id} item={item} onSelect={onSelect} />)}
            <CameraRig input={input} farZ={farZ} />
        </Canvas>
    );
}
