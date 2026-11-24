import { MutableRefObject, useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { MathUtils, PerspectiveCamera } from "three";
import { ROOM } from "../wallLayout";
import { Focus, MoveInput, moveDirection } from "./input";

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

// 그림을 눌러서 다가가기
const APPROACH_TIME = 1 / 3;      // 그림 앞으로 걸어가거나 돌아올 때 따라가는 시간 (클수록 천천히). 거의 다 도착하는 데 이 값의 약 3배(1초)
const VIEW_MARGIN = 1.5;          // 다가갔을 때 그림이 화면에 꽉 차지 않게 두는 여유 (하단 플레이어에 가리지 않게)
// 아무리 작은 그림도 이보다 가까이 가지는 않음 (m). 큰 그림은 화면의 2/3쯤 차는 거리에 서지만, 작은 그림은 여기서 멈춤.
// 0.8m는 12x22cm 그림이 휴대폰 폭의 1/5 정도로만 보여 멀었고, 큰 그림처럼 2/3까지 다가가면(0.15m) 너무 가까웠음.
// 0.5m: 12x22cm 그림이 휴대폰 폭의 1/3쯤, PC 화면 높이의 절반쯤
const MIN_VIEW = 0.5;
const WALL_YAW = Math.PI / 2;     // 그림 벽을 정면으로 보는 방향

// from에서 가장 가까운 쪽으로 도는 목표 각도 (시선을 여러 바퀴 돌린 뒤에도 반 바퀴 넘게 돌지 않게)
const nearestAngle = (goal: number, from: number) => from + MathUtils.euclideanModulo(goal - from + Math.PI, Math.PI * 2) - Math.PI;

export const photoFov = (aspect: number) => MathUtils.radToDeg(aspect >= PHOTO_ASPECT
    ? PHOTO_VFOV
    : Math.min(MAX_VFOV, 2 * Math.atan(Math.tan(PHOTO_HFOV / 2) / aspect)));

// 그림을 눌러 다가갔을 때 벽에서 떨어지는 거리: 그림 전체가 여유 있게 보이는 거리. 아주 큰 그림은 관람 레일까지만 물러남.
// fov는 세로 화각(도), aspect는 화면 가로/세로. 그림 텍스처를 얼마나 크게 받을지 정할 때도 씀 (Artwork.tsx)
export const viewDistanceFor = ({ width, height }: { width: number; height: number; }, fov: number, aspect: number) => {
    const vHalf = MathUtils.degToRad(fov) / 2;
    const hHalf = Math.atan(Math.tan(vHalf) * aspect);
    const fit = Math.max(height / 2 / Math.tan(vHalf), width / 2 / Math.tan(hHalf));
    return MathUtils.clamp(fit * VIEW_MARGIN, MIN_VIEW, ROOM.railX - ROOM.artWallX);
};

export default function CameraRig({ input, farZ }: { input: MutableRefObject<MoveInput>; farZ: number; }) {
    const camera = useThree(state => state.camera) as PerspectiveCamera;
    const gl = useThree(state => state.gl);
    const size = useThree(state => state.size);
    const invalidate = useThree(state => state.invalidate);

    const look = useRef({ yaw: START_YAW, pitch: 0 });
    const target = useRef(camera.position.z);  // 스크롤·스와이프·키가 옮기는 목표 위치
    const fling = useRef(0);                   // 스와이프를 놓은 뒤 남은 속도 (m/s)
    const focused = useRef<Focus | null>(null);                             // 지금 다가가 있는 그림
    const lookGoal = useRef<{ yaw: number; pitch: number; } | null>(null);  // 시선을 자동으로 돌리는 중이면 그 목표
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
            input.current.focus = null; // 걷기 시작하면 보던 그림 앞에서 물러남
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
                lookGoal.current = null; // 직접 돌리기 시작하면 자동 회전은 멈춤
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
    }, [gl, camera, input, invalidate, reducedMotion]);

    // 그림 전체가 여유 있게 보이는 거리 (벽에서 떨어진 정도). 아주 큰 그림은 관람 레일까지만 물러남
    const viewDistance = (focus: Focus) => viewDistanceFor(focus, camera.fov, camera.aspect);

    useFrame((_, delta) => {
        // 렌더를 쉬었다가 다시 시작하면 delta가 쉰 시간 전체라서 잘라냄
        const dt = Math.min(delta, 0.05);
        const { minZ, maxZ } = limits.current;

        // 키보드: 누르고 있는 동안 목표를 계속 밀어 줌 (W·↑ = 안쪽)
        const dir = moveDirection(input.current);
        if (dir !== 0) input.current.focus = null; // 걷기 시작하면 보던 그림 앞에서 물러남

        // 그림을 새로 눌렀거나 그림 앞을 떠났을 때: 갈 곳과 볼 방향을 정함
        const focus = input.current.focus;
        if (focus !== focused.current) {
            if (focus) {
                target.current = focus.z;
                fling.current = 0;
                // 그림 정면에 서서 그림 가운데를 봄
                lookGoal.current = {
                    yaw: nearestAngle(WALL_YAW, look.current.yaw),
                    pitch: MathUtils.clamp(Math.atan2(focus.y - ROOM.eye, viewDistance(focus)), -MAX_PITCH, MAX_PITCH),
                };
            } else {
                // 물러날 때는 보던 방향 그대로 뒤로만 감 (시선을 되돌리지 않음)
                lookGoal.current = null;
            }
            focused.current = focus;
        }
        const xGoal = focus ? ROOM.artWallX + viewDistance(focus) : ROOM.railX;

        let next = target.current - dir * KEY_SPEED * dt;
        if (fling.current) {
            next += fling.current * dt;
            fling.current *= Math.exp(-dt / FLING_TIME);
            if (Math.abs(fling.current) < 0.05) fling.current = 0;
        }
        target.current = MathUtils.clamp(next, minZ, maxZ);
        if (target.current === minZ || target.current === maxZ) fling.current = 0;

        // 그림 쪽으로 다가가거나 돌아오는 동안은 앞뒤·좌우를 같은 속도로 따라가서 곧게 걸어감
        const goal = target.current;
        const sideways = camera.position.x !== xGoal;
        const k = 1 - Math.exp(-dt / (sideways ? APPROACH_TIME : FOLLOW_TIME));
        const follow = (from: number, to: number) => reducedMotion || Math.abs(to - from) < 0.001 ? to : from + (to - from) * k;
        camera.position.z = follow(camera.position.z, goal);
        camera.position.x = follow(camera.position.x, xGoal);
        if (lookGoal.current) {
            look.current.yaw = follow(look.current.yaw, lookGoal.current.yaw);
            look.current.pitch = follow(look.current.pitch, lookGoal.current.pitch);
            if (look.current.yaw === lookGoal.current.yaw && look.current.pitch === lookGoal.current.pitch) lookGoal.current = null;
        }
        camera.rotation.set(look.current.pitch, look.current.yaw, 0);

        const pushing = dir !== 0 && !((dir > 0 && goal === minZ) || (dir < 0 && goal === maxZ));
        if (pushing || fling.current !== 0 || camera.position.z !== goal || camera.position.x !== xGoal || lookGoal.current) invalidate();
    });

    return null;
}
