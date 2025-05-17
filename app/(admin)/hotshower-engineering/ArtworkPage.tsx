"use client"
import React, { useState } from "react";
import ArtworkDisplayPanel from './artwork-display/ArtworkDisplayPanel';
import ArtworkInfoForm from './artwork-info/ArtworkInfoForm';
import { Artwork, ArtworkList } from "@/types";
import ArtAddDialog from "./dialog/ArtAddDialog";
import styles from "./ArtworkPage.module.css";

const ArtworkPage = ({ artworks }: { artworks: ArtworkList }) => {

    const [selectedArtworkId, setSelectedArtworkId] = useState<String | null>(null);
    const [tab, setTab] = useState<string>('1');
    const [openDialog, setOpenDialog] = useState<boolean>(false);

    const {
        pageWrapper,
        leftPanel,
        topBar,
        addButton,
        tabBar,
        tabButton,
        active,
        rightPanel,
        imagePreview,
        previewImage,
    } = styles;
    return (
        <>
            <div className={pageWrapper}>
                <div className={leftPanel}>
                    <div className={topBar}>
                        <button className={addButton} onClick={() => { setOpenDialog(true) }}>추가</button>
                    </div>

                    <div className={tabBar}>
                        {[{ header: '이미지전체', value: '1' }, { header: '메인전시장표시', value: '2' }, { header: '비쥬얼표시', value: '3' }].map(({ header, value }, index) => (
                            <div
                                key={`artworkBtn${index}`}
                                className={`${tabButton} ${tab === value ? active : ''}`}
                                onClick={() => {
                                    setTab(value);
                                    setSelectedArtworkId(null);
                                }}
                            >
                                {header}
                            </div>
                        ))}
                    </div>

                    <ArtworkInfoForm
                        tab={tab}
                        artworks={artworks}
                        selectedArtworkId={selectedArtworkId}
                        setSelectedArtworkId={setSelectedArtworkId}
                    />
                </div>

                <div className={rightPanel}>
                    {['1', '3'].includes(tab) && selectedArtworkId && (() => {
                        const targetData = artworks.find((artwork) => artwork.id === selectedArtworkId) || { poster_path: '', title: '' };
                        const { poster_path, title } = targetData;
                        return (
                            <div className={imagePreview}>
                                <img className={previewImage} src={poster_path} alt={title} />
                            </div>
                        );
                    })()}
                    {tab === '2' && <ArtworkDisplayPanel artworks={artworks} selectedArtworkId={selectedArtworkId} />}
                </div>
            </div>
            {openDialog && <ArtAddDialog artworks={artworks} setOpenDialog={setOpenDialog} tab={tab} />}
        </>
    )
}
export default ArtworkPage;