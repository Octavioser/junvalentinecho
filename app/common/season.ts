import { Artwork } from "@/types";
import { visualList } from "./order";

/**
 * 시즌(2D 화면의 시리즈)
 * - 시즌은 따로 저장하는 목록이 아니라 그림에 적힌 값으로 이루어짐: 그림의 season이 그 그림이 들어 있는 시즌 이름 (한 그림은 한 시즌에만).
 *   그림이 하나도 없는 시즌은 없음 (마지막 그림을 빼면 시즌도 없어짐).
 * - 시즌 안 그림 순서: seasonOrder (없으면 등록한 순서대로 뒤에)
 * - 시즌 대표: 그 시즌에서 visualYn이 'Y'인 그림. 2D 화면에는 대표가 있는 시즌만, 대표 그림으로 나옴.
 *   2D 화면에서의 시즌 순서는 대표 그림의 visualOrder
 * - 관리자가 "2D 시즌" 탭에서 시즌을 만들고 그림을 넣고 빼며, 아래 함수들은 그때 바뀐 그림 목록을 돌려줌 (저장은 부르는 쪽에서)
 */

const largest = (values: (number | null | undefined)[]) => Math.max(0, ...values.filter((value): value is number => value != null));

// 2D 화면에 나오는 시즌 대표 그림들 (시즌마다 하나, 2D 순서대로)
export const seasonCovers = (artworks: Artwork[]) => {
    const seen = new Set<string>();
    return visualList(artworks).filter(({ season }) => !!season && !seen.has(season) && !!seen.add(season));
};

// 이 시즌의 대표 그림 (없으면 이 시즌은 2D 화면에 안 나옴)
export const seasonCover = (artworks: Artwork[], season: string) => seasonCovers(artworks).find((artwork) => artwork.season === season);

// 시즌 이름 목록: 2D에 나오는 시즌을 2D 순서대로, 그 뒤에 대표가 없는 시즌을 처음 나온 순서대로
export const seasonNames = (artworks: Artwork[]) =>
    [...new Set([...seasonCovers(artworks), ...artworks].map(({ season }) => season).filter(Boolean))];

// 이 시즌의 그림들을 시즌 안 순서대로
export const seasonArtworks = (artworks: Artwork[], season: string) =>
    artworks
        .map((artwork, index) => ({ artwork, index }))
        .filter(({ artwork }) => !!season && artwork.season === season)
        .sort((a, b) => ((a.artwork.seasonOrder ?? Infinity) - (b.artwork.seasonOrder ?? Infinity)) || (a.index - b.index))
        .map(({ artwork }) => artwork);

// 시즌 순서를 order(시즌 이름을 새 순서대로 늘어놓은 것)대로 매김. 순서는 대표 그림에 적으므로 대표가 없는 시즌은 그대로 뒤에 남음
export const applySeasonOrder = (artworks: Artwork[], order: string[]) => {
    const position = new Map(order.map((season, index) => [seasonCover(artworks, season)?.id, index + 1]));
    return artworks.map((artwork) => position.has(artwork.id) ? { ...artwork, visualOrder: position.get(artwork.id)! } : artwork);
};

// 시즌 안 그림 순서를 order(작품 ID를 새 순서대로 늘어놓은 것)대로 매김
export const applySeasonArtworkOrder = (artworks: Artwork[], season: string, order: string[]) => {
    const position = new Map(order.map((id, index) => [id, index + 1]));
    return artworks.map((artwork) => artwork.season === season && position.has(artwork.id) ? { ...artwork, seasonOrder: position.get(artwork.id)! } : artwork);
};

// 그림을 시즌에서 뺌. 그 그림이 시즌 대표였으면 시즌의 다음 그림이 대표를 이어받음 (2D 화면에서의 자리도 그대로)
export const leaveSeason = (artworks: Artwork[], id: string) => {
    const target = artworks.find((artwork) => artwork.id === id);
    if (!target?.season) return artworks;
    const heir = seasonCover(artworks, target.season)?.id === id
        ? seasonArtworks(artworks, target.season).find((artwork) => artwork.id !== id)
        : undefined;
    return artworks.map((artwork) =>
        artwork.id === id ? { ...artwork, season: '', seasonOrder: null, visualYn: '', visualOrder: null }
            : artwork.id === heir?.id ? { ...artwork, visualYn: 'Y', visualOrder: target.visualOrder ?? null }
                : artwork);
};

// 그림을 시즌에 넣음 (다른 시즌에 있었으면 거기서는 빠짐). 시즌 안에서는 맨 뒤에 붙음
export const joinSeason = (artworks: Artwork[], id: string, season: string) => {
    if (artworks.find((artwork) => artwork.id === id)?.season === season) return artworks;
    const left = leaveSeason(artworks, id);
    // 이미 들어 있던 그림들에도 지금 보이는 순서대로 번호를 매김: 순서를 정한 적 없는 그림(번호 없음)은 맨 뒤로 치므로,
    // 새 그림에만 번호를 주면 새 그림이 맨 앞으로 가 버림
    const position = new Map(seasonArtworks(left, season).map((artwork, index) => [artwork.id, index + 1]));
    return left.map((artwork) =>
        artwork.id === id ? { ...artwork, season, seasonOrder: position.size + 1 }
            : position.has(artwork.id) ? { ...artwork, seasonOrder: position.get(artwork.id)! }
                : artwork);
};

// 시즌 대표(2D 화면에 보이는 그림)를 정함. 2D 화면에서의 자리는 그대로이고, 대표가 없던 시즌이면 맨 뒤에 새로 나옴
export const setSeasonCover = (artworks: Artwork[], season: string, id: string) => {
    const order = seasonCover(artworks, season)?.visualOrder ?? largest(seasonCovers(artworks).map(({ visualOrder }) => visualOrder)) + 1;
    return artworks.map((artwork) =>
        artwork.season !== season ? artwork
            : artwork.id === id ? { ...artwork, visualYn: 'Y', visualOrder: order }
                : { ...artwork, visualYn: '', visualOrder: null });
};

// 그림 여러 개를 시즌에 넣음 (ids: 넣을 순서대로). 그 순서대로 시즌 맨 뒤에 붙음
export const joinSeasonAll = (artworks: Artwork[], ids: string[], season: string) =>
    ids.reduce((list, id) => joinSeason(list, id, season), artworks);

// 새 시즌: 그림들을 고른 순서대로 넣고 첫 그림을 대표로 삼음 (2D 화면 맨 뒤에 나옴)
export const createSeason = (artworks: Artwork[], season: string, ids: string[]) =>
    ids.length ? setSeasonCover(joinSeasonAll(artworks, ids, season), season, ids[0]) : artworks;

// 시즌 이름 바꾸기
export const renameSeason = (artworks: Artwork[], from: string, to: string) =>
    artworks.map((artwork) => artwork.season === from ? { ...artwork, season: to } : artwork);

// 시즌 없애기: 들어 있던 그림은 그대로 두고 시즌에서만 뺌
export const deleteSeason = (artworks: Artwork[], season: string) =>
    artworks.map((artwork) => artwork.season === season ? { ...artwork, season: '', seasonOrder: null, visualYn: '', visualOrder: null } : artwork);
