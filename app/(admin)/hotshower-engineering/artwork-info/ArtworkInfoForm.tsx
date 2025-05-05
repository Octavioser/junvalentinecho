"use client"
import React, { useState } from "react";
import ArtworkInfoGrid from "./ArtworkInfoGrid";
import { Artwork, ArtworkList } from "@/types";

const ArtworkInfoForm = ({ artworks, selectedArtwork, setSelectedArtwork }: { artworks: ArtworkList, selectedArtwork: Artwork, setSelectedArtwork: React.Dispatch<React.SetStateAction<Artwork>> }) => {


    return (
        <div style={{ width: '98.5%', height: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', width: '100%', height: '3.5%', marginBottom: '5%' }}>
                <button style={{ display: 'flex', justifyContent: 'flex-end' }}>추가</button>
                <button style={{ display: 'flex', justifyContent: 'flex-end' }}>저장</button>
            </div>
            <ArtworkInfoGrid
                artworks={artworks}
                selectedArtwork={selectedArtwork}
                setSelectedArtwork={setSelectedArtwork}
            />
        </div>
    )

}
export default ArtworkInfoForm;