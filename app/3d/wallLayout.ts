import { Artwork } from "@/types";
import { wallList } from "@/common/order";

// 첨부 사진에서 역산한 전시장 치수 (1 = 1m). 사진을 찍은 위치가 원점, 안쪽 방향이 -Z
export const ROOM = {
    artWallX: -6.045,  // 그림을 거는 왼쪽 벽
    railX: -2.045,     // 관람 레일: 그림 벽에서 4m (사진은 6m 지점에서 찍음)
    rightWallX: 4,
    ceiling: 6.15,
    eye: 1.5,          // 사진 카메라 높이 = 관람 눈높이
    entranceZ: 8,
    farZ: -27,         // 사진 속 정면 끝 벽. 그림이 많아지면 더 뒤로 밀림
};

export const HANG = {
    firstZ: -5,        // 첫 그림의 입구 쪽 가장자리
    gap: 1.8,          // 그림 사이
    endPad: 6,         // 마지막 그림 뒤로 남기는 벽
    centerY: 1.5,      // 전시장 관례: 바닥에서 150cm가 그림 중심
    minBottom: 0.05,   // 세로 3m 가까운 아주 큰 그림만 바닥에 닿지 않게 올림
};

export type WallItem = {
    artwork: Artwork;
    width: number;     // m
    z: number;         // 벽 위 그림 중심
};

// 관리자가 "3D 전시장"에 넣은 그림들을 정한 순서대로 왼쪽 벽에 한 줄로 배치.
// 홈 화면과는 별개라서, 3D에 아무것도 넣지 않았으면 빈 벽
export function wallLayout(artworks: Artwork[]): { items: WallItem[]; farZ: number; } {
    const shown = wallList(artworks).filter(({ width }) => width > 0);

    const items: WallItem[] = [];
    let edge = HANG.firstZ;
    shown.forEach((artwork, i) => {
        if (i > 0) edge -= HANG.gap;
        // 실제 크기 그대로 검: 전시장은 그림끼리 크기를 비교해 보는 곳이라 아주 작은 그림도 키우지 않음
        const width = artwork.width / 100;
        items.push({ artwork, width, z: edge - width / 2 });
        edge -= width;
    });

    return { items, farZ: Math.min(ROOM.farZ, edge - HANG.endPad) };
}
