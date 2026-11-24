import { Artwork } from "@/types";

// 2D 화면에 보이는 그림 목록: 정해 둔 순서(visualOrder)대로. 순서를 정한 적 없는 그림은 등록한 순서대로 뒤에 옴
export const visualList = (artworks: Artwork[]) =>
    artworks
        .map((artwork, index) => ({ artwork, index }))
        .filter(({ artwork }) => artwork.visualYn === 'Y')
        .sort((a, b) => ((a.artwork.visualOrder ?? Infinity) - (b.artwork.visualOrder ?? Infinity)) || (a.index - b.index))
        .map(({ artwork }) => artwork);

// 홈 화면에서 한 카드(그룹)의 그림 설명을 나열하는 순서: 관리자가 정한 순서(captionOrder)대로.
// 순서를 정한 적 없는 그림은 그 뒤에, 위에 걸린 그림부터 (높이가 같으면 왼쪽 그림부터)
export const captionList = (group: Artwork[]) =>
    [...group].sort((a, b) =>
        ((a.captionOrder ?? Infinity) - (b.captionOrder ?? Infinity))
        || ((a.top ?? 0) - (b.top ?? 0))
        || ((a.left ?? 0) - (b.left ?? 0)));

// 메인 전시장 그룹 번호 목록 (번호가 작은 그룹이 앞)
export const groupIds = (artworks: Artwork[]) =>
    [...new Set(artworks.map(({ galleryId }) => galleryId).filter((id): id is number => !!id))].sort((a, b) => a - b);

// 홈 화면에서 가려 둔 그룹 번호들. 가리기 표시(galleryHidden)는 그룹의 모든 그림에 같이 적지만,
// 하나라도 있으면 그룹 전체를 가림 (그룹에 새로 넣은 그림에 표시가 빠져도 카드가 반쪽만 나오지 않게)
export const hiddenGroupIds = (artworks: Artwork[]) =>
    new Set(artworks.filter(({ galleryId, galleryHidden }) => galleryId && galleryHidden).map(({ galleryId }) => galleryId!));

// 그룹을 홈 화면에서 가리거나 다시 보이게 함 (그림·배치·순서는 그대로)
export const setGroupHidden = (artworks: Artwork[], galleryId: number, hidden: boolean) =>
    artworks.map((artwork) => artwork.galleryId === galleryId ? { ...artwork, galleryHidden: hidden ? true : null } : artwork);

// 그룹을 order(그룹 번호를 새 순서대로 늘어놓은 것)대로 다시 세움.
// 그룹 번호가 곧 순서라서, 쓰던 번호들을 새 순서에 맞게 다시 나눠 줌
export const applyGroupOrder = (artworks: Artwork[], order: number[]) => {
    const ids = [...order].sort((a, b) => a - b);
    const renumber = new Map(order.map((id, index) => [id, ids[index]]));
    return artworks.map((artwork) => artwork.galleryId && renumber.has(artwork.galleryId)
        ? { ...artwork, galleryId: renumber.get(artwork.galleryId)! }
        : artwork);
};

// 그림들을 메인 전시장 그룹에 넣음 (ids: 고른 순서대로. 다른 그룹에 있던 그림은 거기서 빠짐).
// 설명 순서: 그 그룹이 순서를 정해 둔 그룹이면 고른 순서대로 맨 뒤에 붙임.
// 새 그룹이거나 순서를 정한 적 없는 그룹이면 번호 없이 둠 (위에 걸린 그림부터 나옴. 새 그림에만 번호를 주면 새 그림이 맨 앞으로 가 버림)
// 가리기: 가려 둔 그룹에 넣으면 같이 가려지고, 새 그룹이나 보이는 그룹으로 옮기면 가리기 표시가 지워짐
export const joinGroup = (artworks: Artwork[], ids: string[], galleryId: number, groupWinSize: number) => {
    const members = artworks.filter((artwork) => artwork.galleryId === galleryId && !ids.includes(artwork.id));
    const ordered = members.length > 0 && members.every(({ captionOrder }) => captionOrder != null);
    const last = Math.max(0, ...members.map(({ captionOrder }) => captionOrder ?? 0));
    const hidden = members.some(({ galleryHidden }) => galleryHidden);
    const position = new Map(ids.map((id, index) => [id, ordered ? last + index + 1 : null]));
    return artworks.map((artwork) => position.has(artwork.id)
        ? { ...artwork, galleryId, groupWinSize, captionOrder: position.get(artwork.id)!, galleryHidden: hidden ? true : null }
        : artwork);
};

// 3D 전시장 벽에 거는 그림: 관리자가 3D에 넣은 것만(wallOrder가 있는 것), 정한 순서대로. 홈 화면에 걸었는지와는 상관없음
export const wallList = (artworks: Artwork[]) =>
    artworks
        .map((artwork, index) => ({ artwork, index }))
        .filter(({ artwork }) => artwork.wallOrder != null)
        .sort((a, b) => (a.artwork.wallOrder! - b.artwork.wallOrder!) || (a.index - b.index))
        .map(({ artwork }) => artwork);

// 3D 전시장 순서를 order(작품 ID를 새 순서대로 늘어놓은 것)대로 매김
export const applyWallOrder = (artworks: Artwork[], order: string[]) => {
    const position = new Map(order.map((id, index) => [id, index + 1]));
    return artworks.map((artwork) => position.has(artwork.id) ? { ...artwork, wallOrder: position.get(artwork.id)! } : artwork);
};

// 그림들을 3D 전시장 맨 뒤에 검 (ids: 걸 순서대로)
export const addToWall = (artworks: Artwork[], ids: string[]) => {
    const last = Math.max(0, ...artworks.map(({ wallOrder }) => wallOrder ?? 0));
    const position = new Map(ids.map((id, index) => [id, last + index + 1]));
    return artworks.map((artwork) => position.has(artwork.id) ? { ...artwork, wallOrder: position.get(artwork.id)! } : artwork);
};

// from 자리의 항목을 to 자리로 옮긴 새 배열
export const moveItem = <T,>(list: T[], from: number, to: number) => {
    const next = [...list];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    return next;
};
