import { MutableRefObject, useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { MathUtils, PerspectiveCamera } from "three";
import { ROOM } from "../wallLayout";
import { MoveInput, moveDirection } from "./input";

// 사진 카메라: 1290x848, 초점거리 940px → 가로 68.9°, 세로 48.6°, 복도 방향에서 왼쪽으로 32.6°
const PHOTO_ASPECT = 1290 / 848;
const PHOTO_HFOV = 2 * Math.atan(645 / 940);
const PHOTO_VFOV = 2 * Math.atan(424 / 940);
const MAX_VFOV = MathUtils.degToRad(80);
export const START_YAW = MathUtils.degToRad(32.6);

const MAX_PITCH = MathUtils.degToRad(55);
const WHEEL_STEP = 0.012;  // 휠 1px당 이동(m). 마우스 한 칸(약 100px) ≈ 1.2m
const TOUCH_STEP = 0.012;  // 터치 세로 1px당 이동(m)
const KEY_SPEED = 1.8;     // 키를 누르고 있을 때 m/s
const FOLLOW_TIME = 0.15;  // 목표 위치를 따라가는 시간 (부드럽게 출발·정지)
const FLING_TIME = 0.35;   // 스와이프 후 관성이 줄어드는 시간
const MAX_FLING = 8;       // 관성 최대 속도(m/s). 세게 튕겨도 2.8m 정도만 더 감
const AXIS_LOCK = 8;       // 터치가 이만큼(px) 움직이면 세로=이동 / 가로=회전으로 결정
const END_STOP = 2;        // 앞뒤 벽에서 멈추는 거리

export const photoFov = (aspect: number) => MathUtils.radToDeg(aspect >= PHOTO_ASPECT
    ? PHOTO_VFOV
    : Math.min(MAX_VFOV, 2 * Math.atan(Math.tan(PHOTO_HFOV / 2) / aspect)));

export default function CameraRig({ input, farZ }: { input: MutableRefObject<MoveInput>; farZ: number; }) {
    const camera = useThree(state => state.camera) as PerspectiveCamera;
    const gl = useThree(state => state.gl);
    const size = useThree(state => state.size);
    const invalidate = useThree(state => state.invalidate);

    const look = useRef({ yaw: START_YAW, pitch: 0 });
    const target = useRef(camera.position.z);  // 스크롤·스와이프·키가 옮기는 목표 위치
    const fling = useRef(0);                   // 스와이프를 놓은 뒤 남은 속도 (m/s)
    const reducedMotion = useMemo(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches, []);

    const minZ = farZ + END_STOP, maxZ = ROOM.entranceZ - END_STOP;
    const limits = useRef({ minZ, maxZ });
    limits.current = { minZ, maxZ };

    // 화면 비율이 바뀌어도 사진과 같은 화각 유지 (사진보다 좁은 화면은 가로 화각 기준)
    useLayoutEffect(() => {
        camera.aspect = size.width / size.height;
        camera.fov = photoFov(camera.aspect);
        camera.far = ROOM.entranceZ - farZ + 10;
        camera.rotation.order = 'YXZ';
        camera.rotation.set(look.current.pitch, look.current.yaw, 0);
        camera.updateProjectionMatrix();
        invalidate();
    }, [camera, size, farZ, invalidate]);

    useEffect(() => {
        const el = gl.domElement;
        const moveTarget = (dz: number) => {
            target.current = MathUtils.clamp(target.current + dz, limits.current.minZ, limits.current.maxZ);
            invalidate();
        };

        // 휠·트랙패드: 아래로 스크롤 = 안쪽으로
        const wheel = (e: WheelEvent) => {
            e.preventDefault();
            if (e.ctrlKey) return; // 트랙패드 핀치(브라우저 확대)는 무시
            const px = e.deltaMode === 1 ? e.deltaY * 33 : e.deltaMode === 2 ? e.deltaY * el.clientHeight : e.deltaY;
            fling.current = 0;
            moveTarget(-px * WHEEL_STEP);
        };

        // 마우스 드래그 = 시선 회전. 터치는 처음 움직인 방향으로 결정: 세로 = 이동(스크롤처럼), 가로 = 좌우 회전
        type Drag = { id: number; x: number; y: number; startX: number; startY: number; mode: 'look' | 'move' | null; touch: boolean; samples: [number, number][]; };
        let drag: Drag | null = null;

        const down = (e: PointerEvent) => {
            if (drag || (e.pointerType === 'mouse' && e.button !== 0)) return;
            const touch = e.pointerType !== 'mouse';
            drag = { id: e.pointerId, x: e.clientX, y: e.clientY, startX: e.clientX, startY: e.clientY, mode: touch ? null : 'look', touch, samples: [] };
            fling.current = 0;
            try { el.setPointerCapture(e.pointerId); } catch { /* 이미 끝난 포인터 */ }
        };
        const move = (e: PointerEvent) => {
            if (!drag || drag.id !== e.pointerId) return;
            if (!drag.mode) {
                const ax = Math.abs(e.clientX - drag.startX), ay = Math.abs(e.clientY - drag.startY);
                if (Math.max(ax, ay) < AXIS_LOCK) return;
                drag.mode = ax > ay ? 'look' : 'move';
            }
            const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
            drag.x = e.clientX;
            drag.y = e.clientY;

            if (drag.mode === 'look') {
                // 스트리트뷰처럼 화면을 잡아 끄는 방향
                const perPixel = MathUtils.degToRad(camera.fov) / el.clientHeight;
                look.current.yaw += dx * perPixel;
                if (!drag.touch) look.current.pitch = MathUtils.clamp(look.current.pitch + dy * perPixel, -MAX_PITCH, MAX_PITCH);
                invalidate();
            } else {
                // 손가락을 위로 밀면(dy < 0) 안쪽으로
                moveTarget(dy * TOUCH_STEP);
                const now = performance.now();
                drag.samples.push([now, target.current]);
                while (drag.samples.length > 2 && now - drag.samples[0][0] > 100) drag.samples.shift();
            }
        };
        const up = (e: PointerEvent) => {
            if (!drag || drag.id !== e.pointerId) return;
            const samples = drag.samples;
            if (drag.mode === 'move' && !reducedMotion && samples.length > 1) {
                const [t0, z0] = samples[0], [t1, z1] = samples[samples.length - 1];
                if (performance.now() - t1 < 60 && t1 > t0) fling.current = MathUtils.clamp((z1 - z0) / ((t1 - t0) / 1000), -MAX_FLING, MAX_FLING);
            }
            drag = null;
            invalidate();
        };

        el.addEventListener('wheel', wheel, { passive: false });
        el.addEventListener('pointerdown', down);
        el.addEventListener('pointermove', move);
        el.addEventListener('pointerup', up);
        el.addEventListener('pointercancel', up);
        el.addEventListener('lostpointercapture', up);
        return () => {
            el.removeEventListener('wheel', wheel);
            el.removeEventListener('pointerdown', down);
            el.removeEventListener('pointermove', move);
            el.removeEventListener('pointerup', up);
            el.removeEventListener('pointercancel', up);
            el.removeEventListener('lostpointercapture', up);
        };
    }, [gl, camera, invalidate, reducedMotion]);

    useFrame((_, delta) => {
        // 렌더를 쉬었다가 다시 시작하면 delta가 쉰 시간 전체라서 잘라냄
        const dt = Math.min(delta, 0.05);
        const { minZ, maxZ } = limits.current;

        // 키보드: 누르고 있는 동안 목표를 계속 밀어 줌 (W·↑ = 안쪽)
        const dir = moveDirection(input.current);
        let next = target.current - dir * KEY_SPEED * dt;
        if (fling.current) {
            next += fling.current * dt;
            fling.current *= Math.exp(-dt / FLING_TIME);
            if (Math.abs(fling.current) < 0.05) fling.current = 0;
        }
        target.current = MathUtils.clamp(next, minZ, maxZ);
        if (target.current === minZ || target.current === maxZ) fling.current = 0;

        const z = camera.position.z, goal = target.current;
        camera.position.z = reducedMotion || Math.abs(goal - z) < 0.001 ? goal : z + (goal - z) * (1 - Math.exp(-dt / FOLLOW_TIME));
        camera.rotation.set(look.current.pitch, look.current.yaw, 0);

        const pushing = dir !== 0 && !((dir > 0 && goal === minZ) || (dir < 0 && goal === maxZ));
        if (pushing || fling.current !== 0 || camera.position.z !== goal) invalidate();
    });

    return null;
}
