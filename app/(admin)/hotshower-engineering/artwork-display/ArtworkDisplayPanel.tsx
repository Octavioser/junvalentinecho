"use client";

import React, { useState, useEffect, useRef, useTransition } from 'react';
import { useRouter } from "next/navigation";
import MainImagePosterCard from "../../../components/MainImage/MainImagePosterCard";
import ArtworkDisplayImage from './ArtworkDisplayImage';
import { Artwork, ArtworkList } from "@/types";
import { updateArtwork } from '@/common/comon';

const ArtworkDisplayPanel = ({ artworks, selectedArtworkId }: { artworks: ArtworkList, selectedArtworkId: String; }) => {

    const posterFrameRef = useRef<HTMLDivElement>(null);

    const [displayPanelItem, setDisplayPanelItem] = useState<ArtworkList>([]);

    const router = useRouter();

    useEffect(() => {
        setDisplayPanelItem(artworks.filter(({ galleryId }) => galleryId === artworks.find(({ id }) => id === selectedArtworkId)?.galleryId));
    }, [selectedArtworkId]);

    return (
        <>
            <div style={{ display: 'flex', justifyContent: 'flex-end', width: '100%', height: '3.5%' }}>
                <button
                    style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}
                    onClick={async () => {
                        for (const item of displayPanelItem) {
                            await updateArtwork(item);
                        }
                        alert('저장되었습니다.');
                        router.refresh(); // 페이지 새로고침
                    }}
                >
                    이미지 위치 저장
                </button>
            </div >
            <div style={{ display: 'flex', width: '100%', height: '96.5%', justifyContent: 'center', alignItems: 'center' }}>
                <div ref={posterFrameRef} style={{ width: '90%', aspectRatio: 1 / 1 }}>
                    <MainImagePosterCard>
                        {(displayPanelItem || []).map((item, index) =>
                            <ArtworkDisplayImage
                                key={`displsyImg${index}`}
                                posterFrameRef={posterFrameRef}
                                setTargetItem={(item: Artwork) => setDisplayPanelItem((prev) => prev.map((i) => (i.id === item.id ? item : i)))}
                                targetArtworks={item}
                                refreshZindex={(id: string) => {
                                    // 제일 최근에 수정한 이미지을 제일 위로 올리기
                                    const targetItem = displayPanelItem.find((i) => i.id === id);
                                    const zIndexSortList = displayPanelItem.sort((a, b) => b.zIndex - a.zIndex);
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
                </div>
            </div >
        </>
    );
};
export default ArtworkDisplayPanel;
