"use client";
import styles from "../ArtAddDialog.module.css";
import React, { useEffect, useState } from "react";
import { Artwork } from "@/types";
import { uploadImage, addArtwork, updateArtwork } from "@/common/comon";
import { useRouter } from "next/navigation";
import { f } from "@vercel/blob/dist/create-folder-C02EFEPE.cjs";

type FormState = {
    id: string;
    season: string;
    year: number | '';
    title: string;
    material: string;
    location: string;
    width: number | '';
    height: number | '';
    overview: string;
    poster_path: string;
};

const ArtNewAddForm = ({ artworks, selectedArtworkId, openDialog, setOpenDialog, setIsLoading }:
    {
        artworks: Artwork[],
        selectedArtworkId: string,
        openDialog: string,
        setOpenDialog: React.Dispatch<React.SetStateAction<string>>;
        setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
    }) => {

    const router = useRouter();

    const [inputFile, setInputFile] = useState<File | null>(null);

    const [form, setForm] = useState<FormState>({
        id: '',
        season: '',
        year: '',
        title: '',
        material: '',
        location: '',
        width: '',
        height: '',
        overview: '',
        poster_path: '',
    });

    // 수정일경우 해당 이미지 정보 넣어주기 
    useEffect(() => {

        if (openDialog === 'mod') {
            const { id, season, year, title, material, location, width, height, overview, poster_path } = artworks.find((artwork: Artwork) => artwork.id === selectedArtworkId) || {};
            setForm({ id, season, year, title, material, location, width, height, overview, poster_path });
        }
    }, [openDialog]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        // 1. 확장자 체크 (optional)
        const isWebpExt = /\.webp$/i.test(file.name);

        // 2. MIME 타입 체크
        const isWebpMime = file.type === 'image/webp';

        // 최종 결과
        if (!(file && isWebpExt && isWebpMime)) {
            alert('WebP 이미지가 아닙니다!');
            return;
        }

        // 최대 허용 크기: 1 MB
        const MAX_SIZE = 1 * 1024 * 1024; // 5 × 1024 × 1024 = 5,242,880 bytes

        if (file.size > MAX_SIZE) {
            alert(`파일 크기는 최대 ${MAX_SIZE / 1024 / 1024}MB까지 허용됩니다.`);
            // 폼 제출 막거나, state에 에러 표시 등 추가 처리
            return;
        }

        setForm(prev => ({ ...prev, poster_path: URL.createObjectURL(file) }));
        setInputFile(file);

    };

    const handleSubmit = async () => {
        try {
            const { id, season, year, title, material, location, width, height, overview, poster_path } = form;

            // 모든 필드가 채워졌는지 검사
            if (
                !id ||
                !season ||
                !year ||
                !title ||
                !width ||
                !height ||
                !overview
            ) {
                alert('필수값이 입력되지 않았습니다.');
                return;
            }

            // formYear
            if (!/^\d+$/.test(String(year)) || year < 2000 || year > 2100) {
                alert('년도를 확인해주세요.');
                return;
            }

            // width
            if (!/^\d+(\.\d+)?$/.test(String(width)) || width < 0) {
                alert('width는 숫자만 입력 가능하며 0보다 커야 입력 가능합니다.');
                return;
            }

            // height
            if (!/^\d+(\.\d+)?$/.test(String(height)) || height < 0) {
                alert('width는 숫자만 입력 가능하며 0보다 커야 입력 가능합니다.');
                return;
            }

            // ID 중복 검사
            if (openDialog === 'add' && artworks.some((artwork: Artwork) => artwork.id === id)) {
                alert('중복된 ID입니다.');
                return;
            }

            // 사진검사
            if (openDialog === 'add' && !inputFile) {
                alert('사진을 넣어주세요.');
                return;
            }
            setIsLoading(true);

            // 한국시간
            const kst = (() => {
                const now = new Date();
                // UTC+9 반영
                return new Date(now.getTime() + 9 * 60 * 60 * 1000).toISOString().replace('Z', '+09:00');
            })();

            // 새로추가
            if (openDialog === 'add') {
                const url = await uploadImage(inputFile, title.trim());
                await addArtwork(artworks, {
                    id, // 영화 ID
                    poster_path: url, // 이미지 경로
                    title, // 영화 제목
                    overview, // 내용   
                    season, // 시즌
                    year,
                    material, // 재료
                    location, // 위치
                    width, // 너비 (CSS 관련 값)
                    height, // 높이 (CSS 관련 값)
                    insertDt: kst, // 등록일 
                    updateDt: null, // 수정일
                    top: null, // 상단 위치 (CSS 관련 값)
                    left: null,// 왼쪽 위치 (CSS 관련 값)
                    zIndex: null, // z-index (CSS 관련 값)
                    galleryId: null, // 갤러리 ID
                    galleryRaito: null, // 갤러리 배율
                    visualYn: null, // 비주얼 ID
                });
            }
            else if (openDialog === 'mod') {
                const url = inputFile ? await uploadImage(inputFile, title.trim()) : poster_path;
                const orginArtwork = artworks.find((artwork: Artwork) => artwork.id === selectedArtworkId);
                await updateArtwork(artworks, {
                    ...orginArtwork,
                    id, // 영화 ID
                    poster_path: url, // 이미지 경로
                    title, // 영화 제목
                    overview, // 내용   
                    season, // 시즌
                    year,
                    material, // 재료
                    location, // 위치
                    width, // 너비 (CSS 관련 값)
                    height, // 높이 (CSS 관련 값)
                    updateDt: kst,
                });
            }

            // 실제 저장 로직
            alert('저장되었습니다.');
            setOpenDialog(null);
            router.refresh(); // 페이지 새로고침
        } catch (error) {
            console.log(error);
            alert('저장에 실패했습니다.');
        } finally {
            setIsLoading(false);
        }


    };

    const { topBarWrapper, inputWrapper, formWrapper } = styles;



    const {
        id: formId,
        season: formSeason,
        year: formYear,
        title: formTitle,
        material: fomMaterial,
        location: fomLocation,
        width: formWidth,
        height: formHeight,
        overview: formOverview,
        poster_path: formPoster_path
    } = form;

    return (
        <>
            <div className={topBarWrapper}>
                <p>{openDialog === 'mod' ? '[변경]' : '[추가]'}</p>
            </div>
            <div className={inputWrapper}>
                <div style={{ width: '60%' }}>
                    <form className={formWrapper}
                        onSubmit={async (e) => {
                            e.preventDefault(); // 새로고침 막기
                            await handleSubmit();
                        }}
                    >
                        {openDialog === 'add' && <label>
                            ID(고유 식별번호(url에 표시됨)):
                            <input style={{ width: '50%' }} type="text" name="id" value={formId} onChange={handleChange} required />
                        </label>
                        }
                        <label>
                            제목:
                            <input style={{ width: '50%' }} type="text" name="title" value={formTitle} onChange={handleChange} required />
                        </label>
                        <label>
                            시즌:
                            <input style={{ width: '50%' }} type="text" name="season" value={formSeason} onChange={handleChange} required />
                        </label>
                        <label>
                            년도:
                            <input style={{ width: '50%' }} type="text" name="year" value={formYear} onChange={handleChange} required />
                        </label>
                        <label>
                            재료:
                            <input style={{ width: '50%' }} type="text" name="material" value={fomMaterial} onChange={handleChange} />
                        </label>
                        <label>
                            위치:
                            <input style={{ width: '50%' }} type="text" name="location" value={fomLocation} onChange={handleChange} />
                        </label>
                        <label>
                            실제 가로(cm)width:
                            <input style={{ width: '20%' }} type="number" step="0.01" name="width" value={formWidth} onChange={handleChange} required />
                        </label>

                        <label>
                            실제 세로(cm)height:
                            <input style={{ width: '20%' }} type="number" step="0.01" name="height" value={formHeight} onChange={handleChange} required />
                        </label>

                        <label>Overview: </label>

                        <label>
                            <textarea
                                style={{ width: '60%', fontSize: '0.7rem' }}
                                name="overview"
                                rows={4}
                                value={formOverview}
                                onChange={handleChange}
                            />
                        </label>

                        <label>
                            이미지 첨부:
                            <input type="file" accept="image/*" onChange={handleImageChange} />
                        </label>
                        <button type="submit" style={{ marginTop: '1rem', width: '50%' }}>
                            저장
                        </button>
                    </form>
                </div>
                <div style={{ width: '30%', display: 'flex', justifyContent: 'center', alignItems: 'center', borderLeft: '1px solid #ccc' }}>
                    {formPoster_path && (
                        <img
                            src={formPoster_path}
                            alt="미리보기"
                            style={{ maxWidth: '50%', maxHeight: 'auto', border: '1px solid #ccc' }}
                        />
                    )}
                </div>
            </div>
        </>
    );
};
export default ArtNewAddForm;