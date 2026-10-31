"use client";
import styles from "../ArtAddDialog.module.css";
import React, { useEffect, useState } from "react";
import { Artwork } from "@/types";
import { uploadImage, addArtwork, updateArtwork } from "@/common/comon";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { snackbar } from "@/components/Snackbar/Snackbar";

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

type Errors = Partial<Record<keyof FormState | 'image', string>>;

// 최대 허용 크기: 1 MB
const MAX_SIZE = 1 * 1024 * 1024;

// 라벨 + 입력칸 + (오류 또는 안내) 한 칸
const Field = ({ label, required, hint, error, children }: { label: string; required?: boolean; hint?: string; error?: string; children: React.ReactNode; }) => (
    <label className={`${styles.field} ${error ? styles.fieldError : ''}`}>
        <div className={styles.labelText}>{label}{required && <b className={styles.requiredMark}>*</b>}</div>
        {children}
        {error ? <div className={styles.errorText}>{error}</div> : hint ? <div className={styles.hint}>{hint}</div> : null}
    </label>
);

const ArtNewAddForm = ({ artworks, selectedArtworkId, openDialog, setOpenDialog, setIsLoading }:
    {
        artworks: Artwork[],
        selectedArtworkId: string | null,
        openDialog: string | null,
        setOpenDialog: React.Dispatch<React.SetStateAction<"add" | "mod" | null>>;
        setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
    }) => {

    const router = useRouter();

    const [inputFile, setInputFile] = useState<File | null>(null);
    const [errors, setErrors] = useState<Errors>({});

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
            const artwork = artworks.find((artwork: Artwork) => artwork.id === selectedArtworkId);
            if (artwork) {
                const { id, season, year, title, material, location, width, height, overview, poster_path } = artwork;
                setForm({ id, season, year, title, material: material || '', location: location || '', width, height, overview, poster_path });
            }
        }
    }, [openDialog]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
        setErrors(prev => ({ ...prev, [name]: undefined }));
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = ''; // 같은 파일을 다시 골라도 다시 검사
        if (!file) return;

        // 확장자와 MIME 타입 둘 다 WebP
        if (!(/\.webp$/i.test(file.name) && file.type === 'image/webp')) {
            setErrors(prev => ({ ...prev, image: 'WebP 파일만 올릴 수 있어요.' }));
            return;
        }
        if (file.size > MAX_SIZE) {
            setErrors(prev => ({ ...prev, image: `파일이 ${MAX_SIZE / 1024 / 1024}MB보다 커요. (지금 ${(file.size / 1024 / 1024).toFixed(1)}MB)` }));
            return;
        }

        setErrors(prev => ({ ...prev, image: undefined }));
        setForm(prev => ({ ...prev, poster_path: URL.createObjectURL(file) }));
        setInputFile(file);
    };

    const validate = (): Errors => {
        const { id, season, year, title, width, height, overview } = form;
        const next: Errors = {};
        if (openDialog === 'add') {
            if (!id.trim()) next.id = 'ID를 입력해주세요.';
            else if (artworks.some((artwork: Artwork) => artwork.id === id)) next.id = '이미 있는 ID예요.';
        }
        if (!title.trim()) next.title = '제목을 입력해주세요.';
        if (!season.trim()) next.season = '시즌을 입력해주세요.';
        if (!/^\d+$/.test(String(year)) || Number(year) < 2000 || Number(year) > 2100) next.year = '2000~2100 사이 연도를 입력해주세요.';
        if (!/^\d+(\.\d+)?$/.test(String(width)) || !(Number(width) > 0)) next.width = '0보다 큰 숫자를 입력해주세요.';
        if (!/^\d+(\.\d+)?$/.test(String(height)) || !(Number(height) > 0)) next.height = '0보다 큰 숫자를 입력해주세요.';
        if (!overview.trim()) next.overview = '설명을 입력해주세요.';
        if (openDialog === 'add' && !inputFile) next.image = '이미지를 선택해주세요.';
        return next;
    };

    const handleSubmit = async () => {
        const found = validate();
        if (Object.values(found).some(Boolean)) {
            setErrors(found);
            snackbar.error('입력값을 확인해주세요.');
            return;
        }
        try {
            const { id, season, year, title, material, location, width, height, overview, poster_path } = form;
            setIsLoading(true);

            // 한국시간
            const kst = (() => {
                const now = new Date();
                // UTC+9 반영
                return new Date(now.getTime() + 9 * 60 * 60 * 1000).toISOString().replace('Z', '+09:00');
            })();

            if (openDialog === 'add' && inputFile) {
                const url = await uploadImage(inputFile, title.trim());
                await addArtwork(artworks, {
                    id, // 영화 ID
                    poster_path: url, // 이미지 경로
                    title, // 영화 제목
                    overview, // 내용
                    season, // 시즌
                    year: Number(year),
                    material, // 재료
                    location, // 위치
                    width: Number(width), // 너비 (CSS 관련 값)
                    height: Number(height), // 높이 (CSS 관련 값)
                    insertDt: kst, // 등록일
                    updateDt: null, // 수정일
                    top: null, // 상단 위치 (CSS 관련 값)
                    left: null,// 왼쪽 위치 (CSS 관련 값)
                    zIndex: null, // z-index (CSS 관련 값)
                    galleryId: null, // 갤러리 ID
                    groupWinSize: null, // 전시창 크기
                    visualYn: null, // 비주얼 ID
                });
            }
            else if (openDialog === 'mod') {
                const url = inputFile ? await uploadImage(inputFile, title.trim()) : poster_path;
                const orginArtwork = artworks.find((artwork: Artwork) => artwork.id === selectedArtworkId);
                if (!orginArtwork) throw new Error("Artwork not found");

                await updateArtwork(artworks, {
                    ...orginArtwork,
                    id, // 영화 ID
                    poster_path: url, // 이미지 경로
                    title, // 영화 제목
                    overview, // 내용
                    season, // 시즌
                    year: Number(year),
                    material, // 재료
                    location, // 위치
                    width: Number(width), // 너비 (CSS 관련 값)
                    height: Number(height), // 높이 (CSS 관련 값)
                    updateDt: kst,
                });
            }

            // 실제 저장 로직
            snackbar.success('저장되었습니다.');
            setOpenDialog(null);
            router.refresh(); // 페이지 새로고침
        } catch (error) {
            console.log(error);
            snackbar.error('저장에 실패했습니다.');
        } finally {
            setIsLoading(false);
        }


    };

    const { form: formStyle, formColumns, fields, row, input, textarea, readonly, imageColumn, preview, previewEmpty, fileButton, hint, errorText, footer, primaryButton, secondaryButton } = styles;

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
        <form className={formStyle}
            noValidate
            onSubmit={async (e) => {
                e.preventDefault(); // 새로고침 막기
                await handleSubmit();
            }}
        >
            <div className={formColumns}>
                <div className={fields}>
                    {openDialog === 'add'
                        ? <Field label="ID" required hint="주소에 쓰여요. 저장한 뒤에는 바꿀 수 없어요." error={errors.id}>
                            <input className={input} type="text" name="id" value={formId} onChange={handleChange} />
                        </Field>
                        : <Field label="ID" hint="ID는 바꿀 수 없어요.">
                            <div className={readonly}>{formId}</div>
                        </Field>
                    }
                    <Field label="제목" required error={errors.title}>
                        <input className={input} type="text" name="title" value={formTitle} onChange={handleChange} />
                    </Field>
                    <div className={row}>
                        <Field label="시즌" required error={errors.season}>
                            <input className={input} type="text" name="season" value={formSeason} onChange={handleChange} />
                        </Field>
                        <Field label="연도" required error={errors.year}>
                            <input className={input} type="number" inputMode="numeric" name="year" value={formYear} onChange={handleChange} placeholder="2026" />
                        </Field>
                    </div>
                    <div className={row}>
                        <Field label="재료" hint="예: oil on linen">
                            <input className={input} type="text" name="material" value={fomMaterial} onChange={handleChange} />
                        </Field>
                        <Field label="위치">
                            <input className={input} type="text" name="location" value={fomLocation} onChange={handleChange} />
                        </Field>
                    </div>
                    <div className={row}>
                        <Field label="실제 세로 (cm)" required error={errors.height}>
                            <input className={input} type="number" step="0.01" min="0" name="height" value={formHeight} onChange={handleChange} />
                        </Field>
                        <Field label="실제 가로 (cm)" required error={errors.width}>
                            <input className={input} type="number" step="0.01" min="0" name="width" value={formWidth} onChange={handleChange} />
                        </Field>
                    </div>
                    <Field label="설명" required error={errors.overview}>
                        <textarea className={textarea} name="overview" rows={4} value={formOverview} onChange={handleChange} />
                    </Field>
                </div>
                <div className={imageColumn}>
                    <div className={preview}>
                        {formPoster_path
                            ? <Image src={formPoster_path} alt="미리보기" fill sizes="40vw" style={{ objectFit: 'contain', padding: 16, boxSizing: 'border-box' }} />
                            : <div className={previewEmpty}>이미지를 선택하면 여기에 보여요</div>
                        }
                    </div>
                    <label className={fileButton}>
                        {formPoster_path ? '이미지 바꾸기' : '이미지 선택'}
                        <input type="file" accept="image/webp,.webp" onChange={handleImageChange} />
                    </label>
                    {errors.image
                        ? <div className={errorText}>{errors.image}</div>
                        : <div className={hint}>WebP 파일, 최대 {MAX_SIZE / 1024 / 1024}MB{openDialog === 'add' ? ' (필수)' : ''}</div>
                    }
                </div>
            </div>
            <div className={footer}>
                <button type="button" className={secondaryButton} onClick={() => setOpenDialog(null)}>취소</button>
                <button type="submit" className={primaryButton}>저장</button>
            </div>
        </form>
    );
};
export default ArtNewAddForm;
