"use client";
import React from "react";
import { Artwork, MusicBlob } from "@/types";
import GridComponents from "@/components/grid/GridComponents";
import { formatSizeNumbers } from "@/common/format";
import { wallList } from "@/common/order";
import { seasonArtworks, seasonCover, seasonNames } from "@/common/season";

const ARTWORK_COLUMNS = [
    { name: 'season', header: '시즌', type: 'string' },
    { name: 'id', header: 'ID', type: 'string' },
    { name: 'title', header: '제목', type: 'string' },
    { name: 'size', header: '세로 x 가로(cm)', type: 'number' },
    { name: 'overview', header: '설명', type: 'string' }
];

// onReorderGroups·onReorderSeasons·onReorderWall·onReorderMusic: 표에서 줄을 끌어 순서를 바꿨을 때 (from 자리의 줄을 to 자리로)
// groupReorderLocked: 그룹 순서를 지금 바꿀 수 없는 이유 (없으면 바꿀 수 있음). 잠긴 손잡이를 누르면 onGroupReorderLockedAttempt
const ArtworkInfoForm = ({ tab, artworks, musicList, selectedArtworkId, setSelectedArtworkId, onReorderGroups, onReorderSeasons, onReorderWall, onReorderMusic, groupReorderLocked, onGroupReorderLockedAttempt }: {
    tab: string, artworks: Artwork[], musicList: MusicBlob[], selectedArtworkId: string | null, setSelectedArtworkId: (id: string | null) => void;
    onReorderGroups: (from: number, to: number) => void; onReorderSeasons: (from: number, to: number) => void;
    onReorderWall: (from: number, to: number) => void; onReorderMusic: (from: number, to: number) => void;
    groupReorderLocked?: string; onGroupReorderLockedAttempt?: () => void;
}) => {

    const withSize = (list: Artwork[]) => list.map(e => ({ ...e, size: formatSizeNumbers(e.width, e.height) }));

    return (
        // minHeight: 0이 있어야 줄이 많을 때 이 칸이 내용만큼 늘어나지 않고, 안의 표(GridComponents)가 스크롤됨.
        // 없으면 칸이 패널 밖으로 넘치고 패널이 잘라내서, 아래쪽 줄이 가려진 채 스크롤도 안 생김
        <div style={{ boxSizing: 'border-box', width: '100%', flex: 1, minHeight: 0, padding: 'var(--sp)' }}>
            {tab === '1' &&
                <GridComponents
                    columnList={ARTWORK_COLUMNS}
                    gridData={withSize(artworks)}
                    selectedArtworkId={selectedArtworkId}
                    setSelectedArtworkId={setSelectedArtworkId}
                    emptyText="등록된 그림이 없어요. 추가 버튼으로 올려주세요."
                />
            }
            {tab === '5' &&
                <GridComponents
                    columnList={ARTWORK_COLUMNS}
                    // 3D 전시장 벽에 걸리는 순서 그대로: 맨 위가 입구 쪽 (끌어서 바꿀 수 있음)
                    gridData={withSize(wallList(artworks))}
                    selectedArtworkId={selectedArtworkId}
                    setSelectedArtworkId={setSelectedArtworkId}
                    emptyText="3D 전시장에 건 그림이 없어요. 추가 버튼으로 넣어주세요."
                    onReorder={onReorderWall}
                />
            }
            {tab === '3' &&
                <GridComponents
                    columnList={[
                        { name: 'season', header: '시즌', type: 'string' },
                        { name: 'count', header: '그림 수', type: 'number' },
                        { name: 'cover', header: '2D 대표 그림', type: 'string' },
                    ]}
                    // 시즌마다 한 줄, 2D 화면에 나오는 순서대로 (끌어서 바꿀 수 있음). 줄의 ID는 시즌 이름
                    gridData={seasonNames(artworks).map((season) => ({
                        id: season,
                        season,
                        count: seasonArtworks(artworks, season).length,
                        cover: seasonCover(artworks, season)?.title ?? '없음 (2D 화면에 안 나옴)',
                    }))}
                    selectedArtworkId={selectedArtworkId}
                    setSelectedArtworkId={setSelectedArtworkId}
                    emptyText="시즌이 없어요. 새 시즌 만들기로 만들어주세요."
                    onReorder={onReorderSeasons}
                />
            }
            {tab === '2' &&
                <GridComponents
                    columnList={[
                        { name: 'id', header: 'ID', type: 'string' },
                        { name: 'galleryId', header: '그룹', type: 'string' },
                        { name: 'title', header: '제목', type: 'string' },
                        { name: 'groupWinSize', header: '전시창 크기(cm)', type: 'string' },
                    ]}
                    // 그룹마다 한 줄, 홈 화면에 나오는 순서(그룹 번호 순)대로 (끌어서 바꿀 수 있음)
                    gridData={(artworks.filter(({ galleryId }) => galleryId)).reduce((acc: Artwork[], curr: Artwork) => {
                        const existingGroup = acc.find((item) => item.galleryId === curr.galleryId);
                        if (existingGroup) return [
                            ...acc.filter(({ galleryId }) => galleryId !== curr.galleryId),
                            { ...curr, title: `${existingGroup.title} | ${curr.title}` }
                        ];
                        return [...acc, curr];
                    }, []).sort((a, b) => (a.galleryId ?? 0) - (b.galleryId ?? 0))}
                    selectedArtworkId={selectedArtworkId}
                    setSelectedArtworkId={setSelectedArtworkId}
                    emptyText="메인 전시장에 올린 그룹이 없어요."
                    onReorder={onReorderGroups}
                    reorderLocked={groupReorderLocked}
                    onReorderLockedAttempt={onGroupReorderLockedAttempt}
                />
            }
            {tab === '4' &&
                <GridComponents
                    columnList={[
                        { name: 'title', header: '제목', type: 'string' },
                        { name: 'uploadedAt', header: '올린 날짜', type: 'string' },
                    ]}
                    // 홈 화면 플레이어에 나오는 순서 그대로: 맨 위 곡부터 재생됨 (끌어서 바꿀 수 있음)
                    gridData={musicList}
                    selectedArtworkId={selectedArtworkId}
                    setSelectedArtworkId={setSelectedArtworkId}
                    emptyText="등록된 음악이 없어요."
                    onReorder={onReorderMusic}
                />
            }
        </div>
    );

};
export default ArtworkInfoForm;
