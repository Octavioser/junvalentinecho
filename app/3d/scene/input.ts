// 키보드 이동 입력. React state가 아니라 ref로 들고 있어서 누를 때마다 3D 화면이 다시 렌더되지 않음
export type MoveInput = {
    held: Map<string, 1 | -1>;  // 누르고 있는 키 코드 → 1: 안쪽, -1: 입구 쪽
    wake: () => void;           // 멈춰 있던 렌더 루프 깨우기
};

export const createMoveInput = (): MoveInput => ({ held: new Map(), wake: () => { } });

export const moveDirection = ({ held }: MoveInput) => {
    let sum = 0;
    held.forEach(dir => { sum += dir; });
    return Math.sign(sum);
};
