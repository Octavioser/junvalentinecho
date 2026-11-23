// 다가가서 볼 그림: 벽 위 위치와 크기 (m)
export type Focus = { id: string; z: number; y: number; width: number; height: number; };

// 이동 입력. React state가 아니라 ref로 들고 있어서 누를 때마다 3D 화면이 다시 렌더되지 않음
export type MoveInput = {
    held: Map<string, 1 | -1>;  // 누르고 있는 키 코드 → 1: 안쪽, -1: 입구 쪽
    wake: () => void;           // 멈춰 있던 렌더 루프 깨우기
    focus: Focus | null;        // 눌러서 다가가 있는 그림 (없으면 관람 레일 위를 걷는 중)
    focusListeners: Set<(focus: Focus | null) => void>; // 다가간 그림이 바뀔 때 알림 (그 그림만 원본으로 바꿔 거는 용도)
};

export const createMoveInput = (): MoveInput => ({ held: new Map(), wake: () => { }, focus: null, focusListeners: new Set() });

export const moveDirection = ({ held }: MoveInput) => {
    let sum = 0;
    held.forEach(dir => { sum += dir; });
    return Math.sign(sum);
};
