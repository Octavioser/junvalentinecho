"use client";

import React, { useState, useEffect, useRef, useTransition } from 'react';
import { useRouter } from "next/navigation";
import MainImagePosterCard from "../../../components/MainImage/MainImagePosterCard";
import MainImageRatio from '@/components/MainImage/MainImageRatio';
import ArtworkDisplayImage from './ArtworkDisplayImage';
import { Artwork } from "@/types";
import { updateAllArtwork } from '@/common/comon';
import styles from "../ArtworkPage.module.css";

const ArtworkDisplayPanel = ({ artworks, selectedArtworkId, setIsLoading }: { artworks: Artwork[], selectedArtworkId: string | null, setIsLoading: React.Dispatch<React.SetStateAction<boolean>>; }) => {

    const posterFrameRef = useRef<HTMLDivElement>(null);

    const [displayPanelItem, setDisplayPanelItem] = useState<Artwork[]>([]);

    const router = useRouter();

    useEffect(() => {
        setDisplayPanelItem(artworks.filter(({ galleryId }) => galleryId === artworks.find(({ id }) => id === selectedArtworkId)?.galleryId));
    }, [selectedArtworkId]);

    return (
        <div style={{ display: 'flex', flex: 1, flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', width: '100%', height: '3.5%', marginTop: '4px' }}>
                <button className={styles.addButton}
                    onClick={async () => {
                        setIsLoading(true);
                        try {
                            await updateAllArtwork(artworks.map(e => {
                                const target = displayPanelItem.find((i) => i.id === e.id);
                                if (target) return target;
                                return e;
                            }));
                            alert('저장되었습니다.');
                            router.refresh(); // 페이지 새로고침

                        } catch {
                            alert('저장에 실패했습니다.');
                        } finally {
                            setIsLoading(false);
                        }
                    }}
                >
                    이미지 위치 저장
                </button>
            </div >
            <div style={{ display: 'flex', flex: 1, flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <div ref={posterFrameRef} style={{ width: '85%', aspectRatio: 1 / 1 }}>
                    <MainImagePosterCard isAdmin={true}>
                        {(displayPanelItem || []).map((item, index) =>
                            <ArtworkDisplayImage
                                key={item.id}
                                posterFrameRef={posterFrameRef}
                                setTargetItem={(item: Artwork) => setDisplayPanelItem((prev) => prev.map((i) => (i.id === item.id ? item : i)))}
                                targetArtworks={item}
                                refreshZindex={(id: string) => {
                                    // 제일 최근에 수정한 이미지을 제일 위로 올리기
                                    const targetItem = displayPanelItem.find((i) => i.id === id);
                                    const zIndexSortList = displayPanelItem.sort((a, b) => (b.zIndex ?? 0) - (a.zIndex ?? 0));
                                    if (!targetItem) return;
                                    setDisplayPanelItem(
                                        zIndexSortList
                                            .filter((i) => i.id !== id)
                                            .concat(targetItem)
                                            .map((item, zIndex) => ({ ...item, zIndex }))
                                    );
                                }}
                            />
                        )}
                    </MainImagePosterCard>
                    {displayPanelItem[0]?.galleryRaito && <MainImageRatio ratio={displayPanelItem[0].galleryRaito} />}
                </div>
            </div>
        </div >
    );
};
export default ArtworkDisplayPanel;
