"use client"
import styles from "../ArtAddDialog.module.css";
import React, { useEffect, useState } from "react";
import { Artwork, ArtworkList } from "@/types";

type FormState = {
    size: string;
    id: string;
    title: string;
    width: number;
    overview: string;
    imageFile: File | null;
    poster_path: string;
};

const ArtNewAddForm = ({ artworks, selectedArtworkId, openDialog, setOpenDialog }: { artworks: ArtworkList, selectedArtworkId: string, openDialog: string, setOpenDialog: React.Dispatch<React.SetStateAction<string>> }) => {

    const [form, setForm] = useState<FormState>({
        size: '',
        id: '',
        title: '',
        width: 0,
        overview: '',
        imageFile: null,
        poster_path: '',
    });

    useEffect(() => {

        if (openDialog === 'mod') {
            const { size, id, title, width, overview, poster_path } = artworks.find((artwork: Artwork) => artwork.id === selectedArtworkId) || {}
            setForm({ size, id, title, width, overview, imageFile: null, poster_path });
        }
    }, [openDialog]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setForm(prev => ({ ...prev, imageFile: file }));
            console.log(URL.createObjectURL(file))
        }
    };

    const handleSubmit = () => {
        const { id, title, width, poster_path } = form;

        // 모든 필드가 채워졌는지 검사
        if (
            !id.trim() ||
            !title.trim() ||
            !width ||
            !poster_path
        ) {
            alert('필수값이 입력되지 않았습니다.');
            return;
        }

        // ID 중복 검사
        if (openDialog === 'add' && artworks.some((artwork: Artwork) => artwork.id === id)) {
            alert('중복된 ID입니다.');
            return;
        }

        // 실제 저장 로직
        alert('저장되었습니다.');
        setOpenDialog(null);
    };

    const { topBarWrapper, inputWrapper } = styles;

    const { size, id, title, width, overview, poster_path } = form;

    return (
        <>
            <div className={topBarWrapper}>
                <p>{openDialog === 'mod' ? '변경' : '추가'}</p>
                <div onClick={() => { setOpenDialog(null) }} >x</div>
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
                            e.preventDefault(); // 새로고침 막기
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
                        <fieldset>
                            <legend>사진크기 최대 100 (퍼센트 단위이며 height 사진비율에 맞춰서 들어감)</legend><br />
                            width:
                            <input style={{ width: '20%' }} type="number" name="width" value={width} onChange={handleChange} required />
                        </fieldset>

                        <label>
                            Overview:

                        </label>
                        <label><textarea
                            style={{ width: '60%', fontSize: '0.5rem' }}
                            name="overview"
                            rows={4}
                            value={overview}
                            onChange={handleChange}
                        /></label>

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
                    {poster_path && (
                        <img
                            src={poster_path}
                            alt="미리보기"
                            style={{ maxWidth: '50%', maxHeight: 'auto', border: '1px solid #ccc' }}
                        />
                    )}
                </div>
            </div>
        </>
    )
}
export default ArtNewAddForm