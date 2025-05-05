"use client"

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from "next/navigation";
import MainImagePosterCard from "../../../components/MainImage/MainImagePosterCard";
import ArtworkDisplayImage from './ArtworkDisplayImage';
import { Artwork, ArtworkList } from "@/types";
import { updateJsonData } from "../../../../jsondata/jsonhandlers";

const ArtworkDisplayPanel = ({ artworks, selectedArtwork }: { artworks: ArtworkList, selectedArtwork: Artwork }) => {

    const posterFrameRef = useRef<HTMLDivElement>(null);

    const [displayPanelItem, setDisplayPanelItem] = useState<ArtworkList>([]);

    const router = useRouter();

    useEffect(() => {
        setDisplayPanelItem(artworks.filter(({ galleryId }) => galleryId === selectedArtwork?.galleryId))
    }, [selectedArtwork])

    return (
        <>
            <div style={{ display: 'flex', justifyContent: 'flex-end', width: '100%', height: '3.5%' }}>
                <button
                    style={{ display: 'flex', justifyContent: 'flex-end' }}
                    onClick={async () => {
                        for (const item of displayPanelItem) {
                            await updateJsonData(item.id, item);
                        }
                        router.refresh(); // 페이지 새로고침
                    }}
                >
                    이미지 위치 저장
                </button>
            </div>
            <div style={{ display: 'flex', width: '100%', height: '96.5%', justifyContent: 'center', alignItems: 'center' }}>
                <div ref={posterFrameRef} style={{ width: '90%', aspectRatio: 1 / 1 }}>
                    <MainImagePosterCard>
                        {(displayPanelItem || []).map((item, index) =>
                            <ArtworkDisplayImage
                                key={`displsyImg${index}`}
                                posterFrameRef={posterFrameRef}
                                setTargetItem={(item: Artwork) => setDisplayPanelItem((prev) => prev.map((i) => (i.id === item.id ? item : i)))}
                                targetArtworks={item}
                            />
                        )}
                    </MainImagePosterCard>
                </div>
            </div >
        </>
    )
}
export default ArtworkDisplayPanel;
