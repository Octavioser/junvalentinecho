"use client";
import React from "react";
import { Artwork, MusicBlob } from "@/types";
import GridComponents from "@/components/grid/GridComponents";

const ArtworkInfoForm = ({ tab, artworks, musicList, selectedArtworkId, setSelectedArtworkId }: { tab: string, artworks: Artwork[], musicList: MusicBlob[], selectedArtworkId: string | null, setSelectedArtworkId: React.Dispatch<React.SetStateAction<string | null>>; }) => {


    const grid13Data = artworks.map(e => ({ ...e, size: `${e.width} x ${e.height}` }));

    return (
        <div style={{ boxSizing: 'border-box', width: '100%', flex: 1, padding: 'var(--sp)' }}>
            {['1', '3'].includes(tab) &&
                <GridComponents
                    columnList={[
                        { name: 'season', header: '시즌', type: 'string' },
                        { name: 'id', header: 'ID', type: 'string' },
                        { name: 'title', header: '제목', type: 'string' },
                        { name: 'size', header: '사이즈', type: 'number' },
                        { name: 'overview', header: '내용', type: 'string' }
                    ]}
                    gridData={tab === '1' ? grid13Data : grid13Data.filter(({ visualYn }) => visualYn === 'Y')}
                    selectedArtworkId={selectedArtworkId}
                    setSelectedArtworkId={setSelectedArtworkId}
                />
            }
            {tab === '2' &&
                <GridComponents
                    columnList={[
                        { name: 'id', header: 'ID', type: 'string' },
                        { name: 'galleryId', header: '갤러리그룹', type: 'string' },
                        { name: 'title', header: '제목', type: 'string' },
                        { name: 'groupWinSize', header: '전시창 크기(cm)', type: 'string' },
                    ]}
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
                />
            }
            {tab === '4' &&
                <GridComponents
                    columnList={[
                        { name: 'title', header: '제목', type: 'string' },
                        { name: 'uploadedAt', header: '파일업로드', type: 'string' },
                    ]}
                    gridData={musicList}
                    selectedArtworkId={selectedArtworkId}
                    setSelectedArtworkId={setSelectedArtworkId}
                />
            }
        </div>
    );

};
export default ArtworkInfoForm;