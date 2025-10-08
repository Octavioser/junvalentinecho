"use client";
import React from "react";
import { Artwork } from "@/types";
import GridComponents from "@/components/grid/GridComponents";

const ArtworkInfoForm = ({ tab, artworks, selectedArtworkId, setSelectedArtworkId }: { tab: string, artworks: Artwork[], selectedArtworkId: String, setSelectedArtworkId: React.Dispatch<React.SetStateAction<String>>; }) => {


    const grid13Data = artworks.map(e => ({ ...e, size: `${e.width} x ${e.height}` }));

    return (
        <div style={{ width: '99.9%', height: '94%' }}>
            {['1', '3'].includes(tab) &&
                <GridComponents
                    columnList={[
                        { name: 'id', header: 'ID', type: 'string' },
                        { name: 'title', header: '제목', type: 'string' },
                        { name: 'size', header: '사이즈', type: 'number' },
                        { name: 'overview', header: '내용', type: 'string' }
                    ]}
                    artworks={tab === '1' ? grid13Data : grid13Data.filter(({ visualYn }) => visualYn === 'Y')}
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
                        { name: 'galleryRaito', header: '배율', type: 'string' },
                    ]}
                    artworks={(artworks.filter(({ galleryId }) => galleryId)).reduce((acc: Artwork[], curr: Artwork) => {
                        const existingGroup = acc.find((item) => item.galleryId === curr.galleryId);
                        if (existingGroup) return [
                            ...acc.filter(({ galleryId }) => galleryId !== curr.galleryId),
                            { ...curr, title: `${existingGroup.title} | ${curr.title}` }
                        ];
                        return [...acc, curr];
                    }, [])}
                    selectedArtworkId={selectedArtworkId}
                    setSelectedArtworkId={setSelectedArtworkId}
                />
            }
        </div>
    );

};
export default ArtworkInfoForm;