"use client"
import React, { useState } from "react";
import { Artwork, ArtworkList } from "@/types";
import styles from "./ArtAddDialog.module.css";

type FormState = {
    size: string;
    id: string;
    title: string;
    overview: string;
    imageFile: File | null;
    imagePreviewUrl: string;
};

const ArtAddDialog = ({ artworks, setOpenDialog, tab }: { artworks: ArtworkList, setOpenDialog: React.Dispatch<React.SetStateAction<boolean>>, tab: string }) => {

    const { dialogStyle, overlayStyle, topBarWrapper, inputWrapper } = styles;

    const [form, setForm] = useState<FormState>({
        size: '',
        id: '',
        title: '',
        overview: '',
        imageFile: null,
        imagePreviewUrl: '',
    });

    const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setForm(prev => ({ ...prev, imageFile: file }));
            setImagePreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleSubmit = () => {
        const { size, id, title, overview, imageFile } = form;

        // 모든 필드가 채워졌는지 검사
        if (
            !size.trim() ||
            !id.trim() ||
            !title.trim() ||
            !overview.trim() ||
            !imageFile
        ) {
            alert('모든 항목은 필수 입력입니다.');
            return;
        }

        // 실제 저장 로직
        console.log('저장할 데이터:', form);
        alert('저장되었습니다.');
        setOpenDialog(false);
    };

    const { size, id, title, overview, imageFile } = form;

    return (
        <>
            <div className={overlayStyle} onClick={() => { setOpenDialog(false) }} />

            <div className={dialogStyle}>
                <div className={topBarWrapper}>
                    <p>추가</p>
                    <div onClick={() => { setOpenDialog(false) }} >x</div>
                </div>
                <div className={inputWrapper}>
                    <div style={{ width: '70%' }}>
                        <form
                            style={{
                                width: '100%',
                                padding: '1rem',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '12px',
                            }}
                            onSubmit={e => {
                                e.preventDefault();
                                handleSubmit();
                            }}
                        >
                            <label>
                                Size:
                                <input style={{ width: '50%' }} type="text" name="size" value={size} onChange={handleChange} />
                            </label>

                            <label>
                                ID:
                                <input style={{ width: '50%' }} type="text" name="id" value={id} onChange={handleChange} required />
                            </label>

                            <label>
                                Title:
                                <input style={{ width: '50%' }} type="text" name="title" value={title} onChange={handleChange} required />
                            </label>

                            <label>
                                Overview:

                            </label>
                            <label><textarea
                                style={{ width: '50%' }}
                                name="overview"
                                rows={6}
                                value={overview}
                                onChange={handleChange}
                            /></label>

                            <label>
                                이미지 첨부: <span style={{ color: 'red' }}>*</span>
                                <input type="file" accept="image/*" onChange={handleImageChange} />
                            </label>
                            <button type="submit" style={{ marginTop: '1rem' }}>
                                저장
                            </button>
                        </form>
                    </div>
                    <div style={{ width: '30%' }}>
                        {imagePreviewUrl && (
                            <img
                                src={imagePreviewUrl}
                                alt="미리보기"
                                style={{ maxWidth: '50%', maxHeight: 'auto', border: '1px solid #ccc' }}
                            />
                        )}
                    </div>
                </div>
            </div>
        </>
    )

}
export default ArtAddDialog;