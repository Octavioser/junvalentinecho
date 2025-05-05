"use client"
import React, { useState } from "react";
import ArtworkDisplayPanel from './artwork-display/ArtworkDisplayPanel';
import ArtworkInfoForm from './artwork-info/ArtworkInfoForm';
import { Artwork, ArtworkList } from "@/types";

const ArtworkPage = ({ artworks }: { artworks: ArtworkList }) => {

    const [selectedArtwork, setSelectedArtwork] = useState<Artwork | null>(null);

    return (
        <div style={{ width: '100vw', height: '100vh', display: 'flex' }}>
            {/* 내용 입력영역 */}
            <div style={{ width: '50%', borderRight: '1px solid #000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ArtworkInfoForm artworks={artworks} selectedArtwork={selectedArtwork} setSelectedArtwork={setSelectedArtwork} />
            </div>
            {/* 이미지 위치 영역 */}
            <div style={{ width: '50%' }}>
                {selectedArtwork &&
                    <ArtworkDisplayPanel artworks={artworks} selectedArtwork={selectedArtwork} />
                }
            </div>
        </div>
    )
}
export default ArtworkPage;