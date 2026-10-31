"use client";
import { MutableRefObject, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { DataTexture, SRGBColorSpace } from "three";
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
    onReady: () => void;   // 첫 화면이 실제로 그려진 뒤
};

// 첫 화면을 그리기 전에 셰이더를 비동기로 미리 컴파일 (첫 렌더에서 한꺼번에 컴파일하느라 화면이 멈추는 것을 막음).
// 그림은 텍스처를 받은 뒤에 붙으므로, 그림이 쓰는 재질 종류(단색 프레임, 불투명/반투명 이미지)를 임시 메시로 같이 컴파일
const ShaderWarmup = ({ onDone }: { onDone: () => void; }) => {
    const gl = useThree(state => state.gl);
    const scene = useThree(state => state.scene);
    const camera = useThree(state => state.camera);
    const map = useMemo(() => {
        const texture = new DataTexture(new Uint8Array([255, 255, 255, 255]), 1, 1);
        texture.colorSpace = SRGBColorSpace;
        texture.needsUpdate = true;
        return texture;
    }, []);

    useEffect(() => {
        let done = false;
        const finish = () => { if (!done) { done = true; onDone(); } };
        gl.compileAsync(scene, camera).then(finish, finish);
        const timer = setTimeout(finish, 4000); // 확장 기능이 없는 기기에서도 넘어가게
        return () => { done = true; clearTimeout(timer); };
    }, [gl, scene, camera, onDone]);
    useEffect(() => () => map.dispose(), [map]);

    return (
        <group position={[0, -50, 0]}>
            <mesh><boxGeometry args={[0.01, 0.01, 0.01]} /><meshBasicMaterial /></mesh>
            <mesh><planeGeometry args={[0.01, 0.01]} /><meshBasicMaterial map={map} /></mesh>
            <mesh><planeGeometry args={[0.01, 0.01]} /><meshBasicMaterial map={map} transparent /></mesh>
        </group>
    );
};

const FirstFrame = ({ onReady }: { onReady: () => void; }) => {
    const invalidate = useThree(state => state.invalidate);
    const reported = useRef(false);
    useEffect(() => { invalidate(); }, [invalidate]);
    useFrame(() => {
        if (reported.current) return;
        reported.current = true;
        requestAnimationFrame(() => onReady()); // 그린 프레임이 화면에 나간 다음
    });
    return null;
};

export default function Scene({ items, farZ, input, onSelect, onReady }: SceneProps) {
    const [compiled, setCompiled] = useState(false);
    const onCompiled = useCallback(() => setCompiled(true), []);

    return (
        <Canvas
            flat // 톤매핑 없음: 사진에서 뽑은 색과 그림 색이 그대로 나옴
            frameloop={compiled ? 'demand' : 'never'}
            dpr={[1, 2]}
            gl={{ antialias: true }}
            camera={{ position: [ROOM.railX, ROOM.eye, 0], fov: photoFov(1290 / 848), near: 0.1, far: 50 }}
            style={{ touchAction: 'none' }}
            onCreated={({ invalidate }) => { input.current.wake = () => invalidate(); }}
        >
            {/* 조명 없는 재질만 씀: 벽·바닥·천장은 사진 색을, 그림은 원본 색을 그대로 칠함 */}
            <Room farZ={farZ} />
            {items.map(item => <ArtworkPiece key={item.artwork.id} item={item} onSelect={onSelect} />)}
            <CameraRig input={input} farZ={farZ} />
            {compiled ? <FirstFrame onReady={onReady} /> : <ShaderWarmup onDone={onCompiled} />}
        </Canvas>
    );
}
