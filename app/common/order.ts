import { Artwork } from "@/types";

// 2D 화면에 보이는 그림 목록: 정해 둔 순서(visualOrder)대로. 순서를 정한 적 없는 그림은 등록한 순서대로 뒤에 옴
export const visualList = (artworks: Artwork[]) =>
    artworks
        .map((artwork, index) => ({ artwork, index }))
        .filter(({ artwork }) => artwork.visualYn === 'Y')
        .sort((a, b) => ((a.artwork.visualOrder ?? Infinity) - (b.artwork.visualOrder ?? Infinity)) || (a.index - b.index))
        .map(({ artwork }) => artwork);

// 메인 전시장 그룹 번호 목록 (번호가 작은 그룹이 앞)
export const groupIds = (artworks: Artwork[]) =>
    [...new Set(artworks.map(({ galleryId }) => galleryId).filter((id): id is number => !!id))].sort((a, b) => a - b);

// 그룹을 order(그룹 번호를 새 순서대로 늘어놓은 것)대로 다시 세움.
// 그룹 번호가 곧 순서라서, 쓰던 번호들을 새 순서에 맞게 다시 나눠 줌
export const applyGroupOrder = (artworks: Artwork[], order: number[]) => {
    const ids = [...order].sort((a, b) => a - b);
    const renumber = new Map(order.map((id, index) => [id, ids[index]]));
    return artworks.map((artwork) => artwork.galleryId && renumber.has(artwork.galleryId)
        ? { ...artwork, galleryId: renumber.get(artwork.galleryId)! }
        : artwork);
};

// 2D 표시 순서를 order(작품 ID를 새 순서대로 늘어놓은 것)대로 매김
export const applyVisualOrder = (artworks: Artwork[], order: string[]) => {
    const position = new Map(order.map((id, index) => [id, index + 1]));
    return artworks.map((artwork) => position.has(artwork.id) ? { ...artwork, visualOrder: position.get(artwork.id)! } : artwork);
};

// from 자리의 항목을 to 자리로 옮긴 새 배열
export const moveItem = <T,>(list: T[], from: number, to: number) => {
    const next = [...list];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    return next;
};
