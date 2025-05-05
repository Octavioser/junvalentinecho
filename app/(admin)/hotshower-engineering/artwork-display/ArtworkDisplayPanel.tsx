"use client"

import React, { useState, useEffect, useRef, use } from 'react';
import MainImagePosterCard from "../../../components/MainImage/MainImagePosterCard";
import ArtworkDisplayImage from './ArtworkDisplayImage';
import { Artwork, ArtworkList } from "@/types";

const ArtworkDisplayPanel = ({ artworks, selectedArtwork }: { artworks: ArtworkList, selectedArtwork: Artwork }) => {

    const posterFrameRef = useRef<HTMLDivElement>(null);

    const imgRefs = useRef<(HTMLImageElement | null)[]>([]);

    const [displayPanelItem, setDisplayPanelItem] = useState<ArtworkList>([]);

    useEffect(() => {
        setDisplayPanelItem(artworks.filter(({ galleryId }) => galleryId === selectedArtwork?.galleryId))
    }, [selectedArtwork])

    return (
        <>
            <div style={{ display: 'flex', justifyContent: 'flex-end', width: '100%', height: '3.5%' }}>
                <button style={{ display: 'flex', justifyContent: 'flex-end' }}>이미지 위치 저장</button>
            </div>
            <div style={{ display: 'flex', width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' }}>
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
