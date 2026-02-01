"use client";
import React, { Fragment, useEffect, useState } from "react";
import { Artwork } from "@/types";
import GridComponents from "@/components/grid/GridComponents";
import { useRouter } from "next/navigation";
import { updateArtwork, updateAllArtwork } from "@/common/comon";

const ArtGroupAdd = ({ artworks, selectedArtworkId, setSelectedArtworkId, openDialog, setOpenDialog, setIsLoading }
    : {
        artworks: Artwork[],
        selectedArtworkId: string | null,
        setSelectedArtworkId: React.Dispatch<React.SetStateAction<string | null>>,
        openDialog: 'add' | 'mod',
        setOpenDialog: React.Dispatch<React.SetStateAction<"add" | "mod" | null>>;
        setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
    }) => {

    const [targetID, setTargetID] = useState<string | null>(null);

    const [galleryRaito, setGalleryRaito] = useState<number | null>(null);

    // 기존 추가시 배율 가져오기 
    useEffect(() => {
        if (openDialog === 'mod' && selectedArtworkId) {
            setGalleryRaito(artworks.find(({ id }) => selectedArtworkId === id)?.galleryRaito ?? null);
        }
    }, []);

    const gridData = (() => {
        const data = artworks.map(e => ({ ...e, size: `${e.width} x ${e.height}` }));
        if (openDialog === 'mod' && selectedArtworkId) {
            const target = artworks.find(({ id }) => selectedArtworkId === id);
            if (!target) return data;
            return data.filter(({ galleryId }) => galleryId !== target.galleryId);
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
                gridData={gridData}
                selectedArtworkId={targetID}
                setSelectedArtworkId={setTargetID}
            />
        </div>
        <div style={{ height: '10%', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <div style={{ height: '50%', width: '100%' }}>
                <label>
                    {'그룹 배율: '}
                    <input
                        style={{ width: '10%' }}
                        type="text"
                        name="title"
                        value={galleryRaito ?? ''}
                        onChange={(e) =>
                            setGalleryRaito(Number(e.target.value))
                        }
                        required
                    />
                    {' %'}
                </label>
            </div>
            <div style={{ height: '50%', display: 'flex', justifyContent: 'flex-end' }}>
                {openDialog === 'mod' &&
                    <button onClick={async () => {
                        if (!galleryRaito || galleryRaito <= 0) {
                            alert('그룹 배율을 양수로 입력해주세요');
                            return;
                        }
                        setIsLoading(true);
                        try {
                            const galleryId = artworks.find((artwork) => artwork.id === selectedArtworkId)?.galleryId;
                            if (galleryId === undefined || galleryId === null) {
                                alert('갤러리 ID를 찾을 수 없습니다.');
                                setIsLoading(false);
                                return;
                            }

                            await updateAllArtwork(artworks.map(e => {
                                if (e.galleryId === galleryId) {
                                    return { ...e, galleryRaito: galleryRaito ?? 0 };
                                }
                                return e;
                            }));

                            setTargetID(null);
                            setOpenDialog(null);
                            setSelectedArtworkId(null);
                            alert('해당 그룹코드의 배율이 변경되었습니다.');
                            router.refresh(); // 페이지 새로고침
                        } catch (error) {
                            console.log(error);
                            alert('저장에 실패했습니다.');
                        } finally {
                            setIsLoading(false);
                        }

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
                    setIsLoading(true);
                    try {
                        const targetData = artworks.find((artwork) => artwork.id === targetID);

                        if (!targetData) {
                            alert('대상을 찾을 수 없습니다.');
                            setIsLoading(false);
                            return;
                        }

                        const galleryId = openDialog === 'add' ?
                            // 그룹추가
                            artworks.reduce((acc, curr) => Math.max(acc, curr.galleryId ?? 0), 0) + 1
                            : // 기존그룹에 추가 
                            artworks.find((artwork) => artwork.id === selectedArtworkId)?.galleryId;

                        if (galleryId === undefined || galleryId === null) {
                            alert('갤러리 ID를 설정할 수 없습니다.');
                            setIsLoading(false);
                            return;
                        }

                        await updateArtwork(artworks, { ...targetData, galleryId, galleryRaito: galleryRaito ?? 0 });
                        setTargetID(null);
                        setOpenDialog(null);
                        setSelectedArtworkId(null);
                        alert(openDialog === 'mod' ? '해당 그룹에 추가되었습니다.' : '새로운 그룹코드가 생성되었습니다.');
                        router.refresh(); // 페이지 새로고침
                    } catch (error) {
                        console.log(error);
                        alert('저장에 실패했습니다.');
                    } finally {
                        setIsLoading(false);
                    }
                }}>추가</button>
            </div>
        </div>
    </Fragment>;

};
export default ArtGroupAdd;