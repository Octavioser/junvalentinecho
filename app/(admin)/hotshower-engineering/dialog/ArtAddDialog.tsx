"use client";
import React, { useEffect, useState } from "react";
import { Artwork, MusicBlob } from "@/types";
import styles from "./ArtAddDialog.module.css";
import ArtNewAddForm from "./artDialogParts/ArtNewAddForm";
import ArtVisualAdd from "./artDialogParts/ArtVisualAdd";
import ArtGroupAdd from "./artDialogParts/ArtGroupAdd";
import MusicAdd from "./artDialogParts/MusicAdd";



const ArtAddDialog = (
    { artworks,
        musicList,
        selectedArtworkId,
        setSelectedArtworkId,
        openDialog,
        setOpenDialog,
        tab,
        setIsLoading
    }: {
        artworks: Artwork[],
        musicList: MusicBlob[],
        selectedArtworkId: string,
        setSelectedArtworkId: React.Dispatch<React.SetStateAction<string>>,
        openDialog: "add" | "mod",
        setOpenDialog: React.Dispatch<React.SetStateAction<string>>,
        tab: string;
        setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
    }
) => {

    const { dialogStyle, overlayStyle } = styles;

    return (
        <>
            <div className={overlayStyle} onClick={() => { setOpenDialog(null); }} />
            <div className={dialogStyle}>
                {tab === '1' && <ArtNewAddForm artworks={artworks} selectedArtworkId={selectedArtworkId} openDialog={openDialog} setOpenDialog={setOpenDialog} setIsLoading={setIsLoading} />}
                {tab === '2' && <ArtGroupAdd artworks={artworks} selectedArtworkId={selectedArtworkId} setSelectedArtworkId={setSelectedArtworkId} openDialog={openDialog} setOpenDialog={setOpenDialog} setIsLoading={setIsLoading} />}
                {tab === '3' && <ArtVisualAdd artworks={artworks} setOpenDialog={setOpenDialog} setIsLoading={setIsLoading} />}
                {tab === '4' && <MusicAdd musicList={musicList} setOpenDialog={setOpenDialog} setIsLoading={setIsLoading} />}
            </div >
        </>
    );

};
export default ArtAddDialog;