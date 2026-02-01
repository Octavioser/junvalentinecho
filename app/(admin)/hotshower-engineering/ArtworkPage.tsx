"use client";
import React, { useState } from "react";
import ArtworkDisplayPanel from './artwork-display/ArtworkDisplayPanel';
import ArtworkInfoForm from './artwork-info/ArtworkInfoForm';
import { Artwork, MusicBlob } from "@/types";
import ArtAddDialog from "./dialog/ArtAddDialog";
import Image from "next/image";
import styles from "./ArtworkPage.module.css";
import MainImagePosterCard from "@/components/MainImage/MainImagePosterCard";
import { useRouter } from "next/navigation";
import { delArtwork, delImage, updateAllArtwork, updateArtwork, delMusic } from "@/common/comon";
import ShowLoading from "./loading/ShowLoading";
import ImageStyles from "@/components/MainImage/MainImage.module.css";

const ArtworkPage = ({ artworks, musicList }: { artworks: Artwork[]; musicList: MusicBlob[]; }) => {

    const [selectedArtworkId, setSelectedArtworkId] = useState<string | null>(null);
    const [tab, setTab] = useState<string>('1');
    const [openDialog, setOpenDialog] = useState<"add" | "mod" | null>(null);

    const [sortMode, setSortMode] = useState<boolean>(false);
    const [sortViewArtWorks, setSortViewArtWorks] = useState<Artwork[]>([]);

    const [isLoading, setIsLoading] = useState<boolean>(false);

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
        headerPanel
    } = styles;
    return (
        <>
            <div className={pageWrapper}>
                <div className={leftPanel}>
                    <div className={headerPanel}>이미지 관리</div>
                    <div className={tabBar}>
                        {[
                            { header: '이미지전체', value: '1' },
                            { header: '메인전시장표시', value: '2' },
                            { header: '비쥬얼표시(시즌별 대표)', value: '3' },
                            { header: '음악', value: '4' }
                        ].map(({ header, value }, index) => (
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
                                        setIsLoading(true);
                                        try {
                                            const poster_path = artworks.find((artwork) => artwork.id === selectedArtworkId)?.poster_path;
                                            if (!(poster_path && selectedArtworkId)) {
                                                alert('삭제실패하였습니다.');
                                                return;
                                            }
                                            await delImage(poster_path);
                                            await delArtwork(artworks, selectedArtworkId);
                                            setSelectedArtworkId(null);
                                            alert('삭제되었습니다.');
                                            router.refresh(); // 페이지 새로고침
                                        } catch {
                                            alert('삭제에 실패했습니다.');
                                        } finally {
                                            setIsLoading(false);
                                        }

                                    }}>
                                    삭제
                                </button>
                            </>
                        }
                        {tab === '2' &&
                            <>
                                {sortMode ?
                                    <>
                                        <button className={addButton} disabled={!selectedArtworkId} onClick={() => {
                                            setSortViewArtWorks((prev) => {
                                                const targetArtwork = prev.find(({ id }) => id === selectedArtworkId);
                                                if (!targetArtwork) return prev;

                                                const targetGroupId = targetArtwork.galleryId;
                                                if (!targetGroupId) return prev;
                                                const galleryIndexList = [...new Set(prev.map((item) => item.galleryId).filter((id): id is number => !!id))]
                                                    .sort((a, b) => a - b);
                                                const targetIndex = galleryIndexList.indexOf(targetGroupId);

                                                if (targetIndex > 0) {
                                                    return prev.map(e => {
                                                        const nextGroupId = galleryIndexList[targetIndex - 1];
                                                        const galleryId = (() => {
                                                            if (e.galleryId === targetGroupId) return nextGroupId;
                                                            if (e.galleryId === nextGroupId) return targetGroupId;
                                                            return e.galleryId;
                                                        })();
                                                        return { ...e, galleryId };
                                                    });
                                                }
                                                return prev;
                                            });
                                        }}>
                                            ∧
                                        </button>
                                        <button className={addButton} disabled={!selectedArtworkId} onClick={() => {
                                            setSortViewArtWorks((prev) => {
                                                const targetArtwork = prev.find(({ id }) => id === selectedArtworkId);
                                                if (!targetArtwork) return prev;

                                                const targetGroupId = targetArtwork.galleryId;
                                                if (!targetGroupId) return prev;

                                                const galleryIndexList = [...new Set(prev.map((item) => item.galleryId).filter((id): id is number => !!id))]
                                                    .sort((a, b) => a - b);
                                                const targetIndex = galleryIndexList.indexOf(targetGroupId);

                                                if (targetIndex < galleryIndexList.length - 1) {
                                                    return prev.map(e => {
                                                        const nextGroupId = galleryIndexList[targetIndex + 1];
                                                        const galleryId = (() => {
                                                            if (e.galleryId === targetGroupId) return nextGroupId;
                                                            if (e.galleryId === nextGroupId) return targetGroupId;
                                                            return e.galleryId;
                                                        })();
                                                        return { ...e, galleryId };
                                                    });
                                                }
                                                return prev;
                                            });

                                        }}>
                                            ∨
                                        </button>
                                        <button className={addButton} onClick={() => {
                                            setSortMode(false);
                                            setSortViewArtWorks([]);
                                        }}>취소</button>
                                        <button className={addButton} onClick={async () => {
                                            setIsLoading(true);
                                            try {
                                                await updateAllArtwork(sortViewArtWorks);
                                                alert('저장되었습니다.');
                                                setSortMode(false);
                                                setSortViewArtWorks([]);
                                            } catch {
                                                alert('저장에 실패했습니다.');
                                                setIsLoading(false);
                                            }

                                        }}>
                                            저장
                                        </button>
                                    </>
                                    :
                                    <>
                                        <button className={addButton} onClick={() => { setOpenDialog('add'); }}>그룹새로채번</button>
                                        <button className={addButton} disabled={!selectedArtworkId} onClick={() => { setOpenDialog('mod'); }}>기존그룹추가 및 배율저장</button>
                                        <button className={addButton}
                                            disabled={!selectedArtworkId}
                                            onClick={async () => {
                                                setIsLoading(true);
                                                try {
                                                    const targetgalleryId = artworks.find((artwork) => artwork.id === selectedArtworkId)?.galleryId;
                                                    await updateAllArtwork(artworks.map((artwork) => {
                                                        if (artwork.galleryId === targetgalleryId) {
                                                            return { ...artwork, galleryId: null };
                                                        }
                                                        return artwork;
                                                    }));
                                                    setSelectedArtworkId(null);
                                                    alert('그룹이 삭제되었습니다.');
                                                } catch {
                                                    alert('저장에 실패했습니다.');
                                                    setIsLoading(false);
                                                }

                                            }}>
                                            그룹삭제
                                        </button>
                                        <button className={addButton} onClick={() => {
                                            setSortMode(true);
                                            setSortViewArtWorks(artworks);
                                        }}>
                                            그룹순서
                                        </button>
                                    </>
                                }
                            </>
                        }
                        {tab === '3' &&
                            <>
                                <button className={addButton} onClick={() => { setOpenDialog('add'); }}>추가</button>
                                <button className={addButton}
                                    disabled={!selectedArtworkId}
                                    onClick={async () => {
                                        setIsLoading(true);
                                        try {
                                            const targetData = artworks.find((artwork) => artwork.id === selectedArtworkId);

                                            if (!targetData) {
                                                alert('이미지를 찾을 수 없습니다.');
                                                return;
                                            }

                                            await updateArtwork(artworks, { ...targetData, visualYn: '' });
                                            setSelectedArtworkId(null);
                                            alert('비쥬얼 표시가 삭제되었습니다.');
                                        } catch {
                                            alert('저장에 실패했습니다.');
                                            setIsLoading(false);
                                        }

                                    }}
                                >삭제
                                </button>

                            </>
                        }
                        {tab === '4' &&
                            <>
                                <button className={addButton} onClick={() => { setOpenDialog('add'); }}>추가</button>
                                <button className={addButton}
                                    disabled={!selectedArtworkId}
                                    onClick={async () => {
                                        setIsLoading(true);
                                        try {
                                            const targetData = musicList.find((e) => e.id === selectedArtworkId);
                                            if (!targetData) {
                                                alert('음악을 찾을 수 없습니다.');
                                                return;
                                            }
                                            await delMusic(targetData.pathname);
                                            setSelectedArtworkId(null);
                                            alert('선택한 음악이 삭제되었습니다.');
                                            router.refresh(); // 페이지 새로고침
                                        } catch (error) {
                                            console.log(error);
                                            alert('삭제에 실패했습니다.');
                                        } finally {
                                            setIsLoading(false);
                                        }
                                    }}
                                >삭제
                                </button>

                            </>
                        }
                    </div>

                    <ArtworkInfoForm
                        tab={tab}
                        artworks={sortMode ? sortViewArtWorks : artworks}
                        musicList={musicList}
                        selectedArtworkId={selectedArtworkId}
                        setSelectedArtworkId={setSelectedArtworkId}
                    />
                </div>


                <div className={rightPanel}>
                    <div className={headerPanel}>이미지 미리보기</div>
                    {['1', '3'].includes(tab) && selectedArtworkId && (() => {
                        const targetData = artworks.find((artwork) => artwork.id === selectedArtworkId) || { poster_path: '', title: '' };
                        const { poster_path, title } = targetData;
                        return (
                            <div className={imagePreview}>
                                <div style={{ width: '80%', height: '80%', position: 'relative' }}>
                                    <MainImagePosterCard initialScale={1} isAdmin={true}>
                                        <Image
                                            width={0}
                                            height={0}
                                            sizes="50vw"
                                            className={ImageStyles.metalFrame}
                                            src={poster_path}
                                            alt={title}
                                            style={{
                                                top: '50%',
                                                left: '50%',
                                                transform: 'translate(-50%, -50%)',
                                                width: '50%', // Default width for preview
                                                height: 'auto',
                                                position: 'absolute'
                                            }}
                                        />
                                    </MainImagePosterCard>
                                </div>
                            </div>
                        );
                    })()}
                    {tab === '2' && <ArtworkDisplayPanel artworks={artworks} selectedArtworkId={selectedArtworkId} setIsLoading={setIsLoading} />}
                </div>
            </div >
            {openDialog && <ArtAddDialog artworks={artworks} musicList={musicList} selectedArtworkId={selectedArtworkId} setSelectedArtworkId={setSelectedArtworkId} openDialog={openDialog} setOpenDialog={setOpenDialog} tab={tab} setIsLoading={setIsLoading} />}
            {isLoading && <ShowLoading ></ShowLoading>}
        </>
    );
};
export default ArtworkPage;