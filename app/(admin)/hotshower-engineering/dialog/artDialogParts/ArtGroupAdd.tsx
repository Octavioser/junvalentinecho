"use client"
import React, { useEffect, useState } from "react";
import { Artwork, ArtworkList } from "@/types";
import GridComponents from "@/components/grid/GridComponents";
import { useRouter } from "next/navigation";
import { updateJsonData } from "@/common/Jsonhandlers";

const ArtGroupAdd = ({ artworks, selectedArtworkId, setSelectedArtworkId, openDialog, setOpenDialog }: { artworks: ArtworkList, selectedArtworkId: string, setSelectedArtworkId: React.Dispatch<React.SetStateAction<string>>, openDialog: string, setOpenDialog: React.Dispatch<React.SetStateAction<string>> }) => {

    const [targetID, setTargetID] = useState<string>(null);

    const gridData = openDialog === 'mod' ? artworks.filter(({ galleryId }) => galleryId !== artworks.find(({ id }) => selectedArtworkId === id).galleryId) : artworks;

    const router = useRouter();
    return (
        <>
            <GridComponents
                columnList={[
                    { name: 'id', header: 'ID', type: 'string' },
                    { name: 'title', header: '제목', type: 'string' },
                    { name: 'size', header: '사이즈', type: 'number' },
                    { name: 'overview', header: '내용', type: 'string' }
                ]}
                artworks={gridData}
                selectedArtworkId={targetID}
                setSelectedArtworkId={setTargetID}
            />
            <div style={{ height: '16%', display: 'flex', justifyContent: 'flex-end', alignItems: 'flex-end' }}>
                <button onClick={async () => {
                    const targetData = artworks.find((artwork) => artwork.id === targetID);

                    const galleryId = openDialog === 'add' ?
                        // 그룹추가
                        artworks.reduce((acc, curr) => Math.max(acc, curr.galleryId), 0) + 1
                        : // 기존그룹에 추가 
                        (artworks.find((artwork) => artwork.id === selectedArtworkId) || {}).galleryId;

                    await updateJsonData(targetID, { ...targetData, galleryId });
                    setTargetID(null);
                    setOpenDialog(null);
                    setSelectedArtworkId(null);
                    alert(openDialog === 'mod' ? '해당 그룹에 추가되었습니다.' : '새로운 그룹코드가 생성되었습니다.');
                    router.refresh(); // 페이지 새로고침
                }}>추가</button>
            </div>
        </>
    )

}
export default ArtGroupAdd;