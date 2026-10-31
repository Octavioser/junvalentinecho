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
