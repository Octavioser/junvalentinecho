// 첨부 사진의 면별 색. 사진 카메라(초점거리 940px, 왼쪽으로 32.6° 회전, 높이 1.5m)로
// 각 지점을 사진에 역투영해 9x9px 중앙값을 뽑은 것. 사진에서 덕트·조명에 가린 칸은 가장 가까운 값으로 채움.
// 조명이 이미 구워진 색이라 조명 없는 재질에 그대로 칠하면 사진과 같은 밝기가 나옴
export type ColorGrid = {
    cols: number[];
    rows: number[];
    colors: string[][];  // [row][col], sRGB
};

// cols = 앞쪽 거리 s(m, = -z), rows = 높이 y(m)
export const LEFT_WALL: ColorGrid = {
    cols: [2.8, 4, 6, 8, 10, 13, 16, 19, 22, 25, 26.8],
    rows: [6, 5.4, 4.8, 4.2, 3.6, 3, 2.4, 1.8, 1.2, 0.6, 0.1],
    colors: [
        ["#aaaeb7", "#aaaeb7", "#aaaeb7", "#aaaeb7", "#aaaeb7", "#aaaeb7", "#aaaeb7", "#aaaeb7", "#abafb8", "#abafb7", "#acb0b9"],
        ["#a9adb6", "#a9adb6", "#a9adb6", "#a9adb6", "#a9adb6", "#a9adb6", "#aaaeb7", "#aaaeb7", "#aaaeb7", "#aaaeb7", "#aaaeb7"],
        ["#aaaeb7", "#aaaeb7", "#aaaeb7", "#aaaeb7", "#aaaeb7", "#aaaeb7", "#aaaeb7", "#aaaeb7", "#aaaeb7", "#abafb8", "#abaeb8"],
        ["#a9adb6", "#a9adb6", "#a9adb6", "#a9adb6", "#a9adb6", "#a9adb6", "#aaaeb7", "#aaaeb7", "#aaaeb7", "#aaaeb7", "#abaeb8"],
        ["#aaaeb7", "#aaaeb7", "#aaaeb7", "#aaaeb7", "#acb0b9", "#adb1ba", "#aeb2bb", "#aeb2bb", "#aeb2bb", "#aeb2bb", "#afb3be"],
        ["#c2c6cf", "#c2c6cf", "#c2c6cf", "#b7bbc4", "#b9bcc5", "#babdc6", "#babec7", "#bbbec7", "#bbbdc9", "#bbbdc8", "#bbbdc9"],
        ["#c2c5ce", "#c6c8d3", "#cbced7", "#c1c4cd", "#c3c6cf", "#c4c7d0", "#c5c8d1", "#c5c8d1", "#c5c8d1", "#c5c8d1", "#c5c8d1"],
        ["#c8cbd4", "#cbced7", "#cbced7", "#c6c9d0", "#c7cad1", "#c8cbd2", "#c9ccd3", "#c9ccd4", "#cacdd4", "#c9ccd3", "#c9ccd4"],
        ["#cfd2d7", "#d1d4da", "#cfd2d9", "#cacdd2", "#cacdd4", "#cccfd6", "#cccfd6", "#cdd0d7", "#cdd0d7", "#cdd0d7", "#cdd0d7"],
        ["#d5d8dd", "#d6d9de", "#d3d6db", "#cdd0d5", "#cccfd4", "#cdd0d5", "#ced1d6", "#ced1d6", "#ced1d6", "#cfd2d7", "#ced1d6"],
        ["#d7dbde", "#d9dce1", "#dbdde1", "#c8cbd0", "#c3c4c8", "#c4c5ca", "#c5c6cb", "#c6c7cc", "#c5c7cc", "#c5c6cb", "#c4c5ca"],
    ],
};

// cols = x(m), rows = 앞쪽 거리 s(m)
export const FLOOR: ColorGrid = {
    cols: [-5.9, -5.2, -4.4, -3.6, -2.8, -2, -1.2, -0.4, 0.4],
    rows: [26, 23, 20, 17, 14, 11, 9, 7, 5.5, 4.5, 3.6],
    colors: [
        ["#adaeb3", "#a2a4ae", "#a4a8b2", "#a7abb6", "#a7abb7", "#a6aab6", "#a4a9b7", "#9fa5b5", "#a7abb7"],
        ["#abacb1", "#a8aaaf", "#a7aab2", "#a8acb5", "#aaadb8", "#a9aeba", "#a5abbb", "#9da4b6", "#a8aebc"],
        ["#bfbfc4", "#a6a8ad", "#a7aab2", "#a7abb4", "#aaaeb8", "#aaaeba", "#a5acbc", "#9ca3b6", "#a9b0bd"],
        ["#abacb1", "#a6a9af", "#a4a7af", "#a9acb6", "#aaaeb9", "#a8acb8", "#a5abbb", "#9ca3b5", "#a9aeba"],
        ["#adadb2", "#a9aaaf", "#a6a9b2", "#a8abb4", "#a9adb6", "#a9adb9", "#a4abbc", "#9da4b6", "#a8afbc"],
        ["#aeafb4", "#a3a4ac", "#a3a5ae", "#abaeb8", "#aaacb9", "#aaaeba", "#a5aab8", "#9da3b4", "#9da3b4"],
        ["#a8a9ae", "#a9aaaf", "#a6a9b2", "#a7abb4", "#a9adb7", "#aaaeba", "#a4adbd", "#9da4b7", "#9da4b7"],
        ["#afaeb3", "#a8a9ae", "#a4a7b0", "#a6a9b2", "#a9adb6", "#aaafba", "#a5acbc", "#99a0b7", "#99a0b7"],
        ["#b1b2b7", "#9fa1aa", "#a4a5ad", "#aaaeb7", "#b0b4bf", "#aaaeba", "#a6acba", "#99a0b1", "#99a0b1"],
        ["#b5b6bb", "#a2a5ad", "#999da6", "#a6a8b5", "#adafbc", "#a8acb7", "#a3aaba", "#9ba3b4", "#9ba3b4"],
        ["#b4b3b9", "#a9acb5", "#9fa0aa", "#a3a7b3", "#a9abb8", "#a7abb7", "#a0a7b6", "#a0a7b6", "#a0a7b6"],
    ],
};

// cols = x(m), rows = 앞쪽 거리 s(m)
export const CEILING: ColorGrid = {
    cols: [-5.8, -4.8, -3.8, -2.8, -1.8, -0.8, 0.2, 1.2],
    rows: [26, 22, 18, 15, 12],
    colors: [
        ["#c6c9d0", "#c6c9d0", "#c6c9d0", "#c6c8ce", "#c5c8cf", "#c6c9d0", "#c6c9d0", "#c6c9d0"],
        ["#c8cbd2", "#c8cbd2", "#c8cbd2", "#c9cad0", "#c8cbd2", "#c8cbd2", "#c8cbd2", "#c8cbd2"],
        ["#cbced5", "#cbced5", "#cbced5", "#ccced4", "#cbced5", "#cacdd4", "#cbced5", "#cbced5"],
        ["#cdd0d7", "#cdd0d7", "#cdd0d7", "#cdd0d8", "#cdd0d7", "#cdd0d7", "#cdd0d7", "#cdd0d7"],
        ["#cfd2d9", "#cfd2d9", "#cfd2d9", "#cfd2d9", "#cfd2d9", "#cfd2d9", "#cfd2d9", "#cfd2d9"],
    ],
};
