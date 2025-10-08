"use client";
import React, { useEffect, useState } from "react";
import { Artwork } from "@/types";
import styles from "./ArtAddDialog.module.css";
import ArtNewAddForm from "./artDialogParts/ArtNewAddForm";
import ArtVisualAdd from "./artDialogParts/ArtVisualAdd";
import ArtGroupAdd from "./artDialogParts/ArtGroupAdd";




const ArtAddDialog = (
    { artworks,
        selectedArtworkId,
        setSelectedArtworkId,
        openDialog,
        setOpenDialog,
        tab
    }: {
        artworks: Artwork[],
        selectedArtworkId: string,
        setSelectedArtworkId: React.Dispatch<React.SetStateAction<string>>,
        openDialog: "add" | "mod",
        setOpenDialog: React.Dispatch<React.SetStateAction<string>>,
        tab: string;
    }
) => {

    const { dialogStyle, overlayStyle } = styles;

    return (
        <>
            <div className={overlayStyle} onClick={() => { setOpenDialog(null); }} />
            <div className={dialogStyle}>
                {tab === '1' && <ArtNewAddForm artworks={artworks} selectedArtworkId={selectedArtworkId} openDialog={openDialog} setOpenDialog={setOpenDialog} />}
                {tab === '2' && <ArtGroupAdd artworks={artworks} selectedArtworkId={selectedArtworkId} setSelectedArtworkId={setSelectedArtworkId} openDialog={openDialog} setOpenDialog={setOpenDialog} />}
                {tab === '3' && <ArtVisualAdd artworks={artworks} setOpenDialog={setOpenDialog} />}
            </div >
        </>
    );

};
export default ArtAddDialog;