"use client";
import React, { useEffect, useState } from "react";
import { Artwork, ArtworkList } from "@/types";
import GridComponents from "@/components/grid/GridComponents";
import { useRouter } from "next/navigation";
import { updateArtwork } from "@/common/comon";

const ArtVisualAdd = ({ artworks, setOpenDialog }: { artworks: ArtworkList, setOpenDialog: React.Dispatch<React.SetStateAction<string>>; }) => {

    const [targetID, setTargetID] = useState<string>(null);


    const router = useRouter();


    return (
        <div style={{ width: '99.9%', height: '95%' }}>
            <GridComponents
                columnList={[
                    { name: 'id', header: 'ID', type: 'string' },
                    { name: 'title', header: '제목', type: 'string' },
                    { name: 'size', header: '사이즈', type: 'number' },
                    { name: 'overview', header: '내용', type: 'string' }
                ]}
                artworks={artworks.filter(({ visualYn }) => visualYn !== 'Y')}
                selectedArtworkId={targetID}
                setSelectedArtworkId={setTargetID}

            />
            <div style={{ height: '5%', display: 'flex', justifyContent: 'flex-end', alignItems: 'flex-end' }}>
                <button onClick={async () => {
                    const targetData = artworks.find((artwork) => artwork.id === targetID);
                    await updateArtwork({ ...targetData, visualYn: 'Y' });
                    setTargetID(null);
                    setOpenDialog(null);
                    alert('비쥬얼 표시가 추가되었습니다.');
                    router.refresh(); // 페이지 새로고침
                }}>추가</button>
            </div>
        </div>
    );

};
export default ArtVisualAdd;