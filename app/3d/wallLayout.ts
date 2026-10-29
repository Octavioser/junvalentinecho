import { Artwork } from "@/types";

// 첨부 사진에서 역산한 전시장 치수 (1 = 1m). 사진을 찍은 위치가 원점, 안쪽 방향이 -Z
export const ROOM = {
    artWallX: -6.045,  // 그림을 거는 왼쪽 벽
    railX: -3.045,     // 관람 레일: 그림 벽에서 3m (사진은 6m 지점에서 찍음)
    rightWallX: 4,
    ceiling: 6.15,
    eye: 1.5,          // 사진 카메라 높이 = 관람 눈높이
    entranceZ: 8,
    farZ: -27,         // 사진 속 정면 끝 벽. 그림이 많아지면 더 뒤로 밀림
};

export const HANG = {
    firstZ: -5,        // 첫 그림의 입구 쪽 가장자리
    gap: 1.8,          // 같은 그룹 안 그림 사이
    groupGap: 3,       // 홈 화면 그룹이 바뀌는 곳
    endPad: 6,         // 마지막 그림 뒤로 남기는 벽
    centerY: 1.5,      // 그림 중심 높이
    minBottom: 0.4,    // 큰 그림도 바닥에서 이만큼은 띄움
};

export type WallItem = {
    artwork: Artwork;
    width: number;     // m
    z: number;         // 벽 위 그림 중심
};

// 홈 화면과 같은 그림들(galleryId 있는 것)을 그룹 순서대로 왼쪽 벽에 한 줄로 배치
export function wallLayout(artworks: Artwork[]): { items: WallItem[]; farZ: number; } {
    const shown = artworks
        .map((artwork, index) => ({ artwork, index }))
        .filter(({ artwork }) => artwork.galleryId && artwork.width > 0)
        .sort((a, b) =>
            (a.artwork.galleryId! - b.artwork.galleryId!)
            || ((a.artwork.left ?? 0) - (b.artwork.left ?? 0))
            || (a.index - b.index));

    const items: WallItem[] = [];
    let edge = HANG.firstZ;
    shown.forEach(({ artwork }, i) => {
        if (i > 0) edge -= artwork.galleryId === shown[i - 1].artwork.galleryId ? HANG.gap : HANG.groupGap;
        const width = artwork.width / 100;
        items.push({ artwork, width, z: edge - width / 2 });
        edge -= width;
    });

    return { items, farZ: Math.min(ROOM.farZ, edge - HANG.endPad) };
}
