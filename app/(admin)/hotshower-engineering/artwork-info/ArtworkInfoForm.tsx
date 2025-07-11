"use client"
import React, { useState } from "react";
import { Artwork, ArtworkList } from "@/types";
import GridComponents from "@/components/grid/GridComponents";

const ArtworkInfoForm = ({ tab, artworks, selectedArtworkId, setSelectedArtworkId }: { tab: string, artworks: ArtworkList, selectedArtworkId: String, setSelectedArtworkId: React.Dispatch<React.SetStateAction<String>> }) => {

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
                    artworks={tab === '1' ? artworks : artworks.filter(({ visualYn }) => visualYn === 'Y')}
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
                    ]}
                    artworks={(artworks.filter(({ galleryId }) => galleryId)).reduce((acc: ArtworkList, curr: Artwork) => {
                        const existingGroup = acc.find((item) => item.galleryId === curr.galleryId);
                        if (existingGroup) return [
                            ...acc.filter(({ galleryId }) => galleryId !== curr.galleryId),
                            { ...curr, title: `${existingGroup.title} | ${curr.title}` }
                        ]
                        return [...acc, curr];
                    }, [])}
                    selectedArtworkId={selectedArtworkId}
                    setSelectedArtworkId={setSelectedArtworkId}
                />
            }
        </div>
    )

}
export default ArtworkInfoForm;