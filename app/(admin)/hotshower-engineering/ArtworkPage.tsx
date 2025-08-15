"use client";
import React, { useState } from "react";
import ArtworkDisplayPanel from './artwork-display/ArtworkDisplayPanel';
import ArtworkInfoForm from './artwork-info/ArtworkInfoForm';
import { Artwork, ArtworkList } from "@/types";
import ArtAddDialog from "./dialog/ArtAddDialog";
import styles from "./ArtworkPage.module.css";
import { useRouter } from "next/navigation";
import { delArtwork, delImage, updateArtwork } from "@/common/comon";

const ArtworkPage = ({ artworks }: { artworks: ArtworkList; }) => {

    const [selectedArtworkId, setSelectedArtworkId] = useState<string | null>(null);
    const [tab, setTab] = useState<string>('1');
    const [openDialog, setOpenDialog] = useState<"add" | "mod">(null);

    const router = useRouter();
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
                    <div className={topBar}>

                        {tab === '1' &&
                            <>
                                <button className={addButton} onClick={() => { setOpenDialog('add'); }}>추가</button>
                                <button className={addButton} disabled={!selectedArtworkId} onClick={() => { setOpenDialog('mod'); }}>수정</button>
                                <button className={addButton} disabled={!selectedArtworkId}
                                    onClick={async () => {
                                        const poster_path = artworks.find((artwork) => artwork.id === selectedArtworkId)?.poster_path;
                                        if (!(poster_path && selectedArtworkId)) {
                                            alert('삭제실패하였습니다.');
                                            console.error(`posterPath==> ${poster_path}, || selectedArtworkId==> ${selectedArtworkId}`);
                                            return;
                                        }
                                        await delImage(poster_path);
                                        await delArtwork(selectedArtworkId);
                                        setSelectedArtworkId(null);
                                        alert('삭제되었습니다.');
                                        router.refresh(); // 페이지 새로고침
                                    }}>
                                    삭제
                                </button>
                            </>
                        }
                        {tab === '2' && <>
                            <button className={addButton} onClick={() => { setOpenDialog('add'); }}>그룹채번</button>
                            <button className={addButton} disabled={!selectedArtworkId} onClick={() => { setOpenDialog('mod'); }}>기존추가</button>
                            <button className={addButton}
                                disabled={!selectedArtworkId}
                                onClick={async () => {
                                    const targetgalleryId = artworks.find((artwork) => artwork.id === selectedArtworkId)?.galleryId;
                                    const targetData = artworks.filter((artwork) => artwork.galleryId === targetgalleryId);
                                    for (const item of targetData) {
                                        await updateArtwork({ ...item, galleryId: null });
                                    }
                                    setSelectedArtworkId(null);
                                    alert('그룹이 삭제되었습니다.');
                                    router.refresh(); // 페이지 새로고침
                                }}>
                                그룹삭제
                            </button>
                        </>
                        }
                        {tab === '3' &&
                            <>
                                <button className={addButton} onClick={() => { setOpenDialog('add'); }}>추가</button>
                                <button className={addButton}
                                    disabled={!selectedArtworkId}
                                    onClick={async () => {
                                        const targetData = artworks.find((artwork) => artwork.id === selectedArtworkId);
                                        await updateArtwork({ ...targetData, visualYn: '' });
                                        setSelectedArtworkId(null);
                                        alert('비쥬얼 표시가 삭제되었습니다.');
                                        router.refresh(); // 페이지 새로고침
                                    }}
                                >삭제
                                </button>

                            </>
                        }
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
            {openDialog && <ArtAddDialog artworks={artworks} selectedArtworkId={selectedArtworkId} setSelectedArtworkId={setSelectedArtworkId} openDialog={openDialog} setOpenDialog={setOpenDialog} tab={tab} />}
        </>
    );
};
export default ArtworkPage;