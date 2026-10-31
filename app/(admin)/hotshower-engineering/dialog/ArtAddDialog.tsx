"use client";
import React, { useEffect } from "react";
import { Artwork, MusicBlob } from "@/types";
import styles from "./ArtAddDialog.module.css";
import ArtNewAddForm from "./artDialogParts/ArtNewAddForm";
import ArtVisualAdd from "./artDialogParts/ArtVisualAdd";
import ArtGroupAdd from "./artDialogParts/ArtGroupAdd";
import MusicAdd from "./artDialogParts/MusicAdd";

const TITLE: Record<string, { add: string; mod: string; }> = {
    '1': { add: '그림 추가', mod: '그림 정보 수정' },
    '2': { add: '새 그룹 만들기', mod: '그룹에 추가 · 크기 변경' },
    '3': { add: '2D 표시에 추가', mod: '2D 표시에 추가' },
    '4': { add: '음악 추가', mod: '음악 추가' },
};

const ArtAddDialog = ({
    artworks,
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
    selectedArtworkId: string | null,
    setSelectedArtworkId: React.Dispatch<React.SetStateAction<string | null>>,
    openDialog: "add" | "mod",
    setOpenDialog: React.Dispatch<React.SetStateAction<"add" | "mod" | null>>,
    tab: string;
    setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
}) => {

    const { dialogStyle, overlayStyle, header, title, closeButton, body } = styles;

    // Esc로 닫기
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpenDialog(null); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [setOpenDialog]);

    return (
        <>
            <div className={overlayStyle} onClick={() => { setOpenDialog(null); }} />
            <div className={dialogStyle} role="dialog" aria-modal="true" aria-labelledby="art-dialog-title">
                <div className={header}>
                    <div id="art-dialog-title" className={title}>{TITLE[tab]?.[openDialog]}</div>
                    <button type="button" className={closeButton} aria-label="닫기" onClick={() => { setOpenDialog(null); }}>✕</button>
                </div>
                <div className={body}>
                    {tab === '1' && <ArtNewAddForm artworks={artworks} selectedArtworkId={selectedArtworkId} openDialog={openDialog} setOpenDialog={setOpenDialog} setIsLoading={setIsLoading} />}
                    {tab === '2' && <ArtGroupAdd artworks={artworks} selectedArtworkId={selectedArtworkId} setSelectedArtworkId={setSelectedArtworkId} openDialog={openDialog} setOpenDialog={setOpenDialog} setIsLoading={setIsLoading} />}
                    {tab === '3' && <ArtVisualAdd artworks={artworks} setOpenDialog={setOpenDialog} setIsLoading={setIsLoading} />}
                    {tab === '4' && <MusicAdd musicList={musicList} setOpenDialog={setOpenDialog} setIsLoading={setIsLoading} />}
                </div>
            </div >
        </>
    );

};
export default ArtAddDialog;
