"use client";
import React, { Fragment, useEffect, useState } from "react";
import { Artwork } from "@/types";
import GridComponents from "@/components/grid/GridComponents";
import { useRouter } from "next/navigation";
import { updateArtwork, updateAllArtwork } from "@/common/comon";

const ArtGroupAdd = ({ artworks, selectedArtworkId, setSelectedArtworkId, openDialog, setOpenDialog }: { artworks: Artwork[], selectedArtworkId: string, setSelectedArtworkId: React.Dispatch<React.SetStateAction<string>>, openDialog: 'add' | 'mod', setOpenDialog: React.Dispatch<React.SetStateAction<string>>; }) => {

    const [targetID, setTargetID] = useState<string>(null);

    const [galleryRaito, setGalleryRaito] = useState<number>(null);

    // 기존 추가시 배율 가져오기 
    useEffect(() => {
        if (openDialog === 'mod') {
            setGalleryRaito(artworks.find(({ id }) => selectedArtworkId === id).galleryRaito);
        }
    }, []);

    const gridData = (() => {
        const data = artworks.map(e => ({ ...e, size: `${e.width} x ${e.height}` }));
        if (openDialog === 'mod') {
            return data.filter(({ galleryId }) => galleryId !== artworks.find(({ id }) => selectedArtworkId === id).galleryId);
        }
        return data;
    })();

    const router = useRouter();
    return <Fragment>
        <div style={{ width: '100%', height: '90%' }}>
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
        </div>
        <div style={{ height: '10%', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <div style={{ height: '50%', width: '100%' }}>
                <label>
                    그룹 배율:
                    <input style={{ width: '10%' }} type="text" name="title" value={galleryRaito} onChange={(e) => setGalleryRaito(Number(e.target.value))} required />
                    %
                </label>
            </div>
            <div style={{ height: '50%', display: 'flex', justifyContent: 'flex-end' }}>
                {openDialog === 'mod' &&
                    <button onClick={async () => {
                        if (!galleryRaito || galleryRaito <= 0) {
                            alert('그룹 배율을 양수로 입력해주세요');
                            return;
                        }

                        const galleryId = (artworks.find((artwork) => artwork.id === selectedArtworkId) || {}).galleryId;

                        await updateAllArtwork(artworks.map(e => {
                            if (e.galleryId === galleryId) {
                                return { ...e, galleryRaito };
                            }
                            return e;
                        }));

                        setTargetID(null);
                        setOpenDialog(null);
                        setSelectedArtworkId(null);
                        alert('해당 그룹코드의 배율이 변경되었습니다.');
                        router.refresh(); // 페이지 새로고침
                    }}>배율 저장</button>
                }
                <button onClick={async () => {
                    if (!targetID) {
                        alert('그룹을 추가할 대상을 클릭해주세요');
                        return;
                    }

                    if (!galleryRaito || galleryRaito <= 0) {
                        alert('그룹 배율을 양수로 입력해주세요');
                        return;
                    }

                    const targetData = artworks.find((artwork) => artwork.id === targetID);

                    const galleryId = openDialog === 'add' ?
                        // 그룹추가
                        artworks.reduce((acc, curr) => Math.max(acc, curr.galleryId), 0) + 1
                        : // 기존그룹에 추가 
                        (artworks.find((artwork) => artwork.id === selectedArtworkId) || {}).galleryId;

                    await updateArtwork(artworks, { ...targetData, galleryId, galleryRaito });
                    setTargetID(null);
                    setOpenDialog(null);
                    setSelectedArtworkId(null);
                    alert(openDialog === 'mod' ? '해당 그룹에 추가되었습니다.' : '새로운 그룹코드가 생성되었습니다.');
                    router.refresh(); // 페이지 새로고침
                }}>추가</button>
            </div>
        </div>
    </Fragment>;

};
export default ArtGroupAdd;